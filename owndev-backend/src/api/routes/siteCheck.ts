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


  // GET /api/v1/site-check/tech-passport
  app.get<{ Querystring: { url: string } }>(
    '/tech-passport',
    async (req, reply) => {
      const { url } = req.query as { url: string };
      if (!url) {
        return reply.status(400).send({ success: false, error: 'url is required' });
      }
      let origin = url;
      try {
        origin = new URL(url).origin;
      } catch {}
      const [headersData, geoipData] = await Promise.allSettled([
        fetch(url, {
          method: 'HEAD',
          signal: AbortSignal.timeout(8000),
        })
          .then((r) => ({
            server: r.headers.get('server'),
            poweredBy: r.headers.get('x-powered-by'),
            cacheControl: r.headers.get('cache-control'),
            contentType: r.headers.get('content-type'),
            contentSecurityPolicy: r.headers.get('content-security-policy'),
            strictTransportSecurity: r.headers.get('strict-transport-security'),
            xContentTypeOptions: r.headers.get('x-content-type-options'),
            xFrameOptions: r.headers.get('x-frame-options'),
          }))
          .catch(() => ({})),
        fetch(`https://ipapi.co/${new URL(origin).hostname}/json/`, {
          signal: AbortSignal.timeout(5000),
        })
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);
      const headers = headersData.status === 'fulfilled' ? headersData.value : {};
      const geoip = geoipData.status === 'fulfilled' ? geoipData.value : null;
      const server = (headers as any).server || '';
      const poweredBy = (headers as any).poweredBy || '';
      const tech: Record<string, string> = {};
      if (/nginx/i.test(server)) tech.server = 'Nginx';
      else if (/apache/i.test(server)) tech.server = 'Apache';
      else if (server) tech.server = server;
      if (/php/i.test(poweredBy)) tech.language = 'PHP';
      else if (/express/i.test(poweredBy))
        tech.language = 'Node.js/Express';
      if (/wordpress/i.test(poweredBy)) tech.cms = 'WordPress';
      return reply.send({
        tech,
        security: {
          https: origin.startsWith('https://'),
          csp: !!(headers as any).contentSecurityPolicy,
          hsts: !!(headers as any).strictTransportSecurity,
        },
        performance: {
          cache_control: (headers as any).cacheControl || null,
        },
        geoip: geoip
          ? {
              country_code: geoip.country_code,
              city: geoip.city,
              org: geoip.org,
            }
          : null,
        raw_headers: headers,
      });
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