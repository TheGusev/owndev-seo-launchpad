/**
 * services/preflight — orchestrator.
 *
 * Public API:
 *   • runPreflight(evidence, context, formulaJobId?) → PreflightReport
 */

import type { PreflightReport, PageEvidence } from './types.js';
import { loadActiveRules, saveReport } from './repository.js';
import { evaluateRules } from './ruleEngine.js';
import { buildReport } from './axisScorer.js';

export class PreflightService {
  async run(
    evidence: PageEvidence,
    context: { project_code?: string; page_type?: string } = {},
    formulaJobId?: string,
  ): Promise<PreflightReport> {
    const rules = await loadActiveRules({
      project_code: context.project_code ?? evidence.project_code,
      page_type: context.page_type ?? evidence.page_type,
    });
    const findings = evaluateRules(rules, evidence);
    const report = buildReport(evidence.url, findings, {
      project_code: context.project_code ?? evidence.project_code,
      page_type: context.page_type ?? evidence.page_type,
    });

    if (formulaJobId) {
      try {
        await saveReport(formulaJobId, report);
      } catch (err) {
        // Non-fatal — preflight result is still returned.
        // eslint-disable-next-line no-console
        console.warn('[preflight] saveReport failed:', (err as Error).message);
      }
    }
    return report;
  }
}

export const preflightService = new PreflightService();
