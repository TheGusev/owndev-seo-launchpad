import type { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../../cache/redis.js';
import type { Plan } from '../../types/user.js';

const WINDOW_SEC = 60;

const PLAN_LIMITS: Record<string, number> = {
  anon: 10,
  free: 20,
  solo: 200,
  pro: 200,
  agency: 200,
};

export async function rateLimitMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user;
  const plan: Plan | 'anon' = user?.plan ?? 'anon';
  const maxRequests = PLAN_LIMITS[plan] ?? 10;

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
