import { Worker } from 'bullmq';
import { redis } from '../cache/redis.js';
import { AuditService } from '../services/AuditService.js';
import { logger } from '../utils/logger.js';
import type { AuditJobData } from '../queue/jobs.js';

const MAX_CONCURRENT = Number(process.env.MAX_CONCURRENT_AUDITS ?? 3);

export function startAuditWorker() {
  const service = new AuditService();

  const worker = new Worker<AuditJobData>(
    'audit',
    async (job) => {
      const { auditId, domainId, url } = job.data;
      logger.info('AUDIT_WORKER', `Processing audit ${auditId} for ${url}`);
      await service.run(auditId, domainId, url);
    },
    {
      connection: redis,
      concurrency: MAX_CONCURRENT,
    },
  );

  worker.on('failed', (job, err) => {
    logger.error('AUDIT_WORKER', `Job ${job?.id} failed:`, err.message);
  });

  worker.on('completed', (job) => {
    logger.info('AUDIT_WORKER', `Job ${job.id} completed`);
  });

  logger.info('AUDIT_WORKER', `Started (concurrency=${MAX_CONCURRENT})`);
  return worker;
}
