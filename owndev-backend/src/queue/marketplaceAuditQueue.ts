import { Queue } from 'bullmq';
import { redis } from '../cache/redis.js';

export interface MarketplaceAuditJob {
  audit_id: string;
}

export const marketplaceAuditQueue = new Queue<MarketplaceAuditJob>('marketplace-audit', {
  connection: redis,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: 'exponential' as const, delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});
