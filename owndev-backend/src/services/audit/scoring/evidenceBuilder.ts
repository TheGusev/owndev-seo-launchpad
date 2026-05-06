/**
 * scoring/evidenceBuilder — composes PageEvidence from all extractor + audit
 * outputs ready for services/preflight to evaluate.
 */

import type { PageEvidence } from '../../preflight/types.js';
import type { HeadMeta, ContentExtract, SchemaExtract } from '../types.js';
import type { DirectAuditResult, AiLlmAuditResult, SchemaAuditResult } from '../audits/index.js';

export function buildEvidence(opts: {
  url: string;
  project_code?: string;
  page_type?: string;
  head: HeadMeta;
  content: ContentExtract;
  schema: SchemaExtract;
  schemaAudit: SchemaAuditResult;
  direct: DirectAuditResult;
  aiLlm: AiLlmAuditResult;
  is_indexable: boolean;
  in_sitemap: boolean;
  required_schema_types: string[];
}): PageEvidence {
  const headMd = (opts.head.meta_description ?? '').trim();
  const titleLen = (opts.head.title ?? '').length;
  const canonicalSelf =
    !!opts.head.canonical &&
    (opts.head.canonical === opts.url ||
      opts.head.canonical.replace(/\/$/, '') === opts.url.replace(/\/$/, ''));

  const presentTypes = opts.schema.types_present;
  // FAQ presence: from schema (FAQPage) OR heuristic content count
  const faqByType = presentTypes.some((t) => /FAQPage|FAQ/i.test(t));
  const faq5plus = faqByType || opts.content.faq_question_count >= 5;

  return {
    url: opts.url,
    project_code: opts.project_code,
    page_type: opts.page_type,
    has_title: !!opts.head.title,
    title_length: titleLen,
    has_h1: !!opts.content.h1,
    h1_length: opts.content.h1_length,
    has_meta_description: !!opts.head.meta_description,
    meta_description_length: headMd.length,
    has_canonical: !!opts.head.canonical,
    canonical_self: canonicalSelf,
    is_indexable: opts.is_indexable,
    has_intro_answer_40_80: opts.content.has_intro_answer_40_80,
    internal_link_count: opts.content.internal_link_count,
    img_alt_missing_count: opts.content.img_alt_missing_count,
    has_open_graph:
      !!opts.head.open_graph['og:title'] &&
      !!opts.head.open_graph['og:description'] &&
      !!opts.head.open_graph['og:url'],
    has_lang_attr: !!opts.head.lang,
    in_sitemap: opts.in_sitemap,
    // DIRECT
    has_primary_cta_above_fold: opts.direct.cta.has_primary_cta_above_fold,
    has_phone_clickable: opts.direct.cta.has_phone_clickable,
    has_lead_form: opts.direct.forms.form_count > 0,
    trust_signal_count: opts.direct.trust.signal_count,
    has_price_or_secondary_cta: opts.direct.cta.has_secondary_cta,
    cta_contrast_ok: opts.direct.cta.primary_cta_contrast_ok,
    form_required_field_count: opts.direct.forms.primary_form_required_count,
    has_thank_you_event: opts.direct.forms.has_thank_you_state || opts.direct.forms.has_dataLayer_event,
    has_breadcrumbs: presentTypes.some((t) => /BreadcrumbList/i.test(t)),
    has_live_chat: opts.direct.cta.has_messenger_links,
    // SCHEMA
    jsonld_blocks: opts.schema.blocks,
    jsonld_valid: opts.schema.parsed_ok,
    has_graph_root: opts.schema.has_graph,
    required_schema_types: opts.required_schema_types,
    present_schema_types: presentTypes,
    rich_results_eligible: opts.schemaAudit.rich_results_eligible,
    has_breadcrumb_schema: opts.schema.has_breadcrumb,
    has_sameas: opts.schema.has_sameas,
    has_aggregate_rating: opts.schema.has_aggregate_rating,
    // AI/LLM
    has_llms_txt: opts.aiLlm.has_llms_txt,
    has_ai_robots_rules: opts.aiLlm.has_ai_robots_rules,
    has_well_known_ai: opts.aiLlm.has_well_known_ai,
    has_faq_5_plus: faq5plus,
    has_author_bio: opts.content.has_author_bio,
    has_last_updated: opts.content.has_last_updated,
    has_glossary: opts.content.has_glossary,
    citable_facts_score: opts.content.citable_facts_score,
  };
}
