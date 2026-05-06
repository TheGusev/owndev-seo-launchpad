/**
 * Demand cluster builder.
 *
 * Given a seed phrase (e.g. "мойка двигателя"), expands it via Wordstat
 * (also-search + including), classifies each phrase by intent, and groups
 * them into clusters that map 1:1 to landing pages.
 *
 * Output is suitable for direct insertion into demand_clusters /
 * demand_phrases (or for in-memory consumption by blueprint-builder).
 */
import { getTop } from './cache.js';
import type {
  DemandCluster,
  ClusterPhrase,
  IntentType,
  IntentSubtype,
  WordstatPhrase,
} from './types.js';

// ─── Intent classification (rule-based, RU) ───────────────────
const COMMERCIAL_TOKENS = ['купить', 'заказать', 'цена', 'стоимость', 'купить', 'недорого', 'дешево', 'прайс', 'оплата'];
const TRANSACTIONAL_TOKENS = ['заказать', 'оформить', 'записать', 'забронировать', 'купить онлайн', 'оплатить'];
const NAVIGATIONAL_TOKENS = ['официальный сайт', 'личный кабинет', 'войти', 'login', 'sign in'];
const HOWTO_TOKENS = ['как', 'способ', 'инструкция', 'руководство', 'своими руками', 'самостоятельно'];
const COMPARISON_TOKENS = ['или', 'vs', 'против', 'сравнение', 'отличия', 'что лучше'];
const PRICE_TOKENS = ['цена', 'стоимость', 'тариф', 'прайс', 'сколько стоит'];
const REVIEW_TOKENS = ['отзывы', 'обзор', 'мнения', 'рейтинг'];
const NEAR_ME_TOKENS = ['рядом', 'рядом со мной', 'возле', 'недалеко', 'около меня'];

// Coarse RU local modifiers (cities + 'в городе', 'в …').
const LOCAL_MODIFIERS_RE = /(в\s[А-Я][а-яё]+|москв|питер|петербург|екатеринбург|новосибирск|казань|нижн|самар|омск|челябинск|краснодар|ростов|уфа|пермь|воронеж|волгоград|саратов|тольятт|тюмен|ижевск|барнаул|ульяновск|ярославл|владивосток|сочи|калининград)/i;

function detectIntent(phrase: string): IntentType {
  const p = phrase.toLowerCase();
  if (TRANSACTIONAL_TOKENS.some((t) => p.includes(t))) return 'transactional';
  if (NAVIGATIONAL_TOKENS.some((t) => p.includes(t))) return 'navigational';
  if (COMMERCIAL_TOKENS.some((t) => p.includes(t))) return 'commercial';
  return 'informational';
}

function detectSubtype(phrase: string): IntentSubtype {
  const p = phrase.toLowerCase();
  if (NEAR_ME_TOKENS.some((t) => p.includes(t))) return 'near-me';
  if (HOWTO_TOKENS.some((t) => p.startsWith(t + ' ') || p.includes(' ' + t + ' '))) return 'how-to';
  if (COMPARISON_TOKENS.some((t) => p.includes(' ' + t + ' '))) return 'comparison';
  if (PRICE_TOKENS.some((t) => p.includes(t))) return 'price';
  if (REVIEW_TOKENS.some((t) => p.includes(t))) return 'review';
  return 'general';
}

function hasLocalModifier(phrase: string): boolean {
  return LOCAL_MODIFIERS_RE.test(phrase);
}

// ─── Cluster naming ───────────────────────────────────────────
function clusterKey(seed: string, subtype: IntentSubtype, hasLocal: boolean): string {
  const localTag = hasLocal ? '_geo' : '';
  return `${seed.toLowerCase()}__${subtype}${localTag}`;
}

function humanClusterName(seed: string, subtype: IntentSubtype, hasLocal: boolean): string {
  const subtypeLabels: Record<IntentSubtype, string> = {
    'how-to': 'Как сделать',
    comparison: 'Сравнение',
    price: 'Цены',
    review: 'Отзывы',
    'near-me': 'Рядом',
    general: 'Основные',
  };
  return `${subtypeLabels[subtype]}: ${seed}${hasLocal ? ' (гео)' : ''}`;
}

