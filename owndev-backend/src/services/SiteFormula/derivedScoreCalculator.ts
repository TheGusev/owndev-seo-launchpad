import type { NormalizedDimensions, DerivedScores } from '../../types/siteFormula.js';

export function calculateDerivedScores(dims: NormalizedDimensions): DerivedScores {
  const indexation_safety = Math.max(
    0,
    10 - (dims.geo_complexity * 2 + dims.service_breadth + dims.restructuring_need)
  );

  const scale_readiness =
    dims.service_breadth + dims.geo_complexity + dims.scale_ambition;

  const architectural_complexity =
    dims.service_breadth +
    dims.geo_complexity +
    dims.existing_complexity +
    dims.conversion_complexity +
    dims.trust_requirement;

  const restructuring_risk =
    dims.restructuring_need + dims.migration_burden + dims.existing_complexity;

  return {
    indexation_safety,
    scale_readiness,
    architectural_complexity,
    restructuring_risk,
  };
}
