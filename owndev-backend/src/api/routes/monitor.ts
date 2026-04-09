import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { normalizeUrl } from '../../utils/url.js';
import { getOrCreateDomain } from '../../db/queries/domains.js';
import { createMonitor, getMonitorsByUser, toggleMonitor } from '../../db/queries/monitors.js';
import { MonitorService } from '../../services/MonitorService.js';
import { logEvent } from '../../db/queries/events.js';
import { logger } from '../../utils/logger.js';

const monitorBodySchema = z.object({
  url: z.string().url(),
  period: z.enum(['daily', 'weekly']).default('weekly'),
});

export async function monitorRoutes(app: FastifyInstance) {
  const monitorService = new MonitorService();

  app.post('/api/v1/monitors', async (req, reply) => {
    const authErr = requireAuth(req, reply);
    if (authErr) return authErr;

    const parsed = monitorBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ success: false, error: 'Invalid input', code: 'VALIDATION' });
    }

    const url = normalizeUrl(parsed.data.url);
    const user = (req as any).user;

    try {
      const hostname = new URL(url).hostname;
      const domain = await getOrCreateDomain(user.id, hostname);
      const monitorId = await createMonitor(domain.id, user.id, parsed.data.period);

      await monitorService.scheduleMonitor(monitorId);
      await logEvent('monitor_created', { url, period: parsed.data.period, monitorId }, user.id);

      logger.info('MONITOR', `Created monitor ${monitorId} for ${hostname}`);
      return reply.status(201).send({ success: true, data: { monitorId, status: 'scheduled' } });
    } catch (err: any) {
      logger.error('MONITOR', err.message);
      return reply.status(500).send({ success: false, error: 'Failed to create monitor', code: 'INTERNAL' });
    }
  });

  app.get('/api/v1/monitors', async (req, reply) => {
    const authErr = requireAuth(req, reply);
    if (authErr) return authErr;

    const user = (req as any).user;
    const monitors = await getMonitorsByUser(user.id);
    return reply.send({ success: true, data: monitors });
  });

  app.delete('/api/v1/monitors/:id', async (req, reply) => {
    const authErr = requireAuth(req, reply);
    if (authErr) return authErr;

    const { id } = req.params as { id: string };

    try {
      await toggleMonitor(id, false);
      logger.info('MONITOR', `Disabled monitor ${id}`);
      return reply.send({ success: true, data: { id, enabled: false } });
    } catch (err: any) {
      logger.error('MONITOR', err.message);
      return reply.status(500).send({ success: false, error: 'Failed to disable monitor', code: 'INTERNAL' });
    }
  });
}