// ─── H1 / Title / FAQ recommenders ────────────────────────────
function recommendH1(cluster: DemandCluster): string {
  const top = cluster.phrases[0]?.phrase ?? cluster.cluster_name;
  // Capitalize first letter (RU)
  return top.charAt(0).toUpperCase() + top.slice(1);
}

function recommendTitle(cluster: DemandCluster, businessName?: string): string {
  const top = cluster.phrases[0]?.phrase ?? cluster.cluster_name;
  const cap = top.charAt(0).toUpperCase() + top.slice(1);
  if (businessName) return `${cap} — ${businessName}`;
  return cap;
}

function recommendFaq(cluster: DemandCluster): Array<{ q: string; a: string }> {
  // Promote up to 5 phrases (skipping seed) into Q/A skeletons. Answers are
  // placeholders for the human/AI editor to fill in.
  return cluster.phrases
    .filter((p) => p.intent_subtype !== 'general')
    .slice(0, 5)
    .map((p) => ({
      q: phraseToQuestion(p.phrase),
      a: '_TODO_: фактический ответ на 2-3 предложения, опираясь на бизнес-контекст',
    }));
}

function phraseToQuestion(phrase: string): string {
  const p = phrase.trim();
  // Already a question?
  if (/[?]$/.test(p)) return p;

  if (/^(как|что|почему|когда|где|сколько|чем|зачем)\s/i.test(p)) {
    return p.charAt(0).toUpperCase() + p.slice(1) + '?';
  }
  if (/(цена|стоимость|сколько стоит)/i.test(p)) {
    return `Сколько стоит ${p.replace(/(цена|стоимость|сколько стоит)\s*/i, '').trim()}?`;
  }
  if (/(отзывы|обзор)/i.test(p)) {
    return `Какие отзывы о ${p.replace(/(отзывы|обзор)\s*/i, '').trim()}?`;
  }
  // Fallback: turn the phrase into a "what is X?" / "how to X?" form.
  return `Что нужно знать про «${p}»?`;
}

// ─── Public API ───────────────────────────────────────────────
export interface BuildClustersOptions {
  seed: string;
  region_code?: string;
  business_name?: string;
  max_clusters?: number;
  min_volume?: number;
}

export async function buildClusters(opts: BuildClustersOptions): Promise<DemandCluster[]> {
  const { seed, region_code = '225', business_name, max_clusters = 12, min_volume = 0 } = opts;

  const top = await getTop(seed, region_code);
  const allPhrases: WordstatPhrase[] = [
    { phrase: seed, volume: top.total, region_code },
    ...top.also_search,
    ...top.including,
  ];

  // Group by (subtype, has_local)
  const groups = new Map<string, ClusterPhrase[]>();
  let positionCounter = 0;
  for (const p of allPhrases) {
    if (p.volume < min_volume) continue;
    const subtype = detectSubtype(p.phrase);
    const hasLocal = hasLocalModifier(p.phrase);
    const key = clusterKey(seed, subtype, hasLocal);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push({
      phrase: p.phrase,
      volume: p.volume,
      intent_subtype: subtype,
      has_local_modifier: hasLocal,
      position: ++positionCounter,
    });
  }

  // Build cluster objects
  const clusters: DemandCluster[] = [];
  for (const [key, phrases] of groups) {
    phrases.sort((a, b) => b.volume - a.volume);
    const subtype = phrases[0].intent_subtype;
    const hasLocal = phrases[0].has_local_modifier;
    const cluster: DemandCluster = {
      cluster_name: humanClusterName(seed, subtype, hasLocal),
      intent_type: detectIntent(phrases[0].phrase),
      total_volume: phrases.reduce((s, p) => s + p.volume, 0),
      region_code,
      phrases: phrases.slice(0, 25),
      recommended_h1: '',
      recommended_title: '',
      recommended_faq: [],
    };
    cluster.recommended_h1 = recommendH1(cluster);
    cluster.recommended_title = recommendTitle(cluster, business_name);
    cluster.recommended_faq = recommendFaq(cluster);
    clusters.push(cluster);
    void key;
  }

  // Sort clusters by total volume descending and trim
  clusters.sort((a, b) => b.total_volume - a.total_volume);
  return clusters.slice(0, max_clusters);
}
