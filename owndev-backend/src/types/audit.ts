export type IssuePriority = 'P1' | 'P2' | 'P3';
export type AuditStatus = 'pending' | 'processing' | 'done' | 'error';

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

export interface AuditBlock {
  name: string;
  score: number;
  weight: number;
  issues: AuditIssue[];
}

export interface AuditResult {
  score: number;
  confidence: number;
  summary: string;
  issues: AuditIssue[];
  blocks: AuditBlock[];
  meta: Record<string, unknown>;
}

export interface AuditRecord {
  id: string;
  domain_id: string | null;
  user_id: string | null;
  url: string;
  tool_id: string | null;
  status: AuditStatus;
  score: number | null;
  confidence: number | null;
  duration_ms: number | null;
  error_msg: string | null;
  created_at: string;
  finished_at: string | null;
}

export interface CrawlData {
  url: string;
  finalUrl: string;
  statusCode: number;
  headers: Record<string, string>;
  html: string;
  renderedHtml: string;
  title: string;
  metaTags: Record<string, string>;
  links: Array<{ href: string; rel?: string; text?: string }>;
  scripts: string[];
  schemas: object[];
  robots: { index: boolean; follow: boolean; rawContent?: string };
  llmsTxt: { found: boolean; content?: string; url?: string };
  duration_ms: number;
  error?: string;
}
