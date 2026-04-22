/**
 * Single source of truth for the Site Check result contract.
 *
 * IMPORTANT: This file is mirrored on the frontend at
 *   src/lib/site-check-types.ts
 *
 * Any change here MUST be reflected in the frontend file (and vice versa).
 * The pipeline (`SiteCheckPipeline.ts`) and route (`siteCheck.ts`) MUST
 * conform to `SiteCheckResult` so that the frontend never receives
 * fields in unexpected shapes.
 */

export type ScanMode = 'page' | 'site';
export type ScanStatus = 'pending' | 'running' | 'done' | 'error';
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
  impact_score: number;
  docs_url: string;
  is_auto_fixable: boolean;
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
  /** Optional confidence interval, may be null */
  confidence?: number | null;
  /** Optional issues count cached at write time */
  issues_count?: number | null;
  breakdown?: ScoreBreakdown | null;
}

export interface KeywordEntry {
  phrase: string;
  cluster: string;
  intent: string;
  frequency: number;
  landing_needed: boolean;
  verified?: boolean;
  suggestions?: string[];
}

export interface MinusWord {
  word: string;
  type: string;
  reason: string;
}

/**
 * Competitors array is heterogeneous: it contains real competitor entries
 * plus several "meta" envelopes (`_type: 'comparison_table' | 'direct_meta'
 * | 'direct_ad_meta' | 'competitor'`). The frontend filters by `_type`.
 */
export interface CompetitorEntry {
  _type?: 'competitor' | 'comparison_table' | 'direct_meta' | 'direct_ad_meta';
  // Common competitor fields (when _type === 'competitor' or undefined)
  url?: string;
  position?: number;
  domain?: string;
  title?: string;
  description?: string;
  // Direct ad meta fields
  ad_headline?: string;
  ad_suggestion?: unknown;
  readiness_score?: number;
  direct_checks?: unknown;
  autotargeting_categories?: Record<string, boolean>;
  // free-form for forward compatibility
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
  direct_checks?: unknown;
  [key: string]: unknown;
}

/** Shape returned by GET /api/v1/site-check/result/:scanId */
export interface SiteCheckResult {
  id: string;
  scan_id: string;
  url: string;
  mode: ScanMode | string;
  status: ScanStatus | string;
  progress_pct: number;

  scores: ScanScores | null;
  /** Convenience alias of scores.total */
  score?: number | null;

  summary?: string | null;
  issues: IssueCard[];
  blocks?: unknown[];

  theme: string | null;
  competitors: CompetitorEntry[];
  keywords: KeywordEntry[];
  minus_words: MinusWord[];
  seo_data: SeoData | null;

  llm_judge?: unknown | null;
  ai_boost?: { items?: unknown[] } | null;

  /** Raw pipeline result blob, kept for forward compatibility */
  result?: unknown | null;
  /** Raw scores from DB before normalization */
  raw_scores?: unknown | null;

  is_spa: boolean;
  error_message: string | null;
  created_at: string;
}

/** Shape returned directly by the pipeline (before route normalization) */
export interface PipelineResult {
  status: 'done' | 'error';
  url: string;
  mode: string;
  theme: string;
  is_spa: boolean;
  scores: ScanScores;
  issues: IssueCard[];
  competitors: CompetitorEntry[];
  keywords: KeywordEntry[];
  minus_words: MinusWord[];
  seo_data: SeoData | null;
  summary?: string | null;
  blocks?: unknown[];
  error_message?: string;
  signals?: Record<string, number | boolean>;
}