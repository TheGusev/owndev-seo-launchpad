/**
 * services/pipeline/proReportBuilder.ts
 *
 * PR-6 «Фронт + отчёт»: собирает блок PRO-отчёта для отдачи на фронт.
 *
 * На вход:
 *   • input  — PipelineInput (для project_code, engine_state, demand-сигналов)
 *   • result — частично собранный PipelineResultV3 (pages, demand, preflight rollup)
 *
 * На выход — ProReportV3, который кладётся в result.pro_report.
 *
 * Правила:
 *   • Без engine_state и без vertical_profile — возвращаем undefined (нечего показывать).
 *   • Если есть только vertical_profile (engine_state нет) — отдаём KPI и ROI без project_class.
 *   • ROI считаем только при наличии хотя бы demand.total_volume или preflight.total_pages.
 */

import type { PipelineInput, PipelineResultV3, ProReportV3 } from './types.js';
import { getVerticalProfile, formatKpiSummary } from '../verticals/index.js';
import type { SeasonalityVector, VerticalProfile } from '../verticals/types.js';
import type { DemandIntelligenceResult } from '../demand/types.js';

export function buildProReport(
  input: PipelineInput,
  result: PipelineResultV3,
): ProReportV3 | undefined {
  const profile = getVerticalProfile(input.project_code);
  const engineState = input.engine_state;

  // Если ни профиля, ни engine_state — нечего показывать.
  if (!profile && !engineState) return undefined;

  const report: ProReportV3 = {};

  // ── Decision trace и project_class из v1 ──
  if (engineState) {
    report.project_class = engineState.project_class;
    report.project_class_reason = engineState.project_class_reason;
    if (Array.isArray(engineState.decision_trace) && engineState.decision_trace.length > 0) {
      // Ограничим первыми 50 решениями, чтобы не раздувать payload.
      report.decision_trace = engineState.decision_trace.slice(0, 50) as unknown as ProReportV3['decision_trace'];
    }
  }

  // ── Vertical profile + KPI summary ──
  if (profile) {
    report.vertical_profile = profile;
    report.kpi_summary = formatKpiSummary(input.project_code);
  }

  // ── Axis weights и threshold (зеркалим preflight) ──
  if (result.preflight_per_page && result.preflight_per_page.length > 0) {
    const sample = result.preflight_per_page[0];
    if (sample.axis_weights) report.axis_weights = sample.axis_weights;
    if (sample.total_score_threshold !== undefined) {
      report.total_score_threshold = sample.total_score_threshold;
    }
  }

  // ── ROI estimate ──
  if (profile) {
    const kpi = profile.kpi;

    // Оценка месячных визитов: суммарная частотность кластеров × расчётная доля кликов.
    const totalVolume = result.demand?.total_volume ?? 0;
    // Базовая CTR в топ-3 РФ: ~25 %; берём оценочную долю 0.18 как «реалистично достижимый ctr × cap».
    const expectedVisits = totalVolume > 0
      ? Math.round(totalVolume * 0.18)
      : (result.preflight_rollup?.total_pages ?? 0) * 30; // fallback: 30 визитов в мес/страницу

    if (expectedVisits > 0) {
      const visits = expectedVisits;
      const cr1 = kpi.cr_visit_to_lead ?? 0;
      const cr2 = kpi.cr_lead_to_sale ?? 0;
      const aov = kpi.average_order_rub ?? 0;
      const cpa = kpi.cpa_rub ?? 0;

      const leads = Math.round(visits * cr1);
      const sales = Math.round(leads * cr2);
      const revenue = Math.round(sales * aov);
      const acqCost = Math.round(leads * cpa);

      const rationaleParts: string[] = [];
      if (totalVolume > 0) {
        rationaleParts.push(
          `На основе спроса: ${totalVolume.toLocaleString('ru-RU')} показов/мес × 18% CTR = ~${visits.toLocaleString('ru-RU')} визитов`
        );
      } else {
        rationaleParts.push(
          `На основе ${result.preflight_rollup?.total_pages ?? 0} страниц × 30 визитов/мес = ~${visits.toLocaleString('ru-RU')} визитов`
        );
      }
      if (cr1 > 0) rationaleParts.push(`Лиды: ${(cr1 * 100).toFixed(1)}% от визитов = ~${leads.toLocaleString('ru-RU')}`);
      if (cr2 > 0) rationaleParts.push(`Продажи: ${(cr2 * 100).toFixed(0)}% от лидов = ~${sales.toLocaleString('ru-RU')}`);
      if (aov > 0) rationaleParts.push(`Доход: продажи × ${aov.toLocaleString('ru-RU')} ₽ = ~${revenue.toLocaleString('ru-RU')} ₽/мес`);

      report.roi_estimate = {
        expected_monthly_visits: visits,
        expected_monthly_leads: leads > 0 ? leads : undefined,
        expected_monthly_sales: sales > 0 ? sales : undefined,
        expected_monthly_revenue_rub: revenue > 0 ? revenue : undefined,
        expected_monthly_acquisition_cost_rub: acqCost > 0 ? acqCost : undefined,
        rationale_ru: rationaleParts.join('. '),
      };
    }
  }

  // ── PR-7: рынок / реклама / сезонность ──
  if (profile) {
    report.ad_market_estimate = buildAdMarketEstimate(profile, result.demand);
  }

  return report;
}

