/**
 * Cluster builder — groups Wordstat phrases into intent-based clusters
 * and emits page-plan recommendations.
 *
 * Algorithm (lightweight):
 *   0. PRE-FILTER phrases — drop noise (associations without seed root,
 *      товарные категории, энциклопедические термины и т.д.). Это критично:
 *      Yandex `associations` тащит много мусора («инсектициды», «плесневый
 *      гриб», «дезал»), который раздувает total_volume в десятки раз.
 *   1. Classify every phrase by intent (intentClassifier).
 *   2. Bucket by (intent + subtype).
 *   3. Within each bucket, the phrase with the highest volume becomes
 *      the cluster label and seed for H1/Title templates.
 *   4. Build url_pattern based on intent+subtype.
 *   5. Generate FAQ questions from informational variants.
 */

import { logger } from '../../utils/logger.js';
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

/**
 * Глобальные стоп-слова — фразы с этими токенами почти всегда мусор
 * для услугового бизнеса (товарные категории, теория, энциклопедия).
 */
const NOISE_TOKENS = [
  // товарные категории
  'средство', 'средства', 'препарат', 'препараты', 'химия', 'реагент',
  'инсектицид', 'фунгицид', 'пестицид', 'гербицид', 'акарицид',
  // энциклопедия / теория
  'это', 'значение', 'определение', 'википедия', 'вики',
  'методы', 'метод', 'виды', 'классификация',
  // абстрактные термины (имена существительные сами по себе)
  'плесневый', 'плесневой', 'грибок', 'гриб',
  // прайс-маркетплейсы
  'озон', 'вайлдберриз', 'wildberries', 'ozon', 'aliexpress', 'али',
];

/**
 * Гео-токены — фрагменты названий городов/регионов РФ. Если стем seed-фразы
 * совпал с одним из этих фрагментов — он считается «гео-стемом», а не «тематическим»,
 * и его одного недостаточно для совпадения (нужен ещё ≥1 тематический стем).
 * Список покрывает миллионники + ключевые региональные центры; для подстрочного
 * матча хватает первых 4-5 букв.
 */
const GEO_STEMS = new Set([
  'москв', 'спб', 'питер', 'сочи', 'сочин', 'красн', 'красно', 'росто', 'ростов',
  'екате', 'екатер', 'новос', 'новоси', 'самар', 'казан', 'нижн', 'нижне',
  'воло', 'волог', 'волгог', 'волгод', 'воронеж', 'ставр', 'симфе', 'ялта',
  'тюмен', 'омск', 'омске', 'челяб', 'перм', 'перми', 'красноя', 'красноя',
  'минск', 'киев', 'тверь', 'тверс', 'тула', 'туле', 'рязан', 'калин',
  'махач', 'нальч', 'влади', 'хабар', 'влади', 'арханг', 'мурман', 'таган',
  'крым', 'крыма', 'крыму', 'россия', 'росси', 'рф',
]);

const SEED_STOP = new Set([
  'и', 'в', 'на', 'с', 'со', 'от', 'до', 'по', 'за', 'из', 'у', 'к', 'о', 'об',
  'для', 'при', 'или', 'без', 'про', 'над', 'под',
  'после', 'перед', 'между', 'через',
]);

/**
 * Извлечь стемы значимых слов seed-фразы. Возвращает классификацию каждого стема:
 *   topic — тематический стем (услуга / объект)
 *   geo   — стем-город / гео-регион
 */
