/**
 * services/verticals — отраслевые профили «под доход» для всех 23 ProjectTypeCodeV3.
 *
 * В отличие от services/demand/profiles (которые задают модификаторы seed-фраз
 * по ИНДУСТРИИ — клиники, авто, стройка), здесь профиль привязан к
 * ProjectTypeCodeV3 (тип проекта в архитектурном смысле — service_geo, ecommerce,
 * saas и т. д.) и описывает:
 *
 *   • demand_profile  — ожидаемое распределение интентов и сезонность;
 *   • kpi             — словарь типичных KPI вертикали (CR, AOV, CPA, ЧИ);
 *   • monetization    — модель монетизации и порядки величин дохода;
 *   • benchmarks      — рыночные ориентиры для PRO-отчёта.
 *
 * Эти данные не идут в free=v1, они предназначены только для PRO-отчёта.
 */

import type { ProjectTypeCodeV3 } from '../../types/formulaV3.js';

export type DemandIntent =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational'
  | 'local';

/**
 * Распределение интентов в выборке: суммарно ≤ 1.0.
 * Например для service_geo обычно ~70 % local + 20 % commercial + 10 % informational.
 */
export interface IntentDistribution {
  informational?: number;
  commercial?: number;
  transactional?: number;
  navigational?: number;
  local?: number;
}

/**
 * Месячные коэффициенты сезонности (1.0 = средний год).
 * Длина массива 12, индексация: 0=январь … 11=декабрь.
 */
export type SeasonalityVector = [
  number, number, number, number, number, number,
  number, number, number, number, number, number,
];

export interface VerticalKPI {
  /** Конверсия в лид/заявку из визита, среднее значение. */
  cr_visit_to_lead?: number;
  /** Конверсия из лида в продажу, среднее значение. */
  cr_lead_to_sale?: number;
  /** Средний чек / AOV в рублях (порядок). */
  average_order_rub?: number;
  /** Стоимость привлечения, рубли (порядок). */
  cpa_rub?: number;
  /** Жизненная ценность клиента, рубли (порядок). */
  ltv_rub?: number;
  /** «Частотный индекс» — относительная плотность спроса, 0..100. */
  frequency_index?: number;
  /** Среднее время до сделки, дней. */
  sales_cycle_days?: number;
}

export type MonetizationModel =
  | 'lead_gen'          // получаем заявки/звонки и продаём услуги
  | 'transaction'       // прямая транзакция (покупка/оплата на сайте)
  | 'subscription'      // SaaS, мед.абонементы, обучение
  | 'commission'        // marketplace/агрегатор
  | 'advertising'       // media, blog
  | 'donation'          // nonprofit
  | 'institutional'     // gov, нет монетизации напрямую
  | 'brand'             // portfolio/personal_brand — отложенная монетизация
  | 'install';          // mobile_app, install-driven

export interface VerticalBenchmarks {
  /** Минимально-рекомендуемое число страниц для роста. */
  min_pages_for_growth?: number;
  /** Минимальное число городов для гео-стратегии (если применимо). */
  min_cities_for_geo?: number;
  /** Минимальное число направлений для каталог-стратегии (если применимо). */
  min_directions_for_catalog?: number;
  /** Окупаемость SEO-вложений, месяцев. */
  seo_payback_months?: number;
  /** Высокая стоимость клика в Я.Директе для топ-клиентских запросов, рубли. */
  cpc_high_intent_rub?: number;
}

export interface VerticalProfile {
  /** ProjectTypeCodeV3, на который завязан профиль. */
  project_code: ProjectTypeCodeV3;
  /** Человекочитаемое название (русский). */
  title_ru: string;
  /** Короткое описание ниши (русский). */
  description_ru: string;
  /** Модель монетизации. */
  monetization: MonetizationModel;
  /** Распределение интентов в типичной выборке. */
  intent_distribution: IntentDistribution;
  /** Сезонность по месяцам (12 значений; 1.0 = средний год). */
  seasonality: SeasonalityVector;
  /** Типичные KPI ниши. */
  kpi: VerticalKPI;
  /** Рыночные бенчмарки для PRO-отчёта. */
  benchmarks: VerticalBenchmarks;
  /** Признаки/триггеры спроса — какие модификаторы преобладают. */
  demand_triggers: string[];
  /** Источники/комментарий — для прозрачности и трассировки. */
  notes_ru?: string;
}
