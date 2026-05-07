/**
 * services/preflight — веса осей по dimensions из engine_state v1.
 *
 * Цель: при наличии engine_state взвешивать total_score по приоритетам бизнеса.
 * Например, если у проекта seo_weight=3 (высокий) и paid_weight=0, то
 * SEO-ось должна сильнее влиять на total, чем DIRECT.
 *
 * Без engine_state используется legacy-схема: все 4 оси с равными весами.
 *
 * Маппинг dimensions → ось:
 *   • SEO     ← seo_weight + service_breadth (гео-категории дают большой вес SEO)
 *   • DIRECT  ← paid_weight + conversion_complexity
 *   • SCHEMA  ← seo_weight (schema.org нужен прежде всего для SEO/AI)
 *   • AI_LLM  ← scale_ambition + trust_requirement
 *
 * Все веса нормализуются так, чтобы их сумма = 4 (как в legacy: 4 оси × 1).
 *
 * Для project_class='scale' ось SEO дополнительно повышается на 25%
 * — масштабные проекты не должны получать «зелёный» при провале SEO.
 */

import type { EngineState, NormalizedDimensions } from '../../types/siteFormula.js';
import type { PreflightAxis } from './types.js';

export interface AxisWeightProfile {
  weights: Record<PreflightAxis, number>; // сумма = 4
  raw_inputs: Record<string, number>;
  tier_applied: 'start' | 'growth' | 'scale' | 'legacy';
}

/**
 * Возвращает legacy-профиль (равные веса). Используется, когда engine_state
 * не передан — поведение идентично прежнему axisScorer.
 */
export function legacyAxisWeights(): AxisWeightProfile {
  return {
    weights: { SEO: 1, DIRECT: 1, SCHEMA: 1, AI_LLM: 1 },
    raw_inputs: {},
    tier_applied: 'legacy',
  };
}

/**
 * Строит профиль весов из engine_state.
 */
export function buildAxisWeights(engineState: EngineState | undefined): AxisWeightProfile {
  if (!engineState) return legacyAxisWeights();

  const dims: NormalizedDimensions = engineState.dimensions;
  const cls = engineState.project_class;

  // Сырые входы — суммы dimensions.
  const seoRaw = (dims.seo_weight ?? 0) + (dims.service_breadth ?? 0) * 0.5;
  const directRaw = (dims.paid_weight ?? 0) + (dims.conversion_complexity ?? 0) * 0.5;
  const schemaRaw = (dims.seo_weight ?? 0) * 0.7 + (dims.trust_requirement ?? 0) * 0.5;
  const aiRaw = (dims.scale_ambition ?? 0) + (dims.trust_requirement ?? 0) * 0.5;

  // Базовые веса с floor=0.5 (ни одна ось не может полностью «выпасть»).
  const seoBase = Math.max(0.5, seoRaw);
  const directBase = Math.max(0.5, directRaw);
  const schemaBase = Math.max(0.5, schemaRaw);
  const aiBase = Math.max(0.5, aiRaw);

  // Scale-фильтр: для крупных проектов SEO критичен — поднимаем на 25%.
  const seoMul = cls === 'scale' ? 1.25 : 1.0;
  const aiMul = cls === 'scale' ? 1.15 : 1.0;

  const seo = seoBase * seoMul;
  const direct = directBase;
  const schema = schemaBase;
  const ai = aiBase * aiMul;

  // Нормализация к сумме = 4.
  const sum = seo + direct + schema + ai;
  const k = 4 / sum;

  return {
    weights: {
      SEO: round2(seo * k),
      DIRECT: round2(direct * k),
      SCHEMA: round2(schema * k),
      AI_LLM: round2(ai * k),
    },
    raw_inputs: {
      seo_weight: dims.seo_weight ?? 0,
      paid_weight: dims.paid_weight ?? 0,
      service_breadth: dims.service_breadth ?? 0,
      conversion_complexity: dims.conversion_complexity ?? 0,
      trust_requirement: dims.trust_requirement ?? 0,
      scale_ambition: dims.scale_ambition ?? 0,
    },
    tier_applied: cls,
  };
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/**
 * Возвращает порог total_score для tier:
 *   • legacy / start  → 85
 *   • growth          → 88
 *   • scale           → 90
 *
 * Это «правило-тяжеловес» из roadmap PR-2: scale-проекты не должны проходить
 * preflight на минималках.
 */
export function totalScoreThresholdFor(tier: AxisWeightProfile['tier_applied']): number {
  switch (tier) {
    case 'scale':
      return 90;
    case 'growth':
      return 88;
    case 'start':
    case 'legacy':
    default:
      return 85;
  }
}
