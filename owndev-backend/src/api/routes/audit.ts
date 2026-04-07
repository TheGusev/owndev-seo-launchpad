import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { normalizeUrl } from '../../utils/url.js';
import { insertDomain } from '../../db/queries/domains.js';
import { insertAudit, getAuditById } from '../../db/queries/audits.js';
import { addAuditJob } from '../../queue/jobs.js';
import { logger } from '../../utils/logger.js';

const auditBodySchema = z.object({
  url: z.string().url(),
});

export async function auditRoutes(app: FastifyInstance) {
  app.post('/api/v1/audit', { preHandler: [authMiddleware] }, async (req, reply) => {
    const parsed = auditBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid URL', details: parsed.error.flatten() });
    }

    const url = normalizeUrl(parsed.data.url);
    const user = (req as any).user;

    try {
      const domainId = await insertDomain(url);
      const auditId = await insertAudit(domainId, user?.id ?? null);

      await addAuditJob({ auditId, domainId, url, userId: user?.id ?? null });

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
