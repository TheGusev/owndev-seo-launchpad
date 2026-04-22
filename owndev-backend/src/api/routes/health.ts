import type { FastifyInstance } from 'fastify';
import { testConnection } from '../../db/client.js';
import { testRedis } from '../../cache/redis.js';
import { monitorQueue } from '../../queue/queues.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/api/v1/health', async (_req, reply) => {
    const [pg, rd] = await Promise.all([testConnection(), testRedis()]);

    const mq = await monitorQueue.getJobCounts('waiting', 'active', 'completed');

    const ok = pg && rd;
    return reply.status(ok ? 200 : 503).send({
      success: true,
      data: {
        status: ok ? 'ok' : 'degraded',
        version: '1.0.0',
        db: pg ? 'connected' : 'error',
        redis: rd ? 'connected' : 'error',
        queues: { monitor: mq },
        timestamp: new Date().toISOString(),
      },
    });
  });
}