/**
 * Считает рекламно-рыночный блок:
 *   - CPC и payback берем из бенчмарков ниши;
 *   - доля транзакционных интентов — из demand.clusters (transactional + local + commercial);
 *     если demand отсутствует — из profile.intent_distribution;
 *   - бюджет Я.Директа = volume_hot × CPC, где hot = total_volume × transactional_share × 0.18 (CTR);
 *   - competition_level — комбинация CPC-порога и transactional_share;
 *   - seasonality — из вектора ниши (текущий месяц, пик, яма).
 *
 * Важно: никаких вызовов Wordstat или внешних API — всё из уже собранного demand-снэпшота и бенчмарков.
 */
function buildAdMarketEstimate(
  profile: VerticalProfile,
  demand: DemandIntelligenceResult | undefined,
): NonNullable<ProReportV3['ad_market_estimate']> {
  const cpc = profile.benchmarks.cpc_high_intent_rub ?? 0;
  const seoPayback = profile.benchmarks.seo_payback_months;

  // Доля горячего спроса.
  const transactional_share = computeTransactionalShare(profile, demand);

  // Оценка бюджета Я.Директа.
  let monthly_paid_budget_rub: number | undefined;
  if (cpc > 0) {
    const totalVolume = demand?.total_volume ?? 0;
    if (totalVolume > 0) {
      const hotVolume = totalVolume * transactional_share;
      // CTR в рекламе Я.Директа обычно выше органики в SERP — берём базовые 18%.
      const expectedClicks = Math.round(hotVolume * 0.18);
      monthly_paid_budget_rub = Math.round(expectedClicks * cpc);
    }
  }

  // Уровень конкурентности.
  const competition_level = computeCompetitionLevel(cpc, transactional_share);

  // Сезонность.
  const month = new Date().getUTCMonth(); // 0..11
  const seasonality_now = profile.seasonality[month] ?? 1.0;
  const { peak, low } = findSeasonalityExtrema(profile.seasonality);

  // Рационале.
  const parts: string[] = [];
  if (cpc > 0) {
    parts.push(`CPC в нише «${profile.title_ru}» — около ${cpc.toLocaleString('ru-RU')} ₽ за клик по горячим запросам`);
  }
  parts.push(`Доля горячего спроса: ~${(transactional_share * 100).toFixed(0)}%`);
  if (monthly_paid_budget_rub !== undefined) {
    parts.push(`Бюджет Я.Директа на горячую долю: ~${monthly_paid_budget_rub.toLocaleString('ru-RU')} ₽/мес`);
  }
  parts.push(`Конкуренция: ${competitionLabelRu(competition_level)}`);
  if (seasonality_now !== 1.0) {
    const pct = Math.round((seasonality_now - 1) * 100);
    parts.push(`Сезонность сейчас: ${pct >= 0 ? '+' : ''}${pct}% к среднегодовому`);
  }
  if (peak.factor > 1.0) {
    parts.push(`Пик сезона: ${monthName(peak.month)} (×${peak.factor.toFixed(2)})`);
  }
  if (seoPayback !== undefined && seoPayback > 0) {
    parts.push(`Окупаемость SEO: ~${seoPayback} мес`);
  }

  return {
    cpc_high_intent_rub: cpc > 0 ? cpc : undefined,
    transactional_share: round2(transactional_share),
    monthly_paid_budget_rub,
    competition_level,
    seo_payback_months: seoPayback,
    seasonality_now: round2(seasonality_now),
    seasonality_peak: peak.factor > 0 ? { month: peak.month, factor: round2(peak.factor) } : undefined,
    seasonality_low: low.factor > 0 ? { month: low.month, factor: round2(low.factor) } : undefined,
    rationale_ru: parts.join('. '),
  };
}

