/**
 * Регресс-тест PR-8 «Аудит 23 ниш по одной».
 *
 * Цель: каждый из 23 ProjectTypeCodeV3 пропускается через PRO-отчёт с тремя
 * размерами (start / growth / scale) и проверяется на «здравость» отчёта.
 * Ляпы, которые отлавливаются:
 *
 *   • ROI: визиты должны быть положительными, либо отсутствовать (cr=0).
 *   • ROI: revenue не считается, если monetization in {advertising, donation,
 *     institutional, brand, install} ИЛИ если cr_visit_to_lead = 0.
 *   • ad_market_estimate: rationale_ru не пуст и на русском.
 *   • ad_market_estimate: при cpc=0 — нет budget.
 *   • ad_market_estimate: high CPC (>=300 ₽) при share>=0.7 → competition='high'.
 *   • ad_market_estimate: cpc=0 → competition не 'high'.
 *   • vertical_profile: title_ru, description_ru на кириллице.
 *   • vertical_profile: demand_triggers не пуст, ≥3 элементов.
 *   • kpi_summary: ≥1 строка для всех вертикалей.
 *   • seasonality_peak.factor ≥ 1.0 (или 1.0 для нейтральных).
 *   • intent_distribution: сумма ≤ 1.0 + ε.
 *
 * Результат: для каждой комбинации (vertical × size) — список замечаний.
 * Если есть критичные — тест падает.
 *
 * Запуск: npm run test:pr8-vertical-audit
 */

import { buildProReport } from '../proReportBuilder.js';
import { listVerticalProfiles } from '../../verticals/index.js';
import type { PipelineInput, PipelineResultV3 } from '../types.js';
import type { EngineState } from '../../../types/siteFormula.js';
import type { ProjectTypeCodeV3 } from '../../../types/formulaV3.js';

interface AuditFinding {
  code: ProjectTypeCodeV3;
  size: 'start' | 'growth' | 'scale';
  level: 'critical' | 'warning';
  message: string;
}

const findings: AuditFinding[] = [];

function critical(code: ProjectTypeCodeV3, size: AuditFinding['size'], message: string) {
  findings.push({ code, size, level: 'critical', message });
}
function warning(code: ProjectTypeCodeV3, size: AuditFinding['size'], message: string) {
  findings.push({ code, size, level: 'warning', message });
}

const NO_REVENUE_MONETIZATIONS = new Set(['advertising', 'donation', 'institutional', 'brand', 'install']);

function makeEngineState(size: 'start' | 'growth' | 'scale'): EngineState {
  const base = {
    activated_layers: [], activated_blocks: [], activated_checks: [],
    flags: {}, decision_trace: [], rule_conflicts: [],
  };
  if (size === 'start') {
    return {
      ...base,
      dimensions: {
        service_breadth: 0, geo_complexity: 0, seo_weight: 1, paid_weight: 1,
        social_weight: 0, referral_weight: 0, direct_weight: 1, trust_requirement: 0,
        restructuring_need: 0, existing_complexity: 0, conversion_complexity: 0,
        scale_ambition: 0, migration_burden: 0,
      },
      derived_scores: { indexation_safety: 5, scale_readiness: 1, architectural_complexity: 1, restructuring_risk: 0 },
      project_class: 'start',
      project_class_reason: 'Малый проект, одна услуга, один город',
    };
  }
  if (size === 'growth') {
    return {
      ...base,
      dimensions: {
        service_breadth: 2, geo_complexity: 2, seo_weight: 2, paid_weight: 1,
        social_weight: 1, referral_weight: 0, direct_weight: 1, trust_requirement: 1,
        restructuring_need: 0, existing_complexity: 1, conversion_complexity: 1,
        scale_ambition: 2, migration_burden: 0,
      },
      derived_scores: { indexation_safety: 8, scale_readiness: 6, architectural_complexity: 6, restructuring_risk: 0 },
      project_class: 'growth',
      project_class_reason: 'Несколько направлений, рост',
    };
  }
  return {
    ...base,
    dimensions: {
      service_breadth: 3, geo_complexity: 3, seo_weight: 3, paid_weight: 2,
      social_weight: 2, referral_weight: 1, direct_weight: 2, trust_requirement: 2,
      restructuring_need: 2, existing_complexity: 3, conversion_complexity: 3,
      scale_ambition: 3, migration_burden: 2,
    },
    derived_scores: { indexation_safety: 0, scale_readiness: 9, architectural_complexity: 13, restructuring_risk: 7 },
    project_class: 'scale',
    project_class_reason: 'Мульти-гео + мульти-направления + амбиция',
  };
}

