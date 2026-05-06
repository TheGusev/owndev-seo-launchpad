/**
 * services/preflight — repository.
 *
 * Loads active preflight rules from preflight_rules and persists
 * results to preflight_results.
 */
import { sql } from '../../db/client.js';
import type { PreflightRule, PreflightReport } from './types.js';

export async function loadActiveRules(opts?: {
  project_code?: string;
  page_type?: string;
}): Promise<PreflightRule[]> {
  const rows = await sql<PreflightRule[]>`
    SELECT id, rule_code, axis, severity, weight, applies_to, page_types,
           description_ru, remediation_ru, doc_url, active, engine_version
    FROM preflight_rules
    WHERE active = TRUE AND engine_version = 'v3'
    ORDER BY axis, severity, weight DESC
  `;

  if (!opts) return rows;

  return rows.filter((r) => {
    const projectMatch =
      r.applies_to.includes('*') ||
      (opts.project_code && r.applies_to.includes(opts.project_code));
    const pageMatch =
      r.page_types.includes('*') ||
      (opts.page_type && r.page_types.includes(opts.page_type));
    return projectMatch && pageMatch;
  });
}

export async function saveReport(
  formulaJobId: string | null,
  report: PreflightReport,
): Promise<number> {
  const seo = report.axes.find((a) => a.axis === 'SEO');
  const direct = report.axes.find((a) => a.axis === 'DIRECT');
  const schema = report.axes.find((a) => a.axis === 'SCHEMA');
  const ai = report.axes.find((a) => a.axis === 'AI_LLM');

  const rows = await sql<Array<{ id: number }>>`
    INSERT INTO preflight_results (
      formula_job_id, url,
      axis_seo, axis_direct, axis_schema, axis_ai_llm,
      total_score, passed, failed_p0, failed_p1, failed_p2, details
    )
    VALUES (
      ${formulaJobId}, ${report.url},
      ${seo?.score ?? 0}, ${direct?.score ?? 0}, ${schema?.score ?? 0}, ${ai?.score ?? 0},
      ${report.total_score}, ${report.passed},
      ${report.failed_p0}, ${report.failed_p1}, ${report.failed_p2},
      ${sql.json(report as any)}
    )
    RETURNING id
  `;
  return rows[0].id;
}
