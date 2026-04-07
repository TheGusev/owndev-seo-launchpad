/** Совместимы с фронтовыми типами из src/lib/api/types.ts */

export type IssuePriority = 'P1' | 'P2' | 'P3';

export interface AuditIssue {
  type: string;
  severity: string;
  message: string;
  detail: string;
  category?: string;
  recommendation?: string;
  priority?: IssuePriority;
  confidence?: number;
  source?: string;
}

export interface AuditResult {
  score: number;
  confidence: number;
  summary: string;
  issues: AuditIssue[];
  meta: Record<string, unknown>;
}

export type AuditStatus = 'pending' | 'processing' | 'done' | 'error';

export interface AuditRecord {
  id: string;
  domain_id: string;
  user_id: string | null;
  status: AuditStatus;
  result: AuditResult | null;
  created_at: string;
  finished_at: string | null;
}
