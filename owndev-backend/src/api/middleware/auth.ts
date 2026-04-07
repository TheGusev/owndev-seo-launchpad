import type { FastifyRequest, FastifyReply } from 'fastify';
import { getUserByApiKey } from '../../db/queries/users.js';
import { logger } from '../../utils/logger.js';

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    logger.warn('AUTH', 'Missing API key');
    return reply.status(401).send({ error: 'API key required' });
  }

  const user = await getUserByApiKey(apiKey);
  if (!user) {
    logger.warn('AUTH', 'Invalid API key');
    return reply.status(403).send({ error: 'Invalid API key' });
  }

  (req as any).user = user;
}
