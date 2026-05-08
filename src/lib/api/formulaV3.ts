/**
 * Site Formula V3 — frontend API client.
 */
import { apiUrlV3, apiHeaders } from './config';

export type ProjectTypeCodeV3 =
  | 'service_geo' | 'service_pro' | 'service_b2b' | 'ecommerce' | 'marketplace'
  | 'saas' | 'education' | 'medical' | 'legal' | 'realestate'
  | 'mobile_app'
  | 'finance' | 'hospitality' | 'events' | 'nonprofit' | 'gov' | 'portfolio'
  | 'media' | 'blog'
  | 'promo_event' | 'personal_brand' | 'franchise_multi' | 'b2b_media'
  // PR-10: подкатегории локальных услуг
  | 'service_pest_control' | 'service_repair_home' | 'service_auto' | 'service_beauty';

export type ProjectTier = 'A' | 'B' | 'C';
export type ExportMode = 'structured' | 'full' | 'platform_specific' | 'studio';
export type PlatformTarget = 'lovable' | 'cursor' | 'v0' | 'claude_code' | 'antigravity' | 'raw';

export interface ProjectTypeV3 {
  code: ProjectTypeCodeV3;
  name_ru: string;
  name_en: string;
  group_code: string | null;
  description: string | null;
  default_intents: string[];
  default_layers: string[];
  required_schemas: string[];
  is_active: boolean;
  sort_order: number;
  tier: ProjectTier | null;
  engine_modules: string[] | null;
  pack_template: string | null;
}

export interface PipelineStageResult {
  stage: string;
  started_at: string;
  finished_at: string;
  duration_ms: number;
  ok: boolean;
  error?: string;
}

export interface PreflightAxisAvg {
  seo: number;
  direct: number;
  schema: number;
  ai_llm: number;
}

export interface ProReportV3 {
  project_class?: 'start' | 'growth' | 'scale';
  project_class_reason?: string;
  decision_trace?: Array<{ rule_id?: string; reason_human?: string; effect_detail?: string; [k: string]: unknown }>;
  vertical_profile?: {
    project_code: ProjectTypeCodeV3;
    title_ru: string;
    description_ru: string;
    monetization: string;
    intent_distribution: Record<string, number | undefined>;
    seasonality: number[];
    kpi: {
      cr_visit_to_lead?: number;
      cr_lead_to_sale?: number;
      average_order_rub?: number;
      cpa_rub?: number;
      ltv_rub?: number;
      frequency_index?: number;
      sales_cycle_days?: number;
    };
    benchmarks: {
      min_pages_for_growth?: number;
      min_cities_for_geo?: number;
      min_directions_for_catalog?: number;
      seo_payback_months?: number;
      cpc_high_intent_rub?: number;
    };
    demand_triggers: string[];
    notes_ru?: string;
  };
  kpi_summary?: string[];
  roi_estimate?: {
    expected_monthly_visits?: number;
    expected_monthly_leads?: number;
    expected_monthly_sales?: number;
    expected_monthly_revenue_rub?: number;
    expected_monthly_acquisition_cost_rub?: number;
    rationale_ru?: string;
  };
  axis_weights?: { SEO: number; DIRECT: number; SCHEMA: number; AI_LLM: number };
  total_score_threshold?: number;
  // PR-7: рынок / реклама / сезонность
  ad_market_estimate?: {
    cpc_high_intent_rub?: number;
    transactional_share?: number;
    monthly_paid_budget_rub?: number;
    competition_level?: 'low' | 'medium' | 'high';
    seo_payback_months?: number;
    seasonality_now?: number;
    seasonality_peak?: { month: number; factor: number };
    seasonality_low?: { month: number; factor: number };
    rationale_ru?: string;
  };
}

export interface PipelineResultV3 {
  job_id: string;
  root_url?: string;
  status: 'done' | 'failed';
  stages: PipelineStageResult[];
  preflight_per_page?: any[];
  preflight_rollup?: {
    total_pages: number;
    avg_total_score: number;
    pages_passed: number;
    pages_failed: number;
    failed_p0_codes: string[];
    axis_avg: PreflightAxisAvg;
  };
  pack?: any;
  pack_zip_size?: number;
  generated_at: string;
  pro_report?: ProReportV3;
}

export interface RunPipelineInput {
  job_id?: string;
  // root_url опционален — клиент может ещё не иметь домена.
  root_url?: string;
  project_code: ProjectTypeCodeV3;
  brand: {
    name: string;
    industry: string;
    target_audience: string;
    competitive_position?: string;
    primary_city?: string;
    contact_email?: string;
  };
  seed_keywords?: string[];
  recommended_geos?: string[];
  pack_mode?: ExportMode;
  platform_target?: PlatformTarget;
  ai_training_policy?: 'allow' | 'deny' | 'allow_with_attribution';
  skip_demand?: boolean;
  skip_crawl?: boolean;
  max_crawl_pages?: number;
}

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(apiUrlV3(path), { headers: apiHeaders() });
  if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(apiUrlV3(path), {
    method: 'POST',
    headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`API ${r.status}: ${await r.text()}`);
  return r.json() as Promise<T>;
}

export const formulaV3Api = {
  listProjectTypes: () =>
    getJson<{ success: boolean; total: number; by_tier: Record<string, number>; types: ProjectTypeV3[] }>(
      '/project-types',
    ),

  getPageContracts: (projectCode: ProjectTypeCodeV3) =>
    getJson<{ success: boolean; project_code: string; total: number; contracts: any[] }>(
      `/page-contracts/${projectCode}`,
    ),

  runPipeline: (input: RunPipelineInput) =>
    postJson<{ success: boolean; job_id: string; result: PipelineResultV3 }>(
      '/pipeline/run',
      input,
    ),

  getPipelineResult: (jobId: string) =>
    getJson<{ success: boolean; result: PipelineResultV3 }>(`/pipeline/result/${jobId}`),

  getPack: (jobId: string) =>
    getJson<{ success: boolean; pack: any }>(`/pack/${jobId}`),

  getPackZipUrl: (jobId: string) => apiUrlV3(`/pack/${jobId}.zip`),

  validatePack: (jobId: string) =>
    getJson<{ success: boolean; validation: { valid: boolean; errors?: any[] } }>(
      `/pack/${jobId}/validate`,
    ),
};
