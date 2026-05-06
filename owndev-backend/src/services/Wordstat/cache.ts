/**
 * Wordstat cache layer (DB).
 *
 * Wraps the raw client with a 30-day TTL cache, so repeated calls for the
 * same phrase are free. Cache key = (phrase, region_code, metric).
 *
 * Public API mirrors the client but reads/writes wordstat_cache.
 */
import { sql } from '../../db/client.js';
import { logger } from '../../utils/logger.js';
import * as client from './client.js';
import type {
  WordstatTopResponse,
  WordstatDynamicsResponse,
  WordstatRegionsResponse,
} from './types.js';

interface CacheRow<T> {
  payload: T;
  expires_at: Date;
}

async function readCache<T>(
  phrase: string,
  regionCode: string,
  metric: string,
): Promise<T | null> {
  try {
    const rows = await sql<CacheRow<T>[]>`
      SELECT payload, expires_at
      FROM wordstat_cache
      WHERE phrase = ${phrase}
        AND region_code = ${regionCode}
        AND metric = ${metric}
      LIMIT 1
    `;
    if (rows.length === 0) return null;
    if (new Date(rows[0].expires_at) < new Date()) return null;
    return rows[0].payload;
  } catch (err: any) {
    logger.warn('WORDSTAT_CACHE', `read failed: ${err.message}`);
    return null;
  }
}

async function writeCache<T>(
  phrase: string,
  regionCode: string,
  metric: string,
  payload: T,
  source: string,
): Promise<void> {
  try {
    await sql`
      INSERT INTO wordstat_cache (phrase, region_code, metric, payload, source)
      VALUES (${phrase}, ${regionCode}, ${metric}, ${JSON.stringify(payload)}::jsonb, ${source})
      ON CONFLICT (phrase, region_code, metric) DO UPDATE
        SET payload    = EXCLUDED.payload,
            source     = EXCLUDED.source,
            fetched_at = NOW(),
            expires_at = NOW() + INTERVAL '30 days'
    `;
  } catch (err: any) {
    logger.warn('WORDSTAT_CACHE', `write failed: ${err.message}`);
  }
}

// ─── Cached public API ────────────────────────────────────────
export async function getTop(
  phrase: string,
  regionCode = '225',
): Promise<WordstatTopResponse> {
  const cached = await readCache<WordstatTopResponse>(phrase, regionCode, 'top');
  if (cached) return cached;

  const fresh = await client.getTop(phrase, regionCode);
  await writeCache(phrase, regionCode, 'top', fresh, fresh.source);
  return fresh;
}

export async function getDynamics(
  phrase: string,
  regionCode = '225',
): Promise<WordstatDynamicsResponse> {
  const cached = await readCache<WordstatDynamicsResponse>(phrase, regionCode, 'dynamics');
  if (cached) return cached;

  const fresh = await client.getDynamics(phrase, regionCode);
  await writeCache(phrase, regionCode, 'dynamics', fresh, fresh.source);
  return fresh;
}

export async function getRegions(phrase: string): Promise<WordstatRegionsResponse> {
  const cached = await readCache<WordstatRegionsResponse>(phrase, '0', 'regions');
  if (cached) return cached;

  const fresh = await client.getRegions(phrase);
  await writeCache(phrase, '0', 'regions', fresh, fresh.source);
  return fresh;
}

// Bulk for cluster building — fetches in parallel with concurrency limit.
export async function getTopBulk(
  phrases: string[],
  regionCode = '225',
  concurrency = 4,
): Promise<WordstatTopResponse[]> {
  const out: WordstatTopResponse[] = [];
  const queue = [...phrases];
  const workers = new Array(Math.min(concurrency, queue.length)).fill(0).map(async () => {
    while (queue.length > 0) {
      const next = queue.shift();
      if (!next) return;
      try {
        out.push(await getTop(next, regionCode));
      } catch (err: any) {
        logger.warn('WORDSTAT_BULK', `getTop(${next}) failed: ${err.message}`);
      }
    }
  });
  await Promise.all(workers);
  return out;
}
