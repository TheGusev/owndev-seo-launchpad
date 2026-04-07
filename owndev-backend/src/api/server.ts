import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { auditRoutes } from './routes/audit.js';
import { monitorRoutes } from './routes/monitor.js';
import { eventRoutes } from './routes/events.js';
import { monitorRoutes } from './routes/monitor.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { logger } from '../utils/logger.js';

const CORS_ORIGINS = [
  'https://owndev.ru',
  'http://localhost:5173',
  'http://localhost:3000',
];

export async function startServer() {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: CORS_ORIGINS, credentials: true });

  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', rateLimitMiddleware);

  app.setErrorHandler((error, _req, reply) => {
    logger.error('SERVER', error.message);
    const status = error.statusCode ?? 500;
    reply.status(status).send({ success: false, error: status >= 500 ? 'Internal error' : error.message, code: 'INTERNAL' });
  });

  await app.register(healthRoutes);
  await app.register(auditRoutes);
  await app.register(monitorRoutes);
  await app.register(eventRoutes);

  const port = Number(process.env.PORT ?? 3001);
  await app.listen({ port, host: '0.0.0.0' });

  logger.info('SERVER', `Listening on :${port}`);
  return app;
}
