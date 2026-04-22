/**
 * Legacy audit types — оставлены для обратной совместимости с модулями
 * src/db/queries/audits.ts и src/services/LlmsService.ts (старая система audits/audit_results).
 * Новый Site Check pipeline (Sprint 3+) использует scans + scan_rules и не зависит от этих типов.
 */

export type AuditStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface AuditIssue {
  id?: string;
  rule_id?: string;
  module: string;
  type?: string;
  category?: string;
  message?: string;
  fix?: string;
  description?: string;
  detail?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  found?: string;
  location?: string;
  why_it_matters?: string;
  how_to_fix?: string;
  example_fix?: string;
  visible_in_preview?: boolean;
  impact_score?: number;
  // Legacy code (LlmsService и т.п.) добавляет произвольные поля
  [key: string]: unknown;
}

export interface AuditResult {
  url: string;
  scores?: Record<string, number>;
  issues?: AuditIssue[];
  meta?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface AuditRecord {
  id: string;
  domain_id: string;
  status: AuditStatus;
  url: string;
  score?: number | null;
  confidence?: number | null;
  duration_ms?: number | null;
  error_msg?: string | null;
  created_at: string;
  updated_at: string;
}
