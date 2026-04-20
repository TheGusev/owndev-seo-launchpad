import type { FastifyInstance } from 'fastify';
import { logger } from '../../utils/logger.js';

async function askOpenAI(systemPrompt: string, userPrompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY || '';
  if (!apiKey) {
    logger.warn('TOOLS', 'No OPENAI_API_KEY');
    return 'AI недоступен: не задан OPENAI_API_KEY на сервере';
  }
  try {
    const resp = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      logger.warn('TOOLS', `OpenAI error ${resp.status}: ${err.slice(0, 200)}`);
      return '';
    }
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content || '';
  } catch (e) {
    logger.warn('TOOLS', `askOpenAI failed: ${(e as Error).message}`);
    return '';
  }
}

export async function toolsRoutes(app: FastifyInstance): Promise<void> {

  app.post('/tools/seo-audit', async (req, reply) => {
    const { url } = req.body as { url: string };
    if (!url) return reply.status(400).send({ error: 'url required' });
    const result = await askOpenAI(
      'Ты SEO эксперт. Анализируй сайты и давай конкретные рекомендации на русском языке.',
      `Проведи базовый SEO-анализ сайта: ${url}. Укажи: 1) ключевые проблемы, 2) рекомендации по исправлению, 3) приоритеты. Ответ на русском языке.`
    );
    return reply.send({ success: true, result });
  });

  app.post('/tools/check-indexation', async (req, reply) => {
    const { url } = req.body as { url: string };
    if (!url) return reply.status(400).send({ error: 'url required' });
    try {
      const [siteResp, robotsResp] = await Promise.allSettled([
        fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(10000) }),
        fetch(new URL('/robots.txt', url).toString(), { signal: AbortSignal.timeout(5000) }),
      ]);
      const site = siteResp.status === 'fulfilled' ? siteResp.value : null;
      const robots = robotsResp.status === 'fulfilled' ? robotsResp.value : null;
      const robotsTxt = robots?.ok ? await robots.text() : '';
      const isBlocked = robotsTxt.toLowerCase().includes('disallow: /');
      return reply.send({
        success: true,
        status: site?.status ?? 0,
        accessible: site?.ok ?? false,
        robotsBlocked: isBlocked,
        robotsTxt: robotsTxt.slice(0, 500),
      });
    } catch (e) {
      return reply.send({ success: false, error: (e as Error).message });
    }
  });

  app.post('/tools/generate-semantic-core', async (req, reply) => {
    const { topic } = req.body as { topic: string };
    if (!topic) return reply.status(400).send({ error: 'topic required' });
    const result = await askOpenAI(
      'Ты SEO специалист. Составляешь семантические ядра для сайтов. Отвечай на русском языке.',
      `Составь семантическое ядро для тематики: "${topic}". Раздели ключевые слова на кластеры: высокочастотные (5-10 слов), среднечастотные (10-15 слов), низкочастотные (15-20 слов). Для каждого слова укажи примерную частотность.`
    );
    return reply.send({ success: true, result });
  });

  app.post('/tools/generate-text', async (req, reply) => {
    const { type, topic, keywords } = req.body as { type: string; topic: string; keywords: string };
    const result = await askOpenAI(
      'Ты копирайтер-SEO специалист. Пишешь SEO-оптимизированные тексты на русском языке.',
      `Напиши ${type || 'статью'} на тему: "${topic}". Ключевые слова для вхождения: ${keywords}. Объём: 600-800 слов. Используй подзаголовки H2/H3.`
    );
    return reply.send({ success: true, result });
  });

  app.post('/tools/generate-content-brief', async (req, reply) => {
    const { query, url, contentType } = req.body as { query: string; url?: string; contentType?: string };
    const result = await askOpenAI(
      'Ты контент-стратег. Составляешь детальные брифы для SEO-контента. Отвечай на русском языке.',
      `Составь контент-бриф для запроса: "${query}". URL сайта: ${url || 'не указан'}. Тип контента: ${contentType || 'статья'}. Включи в бриф: цель страницы, структуру с заголовками, ключевые слова, требования к объёму, рекомендации по форматированию и внутренним ссылкам.`
    );
    return reply.send({ success: true, result });
  });

  app.post('/tools/check-internal-links', async (req, reply) => {
    const { url } = req.body as { url: string };
    if (!url) return reply.status(400).send({ error: 'url required' });
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
      const html = await resp.text();
      const links = [...html.matchAll(/href=["']([^"'#?][^"']*?)["']/g)].map(m => m[1]);
      const origin = new URL(url).origin;
      const internal = [...new Set(links.filter(l => l.startsWith('/') || l.startsWith(origin)))];
      const external = [...new Set(links.filter(l => l.startsWith('http') && !l.startsWith(origin)))];
      return reply.send({
        success: true,
        total: links.length,
        internal: internal.length,
        external: external.length,
        internalLinks: internal.slice(0, 50),
        externalLinks: external.slice(0, 20),
      });
    } catch (e) {
      return reply.send({ success: false, error: (e as Error).message });
    }
  });

  app.post('/tools/competitor-analysis', async (req, reply) => {
    const { url1, url2 } = req.body as { url1: string; url2: string };
    const result = await askOpenAI(
      'Ты SEO аналитик. Проводишь сравнительный анализ сайтов. Отвечай на русском языке.',
      `Сравни два сайта: ${url1} и ${url2}. Проанализируй по параметрам: контент и структура, техническое SEO, предполагаемый ссылочный профиль, пользовательский опыт, GEO-готовность. Для каждого сайта укажи сильные и слабые стороны. Дай рекомендации.`
    );
    return reply.send({ success: true, result });
  });

  app.post('/tools/brand-tracker', async (req, reply) => {
    const { brand, prompts, aiSystems } = req.body as { brand: string; prompts: string[]; aiSystems: string[] };
    const result = await askOpenAI(
      'Ты эксперт по GEO (Generative Engine Optimization). Анализируешь присутствие брендов в AI-системах. Отвечай на русском языке.',
      `Проанализируй вероятность упоминания бренда "${brand}" в AI-системах: ${(aiSystems || []).join(', ')}. Тестовые запросы: ${(prompts || []).join('; ')}. Оцени: 1) шансы появления в ответах, 2) что нужно улучшить на сайте для GEO-видимости, 3) конкретные рекомендации.`
    );
    return reply.send({ success: true, result });
  });

  app.post('/tools/generate-autofix', async (req, reply) => {
    const { issueType, url, title, description } = req.body as { issueType: string; url: string; title?: string; description?: string };
    const result = await askOpenAI(
      'Ты SEO технический специалист. Даёшь конкретные пошаговые инструкции по исправлению SEO проблем. Отвечай на русском языке.',
      `Дай конкретную инструкцию по исправлению SEO проблемы:\nТип проблемы: ${issueType}\nСайт: ${url}\nНазвание проблемы: ${title || '—'}\nОписание: ${description || '—'}\nПредоставь: 1) объяснение почему это проблема, 2) пошаговое исправление, 3) готовый код если применимо.`
    );
    return reply.send({ success: true, result });
  });

  app.post('/tools/generate-geo-content', async (req, reply) => {
    const { pages, niche, region, tone, customInstructions } = req.body as {
      pages: Array<{ city: string; service: string; slug: string }>;
      niche: string; region: string; tone?: string; customInstructions?: string;
    };
    const result = await askOpenAI(
      'Ты копирайтер по гео-SEO. Пишешь тексты для региональных страниц на русском языке.',
      `Напиши гео-контент:\nНиша: ${niche}\nРегион: ${region}\nТональность: ${tone || 'профессиональная'}\nСтраницы для создания: ${JSON.stringify((pages || []).slice(0, 3))}\n${customInstructions ? `Дополнительные инструкции: ${customInstructions}` : ''}\nДля каждой страницы напиши заголовок H1, мета-описание и вводный абзац 100-150 слов.`
    );
    return reply.send({ success: true, result });
  });

  app.post('/tools/send-telegram', async (req, reply) => {
    const body = req.body as {
      chat_id?: string;
      message?: string;
      text?: string;
      name?: string;
      phone?: string;
      email?: string;
      service?: string;
    };
    const token = process.env.TELEGRAM_BOT_TOKEN || '';
    if (!token) return reply.status(503).send({ error: 'TELEGRAM_BOT_TOKEN не задан на сервере' });
    const chatId = body.chat_id || process.env.TELEGRAM_CHAT_ID || '';
    if (!chatId) return reply.status(400).send({ error: 'chat_id required' });

    let text = body.message || body.text || '';
    if (!text && (body.name || body.phone || body.email)) {
      text = `📬 <b>НОВАЯ ЗАЯВКА С САЙТА</b>\n\n👤 <b>Имя:</b> ${body.name || '—'}\n📞 <b>Телефон:</b> ${body.phone || '—'}\n📧 <b>Email:</b> ${body.email || '—'}\n🛠 <b>Услуга:</b> ${body.service || '—'}\n💬 <b>Сообщение:</b>\n${(body as any).message || 'Не указано'}`;
    }

    const resp = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    const data = await resp.json();
    return reply.send({ success: resp.ok, data });
  });
}