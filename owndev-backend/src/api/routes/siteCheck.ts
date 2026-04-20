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
  await sql\`
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
  \`;

  // Ensure geo_rating table exists
  await sql\`
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
  \`;
  await sql\`CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_rating_domain ON geo_rating(domain)\`;

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
      await sql\`SELECT \${sql(colName)} FROM site_check_scans LIMIT 0\`;
    } catch {
      try {
        await sql.unsafe(\`ALTER TABLE site_check_scans ADD COLUMN IF NOT EXISTS \${col}\`);
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

    const [{ count }] = await sql<[{ count: number }]>\`
      SELECT COUNT(*)::int AS count FROM site_check_scans WHERE status = 'running'
    \`;
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
      const cached = await sql<[{ id: string }?]>\`
        SELECT id FROM site_check_scans
        WHERE url LIKE \${'%' + hostname + '%'}
          AND status = 'done'
          AND created_at::date = \${today}::date
        ORDER BY created_at DESC LIMIT 1
      \`;
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
    await sql\`
      INSERT INTO site_check_scans (id, url, mode, status, progress_pct)
      VALUES (\${scan_id}, \${normalizedUrl}, \${mode}, 'running', 0)
    \`;

    await queue.add('scan', { scan_id, url: normalizedUrl, mode });
    logger.info('SITE_CHECK', \`Scan \${scan_id} queued for \${normalizedUrl}\`);
    return reply.status(200).send({ scan_id, status: 'running' });
  });

  // GET /api/v1/site-check/status/:scanId
  app.get<{ Params: { scanId: string } }>('/status/:scanId', async (req, reply) => {
    const { scanId } = req.params;
    const rows = await sql<
      Array<{ status: string; progress_pct: number; scores: unknown; error_message: string | null }>
    >\`
      SELECT status, progress_pct, scores, error_message
      FROM site_check_scans
      WHERE id = \${scanId}
    \`;
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
    const rows = await sql<Array<any>>\`
      SELECT id, url, mode, status, progress_pct, theme, is_spa,
             scores, issues, competitors, keywords, minus_words,
             seo_data, result, error_message, created_at
      FROM site_check_scans
      WHERE id = \${scanId}
    \`;
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
    const rows = await sql<Array<{ status: string; progress_pct: number; scores: unknown }>>\`
      SELECT status, progress_pct, scores
      FROM site_check_scans
      WHERE id = \${scanId}
    \`;
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

  // PO
[stdout truncated]
