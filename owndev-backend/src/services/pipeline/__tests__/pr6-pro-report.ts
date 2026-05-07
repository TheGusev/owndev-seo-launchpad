/**
 * Регресс-тест PR-6 «Фронт + отчёт».
 *
 * Проверяет, что buildProReport собирает корректный блок:
 *   1. Без engine_state и без known project_code — возвращает undefined.
 *   2. С engine_state без vertical_profile — отдаёт project_class + decision_trace.
 *   3. С vertical_profile (известный project_code) — отдаёт KPI и ROI.
 *   4. Decision_trace ограничен 50 элементами.
 *   5. ROI считается из demand.total_volume × 0.18 (CTR).
 *   6. ROI fallback: при отсутствии demand берёт preflight_rollup.total_pages × 30.
 *   7. Без profile.kpi.cr_visit_to_lead → leads/sales/revenue не считаются.
 *
 * Запуск: npm run test:pr6-pro-report
 */

import { buildProReport } from '../proReportBuilder.js';
import type { PipelineInput, PipelineResultV3 } from '../types.js';
import type { EngineState } from '../../../types/siteFormula.js';

const failures: string[] = [];
function assert(cond: boolean, msg: string) {
  if (!cond) failures.push(msg);
}
function expectEq<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) failures.push(`${label}: ожидалось ${String(expected)}, получено ${String(actual)}`);
}

function makeInput(over: Partial<PipelineInput> = {}): PipelineInput {
  return {
    job_id: 't1',
    project_code: 'service_geo',
    brand: { name: 'Test', industry: 'service', target_audience: 'b2c' },
    ...over,
  };
}

function makeResult(over: Partial<PipelineResultV3> = {}): PipelineResultV3 {
  return {
    job_id: 't1',
    status: 'done',
    stages: [],
    generated_at: new Date().toISOString(),
    ...over,
  };
}

function makeEngineState(): EngineState {
  return {
    dimensions: {
      service_breadth: 2, geo_complexity: 2, seo_weight: 2, paid_weight: 1,
      social_weight: 1, referral_weight: 0, direct_weight: 1, trust_requirement: 1,
      restructuring_need: 0, existing_complexity: 1, conversion_complexity: 1,
      scale_ambition: 2, migration_burden: 0,
    },
    derived_scores: { indexation_safety: 8, scale_readiness: 6, architectural_complexity: 6, restructuring_risk: 0 },
    project_class: 'growth',
    project_class_reason: 'Multi-direction with growth ambition',
    activated_layers: [],
    activated_blocks: [],
    activated_checks: [],
    flags: {},
    decision_trace: [],
    rule_conflicts: [],
  };
}

// ────────── 1. service_geo + demand → ROI считается ──────────
{
  const input = makeInput();
  const result = makeResult({
    demand: {
      session_id: 's',
      seed_keywords: [],
      clusters: [],
      geo_distribution: [],
      recommended_geos: [],
      total_volume: 50000,
      quota_used: 0,
      generated_at: new Date().toISOString(),
    },
  });
  const r = buildProReport(input, result);
  assert(r !== undefined, 'service_geo + demand: pro_report заполнен');
  assert(r?.vertical_profile?.project_code === 'service_geo', 'profile подтянут');
  assert(r?.kpi_summary !== undefined && r.kpi_summary.length >= 4, 'kpi_summary заполнен');
  assert(r?.roi_estimate !== undefined, 'roi_estimate заполнен');
  // 50000 × 0.18 = 9000 визитов → cr1=0.05 → 450 лидов → 6000 ₽ AOV → ~2.7 млн ₽
  assert(
    (r?.roi_estimate?.expected_monthly_visits ?? 0) >= 8000,
    `ROI: ожидаемые визиты ≥ 8000 (получено ${r?.roi_estimate?.expected_monthly_visits})`
  );
  assert(
    (r?.roi_estimate?.expected_monthly_leads ?? 0) >= 400,
    `ROI: ожидаемые лиды ≥ 400 (получено ${r?.roi_estimate?.expected_monthly_leads})`
  );
}

// ────────── 2. С engine_state — project_class попадает в отчёт ──────────
{
  const engineState = makeEngineState();
  const input = makeInput({ engine_state: engineState });
  const result = makeResult();
  const r = buildProReport(input, result);
  expectEq(r?.project_class, 'growth', 'project_class=growth');
  expectEq(r?.project_class_reason, 'Multi-direction with growth ambition', 'project_class_reason передан');
}

// ────────── 3. Decision trace ограничен 50 ──────────
{
  const engineState = makeEngineState();
  // Загоняем 100 фейковых решений.
  engineState.decision_trace = Array.from({ length: 100 }, (_, i) => ({
    rule_id: `R${i}`,
    priority: 1,
    condition: 'true',
    condition_met: true,
    effect_type: 'activate',
    effect_detail: 'mock',
    reason_human: `decision ${i}`,
  })) as unknown as EngineState['decision_trace'];
  const input = makeInput({ engine_state: engineState });
  const r = buildProReport(input, makeResult());
  assert(
    (r?.decision_trace?.length ?? 0) === 50,
    `decision_trace ограничен 50 (получено ${r?.decision_trace?.length})`
  );
}

// ────────── 4. Без demand — ROI считается из preflight_rollup ──────────
{
  const input = makeInput();
  const result = makeResult({
    preflight_rollup: {
      total_pages: 20, avg_total_score: 90, pages_passed: 18, pages_failed: 2,
      failed_p0_codes: [],
      axis_avg: { seo: 90, direct: 90, schema: 90, ai_llm: 90 },
    },
  });
  const r = buildProReport(input, result);
  assert(r !== undefined, 'fallback: pro_report заполнен');
  // 20 × 30 = 600 визитов
  expectEq(r?.roi_estimate?.expected_monthly_visits, 600, 'fallback: 20 страниц × 30 = 600 визитов');
}

// ────────── 5. Несуществующий project_code — без vertical_profile ──────────
{
  const input = makeInput({ project_code: 'not_a_code' as any });
  const r = buildProReport(input, makeResult());
  // Без engine_state и без known profile → undefined.
  expectEq(r, undefined, 'Несуществующий код без engine_state → undefined');
}

// ────────── 6. media — нет монетизации, но profile есть → ROI без revenue ──────────
{
  const input = makeInput({ project_code: 'media' });
  const result = makeResult({
    demand: {
      session_id: 's', seed_keywords: [], clusters: [], geo_distribution: [],
      recommended_geos: [], total_volume: 100000, quota_used: 0,
      generated_at: new Date().toISOString(),
    },
  });
  const r = buildProReport(input, result);
  assert(r?.vertical_profile?.monetization === 'advertising', 'media: monetization=advertising');
  // У media kpi.cr_visit_to_lead = 0 → leads = 0.
  expectEq(r?.roi_estimate?.expected_monthly_leads, undefined, 'media: leads не заполнены (cr=0)');
}

// ────────── Финал ──────────
if (failures.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n❌ PR-6 регресс НЕ пройден (${failures.length}):\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log('✅ PR-6 регресс: pro_report корректно собирается во всех 6 сценариях');
