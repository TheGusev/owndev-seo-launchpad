import { sql } from '../client.js';
import type { Monitor } from '../../types/monitor.js';

export async function createMonitor(domainId: string, userId: string, period = 'weekly'): Promise<string> {
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO monitors (domain_id, user_id, period)
    VALUES (${domainId}, ${userId}, ${period})
    RETURNING id
  `;
  return row.id;
}

export async function getMonitorsByUser(userId: string): Promise<Monitor[]> {
  return sql<Monitor[]>`SELECT * FROM monitors WHERE user_id = ${userId} ORDER BY created_at DESC`;
}

export async function getMonitorById(id: string): Promise<Monitor | null> {
  const [m] = await sql<Monitor[]>`SELECT * FROM monitors WHERE id = ${id}`;
  return m ?? null;
}

export async function getDueMonitors(): Promise<Monitor[]> {
  return sql<Monitor[]>`
    SELECT * FROM monitors
    WHERE enabled = true AND (next_run_at IS NULL OR next_run_at <= NOW())
  `;
}

export async function updateMonitorRun(id: string, nextRunAt: Date): Promise<void> {
  await sql`
    UPDATE monitors SET last_run_at = NOW(), next_run_at = ${nextRunAt} WHERE id = ${id}
  `;
}

export async function toggleMonitor(id: string, enabled: boolean): Promise<void> {
  await sql`UPDATE monitors SET enabled = ${enabled} WHERE id = ${id}`;
}
