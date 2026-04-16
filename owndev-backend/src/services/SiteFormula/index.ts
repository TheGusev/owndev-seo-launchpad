import type {
  RawAnswers,
  EngineState,
  PreviewPayload,
  FullReportPayload,
} from '../../types/siteFormula.js';
import { loadRules, loadTemplate, getRulesVersion, getTemplateVersion } from './configLoader.js';
import { normalizeAnswers } from './answerNormalizer.js';
import { createEngineState } from './engineStateFactory.js';
import { calculateDerivedScores } from './derivedScoreCalculator.js';
import { classifyProject } from './projectClassifier.js';
import { executeRules } from './priorityRuleExecutor.js';
import { buildPreviewPayload } from './previewPayloadBuilder.js';
import { buildFullReportPayload } from './fullReportPayloadBuilder.js';
import {
  validatePreviewPayload,
  validateFullReportPayload,
  validateRawAnswers,
  RuntimeError,
} from './runtimeValidator.js';
import { logger } from '../../utils/logger.js';

export interface RunResult {
  engine_state: EngineState;
  preview_payload: PreviewPayload;
  full_report_payload: FullReportPayload;
}

/**
 * Main orchestrator: takes raw wizard answers, runs the full engine pipeline,
 * returns deterministic results.
 */
export function runEngine(rawAnswers: RawAnswers): RunResult {
  // 1. Validate inputs
  validateRawAnswers(rawAnswers);

  // 2. Load configs (cached after first load)
  const rules = loadRules();
  const template = loadTemplate();

  // 3. Normalize answers → dimensions
  const dimensions = normalizeAnswers(rawAnswers, rules);
  logger.info('ENGINE', `Dimensions: ${JSON.stringify(dimensions)}`);

  // 4. Create engine state
  const state = createEngineState(dimensions);

  // 5. Calculate derived scores
  state.derived_scores = calculateDerivedScores(dimensions);
  logger.info('ENGINE', `Derived scores: ${JSON.stringify(state.derived_scores)}`);

  // 6. Classify project
  const classification = classifyProject(dimensions, state.derived_scores, rules);
  state.project_class = classification.project_class;
  state.project_class_reason = classification.reason;
  logger.info('ENGINE', `Project class: ${state.project_class} — ${state.project_class_reason}`);

  // 7. Execute priority rules P0→P4
  executeRules(state, rules);
  logger.info('ENGINE', `Rules executed: ${state.decision_trace.length} entries, ${state.rule_conflicts.length} conflicts`);

  // 8. Build preview payload
  const previewPayload = buildPreviewPayload(state);
  validatePreviewPayload(previewPayload);

  // 9. Build full report payload
  const fullReportPayload = buildFullReportPayload(state, template);
  validateFullReportPayload(fullReportPayload);

  logger.info('ENGINE', `Run complete: class=${state.project_class}, layers=${state.activated_layers.length}, sections=${fullReportPayload.sections.length}`);

  return {
    engine_state: state,
    preview_payload: previewPayload,
    full_report_payload: fullReportPayload,
  };
}

export function getConfigVersions() {
  return {
    rules_version: getRulesVersion(),
    template_version: getTemplateVersion(),
  };
}

// Re-export for convenience
export { loadRules, loadTemplate } from './configLoader.js';
export { RuntimeError, ValidationError } from './runtimeValidator.js';
