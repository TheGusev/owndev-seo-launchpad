import { Worker } from 'bullmq';
import { redis } from '../cache/redis.js';
import { AuditService } from '../services/AuditService.js';
import { insertAudit } from '../db/queries/audits.js';
import { logger } from '../utils/logger.js';
import type { MonitorJobData } from '../queue/jobs.js';

export function startMonitorWorker() {
  const service = new AuditService();

  const worker = new Worker<MonitorJobData>(
    'monitor',
    async (job) => {
      const { domainId, url } = job.data;
      logger.info('MONITOR_WORKER', `Processing monitor for ${url}`);

      const auditId = await insertAudit(domainId, null);
      await service.run(auditId, domainId, url);
    },
    {
      connection: redis,
      concurrency: 1,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error('MONITOR_WORKER', `Job ${job?.id} failed:`, err.message);
  });

  logger.info('MONITOR_WORKER', 'Started');
  return worker;
}
