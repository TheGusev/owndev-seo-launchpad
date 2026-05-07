/**
 * V3 pipeline route — POST /api/v3/pipeline/run
 *
 * Runs the V3 PipelineOrchestrator synchronously and returns the full
 * PipelineResultV3. ZIP bytes are NOT returned here — use /pack/:job_id.zip.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { pipelineOrchestrator } from '../../../services/pipeline/index.js';
import { logger } from '../../../utils/logger.js';
import { randomUUID } from 'node:crypto';

const PROJECT_CODES_V3 = [
  'service_geo', 'service_pro', 'service_b2b', 'ecommerce', 'marketplace',
  'saas', 'education', 'medical', 'legal', 'realestate',
  'mobile_app',
  'finance', 'hospitality', 'events', 'nonprofit', 'gov', 'portfolio',
  'media', 'blog',
  'promo_event', 'personal_brand', 'franchise_multi', 'b2b_media',
] as const;

const runSchema = z.object({
  job_id: z.string().min(1).optional(),
  // root_url опционален — у клиента может ещё не быть домена.
  // Если url не задан — crawl/audit пропускаются в orchestrator.
  root_url: z.string().url().optional(),
  project_code: z.enum(PROJECT_CODES_V3),
  brand: z.object({
    name: z.string().min(1),
    industry: z.string().min(1),
    target_audience: z.string().min(1),
    competitive_position: z.string().optional(),
    primary_city: z.string().optional(),
    contact_email: z.string().email().optional(),
  }),
  seed_keywords: z.array(z.string().min(1)).optional(),
  recommended_geos: z.array(z.string()).optional(),
  pack_mode: z.enum(['structured', 'full', 'platform_specific', 'studio']).optional(),
  platform_target: z.enum(['lovable', 'cursor', 'v0', 'claude_code', 'antigravity', 'raw']).optional(),
  ai_training_policy: z.enum(['allow', 'deny', 'allow_with_attribution']).optional(),
  skip_demand: z.boolean().optional(),
  skip_crawl: z.boolean().optional(),
  max_crawl_pages: z.number().int().min(1).max(100).optional(),
  // ───── Мост v1 → v3 (опционально) ─────
  // engine_state приходит из серверного ядра v1 (бесплатный SiteFormula).
  // На PRO-эндпоинте валидируем только ключевые поля — остальные пускаем как passthrough,
  // чтобы не дублировать разметку вывода v1 (источник истины — src/types/siteFormula.ts).
  engine_state: z
    .object({
      project_class: z.enum(['start', 'growth', 'scale']),
      project_class_reason: z.string().optional(),
      dimensions: z.record(z.number()).optional(),
      derived_scores: z.record(z.number()).optional(),
      activated_layers: z.array(z.string()).optional(),
      activated_blocks: z.array(z.string()).optional(),
      activated_checks: z.array(z.string()).optional(),
      flags: z.record(z.boolean()).optional(),
      decision_trace: z.array(z.any()).optional(),
      rule_conflicts: z.array(z.any()).optional(),
    })
    .passthrough()
    .optional(),
});

// In-memory cache of recent pipeline results (so /pack/:job_id can read them).
// For production this should be persisted to formula_jobs/pack_artifacts.
const RESULT_CACHE = new Map<string, any>();
const RESULT_TTL_MS = 60 * 60 * 1000; // 1 hour

function evictExpired() {
  const now = Date.now();
  for (const [k, v] of RESULT_CACHE) {
    if (v._cached_at && now - v._cached_at > RESULT_TTL_MS) RESULT_CACHE.delete(k);
  }
}

export function getCachedPipelineResult(jobId: string): any | null {
  evictExpired();
  return RESULT_CACHE.get(jobId) ?? null;
}

export async function pipelineRoutes(app: FastifyInstance) {
  app.post('/run', async (req, reply) => {
    const parsed = runSchema.safeParse(req.body);
    if (!parsed.success) {
      reply.status(400).send({
        success: false,
        error: 'Invalid input',
        issues: parsed.error.issues,
      });
      return;
    }

    const input = parsed.data;
    const jobId = input.job_id ?? randomUUID();

    try {
      const result = await pipelineOrchestrator.run({
        job_id: jobId,
        root_url: input.root_url,
        project_code: input.project_code,
        brand: input.brand,
        seed_keywords: input.seed_keywords,
        recommended_geos: input.recommended_geos,
        pack_mode: input.pack_mode,
        platform_target: input.platform_target,
        ai_training_policy: input.ai_training_policy,
        skip_demand: input.skip_demand,
        skip_crawl: input.skip_crawl,
        max_crawl_pages: input.max_crawl_pages,
        // Мост v1 → v3: пробрасываем engine_state, если передан.
        engine_state: input.engine_state as any,
      });

      // Cache result for /pack/:job_id retrieval
      RESULT_CACHE.set(jobId, { ...result, _cached_at: Date.now() });

      // Strip the ZIP buffer-related raw fields from response payload
      reply.send({
        success: result.status === 'done',
        job_id: jobId,
        result: {
          ...result,
          // pack_zip_size kept; actual bytes via /pack/:job_id.zip
        },
      });
    } catch (err: any) {
      logger.error('API_V3', `pipeline.run failed: ${err.message}`);
      reply.status(500).send({ success: false, error: err.message ?? 'Pipeline failed' });
    }
  });

  app.get('/result/:job_id', async (req, reply) => {
    const { job_id } = req.params as { job_id: string };
    const cached = getCachedPipelineResult(job_id);
    if (!cached) {
      reply.status(404).send({ success: false, error: 'Result not found or expired' });
      return;
    }
    reply.send({ success: true, result: cached });
  });
}
