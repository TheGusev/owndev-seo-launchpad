/**
 * Strategy builder — V3.
 *
 * Pipeline:
 *   1. Pull required pages for the project type from page contracts (DB).
 *   2. Map clusters → page_types based on cluster.recommended_page_type
 *      (override generic templates with cluster-derived H1/Title/FAQ).
 *   3. Generate concrete page contracts per page.
 *   4. Compute funnel stages + primary CTA.
 *   5. Emit SiteStrategy.
 */

import type { ProjectTypeCodeV3 } from '../../types/formulaV3.js';
import { listV3Contracts } from '../pageContracts/repository.js';
import { generatePageContract, type BrandRenderContext } from '../pageContracts/contractGenerator.js';
import type {
  SitePage, SiteStrategy, StrategyBuildInput, CtaPrimary,
} from './types.js';
import type { DemandClusterV3 } from '../demand/types.js';
import { applyPageFanout, fanoutContextFromInput } from './pageFanout.js';

// Primary-CTA per project type
const PRIMARY_CTA: Record<ProjectTypeCodeV3, CtaPrimary> = {
  service_geo: 'phone_call',
  service_pro: 'consultation_book',
  service_b2b: 'demo_request',
  ecommerce: 'buy_now',
  marketplace: 'buy_now',
  saas: 'free_trial',
  mobile_app: 'install_app',
  media: 'subscribe',
  blog: 'subscribe',
  education: 'register',
  medical: 'consultation_book',
  legal: 'consultation_book',
  finance: 'consultation_book',
  realestate: 'lead_form',
  hospitality: 'lead_form',
  events: 'register',
  nonprofit: 'donate',
  gov: 'lead_form',
  portfolio: 'lead_form',
  promo_event: 'register',
  personal_brand: 'consultation_book',
  franchise_multi: 'lead_form',
  b2b_media: 'subscribe',
  // PR-10: подкатегории локальных услуг
  service_pest_control: 'phone_call',
  service_repair_home: 'consultation_book',
  service_auto: 'phone_call',
  service_beauty: 'lead_form',
};

// Page-type → funnel stage
const PAGE_FUNNEL: Record<string, 'awareness' | 'consideration' | 'decision' | 'retention'> = {
  home: 'awareness',
  article: 'awareness',
  category: 'awareness',
  course: 'consideration',
  service: 'consideration',
  'service-geo': 'consideration',
  product: 'consideration',
  feature: 'consideration',
  listing: 'consideration',
  event: 'decision',
  pricing: 'decision',
  contacts: 'decision',
  location: 'decision',
};

// Page-type → sitemap priority/changefreq
const SITEMAP_DEFAULTS: Record<string, { priority: number; changefreq: SitePage['changefreq'] }> = {
  home: { priority: 1.0, changefreq: 'weekly' },
  service: { priority: 0.9, changefreq: 'monthly' },
  'service-geo': { priority: 0.85, changefreq: 'monthly' },
  pricing: { priority: 0.9, changefreq: 'weekly' },
  contacts: { priority: 0.7, changefreq: 'monthly' },
  category: { priority: 0.8, changefreq: 'weekly' },
  product: { priority: 0.7, changefreq: 'weekly' },
  article: { priority: 0.6, changefreq: 'monthly' },
  course: { priority: 0.85, changefreq: 'monthly' },
  listing: { priority: 0.7, changefreq: 'weekly' },
  event: { priority: 0.85, changefreq: 'weekly' },
  location: { priority: 0.85, changefreq: 'monthly' },
  feature: { priority: 0.75, changefreq: 'monthly' },
};

function pickClusterForPage(
  pageType: string,
  clusters: DemandClusterV3[],
): DemandClusterV3 | null {
  // Direct match
  const direct = clusters.find((c) => c.recommended_page_type === pageType);
  if (direct) return direct;
  // Loose mapping for synonyms
  if (pageType === 'service' || pageType === 'service-geo') {
    return clusters.find((c) =>
      c.recommended_page_type === 'service' || c.recommended_page_type === 'service-geo',
    ) ?? null;
  }
  if (pageType === 'article') {
    return clusters.find((c) =>
      ['guide', 'glossary', 'article'].includes(c.recommended_page_type),
    ) ?? null;
  }
  if (pageType === 'category') {
    return clusters.find((c) =>
      ['category', 'reviews', 'comparison'].includes(c.recommended_page_type),
    ) ?? null;
  }
  // Fallback: largest unassigned cluster
  return clusters.length > 0 ? clusters[0] : null;
}

