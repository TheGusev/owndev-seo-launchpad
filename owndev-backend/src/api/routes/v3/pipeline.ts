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
import { PROJECT_TYPE_CODES_V3 } from '../../../types/formulaV3.js';
import {
  setPipelineResult,
  getPipelineResult,
} from '../../../db/queries/v3PipelineResults.js';

// PR-14: zod.enum берёт все 27 кодов из единого источника истины
// (`PROJECT_TYPE_CODES_V3` в types/formulaV3.ts), чтобы ни одна ниша из PR-10
// не падала в 400 Invalid input.
const PROJECT_CODES_V3 = PROJECT_TYPE_CODES_V3;

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
  // ───── PR-3 Fan-out (опционально) ─────
  cities: z.array(z.object({
    slug: z.string().min(1),
    label: z.string().min(1),
  })).max(50).optional(),
  service_directions: z.array(z.object({
    slug: z.string().min(1),
    label: z.string().min(1),
  })).max(50).optional(),
  enable_hub_pages: z.boolean().optional(),
});

// PR-14 (B2): кэш результатов вынесен в `db/queries/v3PipelineResults.ts`,
// где пишется в таблицу `v3_pipeline_results` (PostgreSQL). Это необходимо
// для PM2 cluster: иначе GET /pack/:job_id и GET /result/:job_id, попавшие
// на другой worker, отвечают 404. Memory-fallback остался внутри модуля
// для тестов, где DATABASE_URL не задан.

/**
 * Обратносовместимый алиас для pack.ts — теперь async.
 * Старый импорт `getCachedPipelineResult` в pack.ts обновлён рядом.
 */
export async function getCachedPipelineResult(jobId: string): Promise<any | null> {
  return getPipelineResult(jobId);
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
        // PR-3 Fan-out:
        cities: input.cities,
        service_directions: input.service_directions,
        enable_hub_pages: input.enable_hub_pages,
      });

      // PR-14 (B2): persist в БД — работает и в PM2 cluster.
      await setPipelineResult(jobId, result);

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
    const cached = await getPipelineResult(job_id);
    if (!cached) {
      reply.status(404).send({ success: false, error: 'Result not found or expired' });
      return;
    }
    reply.send({ success: true, result: cached });
  });
}
