import { pool } from '../client.js';
import type { Domain } from '../../types/domain.js';

export async function insertDomain(url: string): Promise<string> {
  const { rows } = await pool.query(
    `INSERT INTO domains (url) VALUES ($1) ON CONFLICT (url) DO UPDATE SET url = EXCLUDED.url RETURNING id`,
    [url],
  );
  return rows[0].id;
}

export async function getDomainByUrl(url: string): Promise<Domain | null> {
  const { rows } = await pool.query(`SELECT * FROM domains WHERE url = $1`, [url]);
  return rows[0] ?? null;
}

export async function updateLastAudit(domainId: string): Promise<void> {
  await pool.query(`UPDATE domains SET last_audit_at = now() WHERE id = $1`, [domainId]);
}
