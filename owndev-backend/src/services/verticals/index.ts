/**
 * services/verticals — loader для отраслевых профилей VerticalProfile.
 *
 * 23 профиля, по одному на каждый ProjectTypeCodeV3, лежат в
 * profiles/all.json и подгружаются один раз через createRequire.
 *
 * Использование:
 *   import { getVerticalProfile, listVerticalProfiles } from './verticals/index.js';
 *   const profile = getVerticalProfile('service_geo');
 *   if (profile) { console.log(profile.kpi.cpa_rub); }
 *
 * Загрузка совместима с tsx (src) и c dist (build):
 *   - createRequire от import.meta.url стабильно работает в обоих случаях;
 *   - JSON копируется в dist через тот же шаг build, что и demand/profiles/*.json.
 */

import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { logger } from '../../utils/logger.js';
import type { ProjectTypeCodeV3 } from '../../types/formulaV3.js';
import type { VerticalProfile, SeasonalityVector } from './types.js';

const require = createRequire(import.meta.url);
const here = path.dirname(fileURLToPath(import.meta.url));

function loadAll(): VerticalProfile[] {
  try {
    const raw = require(path.join(here, 'profiles/all.json')) as unknown;
    if (!Array.isArray(raw)) {
      logger.warn('VERTICAL_PROFILES', 'all.json is not an array');
      return [];
    }
    const valid: VerticalProfile[] = [];
    for (const r of raw) {
      const p = normalize(r);
      if (p) valid.push(p);
    }
    logger.info('VERTICAL_PROFILES', `loaded ${valid.length} profiles: ${valid.map((p) => p.project_code).join(', ')}`);
    return valid;
  } catch (e) {
    logger.warn('VERTICAL_PROFILES', `failed to load all.json: ${(e as Error).message}`);
    return [];
  }
}

function normalize(raw: unknown): VerticalProfile | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<VerticalProfile>;
  if (typeof r.project_code !== 'string') return null;
  if (typeof r.title_ru !== 'string') return null;
  if (typeof r.description_ru !== 'string') return null;
  if (typeof r.monetization !== 'string') return null;
  if (!r.intent_distribution || typeof r.intent_distribution !== 'object') return null;
  if (!Array.isArray(r.seasonality) || r.seasonality.length !== 12) return null;
  if (!r.kpi || typeof r.kpi !== 'object') return null;
  if (!r.benchmarks || typeof r.benchmarks !== 'object') return null;
  if (!Array.isArray(r.demand_triggers)) return null;
  return r as VerticalProfile;
}

let CACHE: VerticalProfile[] | null = null;

function ensureCache(): VerticalProfile[] {
  if (!CACHE) CACHE = loadAll();
  return CACHE;
}

/**
 * Возвращает отраслевой профиль для заданного project_code.
 * Если профиля нет — возвращает null (и логирует один раз).
 */
export function getVerticalProfile(code: ProjectTypeCodeV3): VerticalProfile | null {
  const all = ensureCache();
  return all.find((p) => p.project_code === code) ?? null;
}

/** Возвращает все 23 профиля. */
export function listVerticalProfiles(): VerticalProfile[] {
  return [...ensureCache()];
}

/**
 * Берёт коэффициент сезонности для конкретного месяца (1..12).
 * Если профиля нет — возвращает 1.0 (нейтральный).
 */
export function seasonalityFactor(code: ProjectTypeCodeV3, month: number): number {
  const profile = getVerticalProfile(code);
  if (!profile) return 1.0;
  const idx = Math.max(0, Math.min(11, month - 1));
  return (profile.seasonality as SeasonalityVector)[idx] ?? 1.0;
}

/**
 * Утилита для PRO-отчёта: возвращает осмысленные строки KPI на русском.
 * Полезно для рендера блока «KPI вашей ниши».
 */
export function formatKpiSummary(code: ProjectTypeCodeV3): string[] {
  const profile = getVerticalProfile(code);
  if (!profile) return [];
  const lines: string[] = [];
  const kpi = profile.kpi;
  if (kpi.cr_visit_to_lead !== undefined) {
    lines.push(`Конверсия в лид: ~${(kpi.cr_visit_to_lead * 100).toFixed(1)}%`);
  }
  if (kpi.cr_lead_to_sale !== undefined) {
    lines.push(`Конверсия в продажу: ~${(kpi.cr_lead_to_sale * 100).toFixed(0)}%`);
  }
  if (kpi.average_order_rub !== undefined && kpi.average_order_rub > 0) {
    lines.push(`Средний чек: ~${kpi.average_order_rub.toLocaleString('ru-RU')} ₽`);
  }
  if (kpi.cpa_rub !== undefined && kpi.cpa_rub > 0) {
    lines.push(`CPA (стоимость лида): ~${kpi.cpa_rub.toLocaleString('ru-RU')} ₽`);
  }
  if (kpi.ltv_rub !== undefined && kpi.ltv_rub > 0) {
    lines.push(`LTV: ~${kpi.ltv_rub.toLocaleString('ru-RU')} ₽`);
  }
  if (kpi.frequency_index !== undefined) {
    lines.push(`Частотный индекс: ${kpi.frequency_index}/100`);
  }
  if (kpi.sales_cycle_days !== undefined && kpi.sales_cycle_days > 0) {
    lines.push(`Цикл сделки: ~${kpi.sales_cycle_days} дн.`);
  }
  return lines;
}
