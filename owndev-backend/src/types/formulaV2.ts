/**
 * Formula v2 — public types.
 *
 * Backed by migration 020 tables: formula_project_types, formula_page_contracts,
 * formula_schema_templates, formula_jobs.
 */

// ─── Project types ────────────────────────────────────────────
export type ProjectTypeCode =
  | 'service_geo'
  | 'service_pro'
  | 'service_b2b'
  | 'ecommerce'
  | 'marketplace'
  | 'saas'
  | 'mobile_app'
  | 'media'
  | 'blog'
  | 'education'
  | 'medical'
  | 'legal'
  | 'finance'
  | 'realestate'
  | 'hospitality'
  | 'events'
  | 'nonprofit'
  | 'gov'
  | 'portfolio';

export type ProjectGroupCode =
  | 'services'
  | 'ecommerce'
  | 'tech'
  | 'content'
  | 'education'
  | 'health'
  | 'commerce'
  | 'org';

export interface ProjectType {
  code: ProjectTypeCode;
  name_ru: string;
  name_en: string;
  group_code: ProjectGroupCode;
  description: string | null;
  default_intents: string[];
  default_layers: string[];
  required_schemas: string[];
  is_active: boolean;
  sort_order: number;
}

// ─── Page contracts ───────────────────────────────────────────
export interface PageContract {
  id: string;
  project_type_code: ProjectTypeCode;
  page_type: string;
  version: string;
  required_h1_pattern: string | null;
  required_title_pattern: string | null;
  required_meta_desc_min: number;
  required_meta_desc_max: number;
  required_schemas: string[];
  required_blocks: string[];
  forbidden_blocks: string[];
  min_word_count: number;
  recommended_blocks: string[];
  recommended_schemas: string[];
  must_be_indexable: boolean;
  must_be_in_sitemap: boolean;
  canonical_required: boolean;
  notes_ru: string | null;
  is_active: boolean;
}

// ─── Schema templates ─────────────────────────────────────────
export interface SchemaTemplate {
  id: string;
  schema_type: string;
  variant: string;
  version: string;
  template_json: Record<string, any>;
  required_vars: string[];
  optional_vars: string[];
  description_ru: string | null;
  is_active: boolean;
}

// ─── Async jobs ───────────────────────────────────────────────
export type JobType = 'build' | 'audit' | 'recovery' | 'wordstat' | 'crawl';
export type JobStatus = 'queued' | 'running' | 'done' | 'failed' | 'cancelled';

export interface FormulaJob {
  id: string;
  session_id: string | null;
  job_type: JobType;
  status: JobStatus;
  progress_pct: number;
  current_step: string | null;
  bullmq_job_id: string | null;
  input_payload: any;
  result_payload: any;
  error_message: string | null;
  started_at: Date | null;
  finished_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

// ─── Preflight Audit ──────────────────────────────────────────
export interface PreflightViolation {
  contract_id: string;
  page_type: string;
  rule: string; // 'required_schema_missing' | 'h1_pattern_mismatch' | ...
  severity: 'critical' | 'high' | 'medium' | 'low';
  expected: string | number | string[] | null;
  actual: string | number | string[] | null;
  human_message: string;
}

export interface PreflightReport {
  project_type_code: ProjectTypeCode;
  contracts_checked: number;
  contracts_passed: number;
  violations: PreflightViolation[];
  score: number; // 0..100
  publishable: boolean; // score >= 90
  generated_at: string;
}

// ─── Build payload ────────────────────────────────────────────
export interface BlueprintPagePlan {
  page_type: string;
  url_pattern: string; // e.g. '/services/{slug}'
  examples: string[]; // sample URLs
  contract_id: string;
  h1_template: string;
  title_template: string;
  meta_description_template: string;
  required_schemas: string[];
  required_blocks: string[];
  recommended_blocks: string[];
  notes_ru: string | null;
}

export interface BlueprintV2 {
  project_type_code: ProjectTypeCode;
  engine_version: string;
  pages: BlueprintPagePlan[];
  global_schemas: Array<{ schema_type: string; rendered_json: Record<string, any> }>;
  llms_txt: string;
  robots_txt: string;
  sitemap_skeleton: string;
  preflight: PreflightReport;
  generated_at: string;
}
