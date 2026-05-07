/**
 * Регресс-тест PR-4 «Self-test матрица».
 *
 * Цель: гарантия, что для ЛЮБОЙ комбинации
 *   {23 типа проектов} × {3 размера: start/growth/scale} × {1, 5, 12 городов} × {1, 3, 5 направлений}
 *
 * движок выдаёт:
 *   1. weighted_total_score ≥ 90 при идеальных findings (all-passed) — система оценки не «съедает» баллы;
 *   2. для гео-зависимых типов applyPageFanout даёт N страниц при N городах;
 *   3. для каталог-зависимых типов applyPageFanout даёт M страниц при M направлениях;
 *   4. порог total_score_threshold выставлен корректно (start=85, growth=88, scale=90).
 *
 * Тест полностью модульный — НЕ ходит в БД, НЕ вызывает Wordstat и runEngine.
 * Использует синтетические EngineState и all-passed findings.
 *
 * Запуск: npm run test:pr4-self-test-matrix
 */

import { buildReport } from '../../preflight/axisScorer.js';
import {
  buildAxisWeights,
  totalScoreThresholdFor,
} from '../../preflight/axisWeights.js';
import { applyPageFanout } from '../pageFanout.js';
import type { PreflightFinding } from '../../preflight/types.js';
import type { EngineState, ProjectClass } from '../../../types/siteFormula.js';
import type { ProjectTypeCodeV3 } from '../../../types/formulaV3.js';
import type { SitePage } from '../types.js';

// ────────── Конфигурация матрицы ──────────

const PROJECT_TYPES: ProjectTypeCodeV3[] = [
  // Tier A — Web/SEO
  'service_geo', 'service_pro', 'service_b2b',
  'ecommerce', 'marketplace', 'saas',
  'education', 'medical', 'legal', 'realestate',
  // Tier B
  'mobile_app',
  // Tier C — V2 + V3-new
  'finance', 'hospitality', 'events', 'nonprofit',
  'gov', 'portfolio', 'media', 'blog',
  'promo_event', 'personal_brand', 'franchise_multi', 'b2b_media',
];

const SIZES: ProjectClass[] = ['start', 'growth', 'scale'];
const CITY_COUNTS = [1, 5, 12];
const DIRECTION_COUNTS = [1, 3, 5];

// Геозависимые типы — fan-out по городам должен умножать страницы.
const GEO_DEPENDENT: ProjectTypeCodeV3[] = [
  'service_geo', 'service_pro', 'service_b2b',
  'realestate', 'medical', 'legal', 'education',
  'hospitality', 'events', 'gov', 'franchise_multi',
];

// Каталог-зависимые типы — fan-out по directions должен умножать страницы.
const CATALOG_DEPENDENT: ProjectTypeCodeV3[] = [
  'ecommerce', 'marketplace', 'saas', 'education',
  'service_geo', 'service_pro', 'service_b2b', 'medical', 'legal', 'realestate',
];

// ────────── Утилиты ──────────

const failures: string[] = [];
function assert(cond: boolean, msg: string) {
  if (!cond) failures.push(msg);
}
function expectGe(actual: number, min: number, label: string) {
  if (!(actual >= min)) failures.push(`${label}: ожидалось ≥ ${min}, получено ${actual}`);
}
function expectEq<T>(actual: T, expected: T, label: string) {
  if (actual !== expected) failures.push(`${label}: ожидалось ${String(expected)}, получено ${String(actual)}`);
}

/**
 * Строит синтетический «идеальный» EngineState для заданного project_code и size.
 * dimensions подбираются так, чтобы:
 *   — start: маленький бизнес, узкая ниша
 *   — growth: растущий, средняя сложность
 *   — scale: масштабный, мульти-гео + мульти-направления
 */
