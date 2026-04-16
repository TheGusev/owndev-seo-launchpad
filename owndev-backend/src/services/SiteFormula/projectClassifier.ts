import type { NormalizedDimensions, DerivedScores, ProjectClass, RulesConfig } from '../../types/siteFormula.js';

interface ClassificationResult {
  project_class: ProjectClass;
  reason: string;
}

/**
 * Evaluates simple condition strings from hard_triggers against dimensions.
 * Supports: "key >= N AND key2 >= N"
 */
function evaluateCondition(
  condition: string,
  dims: NormalizedDimensions
): boolean {
  const parts = condition.split(/\s+AND\s+/i);
  for (const part of parts) {
    const match = part.trim().match(/^(\w+)\s*(>=|<=|==|>|<|!=)\s*(\d+)$/);
    if (!match) return false;
    const [, key, op, valStr] = match;
    const left = dims[key] ?? 0;
    const right = Number(valStr);
    switch (op) {
      case '>=': if (!(left >= right)) return false; break;
      case '<=': if (!(left <= right)) return false; break;
      case '==': if (!(left === right)) return false; break;
      case '>':  if (!(left > right)) return false; break;
      case '<':  if (!(left < right)) return false; break;
      case '!=': if (!(left !== right)) return false; break;
      default: return false;
    }
  }
  return true;
}

export function classifyProject(
  dims: NormalizedDimensions,
  scores: DerivedScores,
  config: RulesConfig
): ClassificationResult {
  const triggers = config.hard_triggers;

  // Check force_scale first (highest override)
  for (const trigger of triggers.force_scale || []) {
    if (evaluateCondition(trigger.condition, dims)) {
      return { project_class: 'scale', reason: trigger.reason };
    }
  }

  // Check force_growth
  for (const trigger of triggers.force_growth || []) {
    if (evaluateCondition(trigger.condition, dims)) {
      return { project_class: 'growth', reason: trigger.reason };
    }
  }

  // Threshold-based classification
  const thresholds = config.project_class_thresholds;

  if (
    scores.scale_readiness >= (thresholds.scale.min_scale_readiness ?? 999) &&
    scores.architectural_complexity >= (thresholds.scale.min_architectural_complexity ?? 999)
  ) {
    return {
      project_class: 'scale',
      reason: 'Архитектурная сложность и масштаб требуют полной scale-архитектуры',
    };
  }

  if (
    scores.scale_readiness >= (thresholds.growth.min_scale_readiness ?? 0) &&
    scores.architectural_complexity >= (thresholds.growth.min_architectural_complexity ?? 0)
  ) {
    return {
      project_class: 'growth',
      reason: 'Проект требует структурного роста: несколько направлений или гео-сегментов',
    };
  }

  return {
    project_class: 'start',
    reason: 'Компактный проект — достаточно базовой структуры сайта',
  };
}
