import type { EngineState, FullReportPayload, PriceEstimate, ReportSection, TemplateConfig } from '../../types/siteFormula.js';
import { activateReportBlocks } from './reportBlockActivator.js';
import { getRulesVersion, getTemplateVersion } from './configLoader.js';

export function buildFullReportPayload(
  state: EngineState,
  template: TemplateConfig
): FullReportPayload {
  const sections: ReportSection[] = activateReportBlocks(state, template);

  const traceSummary = state.decision_trace
    .filter((t) => t.condition_met)
    .map((t) => `[${t.priority}] ${t.reason_human}`);

  return {
    project_class: state.project_class,
    sections,
    decision_trace_summary: traceSummary,
    metadata: {
      rules_version: getRulesVersion(),
      template_version: getTemplateVersion(),
      generated_at: new Date().toISOString(),
    },
    price_estimate: calcPriceEstimate(state),
  };
}

function calcPriceEstimate(state: EngineState): PriceEstimate {
  const projectClass = state.project_class;
  const classLabel = projectClass.charAt(0).toUpperCase() + projectClass.slice(1);
  const dims = state.dimensions || ({} as Record<string, number>);
  const flags = state.flags || {};

  const base = projectClass === 'scale' ? 350000
    : projectClass === 'growth' ? 150000
    : 60000;

  let mult = 1.0;
  const breakdown: string[] = [];
  breakdown.push(`Базовая разработка (класс ${classLabel}): от ${base.toLocaleString('ru-RU')} ₽`);

  // Service breadth → каталог/услуги
  const serviceBreadth = Number(dims.service_breadth ?? 0);
  if (serviceBreadth >= 7) { mult += 0.4; breakdown.push('Широкий каталог услуг: +40%'); }
  else if (serviceBreadth >= 4) { mult += 0.2; breakdown.push('Средний каталог услуг: +20%'); }

  // Geo complexity
  const geo = Number(dims.geo_complexity ?? 0);
  if (geo >= 7) { mult += 0.3; breakdown.push('Мультигео (несколько регионов): +30%'); }
  else if (geo >= 4) { mult += 0.15; breakdown.push('Гео-структура (2–3 региона): +15%'); }

  // Conversion / integration complexity → CRM, формы, ЛК
  const conv = Number(dims.conversion_complexity ?? 0);
  if (conv >= 7) { mult += 0.5; breakdown.push('Интеграции (CRM/API, сложные формы): +50%'); }
  else if (conv >= 4) { mult += 0.2; breakdown.push('Базовые интеграции (CRM, формы): +20%'); }

  // Scale ambition / restructuring → ЛК и масштаб
  const scale = Number(dims.scale_ambition ?? 0);
  if (scale >= 7) { mult += 0.3; breakdown.push('Масштабируемая архитектура / личный кабинет: +30%'); }

  // Trust requirement → контент, сертификаты, кейсы
  const trust = Number(dims.trust_requirement ?? 0);
  if (trust >= 7) { mult += 0.2; breakdown.push('Высокие требования к контенту и доверию: +20%'); }

  // Migration burden
  const migration = Number(dims.migration_burden ?? 0);
  if (migration >= 7) { mult += 0.25; breakdown.push('Миграция со старого сайта: +25%'); }

  if (flags.requires_strict_indexation_policy) {
    mult += 0.1;
    breakdown.push('Строгая политика индексации: +10%');
  }

  const min = Math.max(base, Math.round((base * mult) / 10000) * 10000);
  const max = Math.round((min * 1.4) / 10000) * 10000;

  const roi_months = projectClass === 'scale' ? 6 : projectClass === 'growth' ? 4 : 3;

  return {
    class: classLabel,
    min,
    max,
    currency: 'RUB',
    breakdown,
    roi_months,
    note: 'Расчёт ориентировочный. Финальная стоимость определяется после брифинга.',
  };
}
