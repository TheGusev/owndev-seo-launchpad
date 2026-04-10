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
}
