import type { FastifyInstance } from 'fastify';
import { sql } from '../../db/client.js';
import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';
import { redis } from '../../cache/redis.js';
import { logger } from '../../utils/logger.js';

const CONCURRENCY_LIMIT = Number(process.env.SITE_CHECK_CONCURRENCY ?? 10);

export async function siteCheckRoutes(app: FastifyInstance): Promise<void> {
  // Ensure table exists
  await sql`
    CREATE TABLE IF NOT EXISTS site_check_scans (
      id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
      url         TEXT        NOT NULL,
      mode        TEXT        NOT NULL DEFAULT 'site',
      status      TEXT        NOT NULL DEFAULT 'running',
      progress_pct INT        NOT NULL DEFAULT 0,
      scores      JSONB,
      result      JSONB,
      error_message TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const queue = new Queue('site-check', { connection: redis });

  // POST /api/site-check/start
  app.post<{ Body: { url: string; mode?: string } }>('/start', async (req, reply) => {
    const { url, mode = 'site' } = req.body as { url: string; mode?: string };
    if (!url) return reply.status(400).send({ success: false, error: 'url is required' });

    const [{ count }] = await sql<[{ count: number }]>`
      SELECT COUNT(*)::int AS count FROM site_check_scans WHERE status = 'running'
    `;
    if ((count || 0) >= CONCURRENCY_LIMIT) {
      return reply.status(429).send({
        success: false,
        error: '\u0421\u0435\u0440\u0432\u0435\u0440 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043d. \u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0447\u0435\u0440\u0435\u0437 \u043f\u0430\u0440\u0443 \u043c\u0438\u043d\u0443\u0442.',
        code: 'CONCURRENCY_LIMIT',
      });
    }

    // Check if this domain was scanned today (return cached scan_id)
    let hostname = url;
    try { hostname = new URL(url).hostname; } catch { /* keep raw */ }
    const today = new Date().toISOString().slice(0, 10);
    const cached = await sql<[{ id: string }?]>`
      SELECT id FROM site_check_scans
      WHERE url LIKE ${'%' + hostname + '%'}
        AND status = 'done'
        AND created_at::date = ${today}::date
      ORDER BY created_at DESC
      LIMIT 1
    `;
    if (cached[0]) {
      const err: any = new Error('Domain scanned today');
      err.code = 'CONCURRENCY_LIMIT';
      err.last_scan_id = cached[0].id;
      return reply.status(429).send({
        success: false,
        error: '\u042d\u0442\u043e\u0442 \u0434\u043e\u043c\u0435\u043d \u0443\u0436\u0435 \u043f\u0440\u043e\u0432\u0435\u0440\u044f\u043b\u0441\u044f \u0441\u0435\u0433\u043e\u0434\u043d\u044f.',
        code: 'CONCURRENCY_LIMIT',
        last_scan_id: cached[0].id,
      });
    }

    const scan_id = randomUUID();
    await sql`
      INSERT INTO site_check_scans (id, url, mode, status, progress_pct)
      VALUES (${scan_id}, ${url}, ${mode}, 'running', 0)
    `;

    await queue.add('scan', { scan_id, url, mode });
    logger.info('SITE_CHECK', `Scan ${scan_id} queued for ${url}`);

    return reply.status(200).send({ scan_id, status: 'running' });
  });

  // GET /api/site-check/status/:scanId
  app.get<{ Params: { scanId: string } }>('/status/:scanId', async (req, reply) => {
    const { scanId } = req.params;
    const rows = await sql<Array<{
      status: string;
      progress_pct: number;
      scores: unknown;
      error_message: string | null;
    }>>`
      SELECT status, progress_pct, scores, error_message
      FROM site_check_scans WHERE id = ${scanId}
    `;
    if (!rows.length) return reply.status(404).send({ success: false, error: 'Scan not found' });
    const row = rows[0];
    return reply.send({
      status: row.status,
      progress_pct: row.progress_pct,
      scores_preview: row.scores ?? null,
      error_message: row.error_message ?? null,
    });
  });

  // GET /api/site-check/result/:scanId
  app.get<{ Params: { scanId: string } }>('/result/:scanId', async (req, reply) => {
    const { scanId } = req.params;
    const rows = await sql<Array<{
      id: string;
      url: string;
      mode: string;
      status: string;
      progress_pct: number;
      scores: unknown;
      result: unknown;
      error_message: string | null;
    }>>`
      SELECT id, url, mode, status, progress_pct, scores, result, error_message
      FROM site_check_scans WHERE id = ${scanId}
    `;
    if (!rows.length) return reply.status(404).send({ success: false, error: 'Scan not found' });
    const row = rows[0];
    return reply.send({
      id: row.id,
      scan_id: row.id,
      url: row.url,
      mode: row.mode,
      status: row.status,
      progress_pct: row.progress_pct,
      scores: row.scores ?? null,
      result: row.result ?? null,
      error_message: row.error_message ?? null,
    });
  });

  // GET /api/site-check/preview/:scanId (alias for status)
  app.get<{ Params: { scanId: string } }>('/preview/:scanId', async (req, reply) => {
    const { scanId } = req.params;
    const rows = await sql<Array<{ status: string; progress_pct: number; scores: unknown }>>`
      SELECT status, progress_pct, scores FROM site_check_scans WHERE id = ${scanId}
    `;
    if (!rows.length) return reply.status(404).send({ success: false, error: 'Scan not found' });
    const row = rows[0];
    return reply.send({ status: row.status, progress_pct: row.progress_pct, scores: row.scores ?? null });
  });
  
  // POST /api/site-check/report/create
  app.post<{ Body: { scan_id: string; email: string } }>('/report/create', async (req, reply) => {
    const { scan_id, email } = req.body as { scan_id: string; email: string };
    if (!scan_id || !email) {
      return reply.status(400).send({ success: false, error: 'scan_id and email are required' });
    }
    // Ensure reports table exists
    await sql`
      CREATE TABLE IF NOT EXISTS site_check_reports (
        id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        scan_id     UUID        NOT NULL,
        email       TEXT        NOT NULL,
        status      TEXT        NOT NULL DEFAULT 'pending',
        download_token TEXT,
        payment_url TEXT,
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;
    const report_id = randomUUID();
    const download_token = randomUUID();
    await sql`
      INSERT INTO site_check_reports (id, scan_id, email, status, download_token)
      VALUES (${report_id}, ${scan_id}, ${email}, 'pending', ${download_token})
    `;
    logger.info('SITE_CHECK', `Report ${report_id} created for scan ${scan_id}`);
    return reply.status(200).send({ report_id, download_token, payment_url: null });
  });

  // GET /api/site-check/report/:reportId
  app.get<{ Params: { reportId: string }; Querystring: { token?: string } }>('/report/:reportId', async (req, reply) => {
    const { reportId } = req.params;
    const { token } = req.query as { token?: string };
    const rows = await sql<Array<{
      id: string;
      scan_id: string;
      email: string;
      status: string;
      download_token: string | null;
      payment_url: string | null;
    }>>`
      SELECT id, scan_id, email, status, download_token, payment_url
      FROM site_check_reports WHERE id = ${reportId}
    `;
    if (!rows.length) return reply.status(404).send({ success: false, error: 'Report not found' });
    const row = rows[0];
    if (token && row.download_token !== token) {
      return reply.status(403).send({ success: false, error: 'Invalid token' });
    }
    return reply.send(row);
  });
  
  // POST /api/v1/site-check/llm-judge
  app.post<{ Body: { scan_id: string; url: string; theme?: string } }>('/llm-judge', async (req, reply) => {
    const { scan_id, url, theme } = req.body as { scan_id: string; url: string; theme?: string };
    if (!url) return reply.status(400).send({ success: false, error: 'url is required' });
    // If scan has cached llm_judge result, return it
    if (scan_id) {
      const rows = await sql<Array<{ result: any }>>`
        SELECT result FROM site_check_scans WHERE id = ${scan_id}
      `;
      const cached = rows[0]?.result as any;
      if (cached?.llm_judge) {
        return reply.send(cached.llm_judge);
      }
    }
    // Return a structured stub — real LLM judge runs async via worker
    const origin = (() => { try { return new URL(url).origin; } catch { return url; } })();
    const llmsTxtResp = await fetch(`${origin}/llms.txt`).catch(() => null);
    const llmsTxtFound = llmsTxtResp?.ok ?? false;
    return reply.send({
      total_prompts: 0,
      cited_count: 0,
      citation_rate: '0%',
      competitors_found: [],
      llm_judge_score: 0,
      llms_txt_found: llmsTxtFound,
      results: [],
      _pending: true,
    });
  });

  // GET /api/v1/site-check/tech-passport
  app.get<{ Querystring: { url: string } }>('/tech-passport', async (req, reply) => {
    const { url } = req.query as { url: string };
    if (!url) return reply.status(400).send({ success: false, error: 'url is required' });
    let origin = url;
    try { origin = new URL(url).origin; } catch { /* keep */ }
    const [headersData, geoipData] = await Promise.allSettled([
      fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(8000) }).then(r => ({
        server: r.headers.get('server'),
        poweredBy: r.headers.get('x-powered-by'),
        via: r.headers.get('via'),
        cacheControl: r.headers.get('cache-control'),
        contentType: r.headers.get('content-type'),
        xFrameOptions: r.headers.get('x-frame-options'),
        contentSecurityPolicy: r.headers.get('content-security-policy'),
        strictTransportSecurity: r.headers.get('strict-transport-security'),
        xContentTypeOptions: r.headers.get('x-content-type-options'),
      })).catch(() => ({})),
      fetch(`https://ipapi.co/${new URL(origin).hostname}/json/`, { signal: AbortSignal.timeout(5000) })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    const headers = headersData.status === 'fulfilled' ? headersData.value : {};
    const geoip = geoipData.status === 'fulfilled' ? geoipData.value : null;
    const server = (headers as any).server || '';
    const poweredBy = (headers as any).poweredBy || '';
    // Detect CMS/tech from headers
    const tech: Record<string, string> = {};
    if (/nginx/i.test(server)) tech.server = 'Nginx';
    else if (/apache/i.test(server)) tech.server = 'Apache';
    else if (server) tech.server = server;
    if (/php/i.test(poweredBy)) tech.language = 'PHP';
    else if (/express/i.test(poweredBy)) tech.language = 'Node.js/Express';
    if (/wordpress/i.test(poweredBy) || /wp/i.test(server)) tech.cms = 'WordPress';
    const hasHttps = origin.startsWith('https://');
    const hasCsp = !!(headers as any).contentSecurityPolicy;
    const hasHsts = !!(headers as any).strictTransportSecurity;
    const hasXContentType = !!(headers as any).xContentTypeOptions;
    const hasXFrame = !!(headers as any).xFrameOptions;
    return reply.send({
      tech,
      security: { https: hasHttps, csp: hasCsp, hsts: hasHsts, x_content_type: hasXContentType, x_frame: hasXFrame },
      performance: { cache_control: (headers as any).cacheControl || null },
      geoip: geoip ? {
        country_code: geoip.country_code || null,
        country_flag: geoip.country_code ? `\uD83C\uDFF3` : null,
        city: geoip.city || null,
        org: geoip.org || null,
      } : null,
      raw_headers: headers,
    
  // POST /api/v1/site-check/nomination
  app.post<{ Body: { domain: string; display_name: string; category: string; email?: string; scan_id?: string; total_score: number } }>('/nomination', async (req, reply) => {
    const { domain, display_name, category, email, scan_id, total_score } = req.body as any;
    if (!domain || !display_name) {
      return reply.status(400).send({ success: false, error: 'domain and display_name are required' });
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
      VALUES (${domain}, ${display_name}, ${category || 'Другое'}, ${email || null}, ${scan_id || null}, ${total_score || 0})
    `;
    logger.info('SITE_CHECK', `Nomination created for ${domain}`);
    return reply.status(200).send({ success: true });
  });
    }
