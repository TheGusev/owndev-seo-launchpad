import type { FastifyRequest, FastifyReply } from 'fastify';
import { getUserByApiKey } from '../../db/queries/users.js';
import { logger } from '../../utils/logger.js';
import type { Plan } from '../../types/user.js';

export interface RequestUser {
  id: string;
  email: string;
  plan: Plan;
  api_key: string;
  credits_used: number;
  credits_limit: number;
  created_at: string;
}

const ANON_USER: RequestUser = {
  id: 'anon',
  email: '',
  plan: 'free',
  api_key: '',
  credits_used: 0,
  credits_limit: 5,
  created_at: new Date().toISOString(),
};

export async function authMiddleware(req: FastifyRequest, reply: FastifyReply) {
  const apiKey = req.headers['x-api-key'] as string | undefined;

  if (!apiKey) {
    (req as any).user = ANON_USER;
    return;
  }

  const user = await getUserByApiKey(apiKey);
  if (!user) {
    logger.warn('AUTH', 'Invalid API key');
    return reply.status(403).send({ success: false, error: 'Invalid API key', code: 'INVALID_KEY' });
  }

  (req as any).user = user;
}

export function requireAuth(req: FastifyRequest, reply: FastifyReply) {
  const user = (req as any).user as RequestUser;
  if (user.id === 'anon') {
    return reply.status(401).send({ success: false, error: 'Authentication required', code: 'AUTH_REQUIRED' });
  }
}
