/**
 * Site Formula V3 — public types.
 *
 * V3 builds on V2 (migration 020) and adds:
 *   • Tier classification (A/B/C) on project types
 *   • 4 new special verticals (promo_event, personal_brand, franchise_multi, b2b_media)
 *   • Demand intelligence (Yandex Wordstat clusters, geo distribution, quota log)
 *   • Page contracts v2 (intro_answer/H1≤35/Title≤60/FAQ≥5/commercial_signals)
 *   • Schema registry (graph builder, vertical variants, rich-results validation)
 *   • Technical passport (llms.txt, robots.txt AI bots, dataLayer, headers, .well-known/ai.txt)
 *   • Preflight P0/P1/P2 with 4 axes (SEO≥85, Direct≥90, Schema=100, AI/LLM≥85)
 *   • Conversion auditors (cta, trust signals, form flow)
 *   • Developer Pack v2 (super_prompt_pack JSON-Schema-validated, 3 export modes)
 *   • Pipeline orchestrator with 6 BullMQ workers
 */

import type { ProjectGroupCode, PageContract, SchemaTemplate } from './formulaV2.js';

// ─── Tiers ────────────────────────────────────────────────────
export type ProjectTier = 'A' | 'B' | 'C';

export const TIER_LABELS: Record<ProjectTier, string> = {
  A: 'Web / SEO-driven',
  B: 'App-driven',
  C: 'Special vertical',
};

// ─── V3 project type codes (V2 + 4 new) ──────────────────────
export type ProjectTypeCodeV3 =
  // Tier A — Web/SEO-driven
  | 'service_geo'
  | 'service_pro'
  | 'service_b2b'
  | 'ecommerce'
  | 'marketplace'
  | 'saas'
  | 'education'
  | 'medical'
  | 'legal'
  | 'realestate'
  // Tier B — App-driven
  | 'mobile_app'
  // Tier C — Special verticals (existing)
  | 'finance'
  | 'hospitality'
  | 'events'
  | 'nonprofit'
  | 'gov'
  | 'portfolio'
  | 'media'
  | 'blog'
  // Tier C — V3-new
  | 'promo_event'
  | 'personal_brand'
  | 'franchise_multi'
  | 'b2b_media'
  // Tier A — подкатегории service_geo (PR-10)
  | 'service_pest_control'
  | 'service_repair_home'
  | 'service_auto'
  | 'service_beauty';

/**
 * Runtime-массив всех 27 кодов V3.
 *
 * ИСТОЧНИК ИСТИНЫ для zod.enum, фронт-каталога и self-test матрицы.
 * Если добавляете новую нишу — продлевайте оба: тип `ProjectTypeCodeV3`
 * и этот массив. TS-проверка `_assertCoverage` ниже сломает билд,
 * если массив разъедется с типом.
 */
export const PROJECT_TYPE_CODES_V3 = [
  // Tier A — Web/SEO-driven
  'service_geo', 'service_pro', 'service_b2b', 'ecommerce', 'marketplace',
  'saas', 'education', 'medical', 'legal', 'realestate',
  // Tier B — App-driven
  'mobile_app',
  // Tier C — Special verticals (existing)
  'finance', 'hospitality', 'events', 'nonprofit', 'gov', 'portfolio',
  'media', 'blog',
  // Tier C — V3-new
  'promo_event', 'personal_brand', 'franchise_multi', 'b2b_media',
  // Tier A — подкатегории service_geo (PR-10)
  'service_pest_control', 'service_repair_home', 'service_auto', 'service_beauty',
] as const satisfies readonly ProjectTypeCodeV3[];

// Compile-time страховка: тип ⊆ массив (если в типе появится новый код,
// а в массиве нет — TS-билд упадёт здесь).
type _AssertProjectTypeCodesCoverage =
  Exclude<ProjectTypeCodeV3, (typeof PROJECT_TYPE_CODES_V3)[number]> extends never
    ? true
    : never;
const _assertCoverage: _AssertProjectTypeCodesCoverage = true;
void _assertCoverage;

// V3 engine module names (used in formula_project_types.engine_modules)
export type EngineModule =
  | 'intake'
  | 'demand'
  | 'strategy'
  | 'pageContracts'
  | 'schemaRegistry'
  | 'technicalPassport'
  | 'conversion'
  | 'preflight'
  | 'crawl'
  | 'audit'
  | 'developerPack';

