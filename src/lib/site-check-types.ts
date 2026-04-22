export type ScanMode = "page" | "site";
export type ScanStatus = "pending" | "running" | "done" | "error";
export type PaymentStatus = "pending" | "paid" | "failed";
export type IssueSeverity = "critical" | "high" | "medium" | "low";
export type IssueModule = "technical" | "content" | "schema" | "ai" | "geo" | "cro";

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
  impact_score?: number;
  docs_url?: string;
  is_auto_fixable?: boolean;
  rule_id?: string;
}

export interface ScanScores {
  total: number;
  seo: number;
  direct: number;
  schema: number;
  ai: number;
  // Sprint 3 — три честных скора. Опционально для backwards-compatibility со
  // старыми сохранёнными сканами (где их нет).
  geo?: number;
  cro?: number;
}

// ─── Sprint 3: structured data shapes (mirror of backend/SiteCheck/types) ───

export interface RedirectHop { from: string; to: string; status: number; }

export interface Stage0Data {
  httpStatus: number;
  redirectChain: RedirectHop[];
  redirectCount: number;
  ttfbMs: number;
  isHttps: boolean;
  hasHsts: boolean;
  hasCSP: boolean;
  hasXCTO: boolean;
  hasXFO: boolean;
  compression: string | null;
  cacheControl: string | null;
  server: string | null;
  poweredBy: string | null;
}

export interface RobotsAiBot {
  bot: string;
  allowed: boolean;
  rule: string;
}

export interface RobotsData {
  exists: boolean;
  status: number;
  hasUserAgent?: boolean;
  hasSitemap?: boolean;
  aiBots: RobotsAiBot[];
  blockedAiBots: number;
  allowedAiBots: number;
}

export interface SitemapData {
  exists: boolean;
  status: number;
  urlCount: number;
  hasLastmod: boolean;
  avgLastmodDaysAgo: number | null;
  oldestPage: string | null;
  newestPage: string | null;
  stalePages: number;
  indexSitemapOnly: boolean;
}

export interface LlmsTxtData {
  exists: boolean;
  status: number;
  hasFull: boolean;
  qualityScore: number;
  missingElements: string[];
  size: number;
}

export interface ResourcesData {
  blockingCss: number;
  blockingJs: number;
  htmlSizeKB: number;
  modernImageRatio: number;
  lazyImages: number;
  fontDisplaySwap: boolean;
  preloadHints: number;
}

export interface GeoSignalsData {
  citationReadyRatio: number;
  semanticScore: number;
  semanticTags: string[];
  questionHeadingRatio: number;
  readabilityGrade: number;
  avgWordsPerSentence: number;
  authorityLinks: number;
  paragraphCount: number;
}

export interface CROData {
  trustScore: number;
  trust: { hasPhone: boolean; hasEmail: boolean; hasAddress: boolean; hasLegalInfo: boolean; hasGuarantee: boolean };
  cta: { count: number; hasAboveFold: boolean };
  forms: { count: number; avgFields: number };
  price: { hasPrice: boolean };
  socialProof: { hasReviews: boolean; hasLogos: boolean };
  urgency: { hasUrgency: boolean };
  channels: { hasMessenger: boolean; hasChat: boolean; hasCallback: boolean };
}

export interface BenchmarkGap {
  key: string;
  expected: string | number;
  actual: string | number;
  severity: IssueSeverity;
}

export interface BenchmarkData {
  category: string;
  gaps: BenchmarkGap[];
  passed: number;
  total: number;
}

export interface ScoreBreakdownEntry { key: string; weight: number; earned: number; }

export interface FullScanResponse {
  id: string;
  scan_id: string;
  url: string;
  mode: ScanMode;
  status: ScanStatus;
  progress_pct: number;

  scores: ScanScores & {
    confidence?: number | null;
    issues_count?: number | null;
    breakdown?: unknown;
    blocks?: unknown[];
  };
  score: number | null;
  summary: string | null;
  issues: IssueCard[];
  blocks: unknown[];
  theme: string | null;
  seo_data: Record<string, unknown> | null;
  llm_judge: unknown;
  ai_boost: unknown;

  // Sprint 3 fields
  geoScore: number | null;
  seoScore: number | null;
  croScore: number | null;
  scoresBreakdown: {
    geo: ScoreBreakdownEntry[];
    seo: ScoreBreakdownEntry[];
    cro: ScoreBreakdownEntry[];
  } | null;
  stage0: Stage0Data | null;
  robots: RobotsData | null;
  sitemap: SitemapData | null;
  llmsTxt: LlmsTxtData | null;
  resources: ResourcesData | null;
  geoSignals: GeoSignalsData | null;
  cro: CROData | null;
  benchmark: BenchmarkData | null;
  signals: Record<string, number | boolean> | null;

  is_spa: boolean;
  error_message: string | null;
  created_at: string;
}

export interface Scan {
  scan_id: string;
  url: string;
  mode: ScanMode;
  status: ScanStatus;
  created_at: string;
  scores: ScanScores;
  issues: IssueCard[];
  theme: string;
  competitors: { url: string; scores: ScanScores }[];
  keywords: { keyword: string; volume: number; cluster: string }[];
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
