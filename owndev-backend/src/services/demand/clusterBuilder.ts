/**
 * Cluster builder — groups Wordstat phrases into intent-based clusters
 * and emits page-plan recommendations.
 *
 * Algorithm (lightweight):
 *   1. Classify every phrase by intent (intentClassifier).
 *   2. Bucket by (intent + subtype).
 *   3. Within each bucket, the phrase with the highest volume becomes
 *      the cluster label and seed for H1/Title templates.
 *   4. Build url_pattern based on intent+subtype.
 *   5. Generate FAQ questions from informational variants.
 */

import { classifyIntent, intentToPageType } from './intentClassifier.js';
import type {
  DemandClusterV3,
  DemandKeyword,
  DemandIntentV3,
} from './types.js';
import type { TopRequestsResponse } from './types.js';

export interface ClusterBuildInput {
  session_id: string;
  seed_keyword: string;
  region_code: string;
  topResponse: TopRequestsResponse;
  brandTokens?: string[];
}

export function buildClusters(input: ClusterBuildInput): DemandClusterV3[] {
  const all = [...input.topResponse.topRequests, ...input.topResponse.associations];
  const buckets = new Map<string, {
    intent: DemandIntentV3;
    subtype: string;
    keywords: DemandKeyword[];
  }>();

  for (const item of all) {
    const cls = classifyIntent(item.phrase, input.brandTokens ?? []);
    const key = `${cls.intent}::${cls.subtype}`;
    if (!buckets.has(key)) {
      buckets.set(key, { intent: cls.intent, subtype: cls.subtype, keywords: [] });
    }
    buckets.get(key)!.keywords.push({
      phrase: item.phrase,
      frequency: item.count,
      intent_subtype: cls.subtype,
    });
  }

  const clusters: DemandClusterV3[] = [];

  for (const [, bucket] of buckets) {
    bucket.keywords.sort((a, b) => b.frequency - a.frequency);
    if (bucket.keywords.length === 0) continue;
    const total = bucket.keywords.reduce((s, k) => s + k.frequency, 0);
    if (total < 50) continue; // skip noise clusters

    const head = bucket.keywords[0];
    const pageType = intentToPageType(bucket.intent, bucket.subtype);
    const urlPattern = buildUrlPattern(bucket.intent, bucket.subtype, head.phrase);
    const label = clusterLabel(bucket.intent, bucket.subtype, input.seed_keyword);

    clusters.push({
      session_id: input.session_id,
      cluster_label: label,
      intent: bucket.intent,
      seed_keyword: input.seed_keyword,
      region_code: input.region_code,
      keywords: bucket.keywords,
      total_frequency: total,
      recommended_page_type: pageType,
      recommended_url_pattern: urlPattern,
      recommended_h1_template: h1Template(bucket.intent, bucket.subtype, input.seed_keyword),
      recommended_title_template: titleTemplate(bucket.intent, bucket.subtype, input.seed_keyword),
      recommended_faq_questions: deriveFaq(bucket.intent, bucket.subtype, bucket.keywords),
    });
  }

  // Sort: largest cluster first
  clusters.sort((a, b) => b.total_frequency - a.total_frequency);
  return clusters;
}

// ─── Helpers ─────────────────────────────────────────────────

function clusterLabel(intent: DemandIntentV3, subtype: string, seed: string): string {
  const map: Record<string, string> = {
    'transactional::price': `Цена: ${seed}`,
    'transactional::buy': `Заказ: ${seed}`,
    'commercial::review': `Отзывы: ${seed}`,
    'commercial::comparison': `Сравнение: ${seed}`,
    'commercial::top': `Рейтинг: ${seed}`,
    'commercial::general': `Коммерч: ${seed}`,
    'informational::how-to': `Как: ${seed}`,
    'informational::definition': `Что такое: ${seed}`,
    'informational::review-info': `Обзор: ${seed}`,
    'informational::general': `Инфо: ${seed}`,
    'local::local-transactional': `Локально (заказ): ${seed}`,
    'local::local-general': `Локально: ${seed}`,
    'navigational::brand': `Бренд: ${seed}`,
  };
  return map[`${intent}::${subtype}`] ?? `${intent}: ${seed}`;
}

