/**
 * services/preflight — V3 types.
 *
 * V3 Preflight gate uses 4 axes:
 *   • SEO     — must be ≥ 85
 *   • DIRECT  — must be ≥ 90
 *   • SCHEMA  — must be 100
 *   • AI_LLM  — must be ≥ 85
 *
 * Severity levels:
 *   • P0 — blocker; failing any P0 fails the gate regardless of axis score
 *   • P1 — required; counts toward axis score
 *   • P2 — recommended; smaller weight toward axis score
 */

export type PreflightAxis = 'SEO' | 'DIRECT' | 'SCHEMA' | 'AI_LLM';
export type PreflightSeverity = 'P0' | 'P1' | 'P2';

export interface PreflightRule {
  id: number;
  rule_code: string;
  axis: PreflightAxis;
  severity: PreflightSeverity;
  weight: number;
  applies_to: string[];
  page_types: string[];
  description_ru: string;
  remediation_ru: string;
  doc_url: string | null;
  active: boolean;
  engine_version: string;
}

export interface PreflightFinding {
  rule_code: string;
  axis: PreflightAxis;
  severity: PreflightSeverity;
  weight: number;
  passed: boolean;
  description_ru: string;
  remediation_ru: string;
  evidence?: Record<string, any>;
}

export interface AxisScore {
  axis: PreflightAxis;
  score: number;            // 0..100
  threshold: number;        // 85 / 90 / 100 / 85
  passed: boolean;
  findings: PreflightFinding[];
}

export interface PreflightReport {
  url: string;
  project_code?: string;
  page_type?: string;
  axes: AxisScore[];
  total_score: number;       // 0..100 (weighted across axes)
  passed: boolean;           // all axes pass + zero P0 fails
  failed_p0: string[];
  failed_p1: string[];
  failed_p2: string[];
  generated_at: string;
  // ───── PR-2 Мост v1→v3 «Правила + веса» (опциональные поля) ─────
  // Заполняются, если при buildReport передан engine_state.
  // В legacy-вызовах (без engine_state) эти поля отсутствуют — обратная совместимость.
  weighted_total_score?: number;       // total_score с весами по dimensions
  tier_applied?: 'start' | 'growth' | 'scale' | 'legacy';
  total_score_threshold?: number;      // 85/88/90 в зависимости от tier
  axis_weights?: Record<PreflightAxis, number>;  // сумма = 4
  v1_guardrails_total?: number;        // сколько P0-guardrails из v1 было применено
  v1_guardrails_failed?: string[];     // коды проваленных v1 P0-guardrails
}

export interface PageEvidence {
  url: string;
  project_code?: string;
  page_type?: string;
  has_title: boolean;
  title_length: number;
  has_h1: boolean;
  h1_length: number;
  has_meta_description: boolean;
  meta_description_length: number;
  has_canonical: boolean;
  canonical_self: boolean;
  is_indexable: boolean;
  has_intro_answer_40_80: boolean;
  internal_link_count: number;
  img_alt_missing_count: number;
  has_open_graph: boolean;
  has_lang_attr: boolean;
  in_sitemap: boolean;
  // DIRECT
  has_primary_cta_above_fold: boolean;
  has_phone_clickable: boolean;
  has_lead_form: boolean;
  trust_signal_count: number;
  has_price_or_secondary_cta: boolean;
  cta_contrast_ok: boolean;
  form_required_field_count: number;
  has_thank_you_event: boolean;
  has_breadcrumbs: boolean;
  has_live_chat: boolean;
  // SCHEMA
  jsonld_blocks: any[];
  jsonld_valid: boolean;
  has_graph_root: boolean;
  required_schema_types: string[];
  present_schema_types: string[];
  rich_results_eligible: boolean;
  has_breadcrumb_schema: boolean;
  has_sameas: boolean;
  has_aggregate_rating: boolean;
  // AI_LLM
  has_llms_txt: boolean;
  has_ai_robots_rules: boolean;
  has_well_known_ai: boolean;
  has_faq_5_plus: boolean;
  has_author_bio: boolean;
  has_last_updated: boolean;
  has_glossary: boolean;
  citable_facts_score: number;     // 0..1 heuristic
}

export const AXIS_THRESHOLDS: Record<PreflightAxis, number> = {
  SEO: 85,
  DIRECT: 90,
  SCHEMA: 100,
  AI_LLM: 85,
};
