import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { normalizeUrl } from '../../utils/url.js';
import { getOrCreateDomain } from '../../db/queries/domains.js';
import { createAudit, getAuditById, getAuditsByDomain } from '../../db/queries/audits.js';
import { checkUserCredits, incrementUserCredits } from '../../db/queries/users.js';
import { addAuditJob } from '../../queue/jobs.js';
import { logEvent } from '../../db/queries/events.js';
import { logger } from '../../utils/logger.js';

const auditBodySchema = z.object({
  url: z.string().url(),
  toolId: z.string().max(64).optional(),
});

const auditsQuerySchema = z.object({
  url: z.string().url().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export async function auditRoutes(app: FastifyInstance) {
  app.post('/api/v1/audit', async (req, reply) => {
    const parsed = auditBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid input', code: 'VALIDATION', details: parsed.error.flatten() });
    }

    const url = normalizeUrl(parsed.data.url);
    const user = (req as any).user;

    if (user.id !== 'anon') {
      const hasCredits = await checkUserCredits(user.id);
      if (!hasCredits) {
        return reply.status(429).send({ success: false, error: 'Credit limit reached', code: 'CREDIT_LIMIT' });
      }
    }

    try {
      const hostname = new URL(url).hostname;
      const domain = await getOrCreateDomain(user.id === 'anon' ? null : user.id, hostname);
      const auditId = await createAudit({
        domainId: domain.id,
        userId: user.id === 'anon' ? null : user.id,
        url,
        toolId: parsed.data.toolId,
      });

      if (user.id !== 'anon') {
        await incrementUserCredits(user.id);
      }

      await addAuditJob({ auditId, domainId: domain.id, url, userId: user.id === 'anon' ? null : user.id });

      await logEvent('audit_created', { url, toolId: parsed.data.toolId, auditId }, user.id === 'anon' ? null : user.id);

      logger.info('AUDIT', `Created audit ${auditId} for ${url}`);
      return reply.status(202).send({ success: true, data: { auditId, status: 'pending' } });
    } catch (err: any) {
      logger.error('AUDIT', err.message);
      return reply.status(500).send({ success: false, error: 'Failed to create audit', code: 'INTERNAL' });
    }
  });

  app.get('/api/v1/audit/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    const audit = await getAuditById(id);

    if (!audit) {
      return reply.status(404).send({ success: false, error: 'Audit not found', code: 'NOT_FOUND' });
    }

    return reply.send({ success: true, data: audit });
  });

  app.get('/api/v1/audits', async (req, reply) => {
    const parsed = auditsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid query', code: 'VALIDATION' });
    }

    const { url, limit } = parsed.data;
    if (!url) {
      return reply.status(400).send({ success: false, error: 'url query parameter required', code: 'VALIDATION' });
    }

    try {
      const hostname = new URL(url).hostname;
      const audits = await getAuditsByDomain(hostname, limit);
      return reply.send({ success: true, data: audits });
    } catch {
      return reply.status(400).send({ success: false, error: 'Invalid URL', code: 'VALIDATION' });
    }
  });
}
