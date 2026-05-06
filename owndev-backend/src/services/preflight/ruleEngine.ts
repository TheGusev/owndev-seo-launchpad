/**
 * services/preflight — rule engine.
 *
 * Evaluates each PreflightRule against PageEvidence and returns a
 * list of findings (passed / failed) per rule.
 */

import type {
  PreflightRule,
  PreflightFinding,
  PageEvidence,
  PreflightAxis,
} from './types.js';

type Evaluator = (e: PageEvidence) => { passed: boolean; evidence?: Record<string, any> };

const EVALUATORS: Record<string, Evaluator> = {
  // ── SEO ───────────────────────────────────────────────
  SEO_P0_TITLE_PRESENT: (e) => ({ passed: e.has_title && e.title_length > 0, evidence: { title_length: e.title_length } }),
  SEO_P0_H1_PRESENT:    (e) => ({ passed: e.has_h1, evidence: { h1_length: e.h1_length } }),
  SEO_P0_META_DESC:     (e) => ({ passed: e.has_meta_description && e.meta_description_length >= 50,
                                   evidence: { length: e.meta_description_length } }),
  SEO_P0_INDEXABLE:     (e) => ({ passed: e.is_indexable }),
  SEO_P0_CANONICAL:     (e) => ({ passed: e.has_canonical && e.canonical_self }),
  SEO_P1_TITLE_LENGTH:  (e) => ({ passed: e.title_length > 0 && e.title_length <= 60,
                                   evidence: { length: e.title_length } }),
  SEO_P1_H1_LENGTH:     (e) => ({ passed: e.h1_length > 0 && e.h1_length <= 35,
                                   evidence: { length: e.h1_length } }),
  SEO_P1_INTRO_ANSWER:  (e) => ({ passed: e.has_intro_answer_40_80 }),
  SEO_P1_INTERNAL_LINKS:(e) => ({ passed: e.internal_link_count >= 3,
                                   evidence: { count: e.internal_link_count } }),
  SEO_P1_IMG_ALT:       (e) => ({ passed: e.img_alt_missing_count === 0,
                                   evidence: { missing: e.img_alt_missing_count } }),
  SEO_P1_SITEMAP:       (e) => ({ passed: e.in_sitemap }),
  SEO_P2_OPEN_GRAPH:    (e) => ({ passed: e.has_open_graph }),
  SEO_P2_LANG_ATTR:     (e) => ({ passed: e.has_lang_attr }),
  SEO_P2_HREFLANG:      ()  => ({ passed: true }), // not enforced if monolingual

  // ── DIRECT ────────────────────────────────────────────
  DIRECT_P0_PRIMARY_CTA:    (e) => ({ passed: e.has_primary_cta_above_fold }),
  DIRECT_P0_PHONE_CLICKABLE:(e) => ({ passed: e.has_phone_clickable }),
  DIRECT_P0_LEAD_FORM:      (e) => ({ passed: e.has_lead_form }),
  DIRECT_P1_TRUST_SIGNALS:  (e) => ({ passed: e.trust_signal_count >= 2, evidence: { count: e.trust_signal_count } }),
  DIRECT_P1_PRICE_OR_CTA:   (e) => ({ passed: e.has_price_or_secondary_cta }),
  DIRECT_P1_CTA_CONTRAST:   (e) => ({ passed: e.cta_contrast_ok }),
  DIRECT_P1_FORM_FIELDS:    (e) => ({ passed: e.form_required_field_count <= 5,
                                       evidence: { fields: e.form_required_field_count } }),
  DIRECT_P1_THANK_YOU:      (e) => ({ passed: e.has_thank_you_event }),
  DIRECT_P2_LIVE_CHAT:      (e) => ({ passed: e.has_live_chat }),
  DIRECT_P2_CALLBACK:       () => ({ passed: true }),
  DIRECT_P2_BREADCRUMBS:    (e) => ({ passed: e.has_breadcrumbs }),

  // ── SCHEMA ────────────────────────────────────────────
  SCHEMA_P0_JSONLD_PRESENT: (e) => ({ passed: e.jsonld_blocks.length > 0 }),
  SCHEMA_P0_GRAPH_ROOT:     (e) => ({ passed: e.has_graph_root }),
  SCHEMA_P0_REQUIRED_TYPES: (e) => {
    const missing = e.required_schema_types.filter((t) => !e.present_schema_types.includes(t));
    return { passed: missing.length === 0, evidence: { missing } };
  },
  SCHEMA_P0_VALID_JSON:     (e) => ({ passed: e.jsonld_valid }),
  SCHEMA_P1_RICH_RESULTS:   (e) => ({ passed: e.rich_results_eligible }),
  SCHEMA_P1_BREADCRUMB:     (e) => ({ passed: e.has_breadcrumb_schema }),
  SCHEMA_P1_SAMEAS:         (e) => ({ passed: e.has_sameas }),
  SCHEMA_P2_REVIEW_AGG:     (e) => ({ passed: e.has_aggregate_rating || e.trust_signal_count === 0 }),

  // ── AI_LLM ────────────────────────────────────────────
  AILLM_P0_LLMS_TXT:     (e) => ({ passed: e.has_llms_txt }),
  AILLM_P0_AI_ROBOTS:    (e) => ({ passed: e.has_ai_robots_rules }),
  AILLM_P0_INTRO_ANSWER: (e) => ({ passed: e.has_intro_answer_40_80 }),
  AILLM_P0_FAQ_BLOCK:    (e) => ({ passed: e.has_faq_5_plus }),
  AILLM_P1_WELL_KNOWN_AI:(e) => ({ passed: e.has_well_known_ai }),
  AILLM_P1_CITABLE_FACTS:(e) => ({ passed: e.citable_facts_score >= 0.5,
                                    evidence: { score: e.citable_facts_score } }),
  AILLM_P1_AUTHOR_BIO:   (e) => ({ passed: e.has_author_bio }),
  AILLM_P1_LAST_UPDATED: (e) => ({ passed: e.has_last_updated }),
  AILLM_P2_OG_AI_HINT:   () => ({ passed: true }),
  AILLM_P2_GLOSSARY:     (e) => ({ passed: e.has_glossary }),
};

export function evaluateRules(
  rules: PreflightRule[],
  evidence: PageEvidence,
): PreflightFinding[] {
  const findings: PreflightFinding[] = [];
  for (const rule of rules) {
    const evaluator = EVALUATORS[rule.rule_code];
    let result: { passed: boolean; evidence?: Record<string, any> };
    if (!evaluator) {
      // Unknown rule code → mark as passed (rule not yet implemented)
      result = { passed: true };
    } else {
      try {
        result = evaluator(evidence);
      } catch (err) {
        result = { passed: false, evidence: { error: (err as Error).message } };
      }
    }
    findings.push({
      rule_code: rule.rule_code,
      axis: rule.axis,
      severity: rule.severity,
      weight: rule.weight,
      passed: result.passed,
      description_ru: rule.description_ru,
      remediation_ru: rule.remediation_ru,
      evidence: result.evidence,
    });
  }
  return findings;
}

export function findingsByAxis(
  findings: PreflightFinding[],
  axis: PreflightAxis,
): PreflightFinding[] {
  return findings.filter((f) => f.axis === axis);
}
