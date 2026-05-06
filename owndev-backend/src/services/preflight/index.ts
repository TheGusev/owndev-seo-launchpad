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
export { PreflightService, preflightService } from './service.js';