function buildUrlPattern(intent: DemandIntentV3, subtype: string, head: string): string {
  const slug = slugify(head);
  if (intent === 'navigational') return '/';
  if (intent === 'transactional') {
    return subtype === 'price' ? `/pricing/${slug}` : `/services/${slug}`;
  }
  if (intent === 'local') return `/services/{geo}/${slug}`;
  if (intent === 'commercial') {
    if (subtype === 'review') return `/reviews/${slug}`;
    if (subtype === 'comparison') return `/compare/${slug}`;
    return `/category/${slug}`;
  }
  if (subtype === 'how-to') return `/guides/${slug}`;
  if (subtype === 'definition') return `/glossary/${slug}`;
  return `/blog/${slug}`;
}

function h1Template(intent: DemandIntentV3, subtype: string, seed: string): string {
  if (intent === 'transactional' && subtype === 'price') return `Цена ${seed} в {city}`;
  if (intent === 'transactional') return `Заказать ${seed} в {city}`;
  if (intent === 'local') return `${seed} в {city} — выезд за час`;
  if (intent === 'commercial' && subtype === 'review') return `Отзывы о ${seed}`;
  if (intent === 'commercial' && subtype === 'comparison') return `${seed} vs аналоги: что выбрать`;
  if (intent === 'commercial' && subtype === 'top') return `Топ-${'{N}'} ${seed} в {year}`;
  if (intent === 'informational' && subtype === 'how-to') return `Как ${seed}: пошаговая инструкция`;
  if (intent === 'informational' && subtype === 'definition') return `Что такое ${seed}: простыми словами`;
  return `${seed.charAt(0).toUpperCase()}${seed.slice(1)}`;
}

function titleTemplate(intent: DemandIntentV3, subtype: string, seed: string): string {
  if (intent === 'transactional' && subtype === 'price') return `${seed} цена ${'{year}'} | {brand}`;
  if (intent === 'transactional') return `Заказать ${seed} — {brand}`;
  if (intent === 'local') return `${seed} в {city} — {brand}`;
  if (intent === 'commercial') return `${seed}: рейтинг ${'{year}'} | {brand}`;
  if (intent === 'informational') return `${seed} — гайд от {brand}`;
  return `${seed} | {brand}`;
}

function deriveFaq(
  intent: DemandIntentV3,
  subtype: string,
  keywords: DemandKeyword[],
): string[] {
  // Pick the 5 highest-volume informational-style phrases that read like questions.
  const questionMarkers = ['как', 'что', 'почему', 'зачем', 'когда', 'где', 'сколько', 'можно ли'];
  const questionLike = keywords
    .filter((k) => questionMarkers.some((m) => k.phrase.toLowerCase().startsWith(m + ' ')))
    .slice(0, 5)
    .map((k) => k.phrase + (k.phrase.endsWith('?') ? '' : '?'));
  while (questionLike.length < 5) {
    questionLike.push(stockFaq(intent, subtype, keywords[0]?.phrase ?? '', questionLike.length));
  }
  return questionLike.slice(0, 5);
}

function stockFaq(intent: DemandIntentV3, subtype: string, head: string, idx: number): string {
  const stock = [
    `Сколько стоит ${head}?`,
    `Как заказать ${head}?`,
    `Какие сроки выполнения ${head}?`,
    `Какие гарантии при ${head}?`,
    `Можно ли вернуть ${head}?`,
    `В каких городах доступно ${head}?`,
  ];
  return stock[idx % stock.length];
}

function slugify(s: string): string {
  const map: Record<string, string> = {
    'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'e','ж':'zh','з':'z',
    'и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r',
    'с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'c','ч':'ch','ш':'sh','щ':'sch',
    'ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya',
  };
  return s.toLowerCase().split('').map((c) => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
