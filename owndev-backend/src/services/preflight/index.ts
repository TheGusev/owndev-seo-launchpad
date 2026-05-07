/**
 * services/preflight — public API.
 */

export type {
  PreflightAxis,
  PreflightSeverity,
  PreflightRule,
  PreflightFinding,
  AxisScore,
  PreflightReport,
  PageEvidence,
} from './types.js';
export { AXIS_THRESHOLDS } from './types.js';
export { loadActiveRules, saveReport } from './repository.js';
export { evaluateRules, findingsByAxis } from './ruleEngine.js';
export { scoreAxis, buildReport } from './axisScorer.js';
export { PreflightService, preflightService, type PreflightRunContext } from './service.js';
// PR-2 Мост v1→v3:
export {
  buildAxisWeights,
  legacyAxisWeights,
  totalScoreThresholdFor,
  type AxisWeightProfile,
} from './axisWeights.js';
export {
  loadV1Guardrails,
  buildV1GuardrailFindings,
  _resetV1GuardrailsCache,
} from './v1Guardrails.js';