export interface ProjectTypeV3 {
  code: ProjectTypeCodeV3;
  name_ru: string;
  name_en: string;
  group_code: ProjectGroupCode;
  description: string | null;
  default_intents: string[];
  default_layers: string[];
  required_schemas: string[];
  is_active: boolean;
  sort_order: number;
  tier: ProjectTier;
  tier_reason: string | null;
  engine_modules: EngineModule[];
}

// ─── Demand Intelligence (M1) ────────────────────────────────
export type WordstatEndpoint =
  | 'topRequests'
  | 'getDynamics'
  | 'getRegionsDistribution'
  | 'getRegionsTree';

export interface DemandQuotaUsage {
  endpoint: WordstatEndpoint;
  units_used: number;
  units_limit: number;
  date: string; // YYYY-MM-DD UTC
}

export interface DemandCluster {
  id: string;
  session_id: string;
  cluster_label: string;
  intent: 'informational' | 'commercial' | 'transactional' | 'navigational' | 'local';
  seed_keyword: string;
  keywords: Array<{ phrase: string; frequency: number; trend?: number }>;
  total_frequency: number;
  recommended_page_type: string;
  recommended_url_pattern: string;
  created_at: string;
}

export interface DemandGeoPoint {
  region_code: string;          // e.g. '1' Moscow, '213' Moscow city, '2' SPb
  region_name_ru: string;
  affinity_index: number;       // % share of total volume
  absolute_frequency: number;
  is_recommended_geo: boolean;
}

// ─── Page Contracts V2 (M3) ──────────────────────────────────
export interface PageContractV3 extends PageContract {
  // V3 hard limits (P0)
  h1_max_chars: number;             // default 35
  title_max_chars: number;          // default 60
  intro_answer_words_min: number;   // default 40
  intro_answer_words_max: number;   // default 80
  faq_min_items: number;            // default 5

  // Commercial signals (Tier A pages must have these)
  required_commercial_signals: string[];
  // e.g. ['price_block','contacts_block','reviews_block','case_study_block','guarantee_block']

  // V3 schema graph requirements
  schema_graph_root: string;        // 'Service' | 'Product' | 'Article' | ...
  schema_graph_required: string[];  // e.g. ['LocalBusiness','Service','FAQPage','BreadcrumbList']
}

// ─── Schema Registry (M4) ────────────────────────────────────
export interface SchemaGraph {
  '@context': string;
  '@graph': Array<Record<string, any>>;
}

export interface RichResultsValidation {
  schema_type: string;
  is_valid: boolean;
  errors: Array<{ path: string; message: string; severity: 'error' | 'warning' }>;
  google_rich_eligible: boolean;
  yandex_rich_eligible: boolean;
}

export type SchemaTemplateV3 = SchemaTemplate & {
  vertical_variant?: string;        // e.g. 'medical' | 'legal' | 'restaurant'
  rich_eligible_google?: boolean;
  rich_eligible_yandex?: boolean;
};

// ─── Technical Passport (M5) ─────────────────────────────────
export interface TechnicalPassport {
  llms_txt: string;
  robots_txt: string;
  ai_well_known: string;            // .well-known/ai.txt JSON
  data_layer: Record<string, any>;  // window.dataLayer object
  required_headers: Record<string, string>; // X-Robots-Tag, Cache-Control, ...
  ai_bots_allowed: string[];        // GPTBot, ClaudeBot, ...
  ai_bots_blocked: string[];
}

// ─── Conversion (M6) ────────────────────────────────────────
export interface CtaAuditFinding {
  page_url: string;
  cta_count: number;
  primary_cta_present: boolean;
  cta_above_fold: boolean;
  cta_text_quality: 'strong' | 'medium' | 'weak';
  issues: string[];
}

export interface TrustSignalAudit {
  page_url: string;
  has_phone: boolean;
  has_address: boolean;
  has_legal_info: boolean;          // ИНН/ОГРН для RU
  has_reviews: boolean;
  has_case_studies: boolean;
  has_guarantees: boolean;
  has_certifications: boolean;
  score: number; // 0-100
}

