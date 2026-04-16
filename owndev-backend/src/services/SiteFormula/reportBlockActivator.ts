import type { EngineState, TemplateConfig, ReportSection } from '../../types/siteFormula.js';

/**
 * Determines which template sections are activated based on engine state.
 */
export function activateReportBlocks(
  state: EngineState,
  template: TemplateConfig
): ReportSection[] {
  const activatedSections: ReportSection[] = [];

  for (const section of template.sections) {
    let active = false;

    if (section.always_active) {
      active = true;
    } else if (section.activation) {
      const act = section.activation;

      // Check layer activation
      if (act.layer && state.activated_layers.includes(act.layer)) {
        active = true;
      }

      // Check block activation (any block match)
      if (act.blocks && Array.isArray(act.blocks)) {
        if (act.blocks.some((b: string) => state.activated_blocks.includes(b))) {
          active = true;
        }
      }

      // Check checks activation (any check match)
      if (act.checks && Array.isArray(act.checks)) {
        if (act.checks.some((c: string) => state.activated_checks.includes(c))) {
          active = true;
        }
      }
    }

    if (active) {
      activatedSections.push({
        id: section.id,
        title: section.title,
        order: section.order,
        content: generateSectionContent(section.id, section.fields, state),
      });
    }
  }

  // Sort by order
  activatedSections.sort((a, b) => a.order - b.order);
  return activatedSections;
}

/**
 * Generates section content from engine state.
 * This is deterministic — content is derived from state, not invented.
 */
function generateSectionContent(
  sectionId: string,
  fields: string[],
  state: EngineState
): Record<string, string | string[] | Record<string, any>> {
  const content: Record<string, any> = {};

  for (const field of fields) {
    content[field] = generateFieldContent(sectionId, field, state);
  }

  return content;
}

function generateFieldContent(
  sectionId: string,
  field: string,
  state: EngineState
): string | string[] | Record<string, any> {
  const dims = state.dimensions;
  const scores = state.derived_scores;
  const cls = state.project_class;

  // Map section+field to deterministic content from engine state
  switch (`${sectionId}.${field}`) {
    // Executive Summary
    case 'executive_summary.project_class':
      return cls;
    case 'executive_summary.project_class_reason':
      return state.project_class_reason;
    case 'executive_summary.formula_components':
      return state.activated_layers.map((l) => layerDisplayName(l));
    case 'executive_summary.key_decisions':
      return state.decision_trace
        .filter((t) => t.condition_met)
        .map((t) => t.reason_human);

    // Indexation Policy
    case 'indexation_policy.indexable_core':
      return 'Основные коммерческие и информационные страницы';
    case 'indexation_policy.indexable_support':
      return 'Вспомогательные страницы: блог, FAQ, справки';
    case 'indexation_policy.noindex_utility':
      return 'Служебные, платные посадочные, кабинет — всегда noindex';
    case 'indexation_policy.sitemap_rules':
      return 'Только indexable_core и indexable_support попадают в sitemap';
    case 'indexation_policy.canonical_strategy':
      return 'Централизованное управление canonical через route config';

    // Page Roles
    case 'page_roles.page_type_map':
      return buildPageTypeMap(state);
    case 'page_roles.indexability_tiers':
      return {
        indexable_core: 'Основные страницы услуг и гео',
        indexable_support: 'Блог, FAQ',
        noindex_utility: 'Личный кабинет, платные посадочные',
      };
    case 'page_roles.url_governance_rules':
      return [
        'Один URL = одна сущность',
        'Новый URL только при наличии отдельной поисковой ценности',
        'Canonical централизован',
      ];

    // Technical Stability
    case 'technical_stability.rendering_strategy':
      return cls === 'scale' ? 'SSR/SSG для критических страниц' : 'CSR с мета-тегами в HTML';
    case 'technical_stability.performance_requirements':
      return ['Core Web Vitals в зелёной зоне', 'TTFB < 600ms', 'LCP < 2.5s'];
    case 'technical_stability.security_basics':
      return ['HTTPS обязателен', 'CSP headers', 'HSTS'];

    // Next Steps
    case 'next_steps.implementation_priority':
      return buildImplementationPriority(state);
    case 'next_steps.timeline_estimate':
      return cls === 'start' ? '2-4 недели' : cls === 'growth' ? '4-8 недель' : '8-16 недель';
    case 'next_steps.verification_checkpoints':
      return state.flags.verification_required
        ? ['Проверка после каждого этапа', 'Полный аудит перед запуском']
        : ['Проверка перед запуском'];

    // Geo Architecture
    case 'geo_architecture.geo_page_structure':
      return dims.geo_complexity >= 3
        ? 'Отдельные разделы/поддомены для каждого города'
        : 'Гео-страницы в основном разделе';
    case 'geo_architecture.geo_url_pattern':
      return dims.geo_complexity >= 3 ? '/city/service/' : '/service-in-city/';
    case 'geo_architecture.geo_interlinking':
      return 'Перелинковка между гео-страницами через hub-страницу';

    // Safe Scale
    case 'safe_scale.thin_content_assessment':
      return 'Проверка: каждая страница должна нести уникальную ценность';
    case 'safe_scale.cannibalization_prevention':
      return 'Проверка: нет двух страниц, конкурирующих за один запрос';
    case 'safe_scale.doorway_prevention':
      return 'Проверка: гео-страницы не являются дорвеями — уникальный контент обязателен';
    case 'safe_scale.verification_protocol':
      return 'Верификация после каждого этапа масштабирования';

    default:
      return buildGenericFieldContent(sectionId, field, state);
  }
}

