import Fastify from 'fastify';
import cors from '@fastify/cors';
import { healthRoutes } from './routes/health.js';
import { monitorRoutes } from './routes/monitor.js';
import { eventRoutes } from './routes/events.js';
import { siteCheckRoutes } from './routes/siteCheck.js';
import { toolsRoutes } from './routes/tools.js';
import { authMiddleware } from './middleware/auth.js';
import { rateLimitMiddleware } from './middleware/rateLimit.js';
import { logger } from '../utils/logger.js';

const CORS_ORIGINS: (string | RegExp)[] = [
  'https://owndev.ru',
  'https://www.owndev.ru',
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
  /\.lovable\.dev$/,
  'http://localhost:5173',
  'http://localhost:8080',
  'http://localhost:3000',
];

export async function startServer() {
  const app = Fastify({ logger: false });

  await app.register(cors, { origin: CORS_ORIGINS, credentials: true });

  app.addHook('onRequest', authMiddleware);
  app.addHook('onRequest', rateLimitMiddleware);

  app.setErrorHandler((error, _req, reply) => {
    const err = error as any;
    logger.error('SERVER', err?.message || String(err));
    const status = err?.statusCode ?? 500;
    const message = status >= 500 ? 'Internal error' : (err?.message || 'Unknown error');
    reply.status(status).send({ success: false, error: message, code: 'INTERNAL' });
  });

  await app.register(healthRoutes);
  await app.register(monitorRoutes);
  await app.register(eventRoutes);
    await app.register(siteCheckRoutes, { prefix: '/api/v1/site-check' });
    await app.register(toolsRoutes, { prefix: '/api/v1' });
    const { siteFormulaRoutes } = await import('./routes/siteFormula.js');
    await app.register(siteFormulaRoutes, { prefix: '/api/v1/site-formula' });
    const { marketplaceAuditRoutes } = await import('./routes/marketplaceAudit.js');
    await app.register(marketplaceAuditRoutes, { prefix: '/api/v1/marketplace-audit' });
    const { aliceRoutes } = await import('./routes/alice.js');
    await app.register(aliceRoutes, { prefix: '/api/v1/alice' });
    const { conversionAuditRoutes } = await import('./routes/conversionAudit.js');
    await app.register(conversionAuditRoutes, { prefix: '/api/v1/conversion-audit' });

    // ── Formula v2 деактивирована ──
    // Роуты /api/v2/formula, /api/v2/wordstat, /api/v2/audit, /api/v2/jobs,
    // /api/v2/recovery, /api/v2/ai-pack вытеснены v3-пайплайном
    // (/api/v3/pipeline/run + /api/v3/pack/*). Free-формула по-прежнему
    // обслуживается изолированным ядром /api/v1/site-formula/*.
    // Файлы роутов и связанные сервисы будут удалены отдельным коммитом
    // после прогрева мониторинга.

    // ── V3 — Site Formula V3 (Tier A/B/C, demand intelligence,
    //    technical passport, preflight 4-axes, super_prompt_pack v1) ──
    const { v3Routes } = await import('./routes/v3/index.js');
    await app.register(v3Routes, { prefix: '/api/v3' });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen({ port, host: '0.0.0.0' });
  logger.info('SERVER', `Listening on :${port}`);
  return app;
}
