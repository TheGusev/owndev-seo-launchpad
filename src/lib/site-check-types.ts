/**
 * Frontend mirror of owndev-backend/src/types/siteCheck.ts.
 * Keep both files in sync — this is the single source of truth contract
 * between Site Check pipeline and UI.
 */

export type ScanMode = 'page' | 'site';
export type ScanStatus = 'pending' | 'running' | 'done' | 'error';
export type PaymentStatus = 'pending' | 'paid' | 'failed';
export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IssueModule =
  | 'technical'
  | 'content'
  | 'direct'
  | 'competitors'
  | 'semantics'
  | 'schema'
  | 'ai';

export interface IssueCard {
  id: string;
  module: IssueModule;
  severity: IssueSeverity;
  title: string;
  found: string;
  location: string;
  why_it_matters: string;
  how_to_fix: string;
  example_fix: string;
  visible_in_preview: boolean;
  /** Always returned by backend (default: severity-based fallback). Optional on FE for legacy compat. */
  impact_score?: number;
  docs_url?: string;
  is_auto_fixable?: boolean;
  rule_id?: string;
}

export interface CriterionResult {
  key: string;
  weight: number;
  earned: number;
  status: 'pass' | 'fail' | 'partial';
}

export interface ScoreBreakdown {
  seo?: CriterionResult[] | null;
  ai?: CriterionResult[] | null;
  direct?: CriterionResult[] | null;
  schema?: CriterionResult[] | null;
}

export interface ScanScores {
  total: number;
  seo: number;
  direct: number;
  schema: number;
  ai: number;
  confidence?: number | null;
  issues_count?: number | null;
  breakdown?: ScoreBreakdown | null;
}

export interface KeywordEntry {
  phrase?: string;
  /** Legacy alias used by some FE callers */
  keyword?: string;
  cluster?: string;
  intent?: string;
  frequency?: number;
  /** Legacy alias used by some FE callers */
  volume?: number;
  landing_needed?: boolean;
  verified?: boolean;
  suggestions?: string[];
}

export interface MinusWord {
  word: string;
  type: string;
  reason: string;
}

export interface CompetitorEntry {
  _type?: 'competitor' | 'comparison_table' | 'direct_meta' | 'direct_ad_meta';
  url?: string;
  position?: number;
  domain?: string;
  title?: string;
  description?: string;
  ad_headline?: string;
  ad_suggestion?: any;
  readiness_score?: number;
  direct_checks?: any;
  autotargeting_categories?: Record<string, boolean>;
  [key: string]: unknown;
}

export interface SeoData {
  title?: string;
  titleLength?: number;
  description?: string;
  descriptionLength?: number;
  h1?: string;
  h1Count?: number;
  h2Count?: number;
  h3Count?: number;
  wordCount?: number;
  canonical?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  ogImage?: string | null;
  lang?: string | null;
  imagesTotal?: number;
  imagesWithoutAlt?: number;
  hasSchema?: boolean;
  schemaTypes?: string[];
  hasFaq?: boolean;
  hasLlmsTxt?: boolean;
  hasViewport?: boolean;
  loadTimeMs?: number;
  httpStatus?: number;
  hasRobotsTxt?: boolean;
  hasSitemap?: boolean;
  direct_checks?: any;
  [key: string]: unknown;
}

/** Response shape of GET /api/v1/site-check/result/:scanId */
export interface SiteCheckResult {
  id: string;
  scan_id: string;
  url: string;
  mode: ScanMode | string;
  status: ScanStatus | string;
  progress_pct: number;

  scores: ScanScores | null;
  score?: number | null;
  summary?: string | null;
  issues: IssueCard[];
  blocks?: unknown[];

  theme: string | null;
  competitors: CompetitorEntry[];
  keywords: KeywordEntry[];
  minus_words: (MinusWord | string)[];
  seo_data: SeoData | null;

  llm_judge?: any | null;
  ai_boost?: { items?: any[] } | null;

  result?: any | null;
  raw_scores?: any | null;

  is_spa: boolean;
  error_message: string | null;
  created_at: string;
}

/** Legacy summary type used by older payment flow */
export interface Scan {
  scan_id: string;
  url: string;
  mode: ScanMode;
  status: ScanStatus;
  created_at: string;
  scores: ScanScores;
  issues: IssueCard[];
  theme: string;
  competitors: CompetitorEntry[];
  keywords: KeywordEntry[];
  minus_words: string[];
  expires_at: string;
}

export interface Report {
  report_id: string;
  scan_id: string;
  email: string;
  payment_status: PaymentStatus;
  payment_id: string;
  download_token: string;
  created_at: string;
}