function buildGenericFieldContent(
  sectionId: string,
  field: string,
  state: EngineState
): string {
  // Return a descriptive stub from engine state context
  const layerRelated = state.activated_layers.find((l) =>
    sectionId.includes(l) || l.includes(sectionId)
  );
  if (layerRelated) {
    return `Рекомендации по ${layerDisplayName(layerRelated).toLowerCase()} на основе анализа`;
  }
  return `Раздел "${field}" активирован на основе текущей конфигурации проекта`;
}

function layerDisplayName(layer: string): string {
  const names: Record<string, string> = {
    demand_map: 'Карта спроса',
    intent_layers: 'Слои интентов',
    page_roles: 'Роли страниц',
    geo_pages: 'Гео-страницы',
    city_segmentation: 'Сегментация по городам',
    trust_compliance: 'Доверие и соответствие',
    paid_landing_separation: 'Разделение SEO/Реклама',
    internal_linking_system: 'Система перелинковки',
    conversion_system: 'Система конверсии',
    analytics_ads_integration: 'Аналитика и реклама',
  };
  return names[layer] || layer;
}

function buildPageTypeMap(state: EngineState): Record<string, string> {
  const map: Record<string, string> = {
    'Главная': 'Навигационная + конверсионная',
    'Услуга': 'Коммерческая (indexable_core)',
  };

  if (state.activated_layers.includes('geo_pages')) {
    map['Гео-страница'] = 'Коммерческая (indexable_core)';
  }
  if (state.activated_layers.includes('trust_compliance')) {
    map['Страница доверия'] = 'Информационная (indexable_support)';
  }
  if (state.activated_layers.includes('paid_landing_separation')) {
    map['Рекламная посадочная'] = 'Конверсионная (noindex_utility)';
  }

  map['Личный кабинет'] = 'Служебная (noindex_utility)';
  map['Политика конфиденциальности'] = 'Юридическая (indexable_support)';

  return map;
}

function buildImplementationPriority(state: EngineState): string[] {
  const steps: string[] = [
    '1. Карта спроса и кластеризация запросов',
    '2. Структура URL и роли страниц',
    '3. Политика индексации',
  ];

  if (state.activated_layers.includes('geo_pages')) {
    steps.push('4. Гео-архитектура');
  }
  if (state.activated_layers.includes('internal_linking_system')) {
    steps.push('5. Система перелинковки');
  }
  if (state.activated_layers.includes('conversion_system')) {
    steps.push('6. Система конверсии');
  }
  steps.push(`${steps.length + 1}. Техническая настройка и запуск`);

  if (state.flags.verification_required) {
    steps.push(`${steps.length + 1}. Верификационный проход`);
  }

  return steps;
}
