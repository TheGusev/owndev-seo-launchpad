import type { RawAnswers, NormalizedDimensions } from '../../types/siteFormula.js';
import type { RulesConfig } from '../../types/siteFormula.js';

const DEFAULT_DIMENSIONS: NormalizedDimensions = {
  service_breadth: 1,
  geo_complexity: 1,
  seo_weight: 0,
  paid_weight: 0,
  social_weight: 0,
  referral_weight: 0,
  direct_weight: 0,
  trust_requirement: 0,
  restructuring_need: 0,
  existing_complexity: 0,
  conversion_complexity: 0,
  scale_ambition: 0,
  migration_burden: 0,
};

export function normalizeAnswers(
  raw: RawAnswers,
  config: RulesConfig
): NormalizedDimensions {
  const dims: NormalizedDimensions = { ...DEFAULT_DIMENSIONS };
  const mapping = config.question_mapping;

  for (const q of config.questions) {
    const rawVal = raw[q.id];
    if (rawVal === undefined || rawVal === null) continue;

    const dimension = q.engine_dimension;
    const dimMapping = mapping[dimension];
    if (!dimMapping) continue;

    if (q.type === 'multi') {
      // Multi-select: accumulate from _multi_map
      const multiMap = dimMapping._multi_map;
      if (!multiMap) continue;
      const values = Array.isArray(rawVal) ? rawVal : [rawVal];
      for (const v of values) {
        const effects = multiMap[v];
        if (effects) {
          for (const [key, val] of Object.entries(effects)) {
            dims[key] = (dims[key] || 0) + (val as number);
          }
        }
      }
    } else {
      // Single-select
      const val = Array.isArray(rawVal) ? rawVal[0] : rawVal;
      const effects = dimMapping[val];
      if (effects) {
        for (const [key, val2] of Object.entries(effects)) {
          dims[key] = val2 as number;
        }
      }
    }
  }

  return dims;
}