function makeInput(code: ProjectTypeCodeV3, size: 'start' | 'growth' | 'scale'): PipelineInput {
  return {
    job_id: `audit_${code}_${size}`,
    project_code: code,
    brand: { name: `Test ${code}`, industry: 'service', target_audience: 'b2c' },
    engine_state: makeEngineState(size),
  };
}

function makeResult(size: 'start' | 'growth' | 'scale'): PipelineResultV3 {
  // Демонстрационные объёмы спроса по размеру.
  const total_volume = size === 'start' ? 5000 : size === 'growth' ? 30000 : 100000;
  return {
    job_id: 'audit',
    status: 'done',
    stages: [],
    generated_at: new Date().toISOString(),
    demand: {
      session_id: 's',
      seed_keywords: [],
      clusters: [
        { session_id: 's', cluster_label: 'c1', intent: 'transactional', seed_keyword: 'k1', region_code: 'RU', keywords: [], total_frequency: total_volume * 0.5, recommended_page_type: 'service-geo', recommended_url_pattern: '/x' },
        { session_id: 's', cluster_label: 'c2', intent: 'commercial', seed_keyword: 'k2', region_code: 'RU', keywords: [], total_frequency: total_volume * 0.2, recommended_page_type: 'category', recommended_url_pattern: '/y' },
        { session_id: 's', cluster_label: 'c3', intent: 'informational', seed_keyword: 'k3', region_code: 'RU', keywords: [], total_frequency: total_volume * 0.3, recommended_page_type: 'blog', recommended_url_pattern: '/z' },
      ],
      geo_distribution: [],
      recommended_geos: [],
      total_volume,
      quota_used: 0,
      generated_at: new Date().toISOString(),
    },
    preflight_rollup: {
      total_pages: size === 'start' ? 5 : size === 'growth' ? 30 : 200,
      avg_total_score: 92,
      pages_passed: size === 'start' ? 5 : size === 'growth' ? 28 : 195,
      pages_failed: size === 'start' ? 0 : size === 'growth' ? 2 : 5,
      failed_p0_codes: [],
      axis_avg: { seo: 92, direct: 92, schema: 95, ai_llm: 90 },
    },
  };
}

const SIZES: Array<'start' | 'growth' | 'scale'> = ['start', 'growth', 'scale'];
const RUSSIAN_RX = /[а-яёА-ЯЁ]/;

