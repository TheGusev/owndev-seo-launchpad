import type { FastifyInstance } from 'fastify';
import { logger } from '../../utils/logger.js';
import { sql } from '../../db/client.js';
import { withRetry, HttpError } from '../../utils/retry.js';
import { fetchPageForAnalysis } from '../../utils/htmlFetcher.js';
import {
  extractCroSignals,
  deriveDeterministicBarriers,
  deterministicScore,
  type DeterministicBarrier,
} from '../../services/conversionAudit/croSignals.js';

/* ───────────────────────── Кэш ───────────────────────── */

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

/* ───────────────────────── Связка с Site Check ───────────────────────── */

interface SiteCheckSnapshot {
  scan_id: string;
  scores: Record<string, unknown> | null;
  seo_data: Record<string, unknown> | null;
  issues: any[] | null;
  theme: string | null;
  status: string;
}

async function loadSiteCheckByScanId(scanId: string): Promise<SiteCheckSnapshot | null> {
  try {
    const rows = await sql<Array<{ id: string; status: string; scores: any; seo_data: any; issues: any; theme: string | null }>>`
      SELECT id, status, scores, seo_data, issues, theme
      FROM site_check_scans
      WHERE id = ${scanId}
      LIMIT 1
    `;
    if (!rows.length) return null;
    return {
      scan_id: rows[0].id,
      status: rows[0].status,
      scores: rows[0].scores ?? null,
      seo_data: rows[0].seo_data ?? null,
      issues: Array.isArray(rows[0].issues) ? rows[0].issues : null,
      theme: rows[0].theme ?? null,
    };
  } catch (e: any) {
    logger.info('CONVERSION_AUDIT', `loadSiteCheckByScanId(${scanId}) failed: ${e?.message}`);
    return null;
  }
}

