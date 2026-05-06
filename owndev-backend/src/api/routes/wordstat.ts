/**
 * Wordstat / demand intelligence — public API.
 * Mounted at /api/v2/wordstat.
 */
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import {
  getTop,
  getDynamics,
  getRegions,
  buildClusters,
  wordstatMode,
} from '../../services/Wordstat/index.js';
import { logger } from '../../utils/logger.js';

const phraseSchema = z.object({
  phrase: z.string().min(1).max(255),
  region_code: z.string().regex(/^\d{1,16}$/).optional(),
});

const clustersSchema = z.object({
  seed: z.string().min(1).max(100),
  region_code: z.string().regex(/^\d{1,16}$/).optional(),
  business_name: z.string().optional(),
  max_clusters: z.number().int().min(1).max(50).optional(),
  min_volume: z.number().int().min(0).optional(),
});

export async function wordstatRoutes(app: FastifyInstance): Promise<void> {
  // Operational marker — useful in dev to know which backend is active
  app.get('/_status', async (_req, reply) => reply.send({ mode: wordstatMode }));

  app.post('/top', async (req, reply) => {
    const parsed = phraseSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() });
    }
    try {
      const data = await getTop(parsed.data.phrase, parsed.data.region_code);
      return reply.send(data);
    } catch (err: any) {
      logger.error('WORDSTAT', `top failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  app.post('/dynamics', async (req, reply) => {
    const parsed = phraseSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() });
    }
    try {
      const data = await getDynamics(parsed.data.phrase, parsed.data.region_code);
      return reply.send(data);
    } catch (err: any) {
      logger.error('WORDSTAT', `dynamics failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  app.post('/regions', async (req, reply) => {
    const parsed = phraseSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() });
    }
    try {
      const data = await getRegions(parsed.data.phrase);
      return reply.send(data);
    } catch (err: any) {
      logger.error('WORDSTAT', `regions failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });

  app.post('/clusters', async (req, reply) => {
    const parsed = clustersSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'validation_error', details: parsed.error.flatten() });
    }
    try {
      const clusters = await buildClusters(parsed.data);
      return reply.send({ clusters, count: clusters.length });
    } catch (err: any) {
      logger.error('WORDSTAT', `clusters failed: ${err.message}`);
      return reply.code(500).send({ error: 'internal_error', message: err.message });
    }
  });
}
