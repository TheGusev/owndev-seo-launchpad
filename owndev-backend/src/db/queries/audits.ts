import { sql } from '../client.js';
import type { AuditRecord, AuditResult, AuditStatus } from '../../types/audit.js';

interface CreateAuditData {
  domainId: string | null;
  userId: string | null;
  url: string;
  toolId?: string;
}

export async function createAudit(data: CreateAuditData): Promise<string> {
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO audits (domain_id, user_id, url, tool_id)
    VALUES (${data.domainId}, ${data.userId}, ${data.url}, ${data.toolId ?? null})
    RETURNING id
  `;
  return row.id;
}

export async function updateAuditStatus(
  id: string,
  status: AuditStatus,
  meta?: { score?: number; confidence?: number; durationMs?: number; errorMsg?: string },
): Promise<void> {
  await sql`
    UPDATE audits SET
      status = ${status},
      score = COALESCE(${meta?.score ?? null}, score),
      confidence = COALESCE(${meta?.confidence ?? null}, confidence),
      duration_ms = COALESCE(${meta?.durationMs ?? null}, duration_ms),
      error_msg = COALESCE(${meta?.errorMsg ?? null}, error_msg),
      finished_at = CASE WHEN ${status} IN ('done', 'error') THEN NOW() ELSE finished_at END
    WHERE id = ${id}
  `;
}

export async function saveAuditResult(auditId: string, result: AuditResult): Promise<void> {
  await sql`
    INSERT INTO audit_results (audit_id, result)
    VALUES (${auditId}, ${sql.json(result)})
    ON CONFLICT (audit_id) DO UPDATE SET result = EXCLUDED.result, created_at = NOW()
  `;
}

export async function getAuditById(id: string): Promise<(AuditRecord & { result?: AuditResult }) | null> {
  const [row] = await sql<(AuditRecord & { result?: AuditResult })[]>`
    SELECT a.*, ar.result
    FROM audits a
    LEFT JOIN audit_results ar ON ar.audit_id = a.id
    WHERE a.id = ${id}
  `;
  return row ?? null;
}

export async function getAuditsByDomain(hostname: string, limit = 20): Promise<AuditRecord[]> {
  return sql<AuditRecord[]>`
    SELECT a.* FROM audits a
    JOIN domains d ON d.id = a.domain_id
    WHERE d.hostname = ${hostname}
    ORDER BY a.created_at DESC
    LIMIT ${limit}
  `;
}
