import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { normalizeUrl } from '../../utils/url.js';
import { getDomainByUrl, insertDomain } from '../../db/queries/domains.js';
import { listAuditsByDomain } from '../../db/queries/audits.js';
import { addMonitorJob } from '../../queue/jobs.js';
import { logger } from '../../utils/logger.js';

const monitorBodySchema = z.object({
  url: z.string().url(),
});

export async function monitorRoutes(app: FastifyInstance) {
  app.post('/api/v1/monitor', { preHandler: [authMiddleware] }, async (req, reply) => {
    const parsed = monitorBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'Invalid URL' });
    }

    const url = normalizeUrl(parsed.data.url);

    try {
      const domainId = await insertDomain(url);
      await addMonitorJob({ domainId, url });

      logger.info('MONITOR', `Started monitoring ${url}`);
      return reply.status(202).send({ domainId, status: 'monitoring' });
    } catch (err: any) {
      logger.error('MONITOR', err.message);
      return reply.status(500).send({ error: 'Failed to start monitoring' });
    }
  });

  app.get('/api/v1/monitor/:domain', { preHandler: [authMiddleware] }, async (req, reply) => {
    const { domain } = req.params as { domain: string };
    const d = await getDomainByUrl(normalizeUrl(domain));

    if (!d) {
      return reply.status(404).send({ error: 'Domain not found' });
    }

    const audits = await listAuditsByDomain(d.id, 10);
    return reply.send({ domain: d, audits });
  });
}
