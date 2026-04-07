import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { normalizeUrl } from '../../utils/url.js';
import { getOrCreateDomain } from '../../db/queries/domains.js';
import { createAudit, getAuditById } from '../../db/queries/audits.js';
import { checkUserCredits, incrementUserCredits } from '../../db/queries/users.js';
import { addAuditJob } from '../../queue/jobs.js';
import { logger } from '../../utils/logger.js';

const auditBodySchema = z.object({
  url: z.string().url(),
  toolId: z.string().max(64).optional(),
});

export async function auditRoutes(app: FastifyInstance) {
  app.post('/api/v1/audit', { preHandler: [authMiddleware] }, async (req, reply) => {
    const parsed = auditBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid input', details: parsed.error.flatten() });
    }

    const url = normalizeUrl(parsed.data.url);
    const user = (req as any).user;

    // TODO: plan-based credit check
    const hasCredits = await checkUserCredits(user.id);
    if (!hasCredits) {
      return reply.status(429).send({ error: 'Credit limit reached' });
    }

    try {
      const hostname = new URL(url).hostname;
      const domain = await getOrCreateDomain(user.id, hostname);
      const auditId = await createAudit({
        domainId: domain.id,
        userId: user.id,
        url,
        toolId: parsed.data.toolId,
      });

      await incrementUserCredits(user.id);
      await addAuditJob({ auditId, domainId: domain.id, url, userId: user.id });

      logger.info('AUDIT', `Created audit ${auditId} for ${url}`);
      return reply.status(202).send({ auditId, status: 'pending' });
    } catch (err: any) {
      logger.error('AUDIT', err.message);
      return reply.status(500).send({ error: 'Failed to create audit' });
    }
  });

  app.get('/api/v1/audit/:id', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { id } = req.params as { id: string };
    const audit = await getAuditById(id);

    if (!audit) {
      return reply.status(404).send({ error: 'Audit not found' });
    }

    return reply.send(audit);
  });
}
