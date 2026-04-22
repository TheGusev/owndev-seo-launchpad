import type { FastifyInstance } from 'fastify';
import { logger } from '../../utils/logger.js';
import { sql } from '../../db/client.js';
import { withRetry, HttpError } from '../../utils/retry.js';

let cacheTableReady = false;
async function ensureCacheTable(): Promise<void> {
  if (cacheTableReady) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS conversion_audits (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cache_key TEXT UNIQUE NOT NULL,
        url TEXT NOT NULL,
        domain TEXT NOT NULL,
        goal TEXT,
        traffic_source TEXT,
        main_problem TEXT,
        result JSONB NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `;
    cacheTableReady = true;
  } catch (e: any) {
    logger.error('CONVERSION_AUDIT', `cache table init failed: ${e?.message}`);
  }
}

export async function conversionAuditRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/conversion-audit/analyze
  app.post<{ Body: {
    url: string;
    goal: 'calls' | 'leads' | 'sales';
    traffic_source: 'seo' | 'direct' | 'both';
    main_problem: 'no_leads' | 'expensive_lead' | 'no_conversion';
  } }>('/analyze', async (req, reply) => {
    const { url, goal, traffic_source, main_problem } = req.body as any;
    if (!url) return reply.status(400).send({ success: false, error: 'url required' });

    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) return reply.status(503).send({ success: false, error: 'OpenAI key not set' });

    // Нормализуем домен и удаляем www. префикс для корректного кэш-ключа
    const domain = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();

    // Cache lookup (7 days)
    await ensureCacheTable();
    const cacheKey = `${domain}|${goal}|${traffic_source}|${main_problem}`;
    try {
      const rows = await sql<{ result: any }[]>`
        SELECT result FROM conversion_audits
        WHERE cache_key = ${cacheKey}
          AND created_at > NOW() - INTERVAL '7 days'
        LIMIT 1
      `;
      if (rows.length > 0) {
        return reply.send({ success: true, url, domain, cached: true, ...rows[0].result });
      }
    } catch (e: any) {
      logger.error('CONVERSION_AUDIT', `cache read failed: ${e?.message}`);
    }

    // Fetch page HTML
    let html = '';
    try {
      const controller = new AbortController();
      const tid = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(url, {
        signal: controller.signal,
        headers: { 'User-Agent': 'OWNDEV-ConversionAudit/1.0' }
      });
      clearTimeout(tid);
      if (resp.ok) html = await resp.text();
    } catch {}

    // Extract page text
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    let bodyText = bodyMatch
      ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
      : '';
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    let title = titleMatch ? titleMatch[1].trim() : domain;

    // Fallback через Jina Reader для SPA-сайтов, где body пуст или почти пуст
    if (bodyText.length < 500) {
      try {
        const jinaController = new AbortController();
        const jinaTid = setTimeout(() => jinaController.abort(), 20000);
        const jinaResp = await fetch(`https://r.jina.ai/${url}`, {
          signal: jinaController.signal,
          headers: { 'Accept': 'text/plain', 'User-Agent': 'OWNDEV-ConversionAudit/1.0', 'X-Timeout': '15' } as any,
        });
        clearTimeout(jinaTid);
        if (jinaResp.ok) {
          const md = await jinaResp.text();
          if (md && md.length > 200) {
            const jinaTitle = (md.match(/^Title:\s*(.+)$/m) || [])[1];
            if (jinaTitle && (title === domain || !title)) title = jinaTitle.trim();
            // Снимаем служебный header (Title/URL Source/Description/…) и берём основной текст
            const content = md.replace(/^(Title|URL Source|Description|Published Time|Image):.*$/gm, '').replace(/\s+/g, ' ').trim();
            if (content.length > bodyText.length) bodyText = content;
          }
        }
      } catch (e: any) {
        logger.error('CONVERSION_AUDIT', `Jina fallback failed: ${e?.message}`);
      }
    }

    bodyText = bodyText.slice(0, 3000);

    const goalLabels: Record<string, string> = { calls: 'звонки', leads: 'заявки', sales: 'продажи' };
    const trafficLabels: Record<string, string> = { seo: 'SEO (Яндекс/Google)', direct: 'Яндекс.Директ', both: 'SEO + Яндекс.Директ' };
    const problemLabels: Record<string, string> = { no_leads: 'нет заявок/звонков', expensive_lead: 'дорогой лид, бюджет сливается', no_conversion: 'трафик есть но не конвертит' };

    const controller2 = new AbortController();
    const tid2 = setTimeout(() => controller2.abort(), 45000);

    try {
      const resp = await withRetry(async () => {
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          signal: controller2.signal,
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'Ты эксперт по CRO (Conversion Rate Optimization) и юзабилити для российского рынка. Отвечай ТОЛЬКО валидным JSON без markdown.'
            },
            {
              role: 'user',
              content: `Проанализируй сайт и найди КОНКРЕТНЫЕ причины почему он не продаёт.

Сайт: ${domain}
Заголовок страницы: ${title}
Текст страницы: ${bodyText}

Цель бизнеса: ${goalLabels[goal] || goal}
Источник трафика: ${trafficLabels[traffic_source] || traffic_source}
Главная проблема: ${problemLabels[main_problem] || main_problem}

Дай JSON:
{
  "conversion_score": число 0-100 (текущий конверсионный потенциал),
  "money_lost_estimate": "примерный ежемесячный недополученный доход (строка с обоснованием)",
  "barriers": [
    {
      "category": "Доверие|CTA|Структура|Скорость|Контент|УТП|Форма",
      "severity": "critical|high|medium",
      "title": "Конкретная проблема",
      "description": "Что именно не так на этом сайте",
      "fix": "Конкретное решение",
      "impact": "Ожидаемый рост конверсии в %"
    }
  ],
  "direct_budget_waste": "Оценка потерь бюджета Директа из-за конверсионных проблем",
  "quick_wins": ["3 быстрых улучшения которые дадут результат за неделю"],
  "fix_cost_estimate": {
    "min": число (минимальная стоимость исправления в рублях),
    "max": число (максимальная стоимость),
    "breakdown": ["Пункт 1: сумма", "Пункт 2: сумма"],
    "roi_months": число (за сколько месяцев окупится)
  },
  "cta_recommendation": "Рекомендация: исправить самостоятельно / нанять специалиста / переделать с нуля"
}`
            }
          ],
          temperature: 0.3,
          max_tokens: 2500,
          }),
        });
        if (!r.ok) {
          if ([429, 500, 502, 503, 504].includes(r.status)) {
            throw new HttpError(r.status, `OpenAI ${r.status}`);
          }
          throw new Error(`OpenAI ${r.status}`);
        }
        return r;
      }, { label: 'CONVERSION_AUDIT' });
      clearTimeout(tid2);
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || '{}';
      const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
      // Persist to cache
      try {
        await sql`
          INSERT INTO conversion_audits (cache_key, url, domain, goal, traffic_source, main_problem, result)
          VALUES (${cacheKey}, ${url}, ${domain}, ${goal}, ${traffic_source}, ${main_problem}, ${sql.json(parsed)})
          ON CONFLICT (cache_key) DO UPDATE SET
            result = EXCLUDED.result,
            created_at = NOW()
        `;
      } catch (e: any) {
        logger.error('CONVERSION_AUDIT', `cache write failed: ${e?.message}`);
      }
      return reply.send({ success: true, url, domain, cached: false, ...parsed });
    } catch (e: any) {
      clearTimeout(tid2);
      logger.error('CONVERSION_AUDIT', `Analysis failed: ${e?.message}`);
      return reply.status(500).send({ success: false, error: 'Не удалось выполнить анализ' });
    }
  });
}
