import type { FastifyInstance } from 'fastify';
import { testConnection } from '../../db/client.js';
import { testRedis } from '../../cache/redis.js';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (_req, reply) => {
    const [pg, rd] = await Promise.all([testConnection(), testRedis()]);
    const ok = pg && rd;
    return reply.status(ok ? 200 : 503).send({
      status: ok ? 'ok' : 'degraded',
      postgres: pg,
      redis: rd,
      timestamp: new Date().toISOString(),
    });
  });
}
