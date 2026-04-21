import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'crypto';
import { z } from 'zod';
import { sql } from '../../db/client.js';
import { marketplaceAuditQueue } from '../../queue/marketplaceAuditQueue.js';
import {
  createMarketplaceAudit,
  getMarketplaceAudit,
} from '../../db/queries/marketplaceAudits.js';
import { logger } from '../../utils/logger.js';

/** Backwards-compat: legacy rows store competitors as array; new ones as { list, gap }. */
function normalizeCompetitorsField(raw: any): { list: any[]; gap: any | null } {
  if (Array.isArray(raw)) return { list: raw, gap: null };
  if (raw && typeof raw === 'object') {
    return {
      list: Array.isArray(raw.list) ? raw.list : [],
      gap: raw.gap ?? null,
    };
  }
  return { list: [], gap: null };
}

const StartSchema = z.object({
  platform: z.enum(['wb', 'ozon']),
  inputType: z.enum(['url', 'sku', 'manual']),
  value: z.string().trim().min(1).max(2000),
  manual: z
    .object({
      title: z.string().trim().min(1).max(500),
      description: z.string().trim().max(8000).default(''),
      specs: z.record(z.string()).default({}),
      category: z.string().trim().max(200).default(''),
      competitorUrls: z.array(z.string().url().max(500)).max(5).optional(),
    })
    .optional(),
});

