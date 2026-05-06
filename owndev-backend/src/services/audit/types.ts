/**
 * services/audit — V3 audit module types.
 *
 * V3 audit is the **PageEvidence collector** that drives services/preflight.
 * Distinct from the legacy services/SiteCheckPipeline.ts (which is preserved
 * for V2 backward compatibility); V3 audit focuses on the 4-axis Preflight
 * Gate and emits PageEvidence directly.
 */

import type { PageEvidence } from '../preflight/types.js';

export interface AuditInput {
  url: string;
  html: string;
  http_status?: number;
  response_headers?: Record<string, string>;
  robots_txt?: string;
  llms_txt?: string;
  well_known_ai?: string;
  sitemap_xml?: string;
  project_code?: string;
  page_type?: string;
  required_schema_types?: string[];
}

export interface AuditOutput {
  evidence: PageEvidence;
  raw: {
    cta?: any;
    trust?: any;
    forms?: any;
    head_meta?: HeadMeta;
    schema?: SchemaExtract;
    content?: ContentExtract;
  };
}

export interface HeadMeta {
  title: string | null;
  meta_description: string | null;
  canonical: string | null;
  robots_meta: string | null;
  lang: string | null;
  open_graph: Record<string, string>;
}

export interface SchemaExtract {
  blocks: any[];                  // raw JSON-LD objects
  parsed_ok: boolean;
  has_graph: boolean;
  types_present: string[];
  has_breadcrumb: boolean;
  has_sameas: boolean;
  has_aggregate_rating: boolean;
}

export interface ContentExtract {
  h1: string | null;
  h1_length: number;
  internal_link_count: number;
  img_count: number;
  img_alt_missing_count: number;
  word_count: number;
  intro_first_paragraph_words: number;
  has_intro_answer_40_80: boolean;
  faq_question_count: number;
  has_author_bio: boolean;
  has_last_updated: boolean;
  has_glossary: boolean;
  citable_facts_score: number;
}
