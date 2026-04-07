/**
 * Unified API types for OWNDEV platform.
 * These provide a common contract across all tools.
 */

export type ToolId =
  | 'seo-audit'
  | 'site-check'
  | 'brand-tracker'
  | 'indexation'
  | 'semantic-core'
  | 'text-generator'
  | 'content-brief'
  | 'internal-links'
  | 'competitor-analysis'
  | 'schema-generator'
  | 'pseo-generator'
  | 'llm-prompt-helper'
  | 'position-monitor'
  | 'anti-duplicate'
  | 'mcp-server';

export type IssuePriority = 'P1' | 'P2' | 'P3';

export interface AuditIssue {
  type: string;
  severity: string;
  message: string;
  detail: string;
  category?: string;
  recommendation?: string;
  priority?: IssuePriority;
}

export interface AuditResult {
  score: number;
  confidence: number;
  summary: string;
  issues: AuditIssue[];
  meta: Record<string, any>;
}

export interface ConfidenceMeta {
  model: string;
  timestamp: number;
}

export interface SourceMeta {
  tool: ToolId;
  version: string;
}
