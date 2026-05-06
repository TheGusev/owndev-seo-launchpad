/**
 * Formula v2 — Async Jobs API.
 *
 * Mounted at /api/v2/jobs.
 *   POST  /enqueue  — поставить задачу в нужную очередь
 *   GET   /:id      — статус job (в т.ч. result/error)
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { logger } from '../../utils/logger.js';
import {
  enqueueFormulaJob,
  getJobStatus,
  type FormulaJobPayload,
} from '../../queue/formulaV2Jobs.js';

const VALID_TYPES = ['build', 'crawl', 'audit', 'wordstat', 'ai-pack'] as const;

const enqueueSchema = z.object({
  type: z.enum(VALID_TYPES),
  payload: z.record(z.any()),
  session_id: z.string().uuid().optional(),
});

export async function jobsV2Routes(app: FastifyInstance): Promise<void> {
  app.post('/enqueue', async (req, reply) => {
    const parsed = enqueueSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply
        .code(400)
        .send({ error: 'validation_error', details: parsed.error.flatten() });
    }
    try {
      const { type, payload, session_id } = parsed.data;
      const job = await enqueueFormulaJob({
        type,
        ...payload,
        session_id,
      } as FormulaJobPayload);
      return reply.code(202).send({
        job_id: job.id,
        bullmq_job_id: job.bullmq_job_id,
        queue: job.queue,
        type: job.type,
        status: 'queued',
        poll_url: `/api/v2/jobs/${job.id}`,
      });
    } catch (err: any) {
      logger.error('JOBS_V2', `enqueue failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  app.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    try {
      const row = await getJobStatus(req.params.id);
      if (!row) return reply.code(404).send({ error: 'not_found' });
      return reply.send({ job: row });
    } catch (err: any) {
      logger.error('JOBS_V2', `status failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });
}
