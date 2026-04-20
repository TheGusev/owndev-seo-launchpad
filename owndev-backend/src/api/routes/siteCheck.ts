import type { FastifyInstance } from 'fastify';
import { sql } from '../../db/client.js';
import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';
import { redis } from '../../cache/redis.js';
import { logger } from '../../utils/logger.js';
import { calcGeoScore } from '../../services/GeoScoreService.js';
import { isValidUrl, normalizeUrl } from '../../utils/url.js';

const CONCURRENCY_LIMIT = Number(process.env.SITE_CHECK_CONCURRENCY ?? 10);

export async function siteCheckRoutes(app: FastifyInstance): Promise<void> {
  // Ensure table exists with all needed columns
  await sql`
    CREATE TABLE IF NOT EXISTS site_check_scans (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      url         TEXT        NOT NULL,
      mode        TEXT        NOT NULL DEFAULT 'site',
      status      TEXT        NOT NULL DEFAULT 'running',
      progress_pct INT        NOT NULL DEFAULT 0,
      theme       TEXT,
      is_spa      BOOLEAN     DEFAULT false,
      scores      JSONB,
      issues      JSONB       DEFAULT '[]'::jsonb,
      competitors JSONB       DEFAULT '[]'::jsonb,
      keywords    JSONB       DEFAULT '[]'::jsonb,
      minus_words JSONB       DEFAULT '[]'::jsonb,
      seo_data    JSONB,
      result      JSONB,
      error_message TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Ensure geo_rating table exists
  await sql`
    CREATE TABLE IF NOT EXISTS geo_rating (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      domain TEXT NOT NULL,
      display_name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Сервисы',
      llm_score INTEGER NOT NULL DEFAULT 0,
      seo_score INTEGER NOT NULL DEFAULT 0,
      schema_score INTEGER NOT NULL DEFAULT 0,
      direct_score INTEGER NOT NULL DEFAULT 0,
      has_llms_txt BOOLEAN NOT NULL DEFAULT false,
      has_faqpage BOOLEAN NOT NULL DEFAULT false,
      has_schema BOOLEAN NOT NULL DEFAULT false,
      errors_count INTEGER NOT NULL DEFAULT 0,
      top_errors JSONB DEFAULT '[]'::jsonb,
      last_checked_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_rating_domain ON geo_rating(domain)`;

  // Add columns if they don't exist (for existing tables)
  for (const col of [
    'theme TEXT',
    'is_spa BOOLEAN DEFAULT false',
    'competitors JSONB DEFAULT \'[]\'::jsonb',
    'keywords JSONB DEFAULT \'[]\'::jsonb',
    'minus_words JSONB DEFAULT \'[]\'::jsonb',
    'seo_data JSONB',
    'issues JSONB DEFAULT \'[]\'::jsonb',
  ]) {
    const colName = col.split(' ')[0];
    try {
      await sql`SELECT ${sql(colName)} FROM site_check_scans LIMIT 0`;
    } catch {
      try {
        await sql.unsafe(`ALTER TABLE site_check_scans ADD COLUMN IF NOT EXISTS ${col}`);
      } catch {}
    }
  }

  const queue = new Queue('site-check', { connection: redis });

  // POST /api/v1/site-check/start
  app.post<{ Body: { url: string; mode?: string; force?: boolean } }>('/start', async (req, reply) => {
    const { url, mode = 'page', force = false } = req.body as { url: string; mode?: string; force?: boolean };
    if (!url) return reply.status(400).send({ success: false, error: 'url is required' });

    // Normalize and validate URL — protect worker from invalid input
    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(url);
      if (!isValidUrl(normalizedUrl)) throw new Error('invalid');
      const parsed = new URL(normalizedUrl);
      if (!parsed.hostname || parsed.hostname.length < 3 || !parsed.hostname.includes('.')) {
        return reply.status(400).send({
          success: false,
          error: 'Некорректный URL. Укажите адрес сайта, например: https://example.ru',
        });
      }
      if (
        parsed.hostname === 'localhost' ||
        /^\d+\.\d+\.\d+\.\d+$/.test(parsed.hostname) ||
        parsed.hostname.endsWith('.local')
      ) {
        return reply.status(400).send({
          success: false,
          error: 'Укажите реальный домен сайта',
        });
      }
    } catch {
      return reply.status(400).send({
        success: false,
        error: 'Некорректный URL. Проверьте написание адреса.',
      });
    }

    const [{ count }] = await sql<[{ count: number }]>`
      SELECT COUNT(*)::int AS count FROM site_check_scans WHERE status = 'running'
    `;
    if ((count || 0) >= CONCURRENCY_LIMIT) {
      return reply
        .status(429)
        .send({
          success: false,
          error: 'Сервер загружен. Попробуйте через пару минут.',
          code: 'RATE_LIMIT',
        });
    }

    // Check cache (skip if force=true)
    if (!force) {
      let hostname = normalizedUrl;
      try {
        hostname = new URL(normalizedUrl).hostname;
      } catch {}
      const today = new Date().toISOString().slice(0, 10);
      const cached = await sql<[{ id: string }?]>`
        SELECT id FROM site_check_scans
        WHERE url LIKE ${'%' + hostname + '%'}
          AND status = 'done'
          AND created_at::date = ${today}::date
        ORDER BY created_at DESC LIMIT 1
      `;
      if (cached[0]) {
        return reply.status(429).send({
          success: false,
          error: 'Этот домен уже проверялся сегодня.',
          code: 'ALREADY_SCANNED',
          last_scan_id: cached[0].id,
        });
      }
    }

    const scan_id = randomUUID();
    await sql`
      INSERT INTO site_check_scans (id, url, mode, status, progress_pct)
      VALUES (${scan_id}, ${normalizedUrl}, ${mode}, 'running', 0)
    `;

    await queue.add('scan', { scan_id, url: normalizedUrl, mode });
    logger.info('SITE_CHECK', `Scan ${scan_id} queued for ${normalizedUrl}`);
    return reply.status(200).send({ scan_id, status: 'running' });
  });

  // GET /api/v1/site-check/status/:scanId
  app.get<{ Params: { scanId: string } }>('/status/:scanId', async (req, reply) => {
    const { scanId } = req.params;
    const rows = await sql<
      Array<{ status: string; progress_pct: number; scores: unknown; error_message: string | null }>
    >`
      SELECT status, progress_pct, scores, error_message
      FROM site_check_scans
      WHERE id = ${scanId}
    `;
    if (!rows.length) {
      return reply.status(404).send({ success: false, error: 'Scan not found' });
    }
    const row = rows[0];
    return reply.send({
      status: row.status,
      progress_pct: row.progress_pct,
      scores_preview: row.scores ?? null,
      error_message: row.error_message ?? null,
    });
  });

  // GET /api/v1/site-check/result/:scanId — FLATTENED response for frontend
  app.get<{ Params: { scanId: string } }>('/result/:scanId', async (req, reply) => {
    const { scanId } = req.params;
    const rows = await sql<Array<any>>`
      SELECT id, url, mode, status, progress_pct, theme, is_spa,
             scores, issues, competitors, keywords, minus_words,
             seo_data, result, error_message, created_at
      FROM site_check_scans
      WHERE id = ${scanId}
    `;
    if (!rows.length) {
      return reply.status(404).send({ success: false, error: 'Scan not found' });
    }
    const row = rows[0] as any;

    let scores = row.scores ?? null;
    let result = row.result ?? null;

    try {
      scores = typeof scores === 'string' ? JSON.parse(scores) : scores;
    } catch {
      scores = row.scores ?? null;
    }

    try {
      result = typeof result === 'string' ? JSON.parse(result) : result;
    } catch {
      result = row.result ?? null;
    }

    const issues = result?.issues ?? (typeof row.issues === 'string' ? JSON.parse(row.issues) : (row.issues ?? []));
    const blocks = result?.blocks ?? [];
    const summary = result?.summary ?? null;

    const totalScore = scores?.total ?? result?.score ?? scores?.seo ?? null;

    return reply.send({
      id: row.id,
      scan_id: row.id,
      url: row.url,
      mode: row.mode,
      status: row.status,
      progress_pct: row.progress_pct,

      scores: {
        total: totalScore,
        seo: scores?.seo ?? null,
        direct: scores?.direct ?? null,
        schema: scores?.schema ?? null,
        ai: scores?.ai ?? null,
        confidence: scores?.confidence ?? null,
        issues_count: scores?.issues_count ?? issues.length ?? null,
        breakdown: scores?.breakdown ?? null,
        blocks: scores?.blocks ?? [],
      },

      score: totalScore,
      summary,
      issues,
      blocks,
      theme: result?.theme ?? row.theme ?? null,
      competitors: result?.competitors ?? (typeof row.competitors === 'string' ? JSON.parse(row.competitors) : (row.competitors ?? [])),
      keywords: result?.keywords ?? (typeof row.keywords === 'string' ? JSON.parse(row.keywords) : (row.keywords ?? [])),
      minus_words: result?.minus_words ?? (typeof row.minus_words === 'string' ? JSON.parse(row.minus_words) : (row.minus_words ?? [])),
      seo_data: result?.seo_data ?? (typeof row.seo_data === 'string' ? JSON.parse(row.seo_data) : (row.seo_data ?? null)),
      llm_judge: result?.llm_judge ?? null,
      ai_boost: result?.ai_boost ?? null,

      result,
      raw_scores: scores,

      is_spa: row.is_spa ?? false,
      error_message: row.error_message ?? null,
      created_at: row.created_at,
    });
  });

  // GET /api/v1/site-check/preview/:scanId
  app.get<{ Params: { scanId: string } }>('/preview/:scanId', async (req, reply) => {
    const { scanId } = req.params;
    const rows = await sql<Array<{ status: string; progress_pct: number; scores: unknown }>>`
      SELECT status, progress_pct, scores
      FROM site_check_scans
      WHERE id = ${scanId}
    `;
    if (!rows.length) {
      return reply.status(404).send({ success: false, error: 'Scan not found' });
    }
    const row = rows[0];
    return reply.send({
      status: row.status,
      progress_pct: row.progress_pct,
      scores: row.scores ?? null,
    });
  });

  // POST /api/v1/site-check/report/create
  app.post<{ Body: { scan_id: string; email: string } }>('/report/create', async (req, reply) => {
    const { scan_id, email } = req.body as { scan_id: string; email: string };
    if (!scan_id || !email) {
      return reply
        .status(400)
        .send({ success: false, error: 'scan_id and email are required' });
    }
    await sql`
      CREATE TABLE IF NOT EXISTS site_check_reports (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        scan_id UUID NOT NULL,
        email TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        download_token TEXT,
        payment_url TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    const report_id = randomUUID();
    const download_token = randomUUID();
    await sql`
      INSERT INTO site_check_reports (id, scan_id, email, status, download_token)
      VALUES (${report_id}, ${scan_id}, ${email}, 'pending', ${download_token})
    `;
    return reply
      .status(200)
      .send({ report_id, download_token, payment_url: null });
  });

  // GET /api/v1/site-check/report/:reportId
  app.get<{ Params: { reportId: string }; Querystring: { token?: string } }>(
    '/report/:reportId',
    async (req, reply) => {
      const { reportId } = req.params;
      const { token } = req.query as { token?: string };
      const rows = await sql<Array<any>>`
        SELECT id, scan_id, email, status, download_token, payment_url
        FROM site_check_reports
        WHERE id = ${reportId}
      `;
      if (!rows.length) {
        return reply
          .status(404)
          .send({ success: false, error: 'Report not found' });
      }
      const row = rows[0];
      if (token && row.download_token !== token) {
        return reply
          .status(403)
          .send({ success: false, error: 'Invalid token' });
      }
      return reply.send(row);
    },
  );

  // POST /api/v1/site-check/llm-judge
  app.post<{ Body: { scan_id?: string; url: string; theme?: string } }>(
    '/llm-judge',
    async (req, reply) => {
      const { url, theme, scan_id } = req.body as { url: string; theme?: string; scan_id?: string };
      if (!url) return reply.status(400).send({ error: 'url required' });

      // Try cache from DB first — only if result was computed deterministically
      if (scan_id) {
        try {
          const cached = await sql<Array<{ llm_judge: any }>>`
            SELECT result->'llm_judge' AS llm_judge
            FROM site_check_scans
            WHERE id = ${scan_id}
          `;
          const cachedJudge = cached[0]?.llm_judge;
          // Only use cache if it was produced by the deterministic algorithm (_deterministic flag)
          if (cachedJudge && typeof cachedJudge === 'object' && (cachedJudge as any)._deterministic === true && Array.isArray((cachedJudge as any).systems) && (cachedJudge as any).systems.length > 0) {
            logger.info('LLM_JUDGE', `Deterministic cache hit for scan ${scan_id}`);
            return reply.send({ ...(cachedJudge as object), _cached: true });
          }
        } catch (e) {
          logger.warn('LLM_JUDGE', `Cache read failed: ${(e as Error).message}`);
        }
      }

      const domain = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();

      // ─── Fetch scan result from DB to extract seo_data ───
      let seoData: any = null;
      if (scan_id) {
        try {
          const rows = await sql<Array<{ seo_data: any }>>`
            SELECT seo_data FROM site_check_scans WHERE id = ${scan_id}
          `;
          seoData = rows[0]?.seo_data ?? null;
        } catch (e) {
          logger.warn('LLM_JUDGE', `seo_data fetch failed: ${(e as Error).message}`);
        }
      }

      // ─── If no seo_data in DB, do a quick live fetch ───
      let liveHtml = '';
      if (!seoData) {
        try {
          const r = await fetch(url, { signal: AbortSignal.timeout(10000), headers: { 'User-Agent': 'Mozilla/5.0' } });
          liveHtml = await r.text();
        } catch (e) {
          logger.warn('LLM_JUDGE', `live fetch failed: ${(e as Error).message}`);
        }
      }

      // ─── Helper: get HTML either from DB seo_data or live fetch ───
      // seo_data doesn't store raw HTML, so we need live fetch for regex-based signals
      // We'll fetch robots.txt separately for AI-crawler check
      const hostname = (() => { try { return new URL(url).hostname; } catch { return ''; } })();
      const origin = (() => { try { const u = new URL(url); return `${u.protocol}//${u.hostname}`; } catch { return ''; } })();

      // Use seo_data fields if available, otherwise parse liveHtml
      const html = liveHtml || '';

      // ─── robots.txt — check for AI crawlers ───
      let robotsTxt = '';
      try {
        const rr = await fetch(`${origin}/robots.txt`, { signal: AbortSignal.timeout(5000) });
        if (rr.ok) robotsTxt = await rr.text();
      } catch {}
      const AI_CRAWLERS = /GPTBot|OAI-SearchBot|PerplexityBot|anthropic-ai|ClaudeBot|Googlebot-Extended|BingAI/i;
      const robotsAllowsAiCrawlers = (() => {
        if (!robotsTxt) return true; // assume allowed if can't check
        // check if any AI crawler is explicitly allowed or not blocked
        const lines = robotsTxt.split('\n').map(l => l.trim());
        let currentAgent = '';
        let anyAiAllowed = false;
        for (const line of lines) {
          if (line.startsWith('User-agent:')) {
            currentAgent = line.replace('User-agent:', '').trim();
          } else if (line.startsWith('Disallow:') && AI_CRAWLERS.test(currentAgent)) {
            const path = line.replace('Disallow:', '').trim();
            if (path === '/' || path === '') return false; // full block
          } else if (line.startsWith('Allow:') && AI_CRAWLERS.test(currentAgent)) {
            anyAiAllowed = true;
          }
          if (currentAgent === '*' && line.startsWith('Disallow:') && line.replace('Disallow:', '').trim() === '/') {
            // all blocked
            return anyAiAllowed;
          }
        }
        return true; // not explicitly blocked
      })();

      // ─── llms.txt length (always try — needed for scoring) ───
      let llmsTxtLength = 0;
      try {
        const lr = await fetch(`${origin}/llms.txt`, { signal: AbortSignal.timeout(5000) });
        if (lr.ok) { const t = await lr.text(); llmsTxtLength = t.length; }
      } catch {}

      // ─── pageAge via WHOIS-like heuristic (domain creation date) ───
      let pageAge: number | null = null;
      try {
        // Try to get domain registration year from rdap
        const rdapResp = await fetch(`https://rdap.org/domain/${hostname.replace(/^www\./, '')}`, {
          signal: AbortSignal.timeout(5000),
          headers: { 'Accept': 'application/json' },
        });
        if (rdapResp.ok) {
          const rdap = await rdapResp.json();
          const events = rdap?.events || [];
          const registered = events.find((e: any) => e.eventAction === 'registration');
          if (registered?.eventDate) {
            const regDate = new Date(registered.eventDate);
            pageAge = Math.floor((Date.now() - regDate.getTime()) / (1000 * 60 * 60 * 24));
          }
        }
      } catch {}

      // ─── Build GeoParams from seo_data + supplemental signals ───
      // Parse additional signals from live HTML if available
      const htmlForParsing = html;
      const hasHreflang = seoData?.hasHreflang ?? /hreflang/i.test(htmlForParsing);
      const hasLists = seoData?.hasLists ?? (/<ul[\s>]|<ol[\s>]/i.test(htmlForParsing));
      const hasTables = seoData?.hasTables ?? (/<table[\s>]/i.test(htmlForParsing));
      const hasAuthorMeta = seoData?.hasAuthorMeta ?? (/об\s*автор|author|автор\s*стать|Person/i.test(htmlForParsing));
      const hasContactPage = seoData?.hasContactPage ?? (/контакт|contact/i.test(htmlForParsing));
      const hasReviews = seoData?.hasReviews ?? (/отзыв|review|Review/i.test(htmlForParsing));
      const hasPricingBlock = seoData?.hasPricingBlock ?? (/цен|тариф|price|pricing/i.test(htmlForParsing));

      const geoParams = {
        hasLlmsTxt: seoData?.hasLlmsTxt ?? false,
        llmsTxtLength,
        hasJsonLd: seoData?.hasSchema ?? (/<script[^>]*type=["']application\/ld\+json["']/i.test(htmlForParsing)),
        schemaTypes: seoData?.schemaTypes ?? [],
        wordCount: seoData?.wordCount ?? 0,
        hasH1: seoData ? (seoData.h1Count > 0 || (seoData.h1 && seoData.h1.length > 0)) : (/<h1[\s>]/i.test(htmlForParsing)),
        hasFaq: seoData?.hasFaq ?? (/faq|часто\s*задаваемые|вопрос.*ответ/i.test(htmlForParsing)),
        hasHreflang,
        isRuDomain: hostname.endsWith('.ru') || hostname.endsWith('.рф'),
        robotsAllowsAiCrawlers,
        sitemapExists: seoData?.hasSitemap ?? false,
        loadTimeMs: seoData?.loadTimeMs ?? 0,
        hasLists,
        hasTables,
        hasAuthorMeta,
        hasContactPage,
        hasReviews,
        hasPricingBlock,
        pageAge,
      };

      // ─── Deterministic GEO score (no LLM, 100% reproducible) ───
      const geoResult = calcGeoScore(geoParams);

      // Map to legacy response shape expected by frontend
      const SYSTEM_META: Record<string, { icon: string; color: string }> = {
        chatgpt:     { icon: 'openai',     color: '#10a37f' },
        perplexity:  { icon: 'perplexity', color: '#20b2aa' },
        yandex_neiro:{ icon: 'yandex',     color: '#ff0000' },
        gemini:      { icon: 'google',     color: '#4285f4' },
        gigachat:    { icon: 'sber',       color: '#21a038' },
        alisa:       { icon: 'alice',      color: '#7B68EE' },
      };
      const results = geoResult.systems.map(s => ({
        ...s,
        ...(SYSTEM_META[s.id] ?? { icon: s.id, color: '#888' }),
      }));
      const payload = { success: true, url, domain, avg_score: geoResult.avg_score, systems: results, _pending: false, _deterministic: true };

      // Persist to DB inside result.llm_judge for next page load
      if (scan_id) {
        try {
          await sql`
            UPDATE site_check_scans
            SET result = COALESCE(result, '{}'::jsonb) || jsonb_build_object('llm_judge', ${JSON.stringify(payload)}::jsonb),
                updated_at = NOW()
            WHERE id = ${scan_id}
          `;
          logger.info('LLM_JUDGE', `Cached result for scan ${scan_id}`);
        } catch (e) {
          logger.warn('LLM_JUDGE', `Cache write failed: ${(e as Error).message}`);
        }
      }

      return reply.send(payload);
    },
  );

  // POST /api/v1/site-check/ai-boost
  app.post<{ Body: { url: string; theme?: string; scores?: any; issues?: any[]; scan_id?: string; force?: boolean } }>(
    '/ai-boost',
    async (req, reply) => {
      const { url, theme, scores, issues, scan_id, force } = req.body as {
        url: string; theme?: string; scores?: any; issues?: any[]; scan_id?: string; force?: boolean;
      };
      if (!url) return reply.status(400).send({ error: 'url required' });

      // Cache check — return stored ai_boost if present
      if (scan_id && !force) {
        try {
          const cached = await sql<Array<{ ai_boost: any }>>`
            SELECT result->'ai_boost' AS ai_boost
            FROM site_check_scans
            WHERE id = ${scan_id}
          `;
          const cachedBoost = cached[0]?.ai_boost;
          if (cachedBoost && typeof cachedBoost === 'object' && Array.isArray((cachedBoost as any).items) && (cachedBoost as any).items.length > 0) {
            logger.info('AI_BOOST', `Cache hit for scan ${scan_id}`);
            return reply.send({ ...(cachedBoost as object), _cached: true });
          }
        } catch (e) {
          logger.warn('AI_BOOST', `Cache read failed: ${(e as Error).message}`);
        }
      }

      const apiKey = process.env.OPENAI_API_KEY || '';
      if (!apiKey) return reply.status(503).send({ error: 'OPENAI_API_KEY не задан' });

      const domain = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();
      const topIssues = (issues || []).slice(0, 5).map((i: any) => i.title || i.found || '').filter(Boolean).join('; ');

      const systemPrompt = `Ты эксперт по GEO (Generative Engine Optimization) — оптимизации сайтов для попадания в ответы нейросетей. Всегда отвечай ТОЛЬКО валидным JSON-массивом без markdown.`;

      const userPrompt = `Данные аудита сайта ${domain}:
- Тематика: ${theme || 'не указана'}
- SEO Score: ${scores?.seo || 0}/100
- LLM Score: ${scores?.ai || 0}/100
- Schema Score: ${scores?.schema || 0}/100
- Топ проблемы: ${topIssues || 'нет данных'}

Сгенерируй персонализированный план из 10 конкретных действий для попадания в ответы нейросетей (ChatGPT, Perplexity, Яндекс Алиса, GigaChat).

Для каждого действия верни объект:
{
  "id": "уникальный id строкой 1-10",
  "action": "конкретное действие в 1 предложении",
  "priority": "high" | "medium" | "low",
  "impact": "ожидаемое влияние в 1 предложении",
  "timeframe": "1 день" | "1 неделя" | "1 месяц",
  "category": "technical" | "content" | "pr" | "schema"
}

Верни JSON-массив из ровно 10 объектов. Без markdown, без пояснений — только массив.`;

      try {
        const resp = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.2,
            max_tokens: 2000,
          }),
        });
        if (!resp.ok) throw new Error(`OpenAI ${resp.status}`);
        const data = await resp.json();
        const content = data?.choices?.[0]?.message?.content || '[]';
        const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
        const payload = { success: true, domain, items: Array.isArray(parsed) ? parsed : [] };

        // Persist to DB inside result.ai_boost for next page load
        if (scan_id) {
          try {
            await sql`
              UPDATE site_check_scans
              SET result = COALESCE(result, '{}'::jsonb) || jsonb_build_object('ai_boost', ${JSON.stringify(payload)}::jsonb),
                  updated_at = NOW()
              WHERE id = ${scan_id}
            `;
            logger.info('AI_BOOST', `Cached result for scan ${scan_id}`);
          } catch (e) {
            logger.warn('AI_BOOST', `Cache write failed: ${(e as Error).message}`);
          }
        }

        return reply.send(payload);
      } catch (e) {
        logger.warn('AI_BOOST', `Failed: ${(e as Error).message}`);
        return reply.status(500).send({ error: 'Не удалось сгенерировать план' });
      }
    },
  );

  // POST /api/v1/site-check/nomination
  app.post<{ Body: any }>('/nomination', async (req, reply) => {
    const { domain, display_name, category, email, scan_id, total_score } =
      req.body as any;
    if (!domain || !display_name) {
      return reply
        .status(400)
        .send({ success: false, error: 'domain and display_name are required' });
    }
    await sql`
      CREATE TABLE IF NOT EXISTS geo_rating_nominations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        domain TEXT NOT NULL,
        display_name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'Другое',
        email TEXT,
        scan_id UUID,
        total_score INT NOT NULL DEFAULT 0,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    await sql`
      INSERT INTO geo_rating_nominations (domain, display_name, category, email, scan_id, total_score)
      VALUES (${domain}, ${display_name}, ${category || 'Другое'}, ${email || null}, ${
        scan_id || null
      }, ${total_score || 0})
    `;
    return reply.status(200).send({ success: true });
  });

  // GET /api/v1/site-check/tech-passport — технический паспорт сайта
  app.get<{ Querystring: { url: string } }>('/tech-passport', async (req, reply) => {
    const { url } = req.query as { url: string };
    if (!url) return reply.status(400).send({ success: false, error: 'url required' });

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return reply.status(400).send({ success: false, error: 'Некорректный URL' });
    }
    const domain = parsedUrl.hostname;
    const baseUrl = `${parsedUrl.protocol}//${domain}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const checks = await Promise.allSettled([
      fetch(baseUrl, { method: 'HEAD', signal: controller.signal, headers: { 'User-Agent': 'OWNDEV-TechPassport/1.0' } }),
      fetch(`${baseUrl}/robots.txt`, { signal: controller.signal }),
      fetch(`${baseUrl}/llms.txt`, { signal: controller.signal }),
      fetch(`${baseUrl}/sitemap.xml`, { signal: controller.signal }),
      fetch(`${baseUrl}/sitemap_index.xml`, { signal: controller.signal }),
      fetch(`${baseUrl}/.well-known/security.txt`, { signal: controller.signal }),
    ]);
    clearTimeout(timeout);

    const [siteResp, robotsResp, llmsResp, sitemapResp, sitemapIdxResp, securityResp] = checks;

    const siteOk = siteResp.status === 'fulfilled' && (siteResp.value as Response).ok;
    const siteHeaders: Record<string, string> = {};
    if (siteResp.status === 'fulfilled') {
      const resp = siteResp.value as Response;
      for (const h of ['server', 'x-powered-by', 'content-type', 'x-frame-options', 'strict-transport-security', 'content-security-policy', 'x-content-type-options']) {
        const v = resp.headers.get(h);
        if (v) siteHeaders[h] = v;
      }
    }

    const robotsTxt = robotsResp.status === 'fulfilled' && (robotsResp.value as Response).ok
      ? await (robotsResp.value as Response).text().catch(() => '')
      : '';
    const hasRobots = !!robotsTxt;
    const hasGptBot = robotsTxt.toLowerCase().includes('gptbot');
    const hasLlmsTxt = llmsResp.status === 'fulfilled' && (llmsResp.value as Response).ok;
    const hasSitemap = (sitemapResp.status === 'fulfilled' && (sitemapResp.value as Response).ok)
      || (sitemapIdxResp.status === 'fulfilled' && (sitemapIdxResp.value as Response).ok);
    const hasSecurityTxt = securityResp.status === 'fulfilled' && (securityResp.value as Response).ok;

    // Detect CMS/tech from headers and robots.txt
    const serverVal = siteHeaders['server'] || '';
    const powered = siteHeaders['x-powered-by'] || '';

    // Build structured tech object (matches TechPassport.tsx interface)
    let cms: string | undefined;
    let framework: string | undefined;
    let language: string | undefined;
    let serverSoftware: string | undefined;

    if (/wordpress/i.test(powered) || /wp-content/i.test(robotsTxt)) cms = 'WordPress';
    else if (/bitrix/i.test(robotsTxt) || /bitrix/i.test(powered)) cms = '1C-Bitrix';
    else if (/tilda/i.test(robotsTxt)) cms = 'Tilda';
    else if (/joomla/i.test(robotsTxt) || /joomla/i.test(powered)) cms = 'Joomla';
    else if (/drupal/i.test(powered)) cms = 'Drupal';
    else if (/opencart/i.test(robotsTxt)) cms = 'OpenCart';

    if (/next\.?js/i.test(powered) || /next\.?js/i.test(serverVal)) framework = 'Next.js';
    else if (/nuxt/i.test(powered)) framework = 'Nuxt.js';
    else if (/express/i.test(powered)) framework = 'Express.js';
    else if (/laravel/i.test(powered)) framework = 'Laravel';

    if (/php/i.test(powered)) language = 'PHP';
    else if (/node/i.test(powered) || /express/i.test(powered)) language = 'Node.js';
    else if (/python/i.test(powered) || /django/i.test(powered) || /flask/i.test(powered)) language = 'Python';
    else if (/ruby/i.test(powered) || /rails/i.test(powered)) language = 'Ruby';

    if (/nginx/i.test(serverVal)) serverSoftware = 'Nginx';
    else if (/apache/i.test(serverVal)) serverSoftware = 'Apache';
    else if (/cloudflare/i.test(serverVal)) serverSoftware = 'Cloudflare';
    else if (/litespeed/i.test(serverVal)) serverSoftware = 'LiteSpeed';
    else if (serverVal) serverSoftware = serverVal.split('/')[0];

    const techObj: Record<string, string | undefined> = {};
    if (cms) techObj.cms = cms;
    if (framework) techObj.framework = framework;
    if (language) techObj.language = language;
    if (serverSoftware) techObj.server = serverSoftware;

    // Security score
    let securityScore = 0;
    if (siteHeaders['strict-transport-security']) securityScore += 30;
    if (siteHeaders['x-frame-options']) securityScore += 20;
    if (siteHeaders['x-content-type-options']) securityScore += 20;
    if (siteHeaders['content-security-policy']) securityScore += 30;

    // AI readiness
    let aiScore = 0;
    if (hasLlmsTxt) aiScore += 40;
    if (hasGptBot) aiScore += 20;
    if (hasSitemap) aiScore += 20;
    if (hasRobots) aiScore += 10;
    if (siteOk) aiScore += 10;

    return reply.send({
      success: true,
      domain,
      url: baseUrl,
      accessible: siteOk,
      // tech object — structured for TechPassport.tsx component
      tech: techObj,
      // geoip placeholder (no IP lookup without external service — return empty)
      geoip: {},
      // raw list for backwards compat
      tech_list: Object.values(techObj).filter(Boolean),
      headers: siteHeaders,
      files: {
        robots_txt: hasRobots,
        llms_txt: hasLlmsTxt,
        sitemap_xml: hasSitemap,
        security_txt: hasSecurityTxt,
      },
      ai_access: {
        has_gptbot_allow: hasGptBot,
        has_llms_txt: hasLlmsTxt,
        ai_score: aiScore,
      },
      security: {
        has_hsts: !!siteHeaders['strict-transport-security'],
        has_x_frame: !!siteHeaders['x-frame-options'],
        has_xcto: !!siteHeaders['x-content-type-options'],
        has_csp: !!siteHeaders['content-security-policy'],
        score: securityScore,
      },
    });
  });

  // GET /api/v1/site-check/geo-rating — GEO Rating data from local DB or Supabase proxy
  app.get('/geo-rating', async (_req, reply) => {
    try {
      // Try local table first
      const rows = await sql`SELECT * FROM geo_rating ORDER BY llm_score DESC`;
      return reply.send(rows);
    } catch {
      // Table doesn't exist locally — proxy to Supabase
      // Используем только backend-переменные (без VITE_ префикса т. к. его нет на сервере)
      try {
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey =
          process.env.SUPABASE_SERVICE_ROLE_KEY ||
          process.env.SUPABASE_ANON_KEY;
        if (supabaseUrl && supabaseKey) {
          const resp = await fetch(
            `${supabaseUrl}/rest/v1/geo_rating?select=*&order=llm_score.desc`,
            {
              headers: {
                apikey: supabaseKey,
                Authorization: `Bearer ${supabaseKey}`,
              },
            },
          );
          if (resp.ok) {
            const data = await resp.json();
            return reply.send(data);
          }
        }
      } catch {}
      return reply.send([]);
    }
  });

  // POST /api/v1/site-check/admin/rescan-geo-rating
  // Admin-only: re-queues geo_rating domains through the worker so it
  // upserts fresh fractional scores back into geo_rating.
  app.post<{
    Body: {
      mode?: 'low65' | 'score65' | 'stale' | 'all';
      domain?: string;
      dry_run?: boolean;
    };
  }>('/admin/rescan-geo-rating', async (req, reply) => {
    const adminToken = process.env.ADMIN_TOKEN || '';
    const provided = (req.headers['x-admin-token'] || '') as string;
    if (!adminToken || provided !== adminToken) {
      return reply.status(401).send({ success: false, error: 'invalid admin token' });
    }

    const { mode = 'low65', domain, dry_run = false } = (req.body || {}) as {
      mode?: 'low65' | 'score65' | 'stale' | 'all';
      domain?: string;
      dry_run?: boolean;
    };

    let rows: Array<{ domain: string }> = [];
    if (domain) {
      rows = await sql<Array<{ domain: string }>>`
        SELECT domain FROM geo_rating WHERE domain = ${domain} LIMIT 1
      `;
    } else if (mode === 'all') {
      rows = await sql<Array<{ domain: string }>>`
        SELECT domain FROM geo_rating ORDER BY llm_score ASC
      `;
    } else if (mode === 'score65') {
      rows = await sql<Array<{ domain: string }>>`
        SELECT domain FROM geo_rating WHERE llm_score = 65 ORDER BY domain
      `;
    } else if (mode === 'stale') {
      rows = await sql<Array<{ domain: string }>>`
        SELECT domain FROM geo_rating
        WHERE last_checked_at < NOW() - INTERVAL '24 hours'
           OR (llm_score % 5 = 0 AND seo_score % 5 = 0)
        ORDER BY last_checked_at NULLS FIRST
      `;
    } else {
      // low65 (default)
      rows = await sql<Array<{ domain: string }>>`
        SELECT domain FROM geo_rating
        WHERE llm_score <= 65
           OR seo_score <= 65
           OR schema_score <= 65
           OR direct_score <= 65
        ORDER BY llm_score ASC, seo_score ASC
      `;
    }

    const domains = rows.map((r) => r.domain);

    if (dry_run) {
      return reply.send({ success: true, dry_run: true, mode, count: domains.length, domains });
    }

    let queued = 0;
    for (const d of domains) {
      const url = `https://${d}`;
      const scan_id = randomUUID();
      try {
        await sql`
          INSERT INTO site_check_scans (id, url, mode, status, progress_pct)
          VALUES (${scan_id}, ${url}, 'page', 'running', 0)
        `;
        await queue.add('scan', { scan_id, url, mode: 'page' });
        queued++;
      } catch (e) {
        logger.warn('SITE_CHECK_ADMIN', `Failed to queue ${d}: ${(e as Error).message}`);
      }
    }

    logger.info('SITE_CHECK_ADMIN', `Rescan queued ${queued}/${domains.length} domains (mode=${mode})`);
    return reply.send({ success: true, mode, queued, total: domains.length, domains });
  });
}