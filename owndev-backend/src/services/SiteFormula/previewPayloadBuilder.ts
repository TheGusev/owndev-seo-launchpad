import type { EngineState, PreviewPayload } from '../../types/siteFormula.js';

const LAYER_DESCRIPTIONS: Record<string, { title: string; description: string }> = {
  demand_map: {
    title: 'Карта спроса',
    description: 'Анализ реального спроса и кластеризация запросов по вашей нише',
  },
  intent_layers: {
    title: 'Слои интентов',
    description: 'Разделение пользовательских намерений по типам страниц',
  },
  page_roles: {
    title: 'Роли страниц',
    description: 'Назначение каждой странице чёткой роли в архитектуре',
  },
  geo_pages: {
    title: 'Гео-архитектура',
    description: 'Структура географических посадочных страниц',
  },
  city_segmentation: {
    title: 'Сегментация по городам',
    description: 'Полноценная многогородская архитектура с уникальным контентом',
  },
  trust_compliance: {
    title: 'Доверие и соответствие',
    description: 'Страницы доверия, лицензии и E-E-A-T структура для регулируемой ниши',
  },
  paid_landing_separation: {
    title: 'Разделение SEO и рекламы',
    description: 'Изоляция рекламных посадочных от SEO-структуры',
  },
  internal_linking_system: {
    title: 'Система перелинковки',
    description: 'Модульная внутренняя перелинковка между разделами',
  },
  conversion_system: {
    title: 'Система конверсии',
    description: 'Единая система обработки заявок и конверсионных точек',
  },
  analytics_ads_integration: {
    title: 'Аналитика и реклама',
    description: 'Настройка аналитики, целей и рекламных интеграций',
  },
};

function estimatePageCount(state: EngineState): { min: number; max: number } {
  const dims = state.dimensions;
  let base = 3; // main + service + contacts
  let multiplier = 1;

  base += Math.max(1, dims.service_breadth) * 2; // pages per service
  if (state.activated_layers.includes('geo_pages')) {
    multiplier = Math.max(2, dims.geo_complexity);
  }
  if (state.activated_layers.includes('trust_compliance')) {
    base += 3; // about, licenses, team
  }
  if (state.activated_layers.includes('paid_landing_separation')) {
    base += dims.service_breadth * 2;
  }

  const min = base * multiplier;
  const max = min + Math.ceil(min * 0.5);
  return { min, max };
}

export function buildPreviewPayload(state: EngineState): PreviewPayload {
  const keyLayers = state.activated_layers
    .map((l) => LAYER_DESCRIPTIONS[l])
    .filter(Boolean)
    .map((desc, _i) => ({
      id: state.activated_layers[_i] || '',
      title: desc!.title,
      description: desc!.description,
    }));

  const primaryRisks: string[] = [];
  if (state.derived_scores.restructuring_risk >= 4) {
    primaryRisks.push('Высокий риск реструктуризации — требуется план миграции');
  }
  if (state.derived_scores.indexation_safety <= 3) {
    primaryRisks.push('Низкая безопасность индексации — нужна строгая политика');
  }
  if (state.activated_checks.includes('thin_content_risk')) {
    primaryRisks.push('Риск тонкого контента при масштабировании');
  }
  if (state.activated_checks.includes('cannibalization_risk')) {
    primaryRisks.push('Риск каннибализации запросов между страницами');
  }
  if (state.flags.verification_required) {
    primaryRisks.push('Требуется верификационный проход после внедрения');
  }

  const previewReasons = state.decision_trace
    .filter((t) => t.condition_met && t.priority <= 'P2')
    .map((t) => t.reason_human);

  return {
    project_class: state.project_class,
    project_class_reason: state.project_class_reason,
    key_layers: keyLayers,
    page_count_estimate: estimatePageCount(state),
    primary_risks: primaryRisks,
    preview_reasons: previewReasons,
    derived_scores: state.derived_scores,
    flags: state.flags,
  };
}
