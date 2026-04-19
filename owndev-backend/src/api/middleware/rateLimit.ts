import type { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../../cache/redis.js';
import type { Plan } from '../../types/user.js';

const WINDOW_SEC = 60;

const PLAN_LIMITS: Record<string, number> = {
  anon: 60,
  free: 60,
  solo: 200,
  pro: 200,
  agency: 500,
};

// Read-only / static config endpoints — no point rate-limiting these
const SKIP_PATHS = new Set<string>([
  '/health',
  '/api/v1/site-formula/questions',
  '/api/v1/site-formula/config-version',
]);

// Path prefixes that should skip rate limit (e.g. polling endpoints)
const SKIP_PREFIXES = [
  '/api/v1/marketplace-audit/preview/',
  '/api/v1/marketplace-audit/result/',
];

export async function rateLimitMiddleware(req: FastifyRequest, reply: FastifyReply) {
  // Strip query string for matching
  const path = (req.url || '').split('?')[0];
  if (SKIP_PATHS.has(path)) {
    return;
  }
  for (const pref of SKIP_PREFIXES) {
    if (path.startsWith(pref)) return;
  }

  const user = (req as any).user;
  const plan: Plan = user?.plan ?? 'anon';
  const maxRequests = PLAN_LIMITS[plan] ?? 60;

  const key = `rl:${plan}:${req.ip}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, WINDOW_SEC);
  }

  reply.header('X-RateLimit-Limit', maxRequests);
  reply.header('X-RateLimit-Remaining', Math.max(0, maxRequests - current));

  if (current > maxRequests) {
    return reply.status(429).send({ success: false, error: 'Too many requests', code: 'RATE_LIMIT' });
  }
}
