/**
 * services/conversion — V3 conversion auditing types.
 *
 * Three sub-auditors:
 *   • ctaAuditor          — CTA presence/contrast/clickability
 *   • trustSignals        — reviews, ratings, certifications, guarantees
 *   • formFlowAuditor     — form usability (field count, validation, success state)
 */

export interface CtaAuditResult {
  has_primary_cta_above_fold: boolean;
  has_secondary_cta: boolean;
  primary_cta_text: string | null;
  primary_cta_contrast_ok: boolean;
  has_phone_clickable: boolean;
  has_messenger_links: boolean;       // tg, wa.me, viber
  cta_count_total: number;
  issues: string[];
  recommendations: string[];
}

export interface TrustSignalAuditResult {
  reviews_count: number;
  has_review_rating_aggregate: boolean;
  has_certifications_block: boolean;
  has_guarantee_block: boolean;
  has_team_block: boolean;
  has_case_studies_block: boolean;
  trust_score: number;                // 0..100
  signal_count: number;
  issues: string[];
  recommendations: string[];
}

export interface FormFlowAuditResult {
  form_count: number;
  primary_form_field_count: number;
  primary_form_required_count: number;
  has_inline_validation: boolean;
  has_thank_you_state: boolean;
  has_dataLayer_event: boolean;
  consent_checkbox_present: boolean;   // 152-ФЗ / GDPR
  issues: string[];
  recommendations: string[];
}

export interface CtaAuditInput {
  html: string;
  cssText?: string;
  primary_cta_keywords?: string[];     // ['заказать', 'купить', 'оставить заявку']
}

export interface TrustAuditInput {
  html: string;
}

export interface FormAuditInput {
  html: string;
}
