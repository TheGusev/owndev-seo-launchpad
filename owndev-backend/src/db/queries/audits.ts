import { pool } from '../client.js';
import type { AuditRecord, AuditResult } from '../../types/audit.js';

export async function insertAudit(domainId: string, userId: string | null): Promise<string> {
  const { rows } = await pool.query(
    `INSERT INTO audits (domain_id, user_id) VALUES ($1, $2) RETURNING id`,
    [domainId, userId],
  );
  return rows[0].id;
}

export async function updateAuditResult(id: string, result: AuditResult): Promise<void> {
  await pool.query(
    `UPDATE audits SET status = 'done', result = $2, finished_at = now() WHERE id = $1`,
    [id, JSON.stringify(result)],
  );
}

export async function setAuditError(id: string, error: string): Promise<void> {
  await pool.query(
    `UPDATE audits SET status = 'error', result = $2, finished_at = now() WHERE id = $1`,
    [id, JSON.stringify({ error })],
  );
}

export async function getAuditById(id: string): Promise<AuditRecord | null> {
  const { rows } = await pool.query(`SELECT * FROM audits WHERE id = $1`, [id]);
  return rows[0] ?? null;
}

export async function listAuditsByDomain(domainId: string, limit = 20): Promise<AuditRecord[]> {
  const { rows } = await pool.query(
    `SELECT * FROM audits WHERE domain_id = $1 ORDER BY created_at DESC LIMIT $2`,
    [domainId, limit],
  );
  return rows;
}
