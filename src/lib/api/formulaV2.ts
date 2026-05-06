/**
 * Formula v2 API client — 19 verticals, page contracts, audit, recovery,
 * AI Developer Pack (Module 9).
 */
import { apiUrlV2, apiHeaders } from './config';

export type ProjectTypeCode =
  | 'service_geo' | 'service_pro' | 'service_b2b'
  | 'ecommerce' | 'marketplace' | 'saas' | 'mobile_app'
  | 'media' | 'blog' | 'education' | 'medical' | 'legal'
  | 'finance' | 'realestate' | 'hospitality' | 'events'
  | 'nonprofit' | 'gov' | 'portfolio';

export interface ProjectType {
  code: ProjectTypeCode;
  name_ru: string;
  name_en: string;
  group_code: string;
  description: string | null;
  default_intents: string[];
  default_layers: string[];
  required_schemas: string[];
  is_active: boolean;
  sort_order: number;
}

export interface PreflightReport {
  project_type_code: ProjectTypeCode;
  contracts_checked: number;
  contracts_passed: number;
  violations: Array<{
    contract_id: string;
    page_type: string;
    rule: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    expected: any;
    actual: any;
    human_message: string;
  }>;
  score: number;
  publishable: boolean;
  generated_at: string;
}

export interface BlueprintPagePlan {
  page_type: string;
  url_pattern: string;
  examples: string[];
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

export interface RecoveryFix {
  page_type: string;
  action: string;
  target: string;
  description_ru: string;
  priority: 1 | 2 | 3;
}

export interface RecoverySchemaPatch {
  schema_type: string;
  jsonld: Record<string, any>;
}

export interface RecoveryContentPatch {
  url: string;
  suggested_h1: string | null;
  suggested_title: string | null;
  suggested_meta: string | null;
  missing_blocks: string[];
}

export interface RecoveryBlueprint {
  recovery_id: string;
  audit_id: string;
  project_type_code: ProjectTypeCode;
  fixes: RecoveryFix[];
  schema_patches: RecoverySchemaPatch[];
  content_patches: RecoveryContentPatch[];
  preflight_score: number;
}

export interface AuditReport {
  audit_id: string;
  project_type_code: ProjectTypeCode;
  url: string;
  pages_total: number;
  pages_audited: number;
  overall_score: number;
  seo_score: number;
  geo_score: number;
  cro_score: number;
  contracts_passed: number;
  contracts_failed: number;
  gaps: Array<{
    url: string;
    page_type: string;
    contract_id: string | null;
    missing_schemas: string[];
    missing_blocks: string[];
    missing_meta: string[];
    word_count_short: boolean;
    forbidden_blocks_present: string[];
    severity: 'critical' | 'high' | 'medium' | 'low';
    message_ru: string;
  }>;
  recommendations: Array<{
    page_type: string;
    action: string;
    target: string;
    description_ru: string;
    priority: 1 | 2 | 3;
  }>;
  generated_at?: string;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...apiHeaders(),
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init?.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text || res.statusText}`);
  }
  return (await res.json()) as T;
}

export const formulaV2Api = {
  async listProjectTypes(): Promise<{ types: ProjectType[]; count: number }> {
    return jsonFetch(apiUrlV2('/formula/project-types'));
  },

  async classify(input: any): Promise<{ project_type_code: ProjectTypeCode; confidence: number; signals: any }> {
    return jsonFetch(apiUrlV2('/formula/classify'), {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async getPageContracts(typeCode: ProjectTypeCode) {
    return jsonFetch(apiUrlV2(`/formula/page-contracts/${typeCode}`));
  },

  async build(payload: any): Promise<{ blueprint: BlueprintV2 }> {
    return jsonFetch(apiUrlV2('/formula/build'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async preflight(blueprint: BlueprintV2): Promise<PreflightReport> {
    return jsonFetch(apiUrlV2('/formula/preflight'), {
      method: 'POST',
      body: JSON.stringify({ blueprint }),
    });
  },

  async runAudit(payload: {
    url: string;
    project_type_code: ProjectTypeCode;
    max_pages?: number;
    respect_robots?: boolean;
    session_id?: string;
  }): Promise<{ audit: AuditReport; crawl_summary: any }> {
    return jsonFetch(apiUrlV2('/audit/run'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  async buildRecovery(
    audit_id: string,
    session_id?: string,
  ): Promise<{ recovery: RecoveryBlueprint }> {
    return jsonFetch(apiUrlV2('/recovery/build'), {
      method: 'POST',
      body: JSON.stringify({ audit_id, session_id }),
    });
  },

  async buildAiPack(payload: {
    blueprint: BlueprintV2;
    audit_id?: string;
    recovery_id?: string;
    business_name?: string;
    site_url?: string;
    publish_threshold?: number;
    session_id?: string;
  }): Promise<{
    pack_id: string;
    preflight_score: number;
    publishable: boolean;
    zip_sha256: string;
    zip_size_bytes: number;
    manifest: { files: Array<{ name: string; size: number }>; total_size: number; engine_version: string };
  }> {
    return jsonFetch(apiUrlV2('/ai-pack/build'), {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  aiPackDownloadUrl(pack_id: string): string {
    return apiUrlV2(`/ai-pack/${pack_id}/download`);
  },
};