export interface FormFlowAudit {
  page_url: string;
  form_count: number;
  fields_avg: number;
  has_field_validation: boolean;
  has_progress_indicator: boolean;
  has_consent_checkbox: boolean;
  estimated_dropoff: number; // 0-1
}

// ─── Preflight (M7) — 4 axes + P0/P1/P2 ──────────────────────
export type PreflightAxis = 'seo' | 'direct' | 'schema' | 'ai_llm';

export type PreflightSeverity = 'P0' | 'P1' | 'P2';

export interface PreflightRule {
  id: string;
  rule_code: string;            // e.g. 'h1.length.max', 'schema.faq.minItems'
  axis: PreflightAxis;
  severity: PreflightSeverity;
  applies_to_tier: ProjectTier[]; // which tiers this rule applies to
  applies_to_page_types: string[]; // [] = all
  applies_to_project_codes: string[]; // [] = all
  description_ru: string;
  fix_hint_ru: string;
  weight: number;               // contribution to axis score
  is_active: boolean;
}

export interface PreflightFinding {
  rule_id: string;
  rule_code: string;
  axis: PreflightAxis;
  severity: PreflightSeverity;
  page_url: string | null;
  page_type: string | null;
  expected: any;
  actual: any;
  human_message: string;
  fix_hint: string;
}

export interface PreflightAxisScore {
  axis: PreflightAxis;
  score: number;        // 0..100
  threshold: number;    // 85/90/100/85
  passes: boolean;
  findings_p0: number;
  findings_p1: number;
  findings_p2: number;
}

export interface PreflightReportV3 {
  project_type_code: ProjectTypeCodeV3;
  tier: ProjectTier;
  axes: PreflightAxisScore[];
  total_score: number;        // weighted average
  publishable: boolean;       // ALL axes pass their thresholds
  blocking_p0_findings: PreflightFinding[];
  warnings_p1: PreflightFinding[];
  hints_p2: PreflightFinding[];
  generated_at: string;
}

export const PREFLIGHT_AXIS_THRESHOLDS: Record<PreflightAxis, number> = {
  seo: 85,
  direct: 90,
  schema: 100,
  ai_llm: 85,
};

// ─── Developer Pack v2 / Super Prompt Pack (M9) ──────────────
export type PackExportMode = 'full_super_prompt' | 'structured_pack' | 'platform_specific';

export type PackPlatform = 'lovable' | 'cursor' | 'v0' | 'claude_code';

export interface PackArtifact {
  id: string;
  session_id: string;
  export_mode: PackExportMode;
  platform: PackPlatform | null;
  filename: string;
  mime_type: string;
  size_bytes: number;
  storage_url: string | null; // S3-like, or null when persisted as bytea
  validated: boolean;         // ajv-validated against schema
  schema_version: string;
  created_at: string;
}

export interface SuperPromptPack {
  meta: {
    version: string;
    project_code: ProjectTypeCodeV3;
    tier: ProjectTier;
    generated_at: string;
    locale: 'ru' | 'en';
  };
  // Sections (matches docs/super_prompt_pack.schema.json, 10 sections)
  business_passport: Record<string, any>;
  geo_targeting: Record<string, any>;
  demand_clusters: Record<string, any>;
  information_architecture: Record<string, any>;
  page_contracts: Record<string, any>;
  schema_graph: Record<string, any>;
  technical_passport: Record<string, any>;
  conversion_layer: Record<string, any>;
  ai_llm_layer: Record<string, any>;
  developer_handoff: Record<string, any>;
}

// ─── Pipeline Orchestrator (M10) ─────────────────────────────
export type PipelineStage =
  | 'intake'
  | 'demand'
  | 'crawl'
  | 'audit'
  | 'preflight'
  | 'pack';

export interface PipelineStageStatus {
  stage: PipelineStage;
  status: 'queued' | 'running' | 'done' | 'failed' | 'skipped';
  started_at: string | null;
  finished_at: string | null;
  progress_pct: number;
  message: string | null;
  artifact_ids: string[];
}

export interface PipelineRun {
  id: string;
  session_id: string;
  project_code: ProjectTypeCodeV3;
  tier: ProjectTier;
  stages: PipelineStageStatus[];
  current_stage: PipelineStage | null;
  status: 'queued' | 'running' | 'done' | 'failed' | 'cancelled';
  created_at: string;
  finished_at: string | null;
}