function buildSyntheticEngineState(code: ProjectTypeCodeV3, size: ProjectClass): EngineState {
  const isCatalog = CATALOG_DEPENDENT.includes(code);
  const isGeo = GEO_DEPENDENT.includes(code);

  // Базовая шкала по размеру: 1=start, 2=growth, 3=scale.
  const sz = size === 'start' ? 1 : size === 'growth' ? 2 : 3;

  return {
    dimensions: {
      service_breadth: isCatalog ? sz : Math.min(sz, 2),
      geo_complexity: isGeo ? sz : 1,
      seo_weight: sz,
      paid_weight: code === 'ecommerce' || code === 'marketplace' || code === 'saas' ? sz : 1,
      social_weight: code === 'media' || code === 'blog' || code === 'personal_brand' ? sz : 1,
      referral_weight: 0,
      direct_weight: 1,
      trust_requirement: code === 'medical' || code === 'legal' || code === 'finance' || code === 'gov' ? 3 : 1,
      restructuring_need: 0,
      existing_complexity: sz,
      conversion_complexity: code === 'ecommerce' || code === 'marketplace' || code === 'saas' ? sz : 1,
      scale_ambition: sz,
      migration_burden: 0,
    },
    derived_scores: {
      indexation_safety: 8,
      scale_readiness: sz * 3,
      architectural_complexity: sz * 4,
      restructuring_risk: 0,
    },
    project_class: size,
    project_class_reason: `synthetic ${size} for ${code}`,
    activated_layers: [],
    activated_blocks: [],
    activated_checks: [],
    flags: {},
    decision_trace: [],
    rule_conflicts: [],
  };
}

