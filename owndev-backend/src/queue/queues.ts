import { Queue } from 'bullmq';
import { redis } from '../cache/redis.js';

export const auditQueue = new Queue('audit', { connection: redis });
export const monitorQueue = new Queue('monitor', { connection: redis });
