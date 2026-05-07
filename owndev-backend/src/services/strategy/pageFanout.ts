/**
 * services/strategy/pageFanout.ts
 *
 * PR-3 «Развёртывание страниц».
 *
 * Принимает результат buildStrategy (массив SitePage) и расширяет его:
 *   • для page_type='service-geo' и 'location' — N экземпляров по городам;
 *   • для page_type='service' (если задан service_directions[]) — M экземпляров;
 *   • для page_type='category' — M экземпляров по directions;
 *   • hub-страницы из крупных кластеров Wordstat (если enable_hub_pages !== false).
 *
 * Принципы:
 *   • если cities/directions не заданы — fan-out не происходит, поведение legacy;
 *   • url_pattern для каждого экземпляра конкретизируется (плейсхолдеры
 *     {geo}/{city}/{slug} заменяются на конкретные значения);
 *   • H1/Title/intro каждого экземпляра содержат {city} и {service} в готовом виде;
 *   • cluster_id, если был, наследуется ко всем экземплярам;
 *   • SEO-priority экземпляров «гео» = 0.85 × (1 - i/N) — первые города выше;
 *   • дубликаты URL не создаются (deduplication по url_pattern).
 */

import type { SitePage, StrategyBuildInput } from './types.js';
import type { GeneratedPageContract } from '../pageContracts/types.js';
import type { DemandClusterV3 } from '../demand/types.js';

/** Шаблонные page_types, которые подлежат развёртыванию по городам. */
const GEO_PAGE_TYPES = new Set(['service-geo', 'location']);

/** Шаблонные page_types, которые подлежат развёртыванию по направлениям. */
const DIRECTION_PAGE_TYPES = new Set(['service', 'category', 'feature', 'product', 'course']);

export interface FanoutContext {
  cities?: Array<{ slug: string; label: string }>;
  service_directions?: Array<{ slug: string; label: string }>;
  clusters?: DemandClusterV3[];
  enable_hub_pages?: boolean;
}

/**
 * Главная функция: разворачивает базовые страницы.
 */
export function applyPageFanout(
  basePages: SitePage[],
  ctx: FanoutContext,
): SitePage[] {
  const result: SitePage[] = [];
  const seenUrls = new Set<string>();

  for (const page of basePages) {
    const expanded = expandSinglePage(page, ctx);
    for (const p of expanded) {
      if (seenUrls.has(p.url_pattern)) continue;
      seenUrls.add(p.url_pattern);
      result.push(p);
    }
  }

  // Hub-страницы из крупных кластеров (если включено).
  if (ctx.enable_hub_pages !== false && ctx.clusters && ctx.clusters.length > 0) {
    const hubs = buildHubPagesFromClusters(ctx.clusters, basePages);
    for (const h of hubs) {
      if (seenUrls.has(h.url_pattern)) continue;
      seenUrls.add(h.url_pattern);
      result.push(h);
    }
  }

  return result;
}

/**
 * Разворачивает одну базовую страницу в N экземпляров (или возвращает её саму).
 */
function expandSinglePage(page: SitePage, ctx: FanoutContext): SitePage[] {
  const cities = (ctx.cities ?? []).filter((c) => !!c.slug);
  const dirs = (ctx.service_directions ?? []).filter((d) => !!d.slug);

  // 1) GEO-страницы → разворачиваем по городам.
  if (GEO_PAGE_TYPES.has(page.page_type) && cities.length > 1) {
    return cities.map((city, i) => makeCityInstance(page, city, i, cities.length));
  }

  // 2) Direction-страницы → разворачиваем по направлениям.
  // Учитываем только если page_type подлежит fan-out по направлениям И dirs > 1.
  if (DIRECTION_PAGE_TYPES.has(page.page_type) && dirs.length > 1) {
    return dirs.map((d, i) => makeDirectionInstance(page, d, i, dirs.length));
  }

  // 3) Комбинация: service-geo с двумя осями (город × направление) — даёт city × dir.
  // В этой версии оставляем только одну ось (приоритет — город), чтобы избежать
  // взрывного роста страниц. Cross-product можно включить отдельным флагом в будущем.

  // 4) Иначе — возвращаем страницу как есть (legacy для одиночных home/pricing/contacts).
  return [page];
}

function makeCityInstance(
  base: SitePage,
  city: { slug: string; label: string },
  i: number,
  total: number,
): SitePage {
  const contract = substituteContract(base.contract, {
    city: city.label,
    geo: city.slug,
    slug: city.slug,
  });
  const url = substituteUrl(base.url_pattern, {
    geo: city.slug,
    city: city.slug,
    slug: city.slug,
  });
  // Приоритет SEO: первые города выше (от 0.85 до 0.65).
  const priority = total > 1
    ? Math.max(0.65, 0.85 - (i / Math.max(1, total - 1)) * 0.2)
    : base.priority;

  return {
    ...base,
    url_pattern: url,
    priority: round2(priority),
    contract,
    page_instance_key: city.slug,
    page_instance_label: city.label,
    page_instance_kind: 'city',
    reasoning: `${base.reasoning} → город ${city.label}`,
  };
}

