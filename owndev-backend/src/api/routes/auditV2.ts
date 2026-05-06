/**
 * Formula v2 — Audit / Recovery / AI Developer Pack routes.
 *
 * Mounted at /api/v2/audit, /api/v2/recovery, /api/v2/ai-pack.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import { sql } from '../../db/client.js';
import { crawlSite } from '../../services/CrawlEngine/index.js';
import { analyzeGaps, buildRecovery } from '../../services/AuditEngine/index.js';
import {
  buildAiDeveloperPack,
  PreflightGateError,
} from '../../services/AiDeveloperPack/index.js';
import type { ProjectTypeCode, BlueprintV2 } from '../../types/formulaV2.js';

const VALID_TYPE_CODES: ProjectTypeCode[] = [
  'service_geo','service_pro','service_b2b','ecommerce','marketplace',
  'saas','mobile_app','media','blog','education','medical','legal',
  'finance','realestate','hospitality','events','nonprofit','gov','portfolio',
];

const auditRunSchema = z.object({
  url: z.string().url(),
  project_type_code: z.enum(VALID_TYPE_CODES as [ProjectTypeCode, ...ProjectTypeCode[]]),
  max_pages: z.number().int().min(1).max(200).optional(),
  respect_robots: z.boolean().optional(),
  session_id: z.string().uuid().optional(),
});

const recoverySchema = z.object({
  audit_id: z.string().uuid(),
  session_id: z.string().uuid().optional(),
});

const aiPackSchema = z.object({
  blueprint: z.any(),
  audit_id: z.string().uuid().optional(),
  recovery_id: z.string().uuid().optional(),
  business_name: z.string().optional(),
  site_url: z.string().url().optional(),
  publish_threshold: z.number().int().min(0).max(100).optional(),
  session_id: z.string().uuid().optional(),
});

export async function auditV2Routes(app: FastifyInstance): Promise<void> {
  // ── POST /audit/run — crawl + gap analysis ──────────────────
  app.post('/audit/run', async (req, reply) => {
    const parsed = auditRunSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() });
    }
    const { url, project_type_code, max_pages, respect_robots, session_id } = parsed.data;
    try {
      const crawl = await crawlSite({
        rootUrl: url,
        maxPages: max_pages ?? 50,
        respectRobots: respect_robots !== false,
        sessionId: session_id ?? null,
      });
      const audit = await analyzeGaps({
        projectTypeCode: project_type_code,
        url,
        crawlSessionId: crawl.id,
        pages: crawl.pages,
        sessionId: session_id ?? null,
      });
      return reply.send({
        audit,
        crawl_summary: {
          id: crawl.id,
          pages_crawled: crawl.pages_crawled,
          errors_count: crawl.errors_count,
        },
      });
    } catch (err: any) {
      logger.error('AUDIT_V2', `run failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  // ── GET /audit/:id ──────────────────────────────────────────
  app.get<{ Params: { id: string } }>('/audit/:id', async (req, reply) => {
    try {
      const [row] = await sql<any[]>`
        SELECT id, session_id, crawl_session_id, project_type_code, url,
               pages_total, pages_audited,
               overall_score, seo_score, geo_score, cro_score,
               contracts_passed, contracts_failed,
               gaps, recommendations, raw, created_at
        FROM site_audit_results
        WHERE id = ${req.params.id}
      `;
      if (!row) return reply.code(404).send({ error: 'not_found' });
      return reply.send({ audit: row });
    } catch (err: any) {
      logger.error('AUDIT_V2', `get failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  // ── POST /recovery/build ───────────────────────────────────
  app.post('/recovery/build', async (req, reply) => {
    const parsed = recoverySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() });
    }
    try {
      const [row] = await sql<any[]>`
        SELECT id, session_id, crawl_session_id, project_type_code, url,
               pages_total, pages_audited,
               overall_score, seo_score, geo_score, cro_score,
               contracts_passed, contracts_failed,
               gaps, recommendations, raw, created_at
        FROM site_audit_results
        WHERE id = ${parsed.data.audit_id}
      `;
      if (!row) return reply.code(404).send({ error: 'audit_not_found' });
      const report = {
        audit_id: row.id,
        project_type_code: row.project_type_code,
        url: row.url,
        pages_total: row.pages_total,
        pages_audited: row.pages_audited,
        overall_score: row.overall_score,
        seo_score: row.seo_score,
        geo_score: row.geo_score,
        cro_score: row.cro_score,
        contracts_passed: row.contracts_passed,
        contracts_failed: row.contracts_failed,
        gaps: row.gaps ?? [],
        recommendations: row.recommendations ?? [],
        raw: row.raw ?? { sampled_pages: [] },
        generated_at: row.created_at?.toISOString?.() ?? new Date().toISOString(),
      } as any;
      const recovery = await buildRecovery(report, { sessionId: parsed.data.session_id ?? null });
      return reply.send({ recovery });
    } catch (err: any) {
      logger.error('AUDIT_V2', `recovery failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  // ── POST /ai-pack/build — генерация ZIP, gate >= 90 ────────
  app.post('/ai-pack/build', async (req, reply) => {
    const parsed = aiPackSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() });
    }
    try {
      const blueprint = parsed.data.blueprint as BlueprintV2;
      if (!blueprint?.preflight) {
        return reply.code(400).send({ error: 'invalid_blueprint', message: 'blueprint.preflight is required' });
      }

      // optional joins
      let audit: any = null;
      if (parsed.data.audit_id) {
        const [r] = await sql<any[]>`SELECT * FROM site_audit_results WHERE id = ${parsed.data.audit_id}`;
        if (r) {
          audit = {
            audit_id: r.id, project_type_code: r.project_type_code, url: r.url,
            pages_total: r.pages_total, pages_audited: r.pages_audited,
            overall_score: r.overall_score, seo_score: r.seo_score,
            geo_score: r.geo_score, cro_score: r.cro_score,
            contracts_passed: r.contracts_passed, contracts_failed: r.contracts_failed,
            gaps: r.gaps ?? [], recommendations: r.recommendations ?? [],
            raw: r.raw ?? { sampled_pages: [] },
            generated_at: r.created_at?.toISOString?.() ?? new Date().toISOString(),
          };
        }
      }
      let recovery: any = null;
      if (parsed.data.recovery_id) {
        const [r] = await sql<any[]>`SELECT * FROM recovery_blueprints WHERE id = ${parsed.data.recovery_id}`;
        if (r) {
          recovery = {
            recovery_id: r.id, audit_id: r.audit_id, project_type_code: r.project_type_code,
            fixes: r.fixes ?? [], schema_patches: r.schema_patches ?? [],
            content_patches: r.content_patches ?? [], preflight_score: r.preflight_score,
          };
        }
      }

      const result = await buildAiDeveloperPack(
        {
          blueprint,
          audit,
          recovery,
          businessName: parsed.data.business_name,
          siteUrl: parsed.data.site_url,
          publishThreshold: parsed.data.publish_threshold,
        },
        { sessionId: parsed.data.session_id ?? null },
      );

      // Если клиент хочет inline ZIP — возвращаем base64; обычно используется /ai-pack/:id/download
      return reply.send({
        pack_id: result.pack_id,
        preflight_score: result.preflight_score,
        publishable: result.publishable,
        zip_sha256: result.zip_sha256,
        zip_size_bytes: result.zip_buffer.length,
        manifest: result.manifest,
      });
    } catch (err: any) {
      if (err instanceof PreflightGateError) {
        return reply.code(409).send({
          error: 'preflight_gate',
          message: err.message,
          score: err.score,
          threshold: err.threshold,
        });
      }
      logger.error('AUDIT_V2', `ai-pack failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  // ── GET /ai-pack/:id/download — отдача ZIP ─────────────────
  app.get<{ Params: { id: string } }>('/ai-pack/:id/download', async (req, reply) => {
    try {
      const [row] = await sql<any[]>`
        SELECT id, project_type_code, zip_blob, zip_size_bytes, zip_sha256, manifest
        FROM ai_developer_packs
        WHERE id = ${req.params.id}
      `;
      if (!row) return reply.code(404).send({ error: 'not_found' });
      if (!row.zip_blob) {
        return reply.code(410).send({
          error: 'blob_unavailable',
          message: 'ZIP не сохранён inline (>5MB), используйте регенерацию через /ai-pack/build',
        });
      }
      reply.header('Content-Type', 'application/zip');
      reply.header(
        'Content-Disposition',
        `attachment; filename="owndev-ai-pack-${row.project_type_code}-${row.id}.zip"`,
      );
      reply.header('X-Pack-SHA256', row.zip_sha256);
      return reply.send(row.zip_blob);
    } catch (err: any) {
      logger.error('AUDIT_V2', `download failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });
}
