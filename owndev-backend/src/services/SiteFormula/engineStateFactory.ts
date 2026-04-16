import type { NormalizedDimensions, EngineState } from '../../types/siteFormula.js';

export function createEngineState(dimensions: NormalizedDimensions): EngineState {
  return {
    dimensions,
    derived_scores: {
      indexation_safety: 0,
      scale_readiness: 0,
      architectural_complexity: 0,
      restructuring_risk: 0,
    },
    project_class: 'start',
    project_class_reason: '',
    activated_layers: [],
    activated_blocks: [],
    activated_checks: [],
    flags: {},
    decision_trace: [],
    rule_conflicts: [],
  };
}