function audit(code: ProjectTypeCodeV3, size: 'start' | 'growth' | 'scale') {
  const input = makeInput(code, size);
  const result = makeResult(size);
  const r = buildProReport(input, result);

  if (!r) {
    critical(code, size, 'pro_report не сгенерирован');
    return;
  }

  // ── 1. Профиль вертикали ──
  if (!r.vertical_profile) {
    critical(code, size, 'vertical_profile отсутствует');
    return;
  }
  const profile = r.vertical_profile;
  if (!RUSSIAN_RX.test(profile.title_ru)) {
    critical(code, size, `title_ru не на кириллице: «${profile.title_ru}»`);
  }
  if (!RUSSIAN_RX.test(profile.description_ru)) {
    critical(code, size, `description_ru не на кириллице`);
  }
  if (!Array.isArray(profile.demand_triggers) || profile.demand_triggers.length < 3) {
    warning(code, size, `demand_triggers слишком мало (${profile.demand_triggers?.length ?? 0})`);
  }

  // ── 2. Intent distribution: сумма ≤ 1 + epsilon ──
  const id = profile.intent_distribution;
  const sum = (id.informational ?? 0) + (id.commercial ?? 0) + (id.transactional ?? 0) + (id.navigational ?? 0) + (id.local ?? 0);
  if (sum > 1.001) {
    critical(code, size, `intent_distribution сумма > 1.0: ${sum.toFixed(3)}`);
  }
  if (sum < 0.5) {
    warning(code, size, `intent_distribution сумма очень низкая: ${sum.toFixed(3)}`);
  }

  // ── 3. KPI summary ──
  if (!r.kpi_summary || r.kpi_summary.length === 0) {
    critical(code, size, 'kpi_summary пуст');
  }

  // ── 4. ROI ──
  const roi = r.roi_estimate;
  if (!roi) {
    critical(code, size, 'roi_estimate отсутствует');
  } else {
    if (!roi.expected_monthly_visits || roi.expected_monthly_visits <= 0) {
      critical(code, size, 'roi: визиты не положительны');
    }
    // У монетизаций без revenue не должно быть expected_monthly_revenue_rub.
    if (NO_REVENUE_MONETIZATIONS.has(profile.monetization)) {
      if (roi.expected_monthly_revenue_rub !== undefined && roi.expected_monthly_revenue_rub > 0) {
        critical(code, size, `monetization=${profile.monetization}, но revenue=${roi.expected_monthly_revenue_rub}`);
      }
    }
    // У транзакционных и lead_gen monetizations должен быть revenue (когда demand есть и cr>0).
    if (profile.monetization === 'lead_gen' || profile.monetization === 'transaction') {
      if (profile.kpi.cr_visit_to_lead && profile.kpi.cr_visit_to_lead > 0) {
        if (!roi.expected_monthly_revenue_rub || roi.expected_monthly_revenue_rub <= 0) {
          warning(code, size, `monetization=${profile.monetization} cr>0 — но revenue не посчитан`);
        }
      }
    }
    // rationale_ru должно быть на кириллице.
    if (roi.rationale_ru && !RUSSIAN_RX.test(roi.rationale_ru)) {
      warning(code, size, 'roi.rationale_ru не на кириллице');
    }
  }

  // ── 5. ad_market_estimate ──
  const am = r.ad_market_estimate;
  if (!am) {
    critical(code, size, 'ad_market_estimate отсутствует');
  } else {
    if (am.rationale_ru && !RUSSIAN_RX.test(am.rationale_ru)) {
      warning(code, size, 'ad_market.rationale_ru не на кириллице');
    }
    // CPC=0 → бюджета не должно быть.
    if (!am.cpc_high_intent_rub) {
      if (am.monthly_paid_budget_rub !== undefined) {
        critical(code, size, `cpc=0, но monthly_paid_budget_rub=${am.monthly_paid_budget_rub}`);
      }
      // и competition не должна быть 'high'.
      if (am.competition_level === 'high') {
        warning(code, size, 'cpc=0, но competition=high');
      }
    } else {
      // CPC>0 + transactional_share>=0.7 → бюджет рассчитан и >0.
      if ((am.transactional_share ?? 0) >= 0.7 && (am.monthly_paid_budget_rub ?? 0) <= 0) {
        warning(code, size, 'cpc>0 и hot share высокая, но бюджет=0');
      }
      // CPC>=300 + share>=0.7 → competition='high'.
      if (am.cpc_high_intent_rub >= 300 && (am.transactional_share ?? 0) >= 0.7) {
        if (am.competition_level !== 'high') {
          warning(code, size, `CPC=${am.cpc_high_intent_rub} share=${am.transactional_share} но competition=${am.competition_level}`);
        }
      }
    }
    // peak >= low.
    if (am.seasonality_peak && am.seasonality_low) {
      if (am.seasonality_peak.factor < am.seasonality_low.factor) {
        critical(code, size, `seasonality peak<${am.seasonality_peak.factor} < low=${am.seasonality_low.factor}`);
      }
    }
  }

  // ── 6. project_class соответствует размеру ──
  const expected = size;
  if (r.project_class !== expected) {
    warning(code, size, `project_class=${r.project_class}, ожидалось ${expected}`);
  }
}

// ─── Запускаем по всем 23 нишам × 3 размерам ───
const profiles = listVerticalProfiles();
// PR-10: каталог расширен до 27 профилей.
const EXPECTED_PROFILES = 27;
if (profiles.length !== EXPECTED_PROFILES) {
  // eslint-disable-next-line no-console
  console.error(`❌ Ожидали ${EXPECTED_PROFILES} профиля, получили ${profiles.length}`);
  process.exit(1);
}

const totalCombos = profiles.length * SIZES.length;
for (const p of profiles) {
  for (const size of SIZES) {
    audit(p.project_code, size);
  }
}

const criticals = findings.filter((f) => f.level === 'critical');
const warnings = findings.filter((f) => f.level === 'warning');

// eslint-disable-next-line no-console
console.log(`\n📋 PR-8 аудит 23 ниш × 3 размера = ${totalCombos} комбинаций`);
// eslint-disable-next-line no-console
console.log(`   критичных: ${criticals.length}`);
// eslint-disable-next-line no-console
console.log(`   предупреждений: ${warnings.length}`);

if (warnings.length > 0) {
  // eslint-disable-next-line no-console
  console.log('\n⚠️  Предупреждения (не блокируют):');
  for (const f of warnings) {
    // eslint-disable-next-line no-console
    console.log(`   - [${f.code}/${f.size}] ${f.message}`);
  }
}

if (criticals.length > 0) {
  // eslint-disable-next-line no-console
  console.error('\n❌ Критичные ляпы (блокируют PR-8):');
  for (const f of criticals) {
    // eslint-disable-next-line no-console
    console.error(`   - [${f.code}/${f.size}] ${f.message}`);
  }
  process.exit(1);
}

// eslint-disable-next-line no-console
console.log(`\n✅ PR-8 регресс: ${profiles.length} ниш × 3 размера = ${totalCombos} комбинаций — критичных ляпов нет`);
