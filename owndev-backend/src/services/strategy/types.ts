/**
 * services/strategy — V3 Strategy Layer types.
 *
 * The strategy layer turns demand intelligence + project type into a
 * concrete site-map of pages, with priorities, ordering and CTA flows.
 */
import type { ProjectTypeCodeV3 } from '../../types/formulaV3.js';
import type { DemandClusterV3 } from '../demand/types.js';
import type { GeneratedPageContract } from '../pageContracts/types.js';
import type { EngineState, ProjectClass } from '../../types/siteFormula.js';

/**
 * Фильтр по размеру/сложности проекта.
 * Совпадает с ProjectClass в v1 (start | growth | scale) + 'all' — контракт подходит любому tier.
 */
export type TierSize = ProjectClass | 'all';

export type CtaPrimary =
  | 'phone_call'
  | 'lead_form'
  | 'demo_request'
  | 'free_trial'
  | 'buy_now'
  | 'subscribe'
  | 'install_app'
  | 'donate'
  | 'register'
  | 'consultation_book';

export interface SitePage {
  page_type: string;
  url_pattern: string;
  priority: number;            // 0..1 (XML sitemap)
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  primary_cta: CtaPrimary;
  cluster_id?: string;
  contract: GeneratedPageContract;
  reasoning: string;            // why this page exists
  // ───── PR-3 Fan-out: развёрнутые экземпляры страниц ─────
  // Для service-geo / location / category — это конкретный экземпляр (город/направление).
  // Для одиночных страниц (home/pricing/contacts) флаг отсутствует (legacy).
  page_instance_key?: string;       // напр. 'moskva' или 'remont-noutbukov'
  page_instance_label?: string;     // напр. 'Москва' или 'Ремонт ноутбуков'
  page_instance_kind?: 'city' | 'service_direction' | 'category_direction' | 'hub';
}

export interface SiteStrategy {
  project_code: ProjectTypeCodeV3;
  brand_name: string;
  positioning: string;
  primary_audience: string;
  primary_cta: CtaPrimary;
  funnel_stages: Array<{
    stage: 'awareness' | 'consideration' | 'decision' | 'retention';
    page_types: string[];
    primary_cta: CtaPrimary;
  }>;
  pages: SitePage[];
  recommended_geos: string[];
  total_clusters: number;
  generated_at: string;
}

export interface StrategyBuildInput {
  project_code: ProjectTypeCodeV3;
  brand_name: string;
  brand_positioning?: string;
  city?: string;
  service_main?: string;
  phone?: string;
  clusters: DemandClusterV3[];
  recommended_geos?: string[];
  // ───── Мост v1 → v3 (опционально) ─────
  // tier_size фильтрует page_contracts по размеру: подходят контракты с tier_size = $tier OR tier_size = 'all'.
  // Без входного значения выбираются все контракты (legacy-поведение).
  tier_size?: TierSize;
  // engine_state пробрасывается для будущих PR (взвешивание dimensions, decision_trace в отчёт).
  engine_state?: EngineState;
  // ───── PR-3 Fan-out (опционально) ─────
  // Список городов, по которым надо развернуть service-geo / location страницы.
  // Например [{ slug: 'moskva', label: 'Москва' }, { slug: 'spb', label: 'СПб' }].
  // Если пусто или один элемент — поведение legacy (одна страница-шаблон).
  cities?: Array<{ slug: string; label: string }>;
  // Список направлений, по которым развернуть service / category страницы.
  service_directions?: Array<{ slug: string; label: string }>;
  // Добавить ли hub-страницы из кластеров Wordstat (по умолчанию — да).
  enable_hub_pages?: boolean;
  // PR-11: лимит cross-product fan-out (по умолчанию 50). Защита от взрыва.
  fanout_max_pages?: number;
  // PR-11: отключение cross-product (легаси PR-3 поведение).
  disable_cross_product?: boolean;
}
