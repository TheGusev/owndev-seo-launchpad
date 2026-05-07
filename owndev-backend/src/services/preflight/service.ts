/**
 * services/preflight — orchestrator.
 *
 * Public API:
 *   • runPreflight(evidence, context, formulaJobId?) → PreflightReport
 *
 * PR-2 (мост v1→v3): context теперь принимает опциональный engine_state.
 * Если он передан:
 *   • подмешиваются 6 P0-guardrails из v1 (formula_v1_p0_guardrails);
 *   • buildReport считает weighted_total_score по dimensions;
 *   • применяется scale-фильтр для тяжёлых проектов.
 *
 * Без engine_state — поведение идентично прежнему (legacy).
 */

import type { PreflightReport, PageEvidence } from './types.js';
import { loadActiveRules, saveReport } from './repository.js';
import { evaluateRules } from './ruleEngine.js';
import { buildReport } from './axisScorer.js';
import { buildV1GuardrailFindings } from './v1Guardrails.js';
import type { EngineState } from '../../types/siteFormula.js';

export interface PreflightRunContext {
  project_code?: string;
  page_type?: string;
  engine_state?: EngineState;
}

export class PreflightService {
  async run(
    evidence: PageEvidence,
    context: PreflightRunContext = {},
    formulaJobId?: string,
  ): Promise<PreflightReport> {
    const rules = await loadActiveRules({
      project_code: context.project_code ?? evidence.project_code,
      page_type: context.page_type ?? evidence.page_type,
    });
    const baseFindings = evaluateRules(rules, evidence);

    // Если есть engine_state — подмешиваем v1-guardrails (мост PR-2).
    // Без engine_state guardrail с applies_when='always' тоже подмешиваются,
    // но бережно: их фейл блокирует ось — поэтому делаем это только когда
    // вызывающий явно подал engine_state (PRO-режим).
    let v1GuardrailCodes: string[] = [];
    let allFindings = baseFindings;
    if (context.engine_state) {
      const guardrails = await buildV1GuardrailFindings(evidence, context.engine_state);
      v1GuardrailCodes = guardrails.map((g) => g.rule_code);
      allFindings = [...baseFindings, ...guardrails];
    }

    const report = buildReport(evidence.url, allFindings, {
      project_code: context.project_code ?? evidence.project_code,
      page_type: context.page_type ?? evidence.page_type,
      engine_state: context.engine_state,
      v1_guardrails_codes: v1GuardrailCodes,
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
