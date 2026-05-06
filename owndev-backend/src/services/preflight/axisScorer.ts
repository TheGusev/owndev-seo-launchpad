/**
 * services/preflight — axis scorer.
 *
 * Computes 0..100 score per axis using weighted P1+P2 findings.
 * If any P0 fails → axis score is 0 (and gate fails regardless).
 *
 * Weighting:
 *   • P1 weight × 1.0
 *   • P2 weight × 0.5
 */

import type {
  PreflightFinding,
  PreflightAxis,
  AxisScore,
  PreflightReport,
} from './types.js';
import { AXIS_THRESHOLDS } from './types.js';
import { findingsByAxis } from './ruleEngine.js';

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

export function buildReport(
  url: string,
  findings: PreflightFinding[],
  context: { project_code?: string; page_type?: string } = {},
): PreflightReport {
  const axes = AXES.map((a) => scoreAxis(a, findings));

  const failedP0 = findings.filter((f) => f.severity === 'P0' && !f.passed).map((f) => f.rule_code);
  const failedP1 = findings.filter((f) => f.severity === 'P1' && !f.passed).map((f) => f.rule_code);
  const failedP2 = findings.filter((f) => f.severity === 'P2' && !f.passed).map((f) => f.rule_code);

  // Total score: weighted average of axis scores (equal weights)
  const totalScore = Math.round(axes.reduce((s, a) => s + a.score, 0) / axes.length);
  const passed = axes.every((a) => a.passed) && failedP0.length === 0;

  return {
    url,
    project_code: context.project_code,
    page_type: context.page_type,
    axes,
    total_score: totalScore,
    passed,
    failed_p0: failedP0,
    failed_p1: failedP1,
    failed_p2: failedP2,
    generated_at: new Date().toISOString(),
  };
}