function computeTransactionalShare(
  profile: VerticalProfile,
  demand: DemandIntelligenceResult | undefined,
): number {
  // Сначала пробуем из demand: доля кластеров с интентами transactional/commercial/local.
  if (demand && Array.isArray(demand.clusters) && demand.clusters.length > 0) {
    let hotFreq = 0;
    let totalFreq = 0;
    for (const c of demand.clusters) {
      const f = c.total_frequency ?? 0;
      totalFreq += f;
      if (c.intent === 'transactional' || c.intent === 'commercial' || c.intent === 'local') {
        hotFreq += f;
      }
    }
    if (totalFreq > 0) return clamp01(hotFreq / totalFreq);
  }
  // Fallback: из профиля вертикали.
  const id = profile.intent_distribution;
  const hot = (id.transactional ?? 0) + (id.commercial ?? 0) + (id.local ?? 0);
  return clamp01(hot);
}

function computeCompetitionLevel(cpc: number, transactionalShare: number): 'low' | 'medium' | 'high' {
  // CPC эвристика: <100 ₽ — low, 100..300 ₽ — medium, >300 ₽ — high.
  // Смещаем по доле горячего спроса: больше транзакционных = выше конкуренция.
  let score = 0;
  if (cpc >= 300) score += 2;
  else if (cpc >= 100) score += 1;
  if (transactionalShare >= 0.7) score += 1;
  else if (transactionalShare >= 0.4) score += 0.5;
  if (score >= 2.5) return 'high';
  if (score >= 1) return 'medium';
  return 'low';
}

function findSeasonalityExtrema(vec: SeasonalityVector): {
  peak: { month: number; factor: number };
  low: { month: number; factor: number };
} {
  let peakMonth = 1;
  let peakFactor = -Infinity;
  let lowMonth = 1;
  let lowFactor = Infinity;
  for (let i = 0; i < 12; i++) {
    const f = vec[i] ?? 1.0;
    if (f > peakFactor) {
      peakFactor = f;
      peakMonth = i + 1;
    }
    if (f < lowFactor) {
      lowFactor = f;
      lowMonth = i + 1;
    }
  }
  return {
    peak: { month: peakMonth, factor: peakFactor === -Infinity ? 0 : peakFactor },
    low: { month: lowMonth, factor: lowFactor === Infinity ? 0 : lowFactor },
  };
}

function monthName(m: number): string {
  const names = ['январь', 'февраль', 'март', 'апрель', 'май', 'июнь', 'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь'];
  return names[Math.max(0, Math.min(11, m - 1))] ?? '';
}

function competitionLabelRu(level: 'low' | 'medium' | 'high'): string {
  if (level === 'low') return 'низкая';
  if (level === 'medium') return 'средняя';
  return 'высокая';
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function clamp01(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
