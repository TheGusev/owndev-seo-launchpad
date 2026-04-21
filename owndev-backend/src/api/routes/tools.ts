import type { FastifyInstance } from 'fastify';
import { callJsonLlm } from '../../services/Tools/llmCall.js';
import { fetchPageMetrics } from '../../services/Tools/pageMetrics.js';
import {
  SEO_AUDIT_SCHEMA,
  SEMANTIC_CORE_SCHEMA,
  TEXT_GEN_SCHEMA,
  CONTENT_BRIEF_SCHEMA,
  COMPETITOR_RECOMMENDATIONS_SCHEMA,
  BRAND_TRACKER_SCHEMA,
  AUTOFIX_SCHEMA,
  GEO_CONTENT_SCHEMA,
} from '../../services/Tools/schemas.js';

const AI_UNAVAILABLE = { error: 'AI временно недоступен, попробуйте через минуту' };

export async function toolsRoutes(app: FastifyInstance): Promise<void> {

  app.post('/tools/seo-audit', async (req, reply) => {
    const { url } = req.body as { url: string };
    if (!url) return reply.status(400).send({ error: 'url required' });
    const metrics = await fetchPageMetrics(url);
    if (!metrics) {
      return reply.status(502).send({ error: 'Не удалось загрузить страницу. Проверьте URL.' });
    }
    const ai = await callJsonLlm({
      schema: SEO_AUDIT_SCHEMA,
      systemPrompt:
        'Ты SEO/GEO эксперт. Анализируешь сайты и даёшь конкретные рекомендации на русском языке. Ответ строго в JSON через tool-calling.',
      userPrompt:
        `Проведи SEO+GEO аудит на основе реальных метрик. URL: ${url}\n\n` +
        `Title: ${metrics.title || '—'}\nDescription: ${metrics.description || '—'}\n` +
        `H1: ${metrics.h1 || '—'}\nH2/H3: ${metrics.h2Count}/${metrics.h3Count}\n` +
        `Слов: ${metrics.wordCount}\nИзображений без alt: ${metrics.imagesWithoutAlt}/${metrics.imageCount}\n` +
        `JSON-LD: ${metrics.hasJsonLd} (${metrics.jsonLdTypes.join(', ') || '—'})\n` +
        `FAQPage: ${metrics.hasFaq}\nCanonical: ${metrics.hasCanonical}, OG: ${metrics.hasOg}, Viewport: ${metrics.hasViewport}\n` +
        `HTTPS: ${metrics.isHttps}, robots.txt: ${metrics.hasRobotsTxt}, sitemap.xml: ${metrics.hasSitemapXml}\n` +
        `HTML: ${metrics.htmlSizeKB} КБ, загрузка: ${metrics.loadTimeMs} мс, lang: ${metrics.lang || '—'}\n\n` +
        `Сформируй issues (критичные/предупреждения/инфо) с категориями seo/llm и рекомендациями. ` +
        `Дай meta с краткой сводкой. seoScore используй ${metrics.seoScore}, llmScore оцени сам.`,
    });
    if (!ai) {
      // Возвращаем хоть что-то, чтобы фронт не показывал пустой экран
      return reply.send({
        success: true,
        result: {
          seoScore: metrics.seoScore,
          llmScore: metrics.hasJsonLd ? 50 : 30,
          summary: 'AI временно недоступен. Показаны базовые метрики, собранные с страницы.',
          issues: [],
          meta: {
            title: metrics.title,
            description: metrics.description,
            h1: metrics.h1,
            wordCount: metrics.wordCount,
          },
        },
      });
    }
    return reply.send({ success: true, result: ai });
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
    const ai = await callJsonLlm({
      schema: SEMANTIC_CORE_SCHEMA,
      systemPrompt:
        'Ты SEO-специалист, составляешь семантические ядра для русского рынка. Отвечай только через tool-call.',
      userPrompt:
        `Тема: "${topic}". Составь 5–8 кластеров. Для каждого: name (короткое), intent ` +
        `(informational/commercial/transactional/navigational), keywords — массив 8–15 русских поисковых фраз.`,
    });
    if (!ai) return reply.status(503).send(AI_UNAVAILABLE);
    return reply.send({ success: true, result: ai });
  });

  app.post('/tools/generate-text', async (req, reply) => {
    const { type, topic, keywords } = req.body as { type: string; topic: string; keywords: string };
    if (!topic) return reply.status(400).send({ error: 'topic required' });
    const ai = await callJsonLlm({
      schema: TEXT_GEN_SCHEMA,
      systemPrompt:
        'Ты SEO-копирайтер. Пишешь оптимизированные русскоязычные тексты. Отвечай только через tool-call.',
      userPrompt:
        `Тип: ${type || 'статья'}. Тема: "${topic}". Ключевые слова: ${keywords || '—'}. ` +
        `Объём 400–800 слов, заголовки H2/H3 в виде markdown ##/###. Верни в поле text.`,
    });
    if (!ai) return reply.status(503).send(AI_UNAVAILABLE);
    return reply.send({ success: true, result: ai });
  });

  app.post('/tools/generate-content-brief', async (req, reply) => {
    const { query, url, contentType } = req.body as { query: string; url?: string; contentType?: string };
    if (!query) return reply.status(400).send({ error: 'query required' });
    const ai = await callJsonLlm({
      schema: CONTENT_BRIEF_SCHEMA,
      systemPrompt:
        'Ты контент-стратег. Составляешь детальные SEO/GEO брифы на русском. Отвечай только через tool-call.',
      userPrompt:
        `Целевой запрос: "${query}". URL сайта: ${url || 'не указан'}. Тип контента: ${contentType || 'статья'}. ` +
        `Сформируй полный бриф: 3 варианта заголовка H1, мета-теги, структуру H2/H3, ключи (primary/secondary), ` +
        `вопросы для AI-цитирования, GEO-рекомендации, рекомендуемый schema.org-тип, тон, подходы конкурентов.`,
    });
    if (!ai) return reply.status(503).send(AI_UNAVAILABLE);
    return reply.send({ success: true, result: ai });
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
    if (!url1 || !url2) return reply.status(400).send({ error: 'url1 and url2 required' });
    const [page1, page2] = await Promise.all([fetchPageMetrics(url1), fetchPageMetrics(url2)]);
    if (!page1 || !page2) {
      return reply.status(502).send({
        error: 'Не удалось загрузить одну из страниц. Проверьте URL.',
      });
    }
    // LLM-комментарий — best-effort, не блокирует ответ.
    const ai = await callJsonLlm({
      schema: COMPETITOR_RECOMMENDATIONS_SCHEMA,
      systemPrompt:
        'Ты SEO/GEO аналитик. Сравниваешь две страницы и даёшь конкретные выводы на русском. Только tool-call.',
      userPrompt:
        `Страница 1 (${page1.url}): score=${page1.seoScore}, words=${page1.wordCount}, h1="${page1.h1}", JSON-LD=${page1.hasJsonLd}, FAQ=${page1.hasFaq}\n` +
        `Страница 2 (${page2.url}): score=${page2.seoScore}, words=${page2.wordCount}, h1="${page2.h1}", JSON-LD=${page2.hasJsonLd}, FAQ=${page2.hasFaq}\n` +
        `Дай: summary (2 предложения), strengths_page1, strengths_page2, recommendations.`,
    }).catch(() => null);
    return reply.send({
      success: true,
      result: { page1, page2, recommendations: ai },
    });
  });

  app.post('/tools/brand-tracker', async (req, reply) => {
    const { brand, prompts, aiSystems } = req.body as { brand: string; prompts: string[]; aiSystems: string[] };
    if (!brand || !prompts?.length || !aiSystems?.length) {
      return reply.status(400).send({ error: 'brand, prompts, aiSystems required' });
    }
    const ai = await callJsonLlm({
      schema: BRAND_TRACKER_SCHEMA,
      systemPrompt:
        'Ты эксперт по GEO (Generative Engine Optimization). Симулируешь, как AI-системы ответили бы на запросы. ' +
        'Для каждой пары (запрос × AI-система) сформируй реалистичную запись. Только tool-call, на русском.',
      userPrompt:
        `Бренд: "${brand}". AI-системы: ${aiSystems.join(', ')}. Запросы:\n` +
        prompts.map((p, i) => `${i + 1}. ${p}`).join('\n') +
        `\n\nДля каждой комбинации запрос × AI-система выдай объект с полями: prompt, aiSystem, mentioned (boolean), ` +
        `sentiment (positive/neutral/negative или null), position (число или null), competitors (массив строк), ` +
        `fullResponse (короткий ответ AI 1–3 предложения).`,
    });
    if (!ai) return reply.status(503).send(AI_UNAVAILABLE);
    return reply.send({ success: true, result: ai });
  });

  app.post('/tools/generate-autofix', async (req, reply) => {
    const { issueType, url, title, description } = req.body as { issueType: string; url: string; title?: string; description?: string };
    if (!issueType || !url) return reply.status(400).send({ error: 'issueType and url required' });
    const ai = await callJsonLlm({
      schema: AUTOFIX_SCHEMA,
      systemPrompt:
        'Ты технический SEO. Даёшь пошаговые инструкции по исправлению проблем. Только tool-call, на русском.',
      userPrompt:
        `Тип: ${issueType}. URL: ${url}. Заголовок: ${title || '—'}. Описание: ${description || '—'}. ` +
        `Сформируй: explanation (почему это проблема), steps (массив 3–6 шагов), code (готовый код или пустая строка).`,
    });
    if (!ai) return reply.status(503).send(AI_UNAVAILABLE);
    return reply.send({ success: true, result: ai });
  });

  app.post('/tools/generate-geo-content', async (req, reply) => {
    const { pages, niche, region, tone, customInstructions } = req.body as {
      pages: Array<{ city: string; service: string; slug: string }>;
      niche: string; region: string; tone?: string; customInstructions?: string;
    };
    if (!pages?.length) return reply.status(400).send({ error: 'pages required' });
    const slice = pages.slice(0, 8);
    const ai = await callJsonLlm({
      schema: GEO_CONTENT_SCHEMA,
      systemPrompt:
        'Ты копирайтер по гео-SEO для русского рынка. Пишешь конкретные региональные тексты. Только tool-call.',
      userPrompt:
        `Ниша: ${niche}. Регион: ${region}. Тон: ${tone || 'профессиональный'}. ` +
        `${customInstructions ? `Доп. инструкции: ${customInstructions}\n` : ''}` +
        `Страницы:\n${slice.map((p) => `- slug=${p.slug}, ${p.service} в ${p.city}`).join('\n')}\n\n` +
        `Для каждой: slug, h1, meta_title (≤60), meta_description (≤160), intro (100–150 слов).`,
    });
    if (!ai) return reply.status(503).send(AI_UNAVAILABLE);
    return reply.send({ success: true, result: ai });
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