export async function marketplaceAuditRoutes(app: FastifyInstance): Promise<void> {
  // Ensure table exists (non-blocking)
  void (async () => {
    try {
      await sql`
        DO $$ BEGIN
          CREATE TYPE marketplace_platform AS ENUM ('wb', 'ozon');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
      `;
      await sql`
        DO $$ BEGIN
          CREATE TYPE marketplace_input_type AS ENUM ('url', 'sku', 'manual');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
      `;
      await sql`
        DO $$ BEGIN
          CREATE TYPE marketplace_audit_status AS ENUM ('pending','parsing','scoring','llm','done','error');
        EXCEPTION WHEN duplicate_object THEN NULL; END $$
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS marketplace_audits (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          source_platform marketplace_platform NOT NULL,
          input_type marketplace_input_type NOT NULL,
          input_value TEXT NOT NULL,
          status marketplace_audit_status NOT NULL DEFAULT 'pending',
          progress_pct INT NOT NULL DEFAULT 0,
          product_title TEXT,
          product_description TEXT,
          attributes_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          category TEXT,
          images_json JSONB NOT NULL DEFAULT '[]'::jsonb,
          scores_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          issues_json JSONB NOT NULL DEFAULT '[]'::jsonb,
          keywords_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          competitors_json JSONB NOT NULL DEFAULT '[]'::jsonb,
          recommendations_json JSONB NOT NULL DEFAULT '{}'::jsonb,
          ai_summary TEXT,
          error_msg TEXT,
          rules_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        )
      `;
      logger.info('MA_ROUTES', 'marketplace_audits table ensured');
    } catch (e: any) {
      logger.error('MA_ROUTES', `ensure table failed: ${e.message}`);
    }
  })();

  // ─── POST /start ───
  app.post('/start', async (req, reply) => {
    const parsed = StartSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: 'Некорректные параметры запроса',
        details: parsed.error.flatten().fieldErrors,
      });
    }
    const { platform, inputType, value, manual } = parsed.data;
    if (inputType === 'manual' && !manual) {
      return reply.status(400).send({ success: false, error: 'Поле manual обязательно для inputType=manual' });
    }

    const id = randomUUID();
    try {
      await createMarketplaceAudit(id, platform, inputType, value, manual);
      await marketplaceAuditQueue.add('audit', { audit_id: id });
      logger.info('MA_ROUTES', `Audit ${id} queued (${platform}/${inputType})`);
      return reply.send({ id, status: 'pending' });
    } catch (e: any) {
      logger.error('MA_ROUTES', `start failed: ${e.message}`);
      return reply.status(500).send({ success: false, error: 'Не удалось создать аудит' });
    }
  });

  // ─── GET /preview/:id — light payload for polling ───
  app.get<{ Params: { id: string } }>('/preview/:id', async (req, reply) => {
    const row = await getMarketplaceAudit(req.params.id);
    if (!row) return reply.status(404).send({ success: false, error: 'Аудит не найден' });

    const scores = row.scores_json && (row.scores_json as any).total !== undefined
      ? row.scores_json as any
      : null;

    return reply.send({
      id: row.id,
      status: row.status,
      progress_pct: row.progress_pct,
      product_title: row.product_title,
      category: row.category,
      image: Array.isArray(row.images_json) && row.images_json.length > 0 ? row.images_json[0] : null,
      preview_scores: scores
        ? { total: scores.total, content: scores.content, search: scores.search, conversion: scores.conversion, ads: scores.ads }
        : null,
      error: row.error_msg ?? null,
    });
  });

  // ─── GET /events/:id — Server-Sent Events stream ───
  app.get<{ Params: { id: string } }>('/events/:id', async (req, reply) => {
    const { id } = req.params;

    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    let lastPct = -1;
    let lastStatus = '';
    let closed = false;
    req.raw.on('close', () => { closed = true; });

    const heartbeat = setInterval(() => {
      if (!closed) {
        try { reply.raw.write(`: ping\n\n`); } catch { closed = true; }
      }
    }, 15_000);

    const poll = async () => {
      while (!closed) {
        const rows = await sql<Array<{
          status: string; progress_pct: number;
          product_title: string | null; category: string | null;
          images_json: any; scores_json: any; error_msg: string | null;
        }>>`
          SELECT status, progress_pct, product_title, category,
                 images_json, scores_json, error_msg
          FROM marketplace_audits WHERE id = ${id}
        `;
        if (!rows.length) {
          try { reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: 'not_found' })}\n\n`); } catch {}
          break;
        }
        const r = rows[0];
        if (r.progress_pct !== lastPct || r.status !== lastStatus) {
          lastPct = r.progress_pct;
          lastStatus = r.status;
          const scores = r.scores_json && (r.scores_json as any).total !== undefined ? r.scores_json as any : null;
          const payload = {
            status: r.status,
            progress_pct: r.progress_pct,
            product_title: r.product_title,
            category: r.category,
            image: Array.isArray(r.images_json) && r.images_json.length > 0 ? r.images_json[0] : null,
            preview_scores: scores ? {
              total: scores.total, content: scores.content, search: scores.search,
              conversion: scores.conversion, ads: scores.ads,
            } : null,
            error: r.error_msg ?? null,
          };
          try { reply.raw.write(`event: progress\ndata: ${JSON.stringify(payload)}\n\n`); } catch { closed = true; break; }
        }
        if (r.status === 'done') {
          try { reply.raw.write(`event: done\ndata: ${JSON.stringify({ id })}\n\n`); } catch {}
          break;
        }
        if (r.status === 'error') {
          try { reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: r.error_msg ?? 'audit_failed' })}\n\n`); } catch {}
          break;
        }
        await new Promise((res) => setTimeout(res, 1000));
      }
      clearInterval(heartbeat);
      if (!closed) { try { reply.raw.end(); } catch {} }
    };

    poll().catch((e) => {
      logger.error('MA_ROUTES', `SSE poll failed for ${id}: ${e?.message}`);
      clearInterval(heartbeat);
      try { reply.raw.end(); } catch {}
    });
  });

  // ─── GET /result/:id — full report ───
  app.get<{ Params: { id: string } }>('/result/:id', async (req, reply) => {
    const row = await getMarketplaceAudit(req.params.id);
    if (!row) return reply.status(404).send({ success: false, error: 'Аудит не найден' });

    return reply.send({
      id: row.id,
      status: row.status,
      platform: row.source_platform,
      inputType: row.input_type,
      product: {
        title: row.product_title ?? '',
        description: row.product_description ?? '',
        category: row.category ?? '',
        images: Array.isArray(row.images_json) ? row.images_json : [],
        attributes: row.attributes_json ?? {},
      },
      scores: row.scores_json ?? {},
      issues: Array.isArray(row.issues_json) ? row.issues_json : [],
      keywords: row.keywords_json ?? { covered: [], missing: [], coveragePct: 0 },
      competitors: normalizeCompetitorsField(row.competitors_json),
      recommendations: row.recommendations_json ?? {},
      ai_summary: row.ai_summary ?? '',
      meta: {
        created_at: row.created_at,
        updated_at: row.updated_at,
        rules_version: row.rules_version,
      },
      error: row.error_msg ?? null,
    });
  });
}
