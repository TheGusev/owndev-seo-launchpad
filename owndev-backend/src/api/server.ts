import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { auditRoutes } from './routes/audit.js';
import { monitorRoutes } from './routes/monitor.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { logger } from '../utils/logger.js';

export async function startServer() {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: true });

  app.addHook('onRequest', rateLimitMiddleware);

  await app.register(healthRoutes);
  await app.register(auditRoutes);
  await app.register(monitorRoutes);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen({ port, host: '0.0.0.0' });

  logger.info('SERVER', `Listening on :${port}`);
  return app;
}
