/**
 * Регресс-тест PR-7 «Wordstat / реклама / сезонность».
 *
 * Проверяет блок ad_market_estimate в pro_report:
 *   1. Профиль ниши без demand → берёт долю горячего спроса из intent_distribution.
 *   2. С demand.clusters — доля горячего спроса считается из частот transactional+commercial+local.
 *   3. CPC и payback берутся из benchmarks.
 *   4. Бюджет Я.Директа считается только при cpc>0 и demand.total_volume>0.
 *   5. competition_level: low/medium/high по CPC и доле горячего спроса.
 *   6. Сезонность: возвращается seasonality_now, peak и low.
 *   7. media — низкая транзакционность → competition не «high».
 *   8. Без profile (неизвестный project_code) — нет ad_market_estimate.
 *
 * Хард-правила: никаких внешних вызовов; всё на бенчмарках и demand-снэпшоте.
 *
 * Запуск: npm run test:pr7-ad-market
 */

import { buildProReport } from '../proReportBuilder.js';
import type { PipelineInput, PipelineResultV3 } from '../types.js';
import type { DemandIntelligenceResult } from '../../demand/types.js';

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

function makeDemand(totalVolume: number, clusters: Array<{ intent: 'transactional' | 'commercial' | 'local' | 'informational' | 'navigational'; freq: number }> = []): DemandIntelligenceResult {
  return {
    session_id: 's',
    seed_keywords: [],
    clusters: clusters.map((c, i) => ({
      session_id: 's',
      cluster_label: `c${i}`,
      intent: c.intent,
      seed_keyword: 'k',
      region_code: 'RU',
      keywords: [],
      total_frequency: c.freq,
      recommended_page_type: 'service-geo',
      recommended_url_pattern: '/x',
    })),
    geo_distribution: [],
    recommended_geos: [],
    total_volume: totalVolume,
    quota_used: 0,
    generated_at: new Date().toISOString(),
  };
}

// ────────── 1. service_geo без demand → fallback на intent_distribution ──────────
{
  const r = buildProReport(makeInput(), makeResult());
  const am = r?.ad_market_estimate;
  assert(am !== undefined, 'service_geo: ad_market_estimate заполнен даже без demand');
  assert((am?.cpc_high_intent_rub ?? 0) > 0, 'service_geo: cpc взят из бенчмарков');
  assert(am?.transactional_share !== undefined && am.transactional_share > 0, 'service_geo: transactional_share из intent_distribution');
  assert(am?.competition_level !== undefined, 'service_geo: competition_level выставлен');
  assert(am?.seasonality_peak !== undefined, 'service_geo: seasonality_peak найден');
  assert(am?.seasonality_low !== undefined, 'service_geo: seasonality_low найден');
}

// ────────── 2. С demand.clusters — доля горячего считается из частот ──────────
{
  const demand = makeDemand(10000, [
    { intent: 'transactional', freq: 700 },
    { intent: 'commercial', freq: 200 },
    { intent: 'informational', freq: 100 },
  ]);
  const r = buildProReport(makeInput(), makeResult({ demand }));
  const am = r?.ad_market_estimate;
  // 700+200 = 900 горячих из 1000 = 0.9.
  assert(
    am?.transactional_share === 0.9,
    `transactional_share=0.9 (получено ${am?.transactional_share})`
  );
}

// ────────── 3. Бюджет Я.Директа считается из total_volume × share × CTR × CPC ──────────
{
  // service_geo: cpc_high_intent_rub = 120
  const demand = makeDemand(10000, [
    { intent: 'transactional', freq: 1000 }, // share = 1.0
  ]);
  const r = buildProReport(makeInput(), makeResult({ demand }));
  const am = r?.ad_market_estimate;
  // 10000 × 1.0 × 0.18 = 1800 кликов × 120 ₽ = 216000 ₽
  expectEq(am?.monthly_paid_budget_rub, 216000, 'service_geo бюджет = 216000 ₽');
}

