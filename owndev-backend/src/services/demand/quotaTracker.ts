/**
 * Demand quota tracker.
 *
 * Tracks daily unit consumption against the 100 000 sync quota of the
 * Yandex Search API (Wordstat). Persists per-endpoint usage in
 * demand_quota_log so we never blow the quota across processes/workers.
 *
 * Strategy:
 *   1. Before every API call: assert there is enough quota.
 *   2. Atomically increment usage in the same UPSERT.
 *   3. Emit a structured warning at 80% and refuse calls at 100%.
 */
import { sql } from '../../db/client.js';
import { logger } from '../../utils/logger.js';
import {
  WORDSTAT_ENDPOINT_COSTS,
  WORDSTAT_DAILY_QUOTA,
  type WordstatEndpointV3,
} from './types.js';

export class QuotaExceededError extends Error {
  constructor(
    public endpoint: WordstatEndpointV3,
    public unitsRequested: number,
    public unitsRemaining: number,
  ) {
    super(
      `Yandex Wordstat quota exceeded: ${endpoint} requires ${unitsRequested}u, only ${unitsRemaining}u remain today (limit ${WORDSTAT_DAILY_QUOTA})`,
    );
  }
}

/**
 * Returns total units used today across all endpoints.
 */
export async function getUsedUnitsToday(): Promise<number> {
  const rows = await sql<Array<{ total: string }>>`
    SELECT COALESCE(SUM(units_used), 0)::text AS total
    FROM demand_quota_log
    WHERE log_date = (NOW() AT TIME ZONE 'UTC')::date
  `;
  return Number(rows[0]?.total ?? 0);
}

export async function getRemainingUnitsToday(): Promise<number> {
  const used = await getUsedUnitsToday();
  return Math.max(0, WORDSTAT_DAILY_QUOTA - used);
}

/**
 * Reserve units before making an API call.
 * Throws QuotaExceededError if the call would push us over the daily limit.
 */
export async function reserveUnits(
  endpoint: WordstatEndpointV3,
  multiplier: number = 1,
): Promise<{ unitsReserved: number; unitsRemaining: number }> {
  const cost = WORDSTAT_ENDPOINT_COSTS[endpoint] * multiplier;

  if (cost === 0) {
    await recordUsage(endpoint, 0);
    const remaining = await getRemainingUnitsToday();
    return { unitsReserved: 0, unitsRemaining: remaining };
  }

  const used = await getUsedUnitsToday();
  const remaining = WORDSTAT_DAILY_QUOTA - used;

  if (cost > remaining) {
    throw new QuotaExceededError(endpoint, cost, remaining);
  }

  await recordUsage(endpoint, cost);

  const newUsed = used + cost;
  if (newUsed >= WORDSTAT_DAILY_QUOTA * 0.8 && used < WORDSTAT_DAILY_QUOTA * 0.8) {
    logger.warn(
      'DEMAND_QUOTA',
      `Crossed 80% of daily Wordstat quota: ${newUsed}/${WORDSTAT_DAILY_QUOTA}u`,
    );
  }

  return { unitsReserved: cost, unitsRemaining: remaining - cost };
}

async function recordUsage(endpoint: WordstatEndpointV3, units: number): Promise<void> {
  await sql`
    INSERT INTO demand_quota_log (log_date, endpoint, units_used, request_count, last_used_at)
    VALUES ((NOW() AT TIME ZONE 'UTC')::date, ${endpoint}, ${units}, 1, NOW())
    ON CONFLICT (log_date, endpoint)
    DO UPDATE SET
      units_used    = demand_quota_log.units_used    + EXCLUDED.units_used,
      request_count = demand_quota_log.request_count + 1,
      last_used_at  = NOW()
  `;
}

/**
 * Roll back a reservation when the API call failed.
 */
export async function refundUnits(
  endpoint: WordstatEndpointV3,
  units: number,
): Promise<void> {
  if (units <= 0) return;
  await sql`
    UPDATE demand_quota_log
    SET units_used = GREATEST(0, units_used - ${units})
    WHERE log_date = (NOW() AT TIME ZONE 'UTC')::date AND endpoint = ${endpoint}
  `;
}

export interface QuotaSnapshot {
  date: string;
  total_used: number;
  total_remaining: number;
  by_endpoint: Array<{
    endpoint: string;
    units_used: number;
    request_count: number;
  }>;
}

export async function getQuotaSnapshot(): Promise<QuotaSnapshot> {
  const rows = await sql<Array<{
    endpoint: string;
    units_used: string;
    request_count: string;
  }>>`
    SELECT endpoint, units_used::text, request_count::text
    FROM demand_quota_log
    WHERE log_date = (NOW() AT TIME ZONE 'UTC')::date
    ORDER BY endpoint
  `;

  const total_used = rows.reduce((s, r) => s + Number(r.units_used), 0);

  return {
    date: new Date().toISOString().slice(0, 10),
    total_used,
    total_remaining: Math.max(0, WORDSTAT_DAILY_QUOTA - total_used),
    by_endpoint: rows.map((r) => ({
      endpoint: r.endpoint,
      units_used: Number(r.units_used),
      request_count: Number(r.request_count),
    })),
  };
}