function seedStems(seed: string): { topic: string[]; geo: string[] } {
  const tokens = seed
    .toLowerCase()
    .replace(/[^а-яёa-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !SEED_STOP.has(w))
    // Стем = слово целиком, если оно ≤5 букв (иначе слишком рыхлый:
    // «потоп» → «пото» ловит «потолок»). Для длинных — первые 5 букв.
    .map((w) => (w.length <= 5 ? w : w.slice(0, 5)));
  const topic: string[] = [];
  const geo: string[] = [];
  for (const t of tokens) {
    if (GEO_STEMS.has(t) || [...GEO_STEMS].some((g) => t.startsWith(g.slice(0, 5)) && g.length >= 4)) {
      geo.push(t);
    } else {
      topic.push(t);
    }
  }
  return { topic, geo };
}

/**
 * Соответствие фразы стемам seed.
 *   - Если seed содержит ≥1 тематический стем — фраза должна совпасть
 *     минимум с 1 тематическим стемом.
 *   - Если seed содержит и тематические, и гео-стемы — гео-стем сам по
 *     себе НЕ достаточен («мэр сочи» не должен пройти для seed «удаление
 *     плесени Сочи»).
 */
function phraseMatchesSeed(phrase: string, stems: { topic: string[]; geo: string[] }): boolean {
  const p = phrase.toLowerCase();
  if (stems.topic.length > 0) {
    return stems.topic.some((stem) => p.includes(stem));
  }
  // Только гео-стемы (например seed «Краснодар») — мало смысла, но fallback
  if (stems.geo.length > 0) return stems.geo.some((stem) => p.includes(stem));
  return true;
}

/** Содержит ли фраза стоп-слова. */
function phraseHasNoise(phrase: string, brandTokens: string[]): boolean {
  const p = ` ${phrase.toLowerCase()} `;
  // Не считаем шумом, если фраза содержит брендовый токен — это явный navigational
  if (brandTokens.some((b) => p.includes(b.toLowerCase()))) return false;
  return NOISE_TOKENS.some((tok) => p.includes(` ${tok} `) || p.includes(` ${tok}`) || p.startsWith(`${tok} `));
}

/**
 * Фильтр-«пылесос»: оставляем только фразы, релевантные seed.
 * Правила:
 *   1. Содержит ≥1 стем seed (главный фильтр).
 *   2. Не содержит NOISE_TOKENS.
 *   3. Длина ≥ 2 слов ИЛИ совпадает с seed дословно (фразы из 1 слова часто
 *      энциклопедические термины).
 *   4. Не короче 5 символов.
 * Если фильтр срезал >95% — fallback: только дословное вхождение seed.
 */
function filterPhrases(
  raw: Array<{ phrase: string; count: number }>,
  seed: string,
  brandTokens: string[],
): Array<{ phrase: string; count: number }> {
  const stems = seedStems(seed);
  const seedLower = seed.toLowerCase();
  // Требование ≥2 тематических совпадений включается только для seed с ≥3 topic-стемов.
  // Для двухсловных (удаление плесени) хватит и 1 совпадения, чтобы пользовательские
  // запросы типа «плесень в подвале» проходили. Для trio-словных (санитарная обработка
  // помещений) жёсткость выше — иначе «мэтоды дезинфекции» и подобный мусор пролезает.
  const minTopicMatches = stems.topic.length >= 3 ? 2 : 1;
  const out: Array<{ phrase: string; count: number }> = [];
  for (const it of raw) {
    const phrase = it.phrase.trim();
    if (phrase.length < 5) continue;
    const lower = phrase.toLowerCase();
    const wordCount = lower.split(/\s+/).filter(Boolean).length;
    if (wordCount < 2 && lower !== seedLower) continue;
    if (!phraseMatchesSeed(lower, stems)) continue;
    // Для trio-словных seed: считаем сколько тематических стемов совпало
    if (minTopicMatches > 1) {
      const matches = stems.topic.filter((stem) => lower.includes(stem)).length;
      if (matches < minTopicMatches) continue;
    }
    if (phraseHasNoise(lower, brandTokens)) continue;
    out.push(it);
  }
  // Fallback: если отфильтровали >95%, оставляем дословные вхождения seed.
  if (raw.length > 5 && out.length < Math.max(2, Math.floor(raw.length * 0.05))) {
    const fallback = raw.filter((it) => it.phrase.toLowerCase().includes(seedLower));
    if (fallback.length > out.length) {
      logger.warn(
        'DEMAND',
        `clusterBuilder: filter too aggressive for seed="${seed}" (kept ${out.length}/${raw.length}), falling back to substring match (${fallback.length})`,
      );
      return fallback;
    }
  }
  return out;
}

export function buildClusters(input: ClusterBuildInput): DemandClusterV3[] {
  const brandTokens = input.brandTokens ?? [];

  // Сырьё: берём оба источника, но фильтруем агрессивно.
  const rawTop = input.topResponse.topRequests ?? [];
  const rawAssoc = input.topResponse.associations ?? [];
  const rawAll = [...rawTop, ...rawAssoc];

  const filtered = filterPhrases(rawAll, input.seed_keyword, brandTokens);

  logger.info(
    'DEMAND',
    `clusterBuilder seed="${input.seed_keyword}": raw=${rawAll.length} (top=${rawTop.length}, assoc=${rawAssoc.length}) → kept=${filtered.length}`,
  );

  const buckets = new Map<string, {
    intent: DemandIntentV3;
    subtype: string;
    keywords: DemandKeyword[];
  }>();

  for (const item of filtered) {
    const cls = classifyIntent(item.phrase, brandTokens);
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
    // URL слаг строим от seed (фиксированная услуга), а не от топ-фразы кластера:
    // топ-фраза может быть информационной вариацией, а URL должен быть стабильным.
    const urlPattern = buildUrlPattern(bucket.intent, bucket.subtype, input.seed_keyword);
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
      recommended_faq_questions: deriveFaq(bucket.intent, bucket.subtype, bucket.keywords, input.seed_keyword),
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
  seed: string,
): string[] {
  // Pick the 5 highest-volume informational-style phrases that read like questions.
  const questionMarkers = ['как', 'что', 'почему', 'зачем', 'когда', 'где', 'сколько', 'можно ли'];
  const questionLike = keywords
    .filter((k) => questionMarkers.some((m) => k.phrase.toLowerCase().startsWith(m + ' ')))
    .slice(0, 5)
    .map((k) => k.phrase + (k.phrase.endsWith('?') ? '' : '?'));
  while (questionLike.length < 5) {
    questionLike.push(stockFaq(intent, subtype, seed, questionLike.length));
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
