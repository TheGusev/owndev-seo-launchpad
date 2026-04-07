import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { logEvent } from '../../db/queries/events.js';
import { logger } from '../../utils/logger.js';

const eventBodySchema = z.object({
  name: z.string().max(128),
  payload: z.record(z.unknown()).optional(),
});

export async function eventRoutes(app: FastifyInstance) {
  app.post('/api/v1/events', async (req, reply) => {
    const parsed = eventBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid event', code: 'VALIDATION' });
    }

    const user = (req as any).user;
    const userId = user?.id === 'anon' ? null : user?.id ?? null;

    try {
      await logEvent(parsed.data.name, parsed.data.payload, userId);
    } catch (err: any) {
      logger.warn('EVENTS', `Failed to log event: ${err.message}`);
      // Don't fail the request — analytics is best-effort
    }

    return reply.status(202).send({ success: true });
  });
}
