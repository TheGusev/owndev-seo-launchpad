/**
 * Регресс-тест PR-5 «Отраслевая полировка под доход».
 *
 * Что проверяем:
 *   1. Все 23 ProjectTypeCodeV3 имеют профиль в verticals/profiles/all.json.
 *   2. Каждый профиль валиден (intent_distribution, seasonality[12], kpi, benchmarks).
 *   3. Каждый профиль ВСЕХ типов — НЕпустой demand_triggers, монетизация задана.
 *   4. seasonalityFactor возвращает значения близкие к 1.0 в среднем по году.
 *   5. formatKpiSummary даёт ≥ 1 строки для всех монетизируемых типов.
 *   6. Если запросили несуществующий код — getVerticalProfile вернёт null.
 *
 * Запуск: npm run test:pr5-vertical-profiles
 */

import {
  getVerticalProfile,
  listVerticalProfiles,
  seasonalityFactor,
  formatKpiSummary,
} from '../index.js';
import type { ProjectTypeCodeV3 } from '../../../types/formulaV3.js';

const ALL_CODES: ProjectTypeCodeV3[] = [
  'service_geo', 'service_pro', 'service_b2b',
  'ecommerce', 'marketplace', 'saas',
  'education', 'medical', 'legal', 'realestate',
  'mobile_app',
  'finance', 'hospitality', 'events', 'nonprofit',
  'gov', 'portfolio', 'media', 'blog',
  'promo_event', 'personal_brand', 'franchise_multi', 'b2b_media',
];

const failures: string[] = [];
function assert(cond: boolean, msg: string) {
  if (!cond) failures.push(msg);
}
function expectEq<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) failures.push(`${label}: ожидалось ${String(expected)}, получено ${String(actual)}`);
}

// ────────── 1. Все 23 кода имеют профиль ──────────
{
  const all = listVerticalProfiles();
  expectEq(all.length, 23, 'listVerticalProfiles: ровно 23 профиля');

  for (const code of ALL_CODES) {
    const p = getVerticalProfile(code);
    assert(p !== null, `Профиль для ${code} существует`);
  }
}

// ────────── 2. Каждый профиль валиден ──────────
{
  for (const code of ALL_CODES) {
    const p = getVerticalProfile(code);
    if (!p) continue; // пропустим (выше уже зафейлится)

    expectEq(p.project_code, code, `${code}: project_code совпадает`);
    assert(p.title_ru.length > 0, `${code}: title_ru непустой`);
    assert(p.description_ru.length > 0, `${code}: description_ru непустой`);
    assert(p.monetization.length > 0, `${code}: monetization задан`);
    assert(p.seasonality.length === 12, `${code}: seasonality имеет 12 значений`);
    assert(p.demand_triggers.length > 0, `${code}: demand_triggers непустые`);

    // intent_distribution: каждое значение 0..1, сумма ≈ 1.
    const sumIntent =
      (p.intent_distribution.informational ?? 0) +
      (p.intent_distribution.commercial ?? 0) +
      (p.intent_distribution.transactional ?? 0) +
      (p.intent_distribution.navigational ?? 0) +
      (p.intent_distribution.local ?? 0);
    assert(
      Math.abs(sumIntent - 1.0) < 0.05,
      `${code}: intent_distribution сумма ≈ 1.0 (получено ${sumIntent.toFixed(3)})`
    );

    // seasonality: каждое значение в разумных пределах [0.3, 2.0].
    for (let i = 0; i < 12; i++) {
      const v = p.seasonality[i];
      assert(v >= 0.3 && v <= 2.0, `${code}: seasonality[${i}] в [0.3, 2.0] (получено ${v})`);
    }
  }
}

// ────────── 3. seasonalityFactor: среднее по году ≈ 1.0 ──────────
{
  for (const code of ALL_CODES) {
    let sum = 0;
    for (let m = 1; m <= 12; m++) sum += seasonalityFactor(code, m);
    const avg = sum / 12;
    // допустимая погрешность ±15% (некоторые ниши специально несимметричны).
    assert(
      avg >= 0.85 && avg <= 1.15,
      `${code}: средний коэффициент сезонности в [0.85, 1.15] (получено ${avg.toFixed(3)})`
    );
  }
}

// ────────── 4. formatKpiSummary даёт ≥ 1 строки для монетизируемых ──────────
{
  // Монетизируемые типы — где есть лид/продажа.
  const monetized: ProjectTypeCodeV3[] = [
    'service_geo', 'service_pro', 'service_b2b',
    'ecommerce', 'marketplace', 'saas',
    'education', 'medical', 'legal', 'realestate',
    'mobile_app', 'finance', 'hospitality', 'events',
    'portfolio', 'personal_brand', 'franchise_multi',
  ];
  for (const code of monetized) {
    const lines = formatKpiSummary(code);
    assert(lines.length >= 1, `${code}: formatKpiSummary даёт ≥ 1 строку (получено ${lines.length})`);
  }
}

// ────────── 5. Несуществующий код возвращает null ──────────
{
  const fake = getVerticalProfile('not_a_real_code' as ProjectTypeCodeV3);
  expectEq(fake, null, 'Несуществующий код → null');

  const f = seasonalityFactor('not_a_real_code' as ProjectTypeCodeV3, 6);
  expectEq(f, 1.0, 'seasonalityFactor для несуществующего → 1.0');

  const lines = formatKpiSummary('not_a_real_code' as ProjectTypeCodeV3);
  expectEq(lines.length, 0, 'formatKpiSummary для несуществующего → []');
}

// ────────── 6. Бенчмарки осмысленны ──────────
{
  for (const code of ALL_CODES) {
    const p = getVerticalProfile(code);
    if (!p) continue;
    if (p.benchmarks.min_pages_for_growth !== undefined) {
      assert(
        p.benchmarks.min_pages_for_growth >= 1 && p.benchmarks.min_pages_for_growth <= 5000,
        `${code}: min_pages_for_growth в [1, 5000] (получено ${p.benchmarks.min_pages_for_growth})`
      );
    }
  }
}

// ────────── Финал ──────────
if (failures.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n❌ PR-5 регресс НЕ пройден (${failures.length} ошибок):\n  - ${failures.join('\n  - ')}`);
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log(`✅ PR-5 регресс: все 23 отраслевых профиля валидны (${listVerticalProfiles().length} шт.)`);
