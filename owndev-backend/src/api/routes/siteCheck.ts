import type { FastifyInstance } from 'fastify';
import { sql } from '../../db/client.js';
import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';
import { redis } from '../../cache/redis.js';
import { logger } from '../../utils/logger.js';
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
          code: 'CONCURRENCY_LIMIT',
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
          code: 'CONCURRENCY_LIMIT',
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

      // Try cache from DB first
      if (scan_id) {
        try {
          const cached = await sql<Array<{ llm_judge: any }>>`
            SELECT result->'llm_judge' AS llm_judge
            FROM site_check_scans
            WHERE id = ${scan_id}
          `;
          const cachedJudge = cached[0]?.llm_judge;
          if (cachedJudge && typeof cachedJudge === 'object' && Array.isArray((cachedJudge as any).systems) && (cachedJudge as any).systems.length > 0) {
            logger.info('LLM_JUDGE', `Cache hit for scan ${scan_id}`);
            return reply.send({ ...(cachedJudge as object), _cached: true });
          }
        } catch (e) {
          logger.warn('LLM_JUDGE', `Cache read failed: ${(e as Error).message}`);
        }
      }

      const apiKey = process.env.OPENAI_API_KEY || '';
      if (!apiKey) {
        return reply.status(503).send({ error: 'OPENAI_API_KEY не задан на сервере' });
      }
      const domain = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();
      const topicHint = theme ? ` в теме "${theme}"` : '';
      const aiSystems = [
        {
          id: 'chatgpt', name: 'ChatGPT', icon: 'openai', color: '#10a37f',
          prompt: `Ты выступаешь в роли ChatGPT (GPT-4). Пользователь задаёт вопрос${topicHint}. Проанализируй: насколько вероятно что ChatGPT упомянет сайт "${domain}" в своих ответах? Учти: известность сайта, качество контента, авторитетность домена, уникальная экспертиза${topicHint ? ', релевантность теме' : ''}. Ответь ТОЛЬКО валидным JSON без markdown: {"score": число 0-100, "verdict": "Высокая/Средняя/Низкая вероятность упоминания", "reason": "2-3 предложения почему такой score", "suggestions": ["3 конкретных совета как улучшить видимость в ChatGPT"]}`,
        },
        {
          id: 'perplexity', name: 'Perplexity', icon: 'perplexity', color: '#20b2aa',
          prompt: `Ты выступаешь в роли Perplexity AI. Пользователь ищет информацию${topicHint}. Проанализируй: насколько вероятно что Perplexity процитирует сайт "${domain}"? Perplexity активно ссылается на первоисточники. Ответь ТОЛЬКО валидным JSON без markdown: {"score": число 0-100, "verdict": "Высокая/Средняя/Низкая вероятность цитирования", "reason": "2-3 предложения", "suggestions": ["3 совета для улучшения видимости в Perplexity"]}`,
        },
        {
          id: 'yandex-neuro', name: 'Яндекс Нейро', icon: 'yandex', color: '#ff0000',
          prompt: `Ты выступаешь в роли Яндекс Нейро. Пользователь задаёт запрос на русском${topicHint}. Проанализируй: насколько вероятно что Яндекс Нейро использует "${domain}" как источник? Яндекс Нейро предпочитает: русскоязычный контент, авторитетные российские источники, хорошее SEO в Яндексе. Ответь ТОЛЬКО валидным JSON: {"score": число 0-100, "verdict": "Высокая/Средняя/Низкая вероятность", "reason": "2-3 предложения", "suggestions": ["3 совета для Яндекс Нейро"]}`,
        },
        {
          id: 'gemini', name: 'Gemini', icon: 'google', color: '#4285f4',
          prompt: `Ты выступаешь в роли Google Gemini. Пользователь задаёт вопрос${topicHint}. Проанализируй: насколько вероятно что Gemini упомянет "${domain}" в AI Overview? Gemini предпочитает: E-E-A-T, Schema.org, Core Web Vitals, авторитетные ссылки. Ответь ТОЛЬКО валидным JSON: {"score": число 0-100, "verdict": "Высокая/Средняя/Низкая вероятность", "reason": "2-3 предложения", "suggestions": ["3 совета для Gemini"]}`,
        },
      ];
      async function queryAiSystem(system: typeof aiSystems[0]) {
        try {
          const resp = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'Ты эксперт по GEO (Generative Engine Optimization). Всегда отвечай ТОЛЬКО валидным JSON без markdown.' },
                { role: 'user', content: system.prompt },
              ],
              temperature: 0.3,
              max_tokens: 500,
            }),
          });
          if (!resp.ok) throw new Error(`OpenAI ${resp.status}`);
          const data = await resp.json();
          const content = data?.choices?.[0]?.message?.content || '{}';
          const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, '').trim());
          return { id: system.id, name: system.name, icon: system.icon, color: system.color, score: Number(parsed.score) || 0, verdict: parsed.verdict || 'Нет данных', reason: parsed.reason || '', suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [] };
        } catch (e) {
          logger.warn('LLM_JUDGE', `${system.name} failed: ${(e as Error).message}`);
          return { id: system.id, name: system.name, icon: system.icon, color: system.color, score: 0, verdict: 'Ошибка анализа', reason: 'Не удалось получить оценку', suggestions: [] };
        }
      }
      const results = await Promise.all(aiSystems.map(queryAiSystem));
      const avgScore = Math.round(results.reduce((s, r) => s + r.score, 0) / results.length);
      const payload = { success: true, url, domain, avg_score: avgScore, systems: results, _pending: false };

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

  // GET /api/v1/site-check/geo-rating — GEO Rating data from local DB or Supabase proxy
  app.get('/geo-rating', async (_req, reply) => {
    try {
      // Try local table first
      const rows = await sql`SELECT * FROM geo_rating ORDER BY llm_score DESC`;
      return reply.send(rows);
    } catch {
      // Table doesn't exist locally — proxy to Supabase
      try {
        const supabaseUrl =
          process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
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
}