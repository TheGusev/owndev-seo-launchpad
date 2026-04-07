import { Worker } from 'bullmq';
import { redis } from '../cache/redis.js';
import { createAudit } from '../db/queries/audits.js';
import { addAuditJob } from '../queue/jobs.js';
import { getMonitorById, updateMonitorRun } from '../db/queries/monitors.js';
import { MonitorService } from '../services/MonitorService.js';
import { logger } from '../utils/logger.js';
import type { MonitorJobData } from '../queue/jobs.js';

export function startMonitorWorker() {
  const monitorService = new MonitorService();

  const worker = new Worker<MonitorJobData>(
    'monitor',
    async (job) => {
      const { monitorId, domainId, url, userId } = job.data;
      logger.info('MONITOR_WORKER', `Processing monitor ${monitorId} for ${url}`);

      const auditId = await createAudit({ domainId, userId: userId ?? null, url });
      await addAuditJob({ auditId, domainId, url, userId: userId ?? null });

      const periodMs = 6 * 60 * 60 * 1000; // default 6h
      const monitor = await getMonitorById(monitorId);
      const interval = monitor?.period === 'daily' ? 24 * 60 * 60 * 1000 : periodMs;
      const nextRunAt = new Date(Date.now() + interval);

      await updateMonitorRun(monitorId, nextRunAt);
      await monitorService.scheduleMonitor(monitorId);

      logger.info('MONITOR_WORKER', `Audit ${auditId} queued, next run at ${nextRunAt.toISOString()}`);
    },
    {
      connection: redis,
      concurrency: 1,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error('MONITOR_WORKER', `Job ${job?.id} failed: ${err.message}`);
  });

  logger.info('MONITOR_WORKER', 'Started');
  return worker;
}
