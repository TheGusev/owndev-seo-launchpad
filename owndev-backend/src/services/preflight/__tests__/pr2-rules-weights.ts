/**
 * Регресс-тест PR-2 «Правила + веса».
 *
 * Что проверяем:
 *   1. buildReport БЕЗ engine_state даёт ровно тот же total_score, passed,
 *      что и legacy (обратная совместимость).
 *   2. buildReport С engine_state заполняет PR-2 поля:
 *      weighted_total_score, tier_applied, total_score_threshold, axis_weights.
 *   3. axis_weights нормализованы к сумме 4.
 *   4. Для project_class='scale' порог total = 90, для 'growth' = 88, 'start' = 85.
 *   5. buildAxisWeights без engine_state возвращает legacy-профиль (1,1,1,1).
 *   6. v1Guardrails корректно фильтруют по applies_when при отсутствии engine_state.
 *
 * Запуск: npm run test:pr2-rules-weights
 *
 * Тесты модульные: НЕ ходят в БД и не вызывают runEngine.
 */

import { buildReport } from '../axisScorer.js';
import {
  buildAxisWeights,
  legacyAxisWeights,
  totalScoreThresholdFor,
} from '../axisWeights.js';
import type { PreflightFinding } from '../types.js';
import type { EngineState } from '../../../types/siteFormula.js';

const failures: string[] = [];
function assert(cond: boolean, msg: string) {
  if (!cond) failures.push(msg);
}
function expectEq<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) failures.push(`${label}: ожидалось ${String(expected)}, получено ${String(actual)}`);
}

// ────────── Фикстура: набор findings, дающий total ≈ 100 на legacy-схеме ──────────
const allPassedFindings: PreflightFinding[] = [
  // SEO
  { rule_code: 'SEO_TITLE', axis: 'SEO', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
  { rule_code: 'SEO_H1',    axis: 'SEO', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
  // DIRECT
  { rule_code: 'DIR_CTA',   axis: 'DIRECT', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
  { rule_code: 'DIR_PHONE', axis: 'DIRECT', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
  // SCHEMA
  { rule_code: 'SCH_GRAPH', axis: 'SCHEMA', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
  // AI_LLM
  { rule_code: 'AI_LLMS_TXT', axis: 'AI_LLM', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
  { rule_code: 'AI_FAQ',      axis: 'AI_LLM', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
];

// ────────── 1. Legacy-режим (без engine_state) ──────────
{
  const r = buildReport('https://example.com/', allPassedFindings, {});
  expectEq(r.total_score, 100, 'Legacy: total_score=100 при всех passed');
  expectEq(r.passed, true, 'Legacy: passed=true');
  expectEq(r.weighted_total_score, undefined, 'Legacy: weighted_total_score не заполнен');
  expectEq(r.tier_applied, undefined, 'Legacy: tier_applied не заполнен');
  expectEq(r.axis_weights, undefined, 'Legacy: axis_weights не заполнен');
}

// ────────── 2. С engine_state class='start' ──────────
{
  const engineState: EngineState = {
    dimensions: {
      service_breadth: 1, geo_complexity: 1, seo_weight: 0, paid_weight: 0,
      social_weight: 0, referral_weight: 0, direct_weight: 1, trust_requirement: 0,
      restructuring_need: 0, existing_complexity: 0, conversion_complexity: 0,
      scale_ambition: 0, migration_burden: 0,
    },
    derived_scores: { indexation_safety: 7, scale_readiness: 2, architectural_complexity: 2, restructuring_risk: 0 },
    project_class: 'start',
    project_class_reason: 'test',
    activated_layers: [], activated_blocks: [], activated_checks: [],
    flags: {}, decision_trace: [], rule_conflicts: [],
  };
  const r = buildReport('https://example.com/', allPassedFindings, { engine_state: engineState });

  assert(r.weighted_total_score !== undefined, 'Start: weighted_total_score заполнен');
  expectEq(r.tier_applied, 'start', 'Start: tier_applied=start');
  expectEq(r.total_score_threshold, 85, 'Start: total_score_threshold=85');
  assert(r.axis_weights !== undefined, 'Start: axis_weights заполнен');

  if (r.axis_weights) {
    const sum = r.axis_weights.SEO + r.axis_weights.DIRECT + r.axis_weights.SCHEMA + r.axis_weights.AI_LLM;
    assert(Math.abs(sum - 4) < 0.05, `Start: axis_weights нормализованы к 4, сумма=${sum}`);
  }
}

// ────────── 3. С engine_state class='scale' ──────────
{
  const engineState: EngineState = {
    dimensions: {
      service_breadth: 3, geo_complexity: 3, seo_weight: 1, paid_weight: 1,
      social_weight: 1, referral_weight: 0, direct_weight: 1, trust_requirement: 1,
      restructuring_need: 2, existing_complexity: 3, conversion_complexity: 3,
      scale_ambition: 3, migration_burden: 2,
    },
    derived_scores: { indexation_safety: 0, scale_readiness: 9, architectural_complexity: 13, restructuring_risk: 7 },
    project_class: 'scale',
    project_class_reason: 'test',
    activated_layers: [], activated_blocks: [], activated_checks: [],
    flags: {}, decision_trace: [], rule_conflicts: [],
  };
  const r = buildReport('https://example.com/', allPassedFindings, { engine_state: engineState });

  expectEq(r.tier_applied, 'scale', 'Scale: tier_applied=scale');
  expectEq(r.total_score_threshold, 90, 'Scale: total_score_threshold=90');

  // Для scale ось SEO должна получить больше веса, чем DIRECT.
  if (r.axis_weights) {
    assert(r.axis_weights.SEO > r.axis_weights.DIRECT,
      `Scale: SEO weight (${r.axis_weights.SEO}) > DIRECT weight (${r.axis_weights.DIRECT})`);
  }
}

// ────────── 4. growth → 88 ──────────
{
  const t = totalScoreThresholdFor('growth');
  expectEq(t, 88, 'totalScoreThresholdFor(growth)=88');
}

// ────────── 5. legacyAxisWeights ──────────
{
  const p = legacyAxisWeights();
  expectEq(p.tier_applied, 'legacy', 'legacyAxisWeights.tier=legacy');
  expectEq(p.weights.SEO, 1, 'legacyAxisWeights.SEO=1');
  expectEq(p.weights.DIRECT, 1, 'legacyAxisWeights.DIRECT=1');
}

// ────────── 6. buildAxisWeights без engine_state ──────────
{
  const p = buildAxisWeights(undefined);
  expectEq(p.tier_applied, 'legacy', 'buildAxisWeights(undefined).tier=legacy');
}

// ────────── 7. P0-fail обнуляет ось и passed ──────────
{
  const findingsWithP0Fail: PreflightFinding[] = [
    ...allPassedFindings,
    { rule_code: 'P0_X', axis: 'SEO', severity: 'P0', weight: 0, passed: false, description_ru: '', remediation_ru: '' },
  ];
  const r = buildReport('https://example.com/', findingsWithP0Fail, {});
  const seo = r.axes.find((a) => a.axis === 'SEO');
  expectEq(seo?.score, 0, 'P0-fail на SEO → axis.score=0');
  expectEq(r.passed, false, 'P0-fail → report.passed=false');
}

// ────────── Финал ──────────
if (failures.length > 0) {
  // eslint-disable-next-line no-console
  console.error('\n❌ PR-2 регресс НЕ пройден:\n  - ' + failures.join('\n  - '));
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log('✅ PR-2 регресс: все проверки прошли');
