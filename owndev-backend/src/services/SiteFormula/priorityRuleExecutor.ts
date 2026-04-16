import type {
  EngineState,
  RuleDef,
  RulePriority,
  DecisionTraceEntry,
  NormalizedDimensions,
  RulesConfig,
} from '../../types/siteFormula.js';
import { logger } from '../../utils/logger.js';

const PRIORITY_ORDER: RulePriority[] = ['P0', 'P1', 'P2', 'P3', 'P4'];

function evaluateRuleCondition(
  condition: string,
  dims: NormalizedDimensions,
  state: EngineState
): boolean {
  if (condition === 'always') return true;

  // Support project_class references
  const condWithClass = condition.replace(
    /project_class\s*==\s*'(\w+)'/g,
    (_m, cls) => (state.project_class === cls ? 'true' : 'false')
  );

  // Simple AND evaluation
  const parts = condWithClass.split(/\s+AND\s+/i);
  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed === 'true') continue;
    if (trimmed === 'false') return false;

    // Check OR
    if (/\s+OR\s+/i.test(trimmed)) {
      const orParts = trimmed.split(/\s+OR\s+/i);
      const anyTrue = orParts.some((op) => evalSimple(op.trim(), dims, state));
      if (!anyTrue) return false;
      continue;
    }

    if (!evalSimple(trimmed, dims, state)) return false;
  }
  return true;
}

function evalSimple(
  expr: string,
  dims: NormalizedDimensions,
  state: EngineState
): boolean {
  // Handle OR at this level too
  if (/\s+OR\s+/i.test(expr)) {
    return expr.split(/\s+OR\s+/i).some((p) => evalSimple(p.trim(), dims, state));
  }

  const match = expr.match(/^(\w+)\s*(>=|<=|==|>|<|!=)\s*(\d+)$/);
  if (!match) return false;
  const [, key, op, valStr] = match;

  // Check derived_scores first, then dimensions
  const left =
    (state.derived_scores as any)[key] ??
    dims[key] ??
    0;
  const right = Number(valStr);

  switch (op) {
    case '>=': return left >= right;
    case '<=': return left <= right;
    case '==': return left === right;
    case '>':  return left > right;
    case '<':  return left < right;
    case '!=': return left !== right;
    default:   return false;
  }
}

function applyEffect(rule: RuleDef, state: EngineState): string {
  const effect = rule.effect;
  const details: string[] = [];

  if (effect.set_flag !== undefined) {
    // P0 flags cannot be overridden by lower priority
    if (state.flags[effect.set_flag] !== undefined) {
      const existingTrace = state.decision_trace.find(
        (t) => t.effect_detail.includes(effect.set_flag) && t.condition_met
      );
      if (existingTrace) {
        const existingPri = PRIORITY_ORDER.indexOf(existingTrace.priority as RulePriority);
        const currentPri = PRIORITY_ORDER.indexOf(rule.priority);
        if (existingPri < currentPri) {
          // Higher priority already set this flag — skip
          state.rule_conflicts.push({
            rule_a: existingTrace.rule_id,
            rule_b: rule.id,
            conflict_type: 'flag_override_blocked',
            resolution: `P${existingPri} flag preserved, P${currentPri} blocked`,
          });
          logger.warn('RULE_ENGINE', `Conflict: ${rule.id} blocked by ${existingTrace.rule_id}`);
          return `flag ${effect.set_flag} override blocked`;
        }
      }
    }
    state.flags[effect.set_flag] = effect.value;
    details.push(`flag:${effect.set_flag}=${effect.value}`);
  }

  if (effect.activate_layer) {
    if (!state.activated_layers.includes(effect.activate_layer)) {
      state.activated_layers.push(effect.activate_layer);
    }
    details.push(`layer:${effect.activate_layer}`);
  }

  if (effect.activate_blocks) {
    for (const block of effect.activate_blocks) {
      if (!state.activated_blocks.includes(block)) {
        state.activated_blocks.push(block);
      }
    }
    details.push(`blocks:${effect.activate_blocks.join(',')}`);
  }

  if (effect.activate_checks) {
    for (const check of effect.activate_checks) {
      if (!state.activated_checks.includes(check)) {
        state.activated_checks.push(check);
      }
    }
    details.push(`checks:${effect.activate_checks.join(',')}`);
  }

  return details.join('; ') || 'no-op';
}

export function executeRules(state: EngineState, config: RulesConfig): void {
  const rulesByPriority = new Map<RulePriority, RuleDef[]>();

  for (const p of PRIORITY_ORDER) {
    rulesByPriority.set(p, []);
  }

  for (const rule of config.rules) {
    const bucket = rulesByPriority.get(rule.priority);
    if (bucket) bucket.push(rule);
  }

  for (const priority of PRIORITY_ORDER) {
    const rules = rulesByPriority.get(priority) || [];
    for (const rule of rules) {
      const conditionMet = evaluateRuleCondition(
        rule.condition,
        state.dimensions,
        state
      );

      let effectDetail = 'skipped';
      if (conditionMet) {
        effectDetail = applyEffect(rule, state);
      }

      const traceEntry: DecisionTraceEntry = {
        rule_id: rule.id,
        priority: rule.priority,
        condition: rule.condition,
        condition_met: conditionMet,
        effect_type: rule.type,
        effect_detail: effectDetail,
        reason_human: conditionMet ? rule.reason_human : `(не применено: условие "${rule.condition}" не выполнено)`,
      };

      state.decision_trace.push(traceEntry);
    }
  }
}