// ────────── 4. competition_level=high при высоком CPC и высокой share ──────────
{
  // legal: cpc_high_intent_rub = 350 → score CPC = 2.
  const input = makeInput({ project_code: 'legal' });
  const demand = makeDemand(5000, [
    { intent: 'transactional', freq: 800 }, // share = 1.0 → +1 = 3.
  ]);
  const r = buildProReport(input, makeResult({ demand }));
  expectEq(r?.ad_market_estimate?.competition_level, 'high', 'legal+транзакц: competition=high');
}

// ────────── 5. competition_level=low при низком CPC и низкой share ──────────
{
  // nonprofit/blog/portfolio — обычно низкий cpc и низкая транзакционная доля.
  const input = makeInput({ project_code: 'blog' });
  const r = buildProReport(input, makeResult());
  const lvl = r?.ad_market_estimate?.competition_level;
  assert(lvl === 'low' || lvl === 'medium', `blog: competition низкая или средняя (получено ${lvl})`);
}

// ────────── 6. media — advertising-монетизация, но ad_market всё равно строится ──────────
{
  const input = makeInput({ project_code: 'media' });
  const r = buildProReport(input, makeResult());
  assert(r?.ad_market_estimate !== undefined, 'media: ad_market_estimate присутствует');
  // У media обычно низкий CPC и низкая транзакционность → competition не high.
  assert(r?.ad_market_estimate?.competition_level !== 'high', 'media: competition не high');
}

// ────────── 7. Без profile (неизвестный project_code) — нет ad_market_estimate ──────────
{
  const input = makeInput({ project_code: 'not_a_code' as never });
  const r = buildProReport(input, makeResult());
  // Без engine_state и без profile → undefined PRO-отчёт целиком.
  expectEq(r, undefined, 'Неизвестный project_code без engine_state → отчёт undefined');
}

// ────────── 8. Сезонность: peak >= low, оба в пределах 1..12 ──────────
{
  // realestate / hospitality / events — у этих явно выраженная сезонность.
  for (const code of ['realestate', 'hospitality', 'events'] as const) {
    const r = buildProReport(makeInput({ project_code: code }), makeResult());
    const am = r?.ad_market_estimate;
    assert(am?.seasonality_peak !== undefined, `${code}: peak найден`);
    assert(am?.seasonality_low !== undefined, `${code}: low найден`);
    assert(
      (am?.seasonality_peak?.factor ?? 0) >= (am?.seasonality_low?.factor ?? 0),
      `${code}: peak >= low (peak=${am?.seasonality_peak?.factor}, low=${am?.seasonality_low?.factor})`
    );
    const pm = am?.seasonality_peak?.month ?? 0;
    const lm = am?.seasonality_low?.month ?? 0;
    assert(pm >= 1 && pm <= 12, `${code}: peak.month в [1..12]`);
    assert(lm >= 1 && lm <= 12, `${code}: low.month в [1..12]`);
  }
}

// ────────── 9. Демонстрация для всех 23 — ничего не падает ──────────
{
  const codes: Array<PipelineInput['project_code']> = [
    'service_geo', 'service_pro', 'service_b2b', 'ecommerce', 'marketplace',
    'saas', 'education', 'medical', 'legal', 'realestate', 'mobile_app',
    'finance', 'hospitality', 'events', 'nonprofit', 'gov', 'portfolio',
    'media', 'blog', 'promo_event', 'personal_brand', 'franchise_multi', 'b2b_media',
  ];
  for (const code of codes) {
    const r = buildProReport(makeInput({ project_code: code }), makeResult());
    assert(r?.ad_market_estimate !== undefined, `${code}: ad_market_estimate собирается без исключений`);
  }
}

// ────────── Финал ──────────
if (failures.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n❌ PR-7 регресс НЕ пройден (${failures.length}):\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log('✅ PR-7 регресс: ad_market_estimate работает на всех 23 нишах и в 9 сценариях');
