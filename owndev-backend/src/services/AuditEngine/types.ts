/**
 * AuditEngine — публичные типы.
 */
import type { ProjectTypeCode } from '../../types/formulaV2.js';
import type { CrawlPageRecord } from '../CrawlEngine/types.js';

export interface AuditPageGap {
  url: string;
  page_type: string;
  contract_id: string | null;
  missing_schemas: string[];
  missing_blocks: string[];
  missing_meta: string[];           // ['title','meta_description','canonical','h1']
  word_count_short: boolean;
  forbidden_blocks_present: string[];
  severity: 'critical' | 'high' | 'medium' | 'low';
  message_ru: string;
}

export interface AuditRecommendation {
  page_type: string;
  action:
    | 'add_schema'
    | 'add_block'
    | 'rewrite_meta'
    | 'increase_content'
    | 'remove_block'
    | 'add_canonical'
    | 'fix_h1';
  target: string;
  description_ru: string;
  priority: 1 | 2 | 3;               // 1 = highest
}

export interface AuditReport {
  audit_id: string | null;            // db row id (filled after save)
  project_type_code: ProjectTypeCode;
  url: string;
  pages_total: number;
  pages_audited: number;
  overall_score: number;              // 0..100
  seo_score: number;
  geo_score: number;
  cro_score: number;
  contracts_passed: number;
  contracts_failed: number;
  gaps: AuditPageGap[];
  recommendations: AuditRecommendation[];
  raw: { sampled_pages: CrawlPageRecord[] };
  generated_at: string;
}

export interface RecoveryBlueprint {
  recovery_id: string | null;
  audit_id: string;
  project_type_code: ProjectTypeCode;
  fixes: AuditRecommendation[];
  schema_patches: Array<{ schema_type: string; jsonld: Record<string, any> }>;
  content_patches: Array<{
    url: string;
    suggested_h1: string | null;
    suggested_title: string | null;
    suggested_meta: string | null;
    missing_blocks: string[];
  }>;
  preflight_score: number;            // прогноз после применения фиксов
}