export async function buildStrategy(input: StrategyBuildInput): Promise<SiteStrategy> {
  // ───── Мост v1 → v3 ─────
  // 1) Если явно передан tier_size — используем его.
  // 2) Иначе — если есть engine_state.project_class из ядра v1, берём его.
  // 3) Иначе — undefined (legacy: выбираются все контракты любого tier_size).
  const effectiveTier = input.tier_size ?? input.engine_state?.project_class;

  const contracts = await listV3Contracts(input.project_code, effectiveTier);
  if (contracts.length === 0) {
    throw new Error(`No V3 page contracts seeded for project type ${input.project_code}`);
  }

  const renderCtx: BrandRenderContext = {
    brand_name: input.brand_name,
    city: input.city,
    service_main: input.service_main,
    phone: input.phone,
    year: new Date().getFullYear(),
  };

  const pages: SitePage[] = [];
  for (const c of contracts) {
    const cluster = pickClusterForPage(c.page_type, input.clusters);
    const generated = generatePageContract(c, cluster, renderCtx);
    const sitemap = SITEMAP_DEFAULTS[c.page_type] ?? { priority: 0.5, changefreq: 'monthly' as const };

    pages.push({
      page_type: c.page_type,
      url_pattern: generated.url_pattern,
      priority: sitemap.priority,
      changefreq: sitemap.changefreq,
      primary_cta: PRIMARY_CTA[input.project_code] ?? 'lead_form',
      cluster_id: cluster?.id,
      contract: generated,
      reasoning: cluster
        ? `Покрывает кластер «${cluster.cluster_label}» (${cluster.total_frequency} показов в мес)`
        : `Контракт ${c.page_type} обязателен для типа ${input.project_code} по гайдлайнам V3`,
    });
  }

  // ───── PR-3: Fan-out ─────
  // Разворачиваем базовые страницы по городам/направлениям + добавляем hub-страницы из Wordstat.
  // Без cities/directions/clusters — это но-op (обратная совместимость).
  const expandedPages = applyPageFanout(pages, fanoutContextFromInput(input));

  // Funnel stages
  const stageMap = new Map<string, string[]>();
  for (const p of expandedPages) {
    const stage = PAGE_FUNNEL[p.page_type] ?? 'consideration';
    if (!stageMap.has(stage)) stageMap.set(stage, []);
    stageMap.get(stage)!.push(p.page_type);
  }
  const stages: SiteStrategy['funnel_stages'] = (
    ['awareness', 'consideration', 'decision', 'retention'] as const
  ).map((s) => ({
    stage: s,
    page_types: stageMap.get(s) ?? [],
    primary_cta: s === 'decision' ? PRIMARY_CTA[input.project_code] : 'lead_form',
  }));

  return {
    project_code: input.project_code,
    brand_name: input.brand_name,
    positioning: input.brand_positioning ?? `${input.brand_name} — ${input.service_main ?? 'надёжный партнёр'} в ${input.city ?? 'вашем регионе'}`,
    primary_audience: derivePrimaryAudience(input.project_code),
    primary_cta: PRIMARY_CTA[input.project_code] ?? 'lead_form',
    funnel_stages: stages,
    pages: expandedPages,
    recommended_geos: input.recommended_geos ?? ['225'],
    total_clusters: input.clusters.length,
    generated_at: new Date().toISOString(),
  };
}

function derivePrimaryAudience(code: ProjectTypeCodeV3): string {
  const map: Partial<Record<ProjectTypeCodeV3, string>> = {
    service_geo: 'Локальные жители города, заказчики услуг 25-55',
    service_pro: 'Малый и средний бизнес, ИП',
    service_b2b: 'Корпоративные клиенты, лица принимающие решения',
    ecommerce: 'Розничные покупатели 18-65',
    marketplace: 'Покупатели и продавцы',
    saas: 'B2B-команды, продакт- и тех-руководители',
    mobile_app: 'Мобильные пользователи целевого устройства',
    media: 'Профессиональная аудитория темы',
    blog: 'Читатели темы, заинтересованные в подписке',
    education: 'Учащиеся и их родители / профессионалы доучивающиеся',
    medical: 'Пациенты, ищущие лечение',
    legal: 'Физлица и бизнес с юридическими задачами',
    finance: 'Клиенты финансовых услуг, инвесторы',
    realestate: 'Покупатели/арендаторы недвижимости',
    hospitality: 'Гости и посетители',
    events: 'Заинтересованные участники события',
    nonprofit: 'Жертвователи, волонтёры, благополучатели',
    gov: 'Граждане и юрлица, обращающиеся в орган',
    portfolio: 'Потенциальные клиенты/работодатели',
    promo_event: 'Целевая аудитория акции',
    personal_brand: 'Клиенты эксперта и подписчики медиа',
    franchise_multi: 'Локальные клиенты по городам + потенциальные франчайзи',
    b2b_media: 'Профессионалы отрасли, ЛПР',
    // PR-10/11: подкатегории локальных услуг
    service_pest_control: 'Локальные жители и БЦ/Общепит в экстренных ситуациях (насекомые, грызуны, СЭС)',
    service_repair_home: 'Собственники квартир и домов, инвесторы под сдачу',
    service_auto: 'Автовладельцы 25-65, парки такси/коммерческий транспорт',
    service_beauty: 'Женщины 18-55, локальные клиенты района',
  };
  return map[code] ?? 'Целевая аудитория проекта';
}
