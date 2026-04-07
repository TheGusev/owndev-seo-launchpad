import type { FastifyRequest, FastifyReply } from 'fastify';
import { redis } from '../../cache/redis.js';

const WINDOW_SEC = 60;
const MAX_REQUESTS = 30;

export async function rateLimitMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const key = `rl:${req.ip}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, WINDOW_SEC);
  }

  reply.header('X-RateLimit-Limit', MAX_REQUESTS);
  reply.header('X-RateLimit-Remaining', Math.max(0, MAX_REQUESTS - current));

  if (current > MAX_REQUESTS) {
    return reply.status(429).send({ error: 'Too many requests' });
  }
}
