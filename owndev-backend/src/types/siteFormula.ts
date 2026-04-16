/* ───── OwnDev Site Formula — Types ───── */

export type ProjectClass = 'start' | 'growth' | 'scale';

export type RulePriority = 'P0' | 'P1' | 'P2' | 'P3' | 'P4';

export type SessionStatus = 'draft' | 'answers_saved' | 'running' | 'preview_ready' | 'unlocked' | 'error';

// ───── Answers ─────

export interface RawAnswers {
  [questionId: string]: string | string[];
}

export interface NormalizedDimensions {
  service_breadth: number;
  geo_complexity: number;
  seo_weight: number;
  paid_weight: number;
  social_weight: number;
  referral_weight: number;
  direct_weight: number;
  trust_requirement: number;
  restructuring_need: number;
  existing_complexity: number;
  conversion_complexity: number;
  scale_ambition: number;
  migration_burden: number;
  [key: string]: number;
}

// ───── Derived Scores ─────

export interface DerivedScores {
  indexation_safety: number;
  scale_readiness: number;
  architectural_complexity: number;
  restructuring_risk: number;
}

// ───── Engine State ─────

export interface EngineState {
  dimensions: NormalizedDimensions;
  derived_scores: DerivedScores;
  project_class: ProjectClass;
  project_class_reason: string;
  activated_layers: string[];
  activated_blocks: string[];
  activated_checks: string[];
  flags: Record<string, boolean>;
  decision_trace: DecisionTraceEntry[];
  rule_conflicts: RuleConflict[];
}

// ───── Decision Trace ─────

export interface DecisionTraceEntry {
  rule_id: string;
  priority: RulePriority;
  condition: string;
  condition_met: boolean;
  effect_type: string;
  effect_detail: string;
  reason_human: string;
}

export interface RuleConflict {
  rule_a: string;
  rule_b: string;
  conflict_type: string;
  resolution: string;
}

// ───── Payloads ─────

export interface PreviewPayload {
  project_class: ProjectClass;
  project_class_reason: string;
  key_layers: Array<{ id: string; title: string; description: string }>;
  page_count_estimate: { min: number; max: number };
  primary_risks: string[];
  preview_reasons: string[];
  derived_scores: DerivedScores;
  flags: Record<string, boolean>;
}

export interface ReportSection {
  id: string;
  title: string;
  order: number;
  content: Record<string, string | string[] | Record<string, any>>;
}

export interface FullReportPayload {
  project_class: ProjectClass;
  sections: ReportSection[];
  decision_trace_summary: string[];
  metadata: {
    rules_version: string;
    template_version: string;
    generated_at: string;
  };
}

// ───── Session / Report DB ─────

export interface BlueprintSession {
  id: string;
  status: SessionStatus;
  raw_answers: RawAnswers | null;
  engine_state: EngineState | null;
  preview_payload: PreviewPayload | null;
  full_report_payload: FullReportPayload | null;
  rules_version: string;
  template_version: string;
  created_at: string;
  updated_at: string;
}

export interface BlueprintReport {
  id: string;
  session_id: string;
  status: 'locked' | 'unlocked';
  unlock_token: string | null;
  created_at: string;
}

// ───── Config Shapes ─────

export interface QuestionOption {
  value: string;
  label: string;
}

export interface QuestionDef {
  id: string;
  step: number;
  label: string;
  type: 'single' | 'multi';
  options: QuestionOption[];
  engine_dimension: string;
}

export interface RuleDef {
  id: string;
  priority: RulePriority;
  type: string;
  condition: string;
  effect: Record<string, any>;
  reason_human: string;
}

export interface RulesConfig {
  version: string;
  checksum: string;
  questions: QuestionDef[];
  question_mapping: Record<string, any>;
  derived_scores: Record<string, { formula: string; description: string }>;
  project_class_thresholds: Record<string, Record<string, number>>;
  hard_triggers: Record<string, Array<{ condition: string; reason: string }>>;
  rules: RuleDef[];
}

export interface TemplateSectionDef {
  id: string;
  title: string;
  always_active?: boolean;
  activation?: Record<string, any>;
  order: number;
  fields: string[];
}

export interface TemplateConfig {
  version: string;
  checksum: string;
  preview_fields: string[];
  sections: TemplateSectionDef[];
}
