/**
 * services/developerPack — Module 9 V3 types.
 *
 * Super Prompt Pack v1.0 — machine-readable contract for AI coder.
 * Schema-of-record: docs/super_prompt_pack.schema.json
 *
 * Three export modes:
 *   • full              — single JSON, all sections inlined
 *   • structured        — JSON skeleton + per-section .md files in ZIP
 *   • platform_specific — tailored for Lovable / Cursor / v0 / Claude Code
 */

export type ExportMode = 'full' | 'structured' | 'platform_specific';
export type PlatformTarget = 'lovable' | 'cursor' | 'v0' | 'claude_code' | 'raw';

export interface AgentRole {
  title: string;
  expertise: string[];
  tone: 'professional' | 'friendly' | 'technical' | 'concise';
}

export interface Mission {
  primary_goal: string;
  success_criteria: string[];
  out_of_scope?: string[];
}

export interface NonNegotiableRule {
  rule: string;
  rationale: string;
  violation_consequence: 'fail_acceptance' | 'warning' | 'rework';
}

export interface TechStack {
  framework: string;
  styling: string;
  ui_kit?: string;
  state_management?: string;
  deployment?: string;
  constraints?: string[];
}

export interface BusinessContext {
  brand: string;
  industry: string;
  project_type_code?: string;
  tier?: 'A' | 'B' | 'C';
  target_audience: string;
  geo?: { country?: string; regions?: string[]; primary_city?: string };
  languages?: string[];
  competitive_position?: string;
}

export interface RouteEntry {
  page_type: string;
  pattern: string;
  examples?: string[];
  priority?: 'MUST' | 'SHOULD' | 'COULD';
  indexable?: boolean;
  in_sitemap?: boolean;
}

export interface PackPageContract {
  page_type: string;
  h1: { template: string; max_chars: number };
  title: { template: string; max_chars: number };
  meta_description: { template: string; min_chars: number; max_chars: number };
  intro_answer?: { min_words: number; max_words: number; guidance?: string };
  faq?: { min_items: number; questions?: Array<{ question: string; answer: string }> };
  required_schemas: string[];
  required_blocks: string[];
  forbidden_blocks?: string[];
  commercial_signals?: Array<
    'price' | 'phone' | 'messengers' | 'reviews' | 'guarantee' | 'license' | 'delivery' | 'working_hours'
  >;
  min_word_count?: number;
  canonical_required?: boolean;
}

export interface SeoGeoSchemaContract {
  global_schemas: Array<{ schema_type: string; rendered_json: Record<string, any> }>;
  page_schemas: Array<{ page_type: string; graph: { '@context': string; '@graph': any[] } }>;
  llms_txt?: string;
  robots_txt?: string;
  sitemap_xml?: string;
  well_known_ai?: string;
  data_layer_events?: Array<{ event: string; trigger: string; payload: Record<string, any> }>;
}

export interface UiComponentRules {
  design_tokens?: Record<string, string>;
  required_components?: string[];
  accessibility?: 'WCAG A' | 'WCAG AA' | 'WCAG AAA';
  performance_budgets?: { lcp_ms?: number; cls?: number; inp_ms?: number; page_weight_kb?: number };
}

export interface AcceptanceCriteria {
  preflight_targets: { seo: number; direct: number; schema: number; ai_llm: number; total: number };
  p0_checks: Array<{ id: string; rule: string; axis: 'seo' | 'direct' | 'schema' | 'ai_llm'; human_message_ru?: string }>;
  p1_checks?: Array<{ id: string; rule: string; axis: 'seo' | 'direct' | 'schema' | 'ai_llm'; human_message_ru?: string }>;
  p2_checks?: Array<{ id: string; rule: string; axis: 'seo' | 'direct' | 'schema' | 'ai_llm'; human_message_ru?: string }>;
  verification_steps?: string[];
  ready_signal?: string;
}

export interface SuperPromptPack {
  version: '1.0';
  engine_version?: string;
  generated_at: string;
  agent_role: AgentRole;
  mission: Mission;
  non_negotiable_rules: NonNegotiableRule[];
  tech_stack: TechStack;
  business_context: BusinessContext;
  route_map: { routes: RouteEntry[] };
  page_contracts: { contracts: PackPageContract[] };
  seo_geo_schema_contract: SeoGeoSchemaContract;
  ui_component_rules: UiComponentRules;
  acceptance_criteria: AcceptanceCriteria;
  export_mode?: ExportMode;
  platform_target?: PlatformTarget;
}

export interface PackArtifact {
  filename: string;       // 'super_prompt_pack.json' | 'page_contracts.md' | ...
  content: Buffer | string;
  content_type: string;   // 'application/json' | 'text/markdown' | 'application/xml'
}

export interface PackBundle {
  mode: ExportMode;
  platform?: PlatformTarget;
  artifacts: PackArtifact[];
  zip_buffer?: Buffer;    // present for structured/platform modes
  pack: SuperPromptPack;
}