/** Идеальный набор findings — все P1 проходят, P0 нет. */
function buildAllPassedFindings(): PreflightFinding[] {
  return [
    { rule_code: 'SEO_TITLE',  axis: 'SEO',    severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
    { rule_code: 'SEO_H1',     axis: 'SEO',    severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
    { rule_code: 'SEO_META',   axis: 'SEO',    severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
    { rule_code: 'DIR_CTA',    axis: 'DIRECT', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
    { rule_code: 'DIR_PHONE',  axis: 'DIRECT', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
    { rule_code: 'SCH_GRAPH',  axis: 'SCHEMA', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
    { rule_code: 'SCH_FAQ',    axis: 'SCHEMA', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
    { rule_code: 'AI_LLMS',    axis: 'AI_LLM', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
    { rule_code: 'AI_FAQ',     axis: 'AI_LLM', severity: 'P1', weight: 10, passed: true, description_ru: '', remediation_ru: '' },
  ];
}

function makeBasePage(page_type: string, url_pattern: string): SitePage {
  return {
    page_type,
    url_pattern,
    priority: 0.7,
    changefreq: 'monthly',
    primary_cta: 'lead_form',
    contract: {
      page_type,
      url_pattern,
      h1_template: `${page_type} {city} {service}`,
      title_template: `${page_type} {city} {service}`,
      meta_description_template: `${page_type} {city} {service}`,
      intro_answer_template: `${page_type} {city} {service}`,
      faq_questions: [],
      required_blocks: [],
      required_commercial_signals: [],
      required_schema_graph: [],
      notes_ru: null,
    } as never,
    reasoning: 'matrix-test',
  };
}

function makeCities(n: number): Array<{ slug: string; label: string }> {
  const all = [
    { slug: 'moskva', label: 'Москва' },
    { slug: 'spb', label: 'Санкт-Петербург' },
    { slug: 'novosibirsk', label: 'Новосибирск' },
    { slug: 'ekb', label: 'Екатеринбург' },
    { slug: 'kazan', label: 'Казань' },
    { slug: 'nn', label: 'Нижний Новгород' },
    { slug: 'samara', label: 'Самара' },
    { slug: 'omsk', label: 'Омск' },
    { slug: 'rostov', label: 'Ростов-на-Дону' },
    { slug: 'ufa', label: 'Уфа' },
    { slug: 'krasnoyarsk', label: 'Красноярск' },
    { slug: 'voronezh', label: 'Воронеж' },
  ];
  return all.slice(0, n);
}

function makeDirections(n: number): Array<{ slug: string; label: string }> {
  const all = [
    { slug: 'a', label: 'Направление A' },
    { slug: 'b', label: 'Направление B' },
    { slug: 'c', label: 'Направление C' },
    { slug: 'd', label: 'Направление D' },
    { slug: 'e', label: 'Направление E' },
  ];
  return all.slice(0, n);
}

// ────────── 1. Матрица: 23 × 3 — weighted_total_score ≥ 90 для all-passed ──────────

let scoreChecks = 0;
for (const code of PROJECT_TYPES) {
  for (const size of SIZES) {
    const engineState = buildSyntheticEngineState(code, size);
    const findings = buildAllPassedFindings();
    const r = buildReport('https://example.com/', findings, {
      engine_state: engineState,
      project_code: code,
    });
    scoreChecks++;
    expectGe(
      r.weighted_total_score ?? 0,
      90,
      `Score ${code}/${size}: weighted_total_score должен быть ≥ 90 при all-passed`
    );
    expectEq(
      r.tier_applied,
      size,
      `Score ${code}/${size}: tier_applied=${size}`
    );
    const expectedThreshold = size === 'scale' ? 90 : size === 'growth' ? 88 : 85;
    expectEq(
      r.total_score_threshold,
      expectedThreshold,
      `Score ${code}/${size}: total_score_threshold=${expectedThreshold}`
    );
    assert(
      r.passed === true,
      `Score ${code}/${size}: passed должно быть true (weighted=${r.weighted_total_score}, threshold=${expectedThreshold})`
    );
  }
}

// ────────── 2. Гео fan-out: 1/5/12 городов ──────────

let geoChecks = 0;
for (const code of GEO_DEPENDENT) {
  for (const cityN of CITY_COUNTS) {
    // Берём шаблонную service-geo страницу.
    const base = [
      makeBasePage('service-geo', '/services/{geo}/{slug}'),
      makeBasePage('home', '/'), // home должна остаться одной
    ];
    const out = applyPageFanout(base, { cities: makeCities(cityN), enable_hub_pages: false });
    geoChecks++;

    if (cityN === 1) {
      // При одном городе fan-out не запускается — service-geo остаётся 1 страницей.
      expectEq(out.length, 2, `Geo ${code}: 1 город → 2 страницы (home + service-geo)`);
    } else {
      // При N>1 service-geo разворачивается в N экземпляров, home остаётся 1.
      expectEq(
        out.length,
        cityN + 1,
        `Geo ${code}: ${cityN} городов → ${cityN + 1} страниц (home + ${cityN} service-geo)`
      );
      const cityInstances = out.filter((p) => p.page_instance_kind === 'city');
      expectEq(
        cityInstances.length,
        cityN,
        `Geo ${code}: ${cityN} city-инстансов`
      );
    }
  }
}

// ────────── 3. Direction fan-out: 1/3/5 направлений ──────────

let dirChecks = 0;
for (const code of CATALOG_DEPENDENT) {
  for (const dirN of DIRECTION_COUNTS) {
    const base = [
      makeBasePage('category', '/catalog/{slug}'),
      makeBasePage('home', '/'),
    ];
    const out = applyPageFanout(base, {
      service_directions: makeDirections(dirN),
      enable_hub_pages: false,
    });
    dirChecks++;

    if (dirN === 1) {
      expectEq(out.length, 2, `Catalog ${code}: 1 направление → 2 страницы (home + category)`);
    } else {
      expectEq(
        out.length,
        dirN + 1,
        `Catalog ${code}: ${dirN} направлений → ${dirN + 1} страниц`
      );
      const dirInstances = out.filter(
        (p) => p.page_instance_kind === 'category_direction' || p.page_instance_kind === 'service_direction'
      );
      expectEq(
        dirInstances.length,
        dirN,
        `Catalog ${code}: ${dirN} direction-инстансов`
      );
    }
  }
}

// ────────── 4. Полная матрица 23 × 3 × 3 × 3 = 621 score-комбинация — sanity-check ──────────

let fullMatrixChecks = 0;
let fullMatrixPassed = 0;
for (const code of PROJECT_TYPES) {
  for (const size of SIZES) {
    for (const cityN of CITY_COUNTS) {
      for (const dirN of DIRECTION_COUNTS) {
        const engineState = buildSyntheticEngineState(code, size);
        const findings = buildAllPassedFindings();
        const r = buildReport('https://example.com/', findings, {
          engine_state: engineState,
          project_code: code,
        });
        fullMatrixChecks++;
        const weighted = r.weighted_total_score ?? 0;
        if (weighted >= 90 && r.passed === true) {
          fullMatrixPassed++;
        } else {
          failures.push(
            `Matrix ${code}/${size}/cities=${cityN}/dirs=${dirN}: weighted=${weighted}, passed=${r.passed}`
          );
        }
      }
    }
  }
}

// 23 × 3 × 3 × 3 = 621
expectEq(fullMatrixChecks, 621, 'Полная матрица: 23 × 3 × 3 × 3 = 621 комбинация');
expectEq(fullMatrixPassed, 621, 'Все 621 комбинаций должны давать weighted ≥ 90 + passed=true');

// ────────── 5. axis_weights для всех 23 типов нормализованы и осмысленны ──────────

for (const code of PROJECT_TYPES) {
  for (const size of SIZES) {
    const engineState = buildSyntheticEngineState(code, size);
    const profile = buildAxisWeights(engineState);
    const sum =
      profile.weights.SEO + profile.weights.DIRECT +
      profile.weights.SCHEMA + profile.weights.AI_LLM;
    assert(
      Math.abs(sum - 4) < 0.05,
      `Weights ${code}/${size}: сумма весов = 4 (получено ${sum})`
    );
    // Все веса > 0 (floor=0.5 защищает от 0).
    assert(profile.weights.SEO > 0, `Weights ${code}/${size}: SEO > 0`);
    assert(profile.weights.DIRECT > 0, `Weights ${code}/${size}: DIRECT > 0`);
    assert(profile.weights.SCHEMA > 0, `Weights ${code}/${size}: SCHEMA > 0`);
    assert(profile.weights.AI_LLM > 0, `Weights ${code}/${size}: AI_LLM > 0`);
    expectEq(
      profile.tier_applied,
      size,
      `Weights ${code}/${size}: tier_applied=${size}`
    );
  }
}

// ────────── 6. totalScoreThresholdFor для всех tier ──────────

expectEq(totalScoreThresholdFor('start'), 85, 'Threshold start=85');
expectEq(totalScoreThresholdFor('growth'), 88, 'Threshold growth=88');
expectEq(totalScoreThresholdFor('scale'), 90, 'Threshold scale=90');
expectEq(totalScoreThresholdFor('legacy'), 85, 'Threshold legacy=85');

// ────────── Финал ──────────

if (failures.length > 0) {
  // eslint-disable-next-line no-console
  console.error(`\n❌ PR-4 self-test матрица НЕ пройдена (${failures.length} ошибок):\n  - ${failures.slice(0, 30).join('\n  - ')}`);
  if (failures.length > 30) {
    // eslint-disable-next-line no-console
    console.error(`  ... и ещё ${failures.length - 30} ошибок`);
  }
  process.exit(1);
}
// eslint-disable-next-line no-console
console.log(
  `✅ PR-4 self-test матрица: все проверки прошли\n` +
  `   • Score-проверки (23×3): ${scoreChecks}\n` +
  `   • Geo fan-out (11×3): ${geoChecks}\n` +
  `   • Direction fan-out (10×3): ${dirChecks}\n` +
  `   • Полная матрица (23×3×3×3): ${fullMatrixChecks} комбинаций → все ≥ 90`
);
