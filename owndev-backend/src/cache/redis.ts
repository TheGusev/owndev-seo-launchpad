import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

export const redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.on('error', (err) => {
  logger.error('REDIS', err.message);
});

redis.on('reconnecting', (delay: number) => {
  logger.warn('REDIS', `Reconnecting in ${delay}ms`);
});

export async function testRedis(): Promise<boolean> {
  try {
    await redis.ping();
    return true;
  } catch {
    return false;
  }
}
