import type { PreviewPayload, FullReportPayload } from '../../types/siteFormula.js';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validatePreviewPayload(payload: PreviewPayload): void {
  if (!payload.project_class) {
    throw new ValidationError('preview_payload: missing project_class');
  }
  if (!['start', 'growth', 'scale'].includes(payload.project_class)) {
    throw new ValidationError(`preview_payload: invalid project_class "${payload.project_class}"`);
  }
  if (!payload.project_class_reason) {
    throw new ValidationError('preview_payload: missing project_class_reason');
  }
  if (!Array.isArray(payload.key_layers)) {
    throw new ValidationError('preview_payload: key_layers must be an array');
  }
  if (!payload.derived_scores) {
    throw new ValidationError('preview_payload: missing derived_scores');
  }

  // Verify utility guardrails are always set
  if (!payload.flags.utility_always_noindex) {
    throw new ValidationError('preview_payload: P0 guardrail utility_always_noindex missing');
  }
  if (!payload.flags.utility_excluded_from_sitemap) {
    throw new ValidationError('preview_payload: P0 guardrail utility_excluded_from_sitemap missing');
  }
  if (!payload.flags.one_url_one_entity) {
    throw new ValidationError('preview_payload: P0 guardrail one_url_one_entity missing');
  }
}

export function validateFullReportPayload(payload: FullReportPayload): void {
  if (!payload.project_class) {
    throw new ValidationError('full_report_payload: missing project_class');
  }
  if (!Array.isArray(payload.sections) || payload.sections.length === 0) {
    throw new ValidationError('full_report_payload: sections must be a non-empty array');
  }
  if (!payload.metadata?.rules_version || !payload.metadata?.template_version) {
    throw new ValidationError('full_report_payload: missing metadata versions');
  }

  // Verify sections are ordered
  for (let i = 1; i < payload.sections.length; i++) {
    if (payload.sections[i].order < payload.sections[i - 1].order) {
      throw new ValidationError('full_report_payload: sections out of order');
    }
  }
}

export function validateRawAnswers(answers: Record<string, any>): void {
  if (!answers || typeof answers !== 'object') {
    throw new ValidationError('answers must be a non-null object');
  }
}

export class RuntimeError extends Error {
  public code: string;
  constructor(message: string, code: string) {
    super(message);
    this.name = 'RuntimeError';
    this.code = code;
  }
}