async function loadLatestSiteCheckByDomain(domain: string): Promise<SiteCheckSnapshot | null> {
  try {
    const rows = await sql<Array<{ id: string; status: string; scores: any; seo_data: any; issues: any; theme: string | null }>>`
      SELECT id, status, scores, seo_data, issues, theme
      FROM site_check_scans
      WHERE url ILIKE ${'%' + domain + '%'}
        AND status = 'done'
        AND scores IS NOT NULL
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (!rows.length) return null;
    return {
      scan_id: rows[0].id,
      status: rows[0].status,
      scores: rows[0].scores ?? null,
      seo_data: rows[0].seo_data ?? null,
      issues: Array.isArray(rows[0].issues) ? rows[0].issues : null,
      theme: rows[0].theme ?? null,
    };
  } catch (e: any) {
    logger.info('CONVERSION_AUDIT', `loadLatestSiteCheckByDomain(${domain}) failed: ${e?.message}`);
    return null;
  }
}

/* ───────────────────────── Защита от запрещённых упоминаний ───────────────── */

/**
 * Юзер запрещает упоминать Cloudflare/CDN/WAF в текстах вывода (на сервере
 * стоит Nginx). Если LLM всё-таки вставит — вычищаем. Заменяем на нейтральные
 * формулировки, ничего не теряя по смыслу.
 */
const FORBIDDEN_REPLACEMENTS: Array<[RegExp, string]> = [
  [/cloudflare/gi, 'защита сервера'],
  [/\bWAF\b/gi, 'защита сервера'],
  [/\bCDN\b/gi, 'настройки сервера'],
  [/проверьте\s+настройки\s+защита сервера/gi, 'проверьте настройки сервера'],
];

function sanitizeText(s: string): string {
  if (!s) return s;
  let out = s;
  for (const [re, rep] of FORBIDDEN_REPLACEMENTS) out = out.replace(re, rep);
  return out;
}

function sanitizeBarrier<T extends { title?: string; description?: string; fix?: string; impact?: string }>(b: T): T {
  return {
    ...b,
    title: b.title ? sanitizeText(b.title) : b.title,
    description: b.description ? sanitizeText(b.description) : b.description,
    fix: b.fix ? sanitizeText(b.fix) : b.fix,
    impact: b.impact ? sanitizeText(b.impact) : b.impact,
  };
}

/* ───────────────────────── Маршруты ───────────────────────── */

export async function conversionAuditRoutes(app: FastifyInstance): Promise<void> {
  // POST /api/v1/conversion-audit/analyze
  app.post<{
    Body: {
      url: string;
      goal: 'calls' | 'leads' | 'sales';
      traffic_source: 'seo' | 'direct' | 'both';
      main_problem: 'no_leads' | 'expensive_lead' | 'no_conversion';
      /** Если фронт уже запустил Site Check — он передаёт его id, и мы
       *  переиспользуем его scores/issues/seo_data вместо повторного анализа. */
      scan_id?: string;
    };
  }>('/analyze', async (req, reply) => {
    const { url, goal, traffic_source, main_problem, scan_id } = req.body as any;
    if (!url) return reply.status(400).send({ success: false, error: 'url required' });

    const apiKey = process.env.OPENAI_API_KEY || '';
    if (!apiKey) return reply.status(503).send({ success: false, error: 'OpenAI key not set' });

    const domain = (() => {
      try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; }
    })();

    // ── Кэш (7 дней) ─────────────────────────────────────────
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

    // ── Источник правды #1: snapshot Site Check, если есть ──
    let siteCheck: SiteCheckSnapshot | null = null;
    if (scan_id) siteCheck = await loadSiteCheckByScanId(scan_id);
    if (!siteCheck) siteCheck = await loadLatestSiteCheckByDomain(domain);

    // ── Источник правды #2: реальный HTML страницы ──────────
    const page = await fetchPageForAnalysis(url, { label: 'CONVERSION_AUDIT' });

    if (!page.ok) {
      // Честный fail — НЕ зовём LLM, чтобы он не выдумал «Cloudflare/WAF».
      // Если у нас есть snapshot Site Check — это, как правило, означает,
      // что сайт ВООБЩЕ-ТО доступен (Site Check же его недавно прошёл),
      // поэтому fail-сообщение мягкое.
      const msg = siteCheck
        ? 'Не удалось загрузить страницу сейчас, но недавний GEO+SEO аудит сайта прошёл успешно. Перезапустите CRO-анализ через минуту.'
        : sanitizeText(page.reason || 'Не удалось получить содержимое страницы.');
      logger.info('CONVERSION_AUDIT', `fetch failed for ${url}: ${page.reason}`);
      return reply.status(200).send({
        success: false,
        url,
        domain,
        error: msg,
        // Возвращаем хотя бы то, что знаем из Site Check, чтобы UI мог
        // показать частичный результат вместо пустого экрана.
        site_check_snapshot: siteCheck
          ? {
              scan_id: siteCheck.scan_id,
              scores: siteCheck.scores,
              theme: siteCheck.theme,
            }
          : null,
      });
    }

    // ── Детерминированные сигналы ───────────────────────────
    const signals = extractCroSignals(page.html, page.bodyText);
    const deterministicBarriers = deriveDeterministicBarriers(signals);
    const detScore = deterministicScore(deterministicBarriers);

    // ── Готовим данные для LLM (мягкие барьеры — копирайтинг и UX) ──
    const goalLabels: Record<string, string> = { calls: 'звонки', leads: 'заявки', sales: 'продажи' };
    const trafficLabels: Record<string, string> = {
      seo: 'SEO (Яндекс/Google)',
      direct: 'Яндекс.Директ',
      both: 'SEO + Яндекс.Директ',
    };
    const problemLabels: Record<string, string> = {
      no_leads: 'нет заявок/звонков',
      expensive_lead: 'дорогой лид, бюджет сливается',
      no_conversion: 'трафик есть но не конвертит',
    };

    const seoTotal = (siteCheck?.scores as any)?.total ?? null;
    const seoSeo = (siteCheck?.scores as any)?.seo ?? null;
    const seoCro = (siteCheck?.scores as any)?.cro ?? null;

    const seoFactsForLlm = siteCheck
      ? `\n\nДанные из недавнего GEO+SEO аудита того же сайта (используй как факты):
- Общий скор: ${seoTotal ?? 'н/д'}/100
- SEO скор: ${seoSeo ?? 'н/д'}/100
- CRO-составляющая SEO-аудита: ${seoCro ?? 'н/д'}/100`
      : '';

    const detFactsForLlm =
      `\n\nЖёсткие факты о странице (определены детерминированно, не оспаривать):
- Форма заявки: ${signals.hasForm ? `есть (${signals.formCount} шт)` : 'НЕТ'}
- Телефон: ${signals.hasPhone ? 'есть' : 'НЕТ'}
- E-mail: ${signals.hasEmail ? 'есть' : 'НЕТ'}
- Мессенджеры: ${signals.hasMessenger ? 'есть' : 'нет'}
- CTA-кнопки с глаголом: ${signals.ctaCount}
- Отзывы/кейсы: ${signals.hasReviewsMention || signals.hasReviewSchema ? 'упоминаются' : 'НЕ найдены'}
- Гарантии: ${signals.hasGuarantee ? 'есть' : 'НЕТ'}
- Цена/прайс: ${signals.hasPrice ? 'есть' : 'НЕТ'}
- FAQ: ${signals.hasFAQ ? 'есть' : 'НЕТ'}
- Блок «почему мы / преимущества»: ${signals.hasUSPSection ? 'есть' : 'НЕТ'}
- Лицензии/сертификаты: ${signals.hasCredibility ? 'упоминаются' : 'НЕ найдены'}
- Слов в видимом тексте: ${signals.wordCount}
- HTML получен через ${page.usedJinaFallback ? 'Jina-fallback (SPA-рендер)' : 'прямой запрос'}`;

    const promptUser = `Проанализируй сайт и найди ТОЛЬКО МЯГКИЕ барьеры, которые НЕ зафиксированы детерминированно.
Не дублируй жёсткие факты ниже — они уже учтены отдельно.
Сосредоточься на КОПИРАЙТИНГЕ, ТОНЕ, СТРУКТУРЕ, ЯСНОСТИ ОФФЕРА.

Сайт: ${domain}
Заголовок страницы: ${page.title}
Текст страницы: ${page.bodyText.slice(0, 3000)}

Цель бизнеса: ${goalLabels[goal] || goal}
Источник трафика: ${trafficLabels[traffic_source] || traffic_source}
Главная проблема: ${problemLabels[main_problem] || main_problem}
${seoFactsForLlm}${detFactsForLlm}

Дай JSON:
{
  "soft_barriers": [
    {
      "category": "Доверие|CTA|Структура|Скорость|Контент|УТП|Форма",
      "severity": "critical|high|medium",
      "title": "Конкретная мягкая проблема (не повторяй жёсткие факты)",
      "description": "Что именно не так с точки зрения копирайтинга/структуры/тона",
      "fix": "Конкретное решение",
      "impact": "+N–M%"
    }
  ],
  "money_lost_estimate": "примерный ежемесячный недополученный доход (короткая строка с обоснованием)",
  "direct_budget_waste": "оценка потерь Директа из-за слабого лендинга",
  "quick_wins": ["3 быстрых улучшения, которые можно внедрить за неделю"],
  "fix_cost_estimate": {
    "min": число (минимум в рублях),
    "max": число (максимум),
    "breakdown": ["Пункт: сумма"],
    "roi_months": число
  },
  "cta_recommendation": "Рекомендация: исправить самостоятельно / нанять специалиста / переделать с нуля"
}

ЗАПРЕЩЕНО упоминать: Cloudflare, WAF, CDN, имена хостинг-провайдеров, фразу «сайт недоступен» (страница успешно загружена, текст у тебя на руках).`;

    const controller2 = new AbortController();
    const tid2 = setTimeout(() => controller2.abort(), 45000);

    let llmJson: any = {};
    try {
      const resp = await withRetry(
        async () => {
          const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            signal: controller2.signal,
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                {
                  role: 'system',
                  content:
                    'Ты эксперт по CRO для российского рынка. Отвечай ТОЛЬКО валидным JSON без markdown. Никогда не упоминай Cloudflare/WAF/CDN/хостинг-провайдеров. Если страница загружена — не пиши, что она недоступна.',
                },
                { role: 'user', content: promptUser },
              ],
              temperature: 0.3,
              max_tokens: 2000,
              response_format: { type: 'json_object' },
            }),
          });
          if (!r.ok) {
            if ([429, 500, 502, 503, 504].includes(r.status)) {
              throw new HttpError(r.status, `OpenAI ${r.status}`);
            }
            throw new Error(`OpenAI ${r.status}`);
          }
          return r;
        },
        { label: 'CONVERSION_AUDIT' },
      );
      clearTimeout(tid2);
      const data = await resp.json();
      const content = data?.choices?.[0]?.message?.content || '{}';
      llmJson = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
    } catch (e: any) {
      clearTimeout(tid2);
      logger.error('CONVERSION_AUDIT', `LLM call failed: ${e?.message}`);
      // Не падаем — у нас уже есть детерминированные барьеры и скор.
      llmJson = {};
    }

    // ── Слияние: жёсткие + мягкие, защита от запретных слов ───────
    const softBarriers: DeterministicBarrier[] = Array.isArray(llmJson.soft_barriers)
      ? llmJson.soft_barriers
          .map((b: any) => sanitizeBarrier(b))
          // Не дублируем то, что уже зафиксировано детерминированно.
          .filter((b: any) => {
            const t = (b?.title || '').toLowerCase();
            const det = deterministicBarriers.map((d) => d.title.toLowerCase());
            return !det.some((d) => t.includes(d.slice(0, 12).toLowerCase()));
          })
      : [];

    const allBarriers = [...deterministicBarriers, ...softBarriers].slice(0, 12);

    // Финальный CRO-скор: берём детерминированный пол и понижаем за софт-барьеры.
    let conversionScore = detScore;
    for (const b of softBarriers) {
      if (b.severity === 'critical') conversionScore -= 6;
      else if (b.severity === 'high') conversionScore -= 3;
      else conversionScore -= 1;
    }
    conversionScore = Math.max(0, Math.min(100, conversionScore));

    const result = {
      conversion_score: conversionScore,
      money_lost_estimate: sanitizeText(llmJson.money_lost_estimate || ''),
      direct_budget_waste: sanitizeText(llmJson.direct_budget_waste || ''),
      barriers: allBarriers,
      quick_wins: Array.isArray(llmJson.quick_wins)
        ? llmJson.quick_wins.map((x: string) => sanitizeText(String(x))).slice(0, 5)
        : [],
      fix_cost_estimate: {
        min: Number(llmJson.fix_cost_estimate?.min) || 20000,
        max: Number(llmJson.fix_cost_estimate?.max) || 60000,
        breakdown: Array.isArray(llmJson.fix_cost_estimate?.breakdown)
          ? llmJson.fix_cost_estimate.breakdown.map((x: string) => sanitizeText(String(x)))
          : [],
        roi_months: Number(llmJson.fix_cost_estimate?.roi_months) || 2,
      },
      cta_recommendation: sanitizeText(llmJson.cta_recommendation || ''),
      // Прозрачность: фронт может показать, что данные согласованы с GEO-аудитом.
      site_check_snapshot: siteCheck
        ? {
            scan_id: siteCheck.scan_id,
            scores: siteCheck.scores,
            theme: siteCheck.theme,
          }
        : null,
      meta: {
        signals,
        used_jina_fallback: page.usedJinaFallback,
        word_count: signals.wordCount,
      },
    };

    // ── Запись в кэш ─────────────────────────────────────────
    try {
      await sql`
        INSERT INTO conversion_audits (cache_key, url, domain, goal, traffic_source, main_problem, result)
        VALUES (${cacheKey}, ${url}, ${domain}, ${goal}, ${traffic_source}, ${main_problem}, ${sql.json(result as any)})
        ON CONFLICT (cache_key) DO UPDATE SET
          result = EXCLUDED.result,
          created_at = NOW()
      `;
    } catch (e: any) {
      logger.error('CONVERSION_AUDIT', `cache write failed: ${e?.message}`);
    }

    return reply.send({ success: true, url, domain, cached: false, ...result });
  });
}