function makeDirectionInstance(
  base: SitePage,
  dir: { slug: string; label: string },
  i: number,
  total: number,
): SitePage {
  const contract = substituteContract(base.contract, {
    service: dir.label,
    direction: dir.label,
    slug: dir.slug,
  });
  const url = substituteUrl(base.url_pattern, {
    slug: dir.slug,
    service: dir.slug,
    direction: dir.slug,
  });
  const priority = total > 1
    ? Math.max(0.6, 0.85 - (i / Math.max(1, total - 1)) * 0.25)
    : base.priority;

  // page_instance_kind: для category — category_direction, иначе service_direction.
  const kind: SitePage['page_instance_kind'] =
    base.page_type === 'category' ? 'category_direction' : 'service_direction';

  return {
    ...base,
    url_pattern: url,
    priority: round2(priority),
    contract,
    page_instance_key: dir.slug,
    page_instance_label: dir.label,
    page_instance_kind: kind,
    reasoning: `${base.reasoning} → направление ${dir.label}`,
  };
}

/**
 * Hub-страницы: для каждого крупного «семантического кластера» (top N по частоте,
 * не входящих в существующие SitePages) создаём дополнительную страницу-хаб
 * под крупный SEO-запрос.
 */
function buildHubPagesFromClusters(
  clusters: DemandClusterV3[],
  basePages: SitePage[],
): SitePage[] {
  const existingClusterIds = new Set(basePages.map((p) => p.cluster_id).filter(Boolean) as string[]);
  // Берём топ-3 кластера, ещё не привязанные к страницам.
  // id опционален у DemandClusterV3 — если его нет, считаем кластер непривязанным.
  const topClusters = [...clusters]
    .filter((c) => !c.id || !existingClusterIds.has(c.id))
    .sort((a, b) => (b.total_frequency ?? 0) - (a.total_frequency ?? 0))
    .slice(0, 3);

  if (topClusters.length === 0) return [];

  return topClusters.map((cluster, i) => {
    const slug = slugify(cluster.cluster_label);
    const url = `/hub/${slug}`;
    const contract: GeneratedPageContract = {
      page_type: 'hub',
      url_pattern: url,
      h1_template: `${cluster.cluster_label}: каталог разделов`,
      title_template: `${cluster.cluster_label} — обзор и подборка`,
      meta_description_template: `Полная подборка по теме «${cluster.cluster_label}» — категории, статьи, кейсы.`,
      intro_answer_template: `Здесь собрано всё по теме «${cluster.cluster_label}»: категории, статьи и подборки. Используйте навигацию для быстрого перехода.`,
      faq_questions: [
        `Что входит в раздел «${cluster.cluster_label}»?`,
        `Как выбрать подходящий вариант?`,
        `С чего начать?`,
      ],
      required_blocks: ['breadcrumbs', 'navigation', 'related_links'],
      required_commercial_signals: [],
      required_schema_graph: ['CollectionPage', 'BreadcrumbList'],
      notes_ru: `Hub-страница для крупного кластера #${i + 1} (${cluster.total_frequency} показов/мес)`,
    };

    return {
      page_type: 'hub',
      url_pattern: url,
      priority: 0.7,
      changefreq: 'weekly' as const,
      primary_cta: 'lead_form',
      cluster_id: cluster.id,
      contract,
      reasoning: `Hub из кластера Wordstat «${cluster.cluster_label}» (${cluster.total_frequency} показов/мес)`,
      page_instance_key: slug,
      page_instance_label: cluster.cluster_label,
      page_instance_kind: 'hub',
    };
  });
}

// ────────── helpers ──────────

function substituteContract(
  contract: GeneratedPageContract,
  vars: Record<string, string>,
): GeneratedPageContract {
  return {
    ...contract,
    url_pattern: substituteUrl(contract.url_pattern, vars),
    h1_template: substituteText(contract.h1_template, vars),
    title_template: substituteText(contract.title_template, vars),
    meta_description_template: substituteText(contract.meta_description_template, vars),
    intro_answer_template: substituteText(contract.intro_answer_template, vars),
    faq_questions: contract.faq_questions.map((q) => substituteText(q, vars)),
  };
}

function substituteUrl(pattern: string, vars: Record<string, string>): string {
  let out = pattern;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  // Если остались плейсхолдеры — подставляем 'page' как fallback, чтобы URL был валиден.
  out = out.replace(/\{[^}]+\}/g, 'page');
  return out;
}

function substituteText(text: string, vars: Record<string, string>): string {
  let out = text;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
  }
  return out;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[ё]/g, 'e')
    .replace(/[^a-zа-я0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60) || 'page';
}

function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Удобный конструктор контекста из StrategyBuildInput. */
export function fanoutContextFromInput(input: StrategyBuildInput): FanoutContext {
  return {
    cities: input.cities,
    service_directions: input.service_directions,
    clusters: input.clusters,
    enable_hub_pages: input.enable_hub_pages,
  };
}
