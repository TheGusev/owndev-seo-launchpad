/**
 * services/preflight — axis scorer.
 *
 * Computes 0..100 score per axis using weighted P1+P2 findings.
 * If any P0 fails → axis score is 0 (and gate fails regardless).
 *
 * Weighting:
 *   • P1 weight × 1.0
 *   • P2 weight × 0.5
 *
 * PR-2 (мост v1→v3): buildReport теперь принимает опциональный engine_state.
 * Если он передан:
 *   • total_score считается ВЗВЕШЕННО по 4 осям (весы из dimensions);
 *   • поля weighted_total_score/tier_applied/total_score_threshold/axis_weights
 *     заполняются;
 *   • для project_class='scale' порог total повышается до 90.
 *
 * Если engine_state не передан — поведение идентично прежнему (legacy).
 */

import type {
  PreflightFinding,
  PreflightAxis,
  AxisScore,
  PreflightReport,
} from './types.js';
import { AXIS_THRESHOLDS } from './types.js';
import { findingsByAxis } from './ruleEngine.js';
import type { EngineState } from '../../types/siteFormula.js';
import {
  buildAxisWeights,
  legacyAxisWeights,
  totalScoreThresholdFor,
  type AxisWeightProfile,
} from './axisWeights.js';

const AXES: PreflightAxis[] = ['SEO', 'DIRECT', 'SCHEMA', 'AI_LLM'];

export function scoreAxis(
  axis: PreflightAxis,
  findings: PreflightFinding[],
): AxisScore {
  const axisFindings = findingsByAxis(findings, axis);
  const failedP0 = axisFindings.filter((f) => f.severity === 'P0' && !f.passed);

  if (failedP0.length > 0) {
    return {
      axis,
      score: 0,
      threshold: AXIS_THRESHOLDS[axis],
      passed: false,
      findings: axisFindings,
    };
  }

  const p1 = axisFindings.filter((f) => f.severity === 'P1');
  const p2 = axisFindings.filter((f) => f.severity === 'P2');

  const p1Total = p1.reduce((s, f) => s + f.weight, 0);
  const p2Total = p2.reduce((s, f) => s + f.weight, 0) * 0.5;
  const maxScore = p1Total + p2Total;

  if (maxScore === 0) {
    // Only P0 rules; all passed → 100.
    return {
      axis,
      score: 100,
      threshold: AXIS_THRESHOLDS[axis],
      passed: true,
      findings: axisFindings,
    };
  }

  const p1Earned = p1.filter((f) => f.passed).reduce((s, f) => s + f.weight, 0);
  const p2Earned = p2.filter((f) => f.passed).reduce((s, f) => s + f.weight, 0) * 0.5;
  const earned = p1Earned + p2Earned;

  const score = Math.round((earned / maxScore) * 100);
  const threshold = AXIS_THRESHOLDS[axis];

  return {
    axis,
    score,
    threshold,
    passed: score >= threshold,
    findings: axisFindings,
  };
}

/**
 * Считает взвешенный total_score по профилю весов осей.
 * Веса нормализованы к сумме = 4 (как и legacy: 4 оси × 1).
 */
function weightedTotal(axes: AxisScore[], profile: AxisWeightProfile): number {
  let sum = 0;
  let totalWeight = 0;
  for (const a of axes) {
    const w = profile.weights[a.axis] ?? 1;
    sum += a.score * w;
    totalWeight += w;
  }
  if (totalWeight === 0) return 0;
  return Math.round(sum / totalWeight);
}

export function buildReport(
  url: string,
  findings: PreflightFinding[],
  context: {
    project_code?: string;
    page_type?: string;
    engine_state?: EngineState;
    v1_guardrails_codes?: string[]; // коды добавленных v1-P0 guardrail-findings
  } = {},
): PreflightReport {
  const axes = AXES.map((a) => scoreAxis(a, findings));

  const failedP0 = findings.filter((f) => f.severity === 'P0' && !f.passed).map((f) => f.rule_code);
  const failedP1 = findings.filter((f) => f.severity === 'P1' && !f.passed).map((f) => f.rule_code);
  const failedP2 = findings.filter((f) => f.severity === 'P2' && !f.passed).map((f) => f.rule_code);

  // Legacy total: equal-weighted average — сохраняем как total_score (обратная совместимость).
  const legacyTotal = Math.round(axes.reduce((s, a) => s + a.score, 0) / axes.length);

  const report: PreflightReport = {
    url,
    project_code: context.project_code,
    page_type: context.page_type,
    axes,
    total_score: legacyTotal,
    passed: false, // переопределим ниже
    failed_p0: failedP0,
    failed_p1: failedP1,
    failed_p2: failedP2,
    generated_at: new Date().toISOString(),
  };

  // Если engine_state передан — обогащаем отчёт PR-2-полями.
  if (context.engine_state) {
    const profile = buildAxisWeights(context.engine_state);
    const weighted = weightedTotal(axes, profile);
    const threshold = totalScoreThresholdFor(profile.tier_applied);

    report.weighted_total_score = weighted;
    report.tier_applied = profile.tier_applied;
    report.total_score_threshold = threshold;
    report.axis_weights = profile.weights;

    // Информация по v1-guardrails: считаем, сколько применено и сколько провалено.
    const guardrailCodes = context.v1_guardrails_codes ?? [];
    const v1Failed = failedP0.filter((c) => guardrailCodes.includes(c));
    report.v1_guardrails_total = guardrailCodes.length;
    report.v1_guardrails_failed = v1Failed;

    // passed: все оси проходят свои axis-thresholds + total ≥ tier-threshold + zero P0 fails.
    report.passed =
      axes.every((a) => a.passed) &&
      failedP0.length === 0 &&
      weighted >= threshold;
  } else {
    // Legacy: passed = все оси прошли + ноль P0.
    const profile = legacyAxisWeights();
    const weighted = weightedTotal(axes, profile); // == legacyTotal в этом случае
    report.passed = axes.every((a) => a.passed) && failedP0.length === 0 && weighted >= 85;
  }

  return report;
}
