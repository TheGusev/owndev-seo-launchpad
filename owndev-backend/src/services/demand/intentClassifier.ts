/**
 * Intent classifier — heuristic Russian-aware intent detection.
 *
 * Classifies a phrase into one of:
 *   informational  — "как", "что такое", "почему", "зачем", "виды", "обзор"
 *   commercial     — "сравнить", "vs", "лучший", "топ", "рейтинг", "отзывы"
 *   transactional  — "купить", "заказать", "цена", "стоимость", "записаться", "оставить заявку"
 *   navigational   — brand-only queries (matching brand from context)
 *   local          — "в москве", "рядом", "около", "ближайш"
 *
 * The output is also tagged with subtype hints used by clusterBuilder.
 */

import type { DemandIntentV3 } from './types.js';

const INFO_MARKERS = [
  'как', 'что такое', 'почему', 'зачем', 'виды', 'обзор', 'преимущества',
  'отличия', 'инструкция', 'руководство', 'гайд', 'когда', 'правила',
];
const COMMERCIAL_MARKERS = [
  'сравнить', 'сравнение', 'vs', 'против', 'лучший', 'лучшая', 'лучшие',
  'топ', 'рейтинг', 'отзывы', 'выбрать', 'какой', 'какая', 'какое',
];
const TRANSACTIONAL_MARKERS = [
  'купить', 'заказать', 'цена', 'стоимость', 'записаться', 'заявка',
  'недорого', 'дешево', 'срочно', 'онлайн', 'оплатить', 'оформить', 'скидка',
];
const LOCAL_MARKERS = [
  'в москве', 'в спб', 'в санкт-петербурге', 'в екатеринбурге',
  'рядом', 'около', 'ближайш', 'недалеко', 'возле', 'в моем городе',
  'круглосуточно', '24 часа',
];

export interface IntentResult {
  intent: DemandIntentV3;
  subtype: string;
  is_local: boolean;
  matched_markers: string[];
}

export function classifyIntent(
  phrase: string,
  brandTokens: string[] = [],
): IntentResult {
  const p = phrase.toLowerCase().trim();
  const matched: string[] = [];
  let isLocal = false;
  let isInfo = false;
  let isCommercial = false;
  let isTransactional = false;

  for (const m of LOCAL_MARKERS) {
    if (p.includes(m)) { matched.push(m); isLocal = true; break; }
  }
  for (const m of TRANSACTIONAL_MARKERS) {
    if (p.includes(m)) { matched.push(m); isTransactional = true; break; }
  }
  for (const m of COMMERCIAL_MARKERS) {
    if (p.includes(m)) { matched.push(m); isCommercial = true; break; }
  }
  for (const m of INFO_MARKERS) {
    if (p.startsWith(m + ' ') || p === m || p.includes(' ' + m + ' ')) {
      matched.push(m); isInfo = true; break;
    }
  }

  // Brand-only queries → navigational
  if (brandTokens.length > 0) {
    const stripped = p.replace(/[^a-zа-я0-9]+/gi, ' ').trim();
    const inBrand = brandTokens.some((b) => stripped === b.toLowerCase());
    if (inBrand) {
      return { intent: 'navigational', subtype: 'brand', is_local: false, matched_markers: ['brand'] };
    }
  }

  // Priority: local > transactional > commercial > informational > default commercial
  let intent: DemandIntentV3 = 'commercial';
  let subtype = 'general';
  if (isLocal) {
    intent = 'local';
    subtype = isTransactional ? 'local-transactional' : 'local-general';
  } else if (isTransactional) {
    intent = 'transactional';
    subtype = matched.includes('цена') || matched.includes('стоимость') ? 'price' : 'buy';
  } else if (isCommercial) {
    intent = 'commercial';
    subtype = matched.includes('отзывы') ? 'review' :
              matched.includes('сравнить') || matched.includes('сравнение') || matched.includes('vs') ? 'comparison' :
              matched.includes('лучший') || matched.includes('топ') || matched.includes('рейтинг') ? 'top' : 'general';
  } else if (isInfo) {
    intent = 'informational';
    subtype = matched.includes('как') ? 'how-to' :
              matched.includes('что такое') ? 'definition' :
              matched.includes('обзор') ? 'review-info' : 'general';
  }

  return { intent, subtype, is_local: isLocal, matched_markers: matched };
}

/**
 * Recommend a page-type code for a given intent.
 */
export function intentToPageType(intent: DemandIntentV3, subtype: string): string {
  if (intent === 'navigational') return 'home';
  if (intent === 'transactional') return subtype === 'price' ? 'pricing' : 'service';
  if (intent === 'local') return 'service-geo';
  if (intent === 'commercial') {
    if (subtype === 'review') return 'reviews';
    if (subtype === 'comparison') return 'comparison';
    if (subtype === 'top') return 'category';
    return 'category';
  }
  // informational
  if (subtype === 'how-to') return 'guide';
  if (subtype === 'definition') return 'glossary';
  return 'article';
}
