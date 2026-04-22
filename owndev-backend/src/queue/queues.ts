import { Queue } from 'bullmq';
import { redis } from '../cache/redis.js';

const defaultJobOptions = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 5000 },
  removeOnComplete: 100,
  removeOnFail: 50,
};

export const monitorQueue = new Queue('monitor', {
  connection: redis,
  defaultJobOptions,
});

export const siteCheckQueue = new Queue('site-check', {
  connection: redis,
  defaultJobOptions,
});
