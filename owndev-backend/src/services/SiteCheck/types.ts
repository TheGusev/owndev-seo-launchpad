/**
 * SiteCheck — public types (Phase 4 / Pass 2).
 *
 * Это единый source of truth для всех публичных интерфейсов SiteCheck. Монолит
 * services/SiteCheckPipeline.ts импортирует эти типы обратно — то есть структуры
 * физически живут здесь, а не в pipeline-файле. Все consumer'ы (Worker, Audit
 * Mode v2, frontend ScoreCards/IssueCard, БД-колонка site_check_scans.result)
 * должны импортировать через ./SiteCheck/types.js или ./SiteCheck/index.js.
 *
 * Шаг 1 из REFACTOR_PLAN.md выполнен: типы вынесены, но реализация runPipeline
 * + audits + extractors всё ещё в монолите. Шаги 2-7 (utils → llm → extractors
 * → scoring → audits → pipeline) будут выполняться в отдельных PR'ах с
 * прохождением `npm run build` после каждого.
 *
 * НЕ ИЗМЕНЯТЬ shape'ы без согласования: SiteCheckWorker, frontend и JSONB
 * колонка site_check_scans.result завязаны на эти контракты.
 */

// ─── Issue ────────────────────────────────────────────────────────
export interface Issue {
  id: string;
  module: string;
  severity: string;
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

// ─── Stage 0 / redirects ──────────────────────────────────────────
export interface RedirectHop {
  from: string;
  to: string;
  status: number;
}

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
  compression: 'br' | 'gzip' | 'deflate' | 'none';
  cacheControl: string | null;
  server: string | null;
  poweredBy: string | null;
}

// ─── Robots ───────────────────────────────────────────────────────
export interface RobotsBotEntry {
  bot: string;
  allowed: boolean;
  rule: string;
}

export interface RobotsData {
  exists: boolean;
  status: number;
  size: number;
  hasSitemap: boolean;
  sitemapUrls: string[];
  bots: RobotsBotEntry[];
  errors: string[];
}

// ─── Sitemap ──────────────────────────────────────────────────────
export interface SitemapData {
  exists: boolean;
  status: number;
  isIndex: boolean;
  urlCount: number;
  hasLastmod: boolean;
  avgLastmodDaysAgo: number | null;
  oldestPage: string | null;
  newestPage: string | null;
  stalePagesCount: number;
  errors: string[];
}

// ─── llms.txt ─────────────────────────────────────────────────────
export interface LlmsTxtData {
  exists: boolean;
  status: number;
  size: number;
  hasH1: boolean;
  hasBlockquote: boolean;
  hasH2: boolean;
  hasLinks: boolean;
  qualityScore: number; // 0-100
  missingElements: string[];
  hasLlmsFull: boolean;
  hasSecurityTxt: boolean;
}

// ─── Resources ────────────────────────────────────────────────────
export interface ResourcesData {
  blockingCss: number;
  blockingJs: number;
  htmlSizeKB: number;
  modernImageRatio: number; // 0-1, share of webp/avif vs total <img>
  lazyImagesRatio: number; // 0-1
  fontDisplaySwap: boolean;
  preloadHints: number;
  totalImages: number;
}

// ─── GEO signals ──────────────────────────────────────────────────
export interface GeoSignalsData {
  citationReadyRatio: number; // 0-1: avg, sentence-clear ratio
  semanticScore: number; // 0-100 weighted semantic tag presence
  semanticTags: {
    article: boolean;
    section: boolean;
    main: boolean;
    nav: boolean;
    aside: boolean;
    figure: boolean;
  };
  questionHeadingRatio: number; // 0-1: H2/H3 in question form
  readabilityGrade: number; // approx (avg sentence length proxy)
  avgWordsPerSentence: number;
  authorityLinks: number; // outgoing https links count
  paragraphCount: number;
}

// ─── CRO ──────────────────────────────────────────────────────────
export interface CROData {
  trustScore: number; // 0-100
  trust: {
    hasPhone: boolean;
    hasEmail: boolean;
    hasAddress: boolean;
    hasLegalInfo: boolean;
    hasGuarantee: boolean;
  };
  cta: { count: number; aboveFold: boolean; hasPrimary: boolean };
  forms: { count: number; avgFields: number; hasContactForm: boolean };
  pricing: { hasPrice: boolean; hasCalculator: boolean };
  socialProof: { hasReviews: boolean; hasCases: boolean; hasLogos: boolean };
  urgency: { hasCountdown: boolean; hasLimited: boolean };
  channels: { hasMessenger: boolean; hasCallback: boolean; hasChat: boolean };
}

// ─── Benchmark ────────────────────────────────────────────────────
export interface BenchmarkGap {
  key: string;
  expected: string | number;
  actual: string | number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

export interface BenchmarkData {
  category: string;
  gaps: BenchmarkGap[];
  passed: number;
  total: number;
  percent: number;
}

// ─── Pipeline result ──────────────────────────────────────────────
export interface PipelineResult {
  status: 'done' | 'error';
  url: string;
  mode: string;
  theme: string;
  is_spa: boolean;
  // SPA Detection v2 — диагностика решения о Jina-рендере.
  spa_score?: number;
  spa_signals?: {
    wordCount: number;
    hasAppRoot: boolean;
    hasFrameworkBundle: boolean;
    hasServerRendered: boolean;
    bodyTextRatio: number;
    mainEmpty: boolean;
    viteMarker: boolean;
  };
  rendered_source?: 'origin' | 'jina';
  spa_render_failed?: boolean;
  scores: {
    total: number;
    seo: number;
    direct: number;
    schema: number;
    ai: number;
    breakdown?: any;
  };
  // Sprint 3 — три честных скора:
  geoScore: number;
  seoScore: number;
  croScore: number;
  scoresBreakdown?: {
    geo: Array<{ key: string; weight: number; earned: number }>;
    seo: Array<{ key: string; weight: number; earned: number }>;
    cro: Array<{ key: string; weight: number; earned: number }>;
  };
  // Sprint 3 — структурированные данные:
  stage0?: Stage0Data;
  robots?: RobotsData;
  sitemap?: SitemapData;
  llmsTxt?: LlmsTxtData;
  resources?: ResourcesData;
  geoSignals?: GeoSignalsData;
  cro?: CROData;
  benchmark?: BenchmarkData;
  issues: Issue[];
  seo_data: any;
  summary?: string | null;
  blocks?: any[];
  error_message?: string;
  signals?: Record<string, number | boolean>;
}
