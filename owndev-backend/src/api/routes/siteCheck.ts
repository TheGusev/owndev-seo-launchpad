import type { FastifyInstance } from 'fastify';
import { sql } from '../../db/client.js';
import { randomUUID } from 'crypto';
import { Queue } from 'bullmq';
import { redis } from '../../cache/redis.js';
import { logger } from '../../utils/logger.js';

const CONCURRENCY_LIMIT = Number(process.env.SITE_CHECK_CONCURRENCY ?? 10);

export async function siteCheckRoutes(app: FastifyInstance): Promise<void> {
  // Ensure table exists with all needed columns
  await sql`
    CREATE TABLE IF NOT EXISTS site_check_scans (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      url TEXT NOT NULL,
      mode TEXT NOT NULL DEFAULT 'site',
      status TEXT NOT NULL DEFAULT 'running',
      progress_pct INT NOT NULL DEFAULT 0,
      theme TEXT,
      is_spa BOOLEAN DEFAULT false,
      scores JSONB,
      issues JSONB DEFAULT '[]'::jsonb,
      competitors JSONB DEFAULT '[]'::jsonb,
      keywords JSONB DEFAULT '[]'::jsonb,
      minus_words JSONB DEFAULT '[]'::jsonb,
      seo_data JSONB,
      result JSONB,
      error_message TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  // Add columns if they don't exist
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

  app.post<{ Body: { url: string; mode?: string } }>('/start', async (req, reply) => {
    const { url, mode = 'page' } = req.body as { url: string; mode?: string };
    if (!url) return reply.status(400).send({ success: false, error: 'url is required' });

    const [{ count }] = await sql<[{ count: number }]>`
      SELECT COUNT(*)::int AS count FROM site_check_scans WHERE status = 'running'
    `;

    if ((count || 0) >= CONCURRENCY_LIMIT) {
      return reply.status(429).send({
        success: false,
        error: 'Сервер загружен. Попробуйте через пару минут.',
        code: 'CONCURRENCY_LIMIT',
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

  app.get<{ Params: { scanId: string } }>('/result/:scanId', async (req, reply) => {
    const { scanId } = req.params;
    const rows = await sql`
      SELECT id, url, mode, status, progress_pct, theme, is_spa, scores, issues, competitors, keywords, minus_words, seo_data, result, error_message, created_at
      FROM site_check_scans WHERE id = ${scanId}
    `;

    if (!rows.length) return reply.status(404).send({ success: false, error: 'Scan not found' });

    const row = rows[0] as any;
    let scores = row.scores ?? {};
    let result = row.result ?? {};

    const issues = Array.isArray(row.issues) ? row.issues : (result?.issues ?? []);
    const competitors = Array.isArray(row.competitors) ? row.competitors : (result?.competitors ?? []);
    const keywords = Array.isArray(row.keywords) ? row.keywords : (result?.keywords ?? []);
    const minus_words = Array.isArray(row.minus_words) ? row.minus_words : (result?.minus_words ?? []);
    
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
        issues_count: issues.length,
      },
      score: totalScore,
      summary: result?.summary ?? null,
      issues,
      blocks: result?.blocks ?? [],
      theme: row.theme ?? result?.theme ?? null,
      competitors,
      keywords,
      minus_words,
      seo_data: row.seo_data ?? result?.seo_data ?? null,
      error_message: row.error_message,
      created_at: row.created_at
    });
  });

  app.post<{ Body: { scan_id: string; url: string; theme?: string } }>('/llm-judge', async (req, reply) => {
    return reply.send({
      total_prompts: 0,
      cited_count: 0,
      citation_rate: '0%',
      results: [],
      _pending: true,
      _status: 'loading'
    });
  });

  app.get<{ Querystring: { url: string } }>('/tech-passport', async (req, reply) => {
    const { url } = req.query as { url: string };
    if (!url) return reply.status(400).send({ success: false, error: 'url is required' });

    try {
      const hostname = new URL(url).hostname;
      const [headersResp, geoipResp] = await Promise.allSettled([
        fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) }),
        fetch(`https://ipapi.co/${hostname}/json/`, { signal: AbortSignal.timeout(3000) })
      ]);

      const headers: any = headersResp.status === 'fulfilled' ? Object.fromEntries(headersResp.value.headers) : {};
      const geoip = geoipResp.status === 'fulfilled' && geoipResp.value.ok ? await geoipResp.value.json() : null;

      const server = headers['server'] || '';
      const poweredBy = headers['x-powered-by'] || '';

      const tech: any = {};
      if (/nginx/i.test(server)) tech.server = 'Nginx';
      else if (/apache/i.test(server)) tech.server = 'Apache';
      else tech.server = server || 'Unknown';

      if (/php/i.test(poweredBy)) tech.language = 'PHP';
      else if (/express/i.test(poweredBy)) tech.language = 'Node.js/Express';

      return reply.send({
        tech,
        security: {
          https: url.startsWith('https://'),
          csp: !!headers['content-security-policy'],
          hsts: !!headers['strict-transport-security'],
        },
        geoip: geoip ? {
          country_code: geoip.country_code,
          city: geoip.city,
          org: geoip.org,
          region: geoip.region,
          timezone: geoip.timezone
        } : null
      });
    } catch (e: any) {
      return reply.send({ _error: e.message });
    }
  });

  app.get('/geo-rating', async (_req, reply) => {
    try {
      const rows = await sql`SELECT * FROM geo_rating ORDER BY llm_score DESC LIMIT 50`;
      return reply.send(rows);
    } catch {
      return reply.send([]);
    }
  });

  app.post<{ Body: any }>('/nomination', async (req, reply) => {
    const data = req.body;
    await sql`
      INSERT INTO geo_rating_nominations (domain, display_name, category, email, scan_id, total_score)
      VALUES (${data.domain}, ${data.display_name}, ${data.category}, ${data.email}, ${data.scan_id}, ${data.total_score})
    `;
    return reply.send({ success: true });
  });
}
