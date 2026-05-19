/**
 * PR-26: sanity-тесты для buildDirectExport + computeDataConfidence.
 *
 * Сценарии:
 *   1. Пустой массив кластеров → groups=[], recommendations не пустые
 *   2. 3 кластера разных интентов → groups=3, match_type по длине,
 *      минусы соответствуют интенту
 *   3. Полная карточка → data_confidence_pct >= 90
 *   4. Урезанная карточка (только title+price) → pct < 50 + ожидаемые missing_fields
 */
import { buildDirectExport } from '../src/services/demand/directCampaignExporter.js';
import { computeDataConfidence } from '../src/services/MarketplaceAudit/scoring/dataConfidence.js';
import type {
  DemandClusterV3,
  DemandKeyword,
} from '../src/services/demand/types.js';
import type { ParsedProduct } from '../src/types/marketplaceAudit.js';

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) {
    throw new Error(`[pr26] FAIL: ${msg}`);
  }
}

function mkKeyword(phrase: string, frequency = 1000, subtype?: string): DemandKeyword {
  return { phrase, frequency, intent_subtype: subtype };
}

function mkCluster(
  intent: DemandClusterV3['intent'],
  label: string,
  phrases: string[],
  subtype?: string,
): DemandClusterV3 {
  return {
    session_id: 'test-session',
    cluster_label: label,
    intent,
    seed_keyword: phrases[0] ?? label,
    region_code: '213',
    keywords: phrases.map((p) => mkKeyword(p, 1000, subtype)),
    total_frequency: phrases.length * 1000,
    recommended_page_type: 'service',
    recommended_url_pattern: '/услуги/{slug}',
  };
}

// ── Сценарий 1 ──
{
  const r = buildDirectExport([], { brand: 'Acme', cityName: 'Москва' });
  assert(r.groups.length === 0, 'empty clusters → groups.length === 0');
  assert(r.recommendations.length >= 5, 'recommendations должны быть непустыми');
  assert(r.campaign_minus_words.includes('бесплатно'), 'campaign_minus_words должны содержать «бесплатно»');
  console.log('[pr26] scenario 1 OK — empty clusters');
}

// ── Сценарий 2 ──
{
  const tx = mkCluster(
    'transactional',
    'Заказать кофе',
    ['кофе', 'купить кофе', 'заказать кофе зерновой', 'купить кофе в москве с доставкой'],
  );
  const info = mkCluster(
    'informational',
    'Как выбрать кофе',
    ['что такое арабика', 'как выбрать кофе для эспрессо', 'отличия арабики и робусты'],
  );
  const nav = mkCluster('navigational', 'Бренд X', ['acme coffee', 'acme бренд']);

  const r = buildDirectExport([tx, info, nav], { brand: 'Acme', cityName: 'Москва' });
  assert(r.groups.length === 3, `groups.length=3, got ${r.groups.length}`);

  const txGroup = r.groups.find((g) => g.intent === 'transactional')!;
  assert(txGroup.minus_words.includes('что такое'), 'transactional минусы должны включать «что такое»');
  // Short phrase «кофе» — exact, средняя — !phrase, длинная — broad
  const exact = txGroup.keywords.find((k) => k.phrase === 'кофе');
  assert(exact?.match_type === '"exact"', `«кофе» → exact, got ${exact?.match_type}`);
  const phraseKw = txGroup.keywords.find((k) => k.phrase === 'заказать кофе зерновой');
  assert(phraseKw?.match_type === '!phrase', `3-сл фраза → !phrase, got ${phraseKw?.match_type}`);
  const broadKw = txGroup.keywords.find((k) => k.phrase === 'купить кофе в москве с доставкой');
  assert(broadKw?.match_type === 'broad', `длинная фраза → broad, got ${broadKw?.match_type}`);

  const infoGroup = r.groups.find((g) => g.intent === 'informational')!;
  assert(infoGroup.minus_words.includes('купить'), 'informational минусы должны включать «купить»');
  console.log('[pr26] scenario 2 OK — 3 clusters / match types / per-cluster minus');
}

// ── Сценарий 3 ──
{
  const fullCard: ParsedProduct = {
    platform: 'wb',
    title: 'Кофе зерновой Арабика 100% премиум 1 кг — отличный аромат',
    description:
      'Натуральный кофе арабика высокогорной обжарки, средний помол подходит для турки, эспрессо и капельной кофеварки. Отборные зёрна с плантаций Эфиопии и Колумбии. Богатый аромат с шоколадными нотами. Свежая обжарка перед отправкой. Идеален для подарка.',
    category: 'Продукты / Кофе и чай / Кофе',
    attributes: {
      бренд: 'Acme Coffee',
      продавец: 'OOO Кофе Маркет',
      вес: '1 кг',
      обжарка: 'средняя',
      помол: 'в зёрнах',
      страна: 'Россия',
      сорт: 'Арабика',
      срок_годности: '12 месяцев',
      состав: '100% арабика',
      упаковка: 'фольгированный пакет с клапаном',
    },
    images: [
      'https://x/1.jpg',
      'https://x/2.jpg',
      'https://x/3.jpg',
      'https://x/4.jpg',
      'https://x/5.jpg',
    ],
    bullets: ['ароматный', 'натуральный'],
    videoCount: 1,
    reviewsCount: 200,
    rating: 4.7,
    sourceData: { price: 1290, brand: 'Acme Coffee', supplier: 'OOO Кофе Маркет' },
  };
  const r = computeDataConfidence(fullCard);
  assert(
    r.data_confidence_pct >= 90,
    `full card pct >= 90, got ${r.data_confidence_pct} (missing=${r.missing_fields.join(',')})`,
  );
  assert(r.missing_fields.length === 0, `full card missing_fields=[], got ${r.missing_fields.join(',')}`);
  console.log(`[pr26] scenario 3 OK — full card pct=${r.data_confidence_pct}`);
}

// ── Сценарий 4 ──
{
  const tinyCard: ParsedProduct = {
    platform: 'ozon',
    title: 'Кофе',
    description: '',
    category: 'Не определена',
    attributes: {},
    images: [],
    sourceData: { price: 990 },
  };
  const r = computeDataConfidence(tinyCard);
  assert(r.data_confidence_pct < 50, `tiny card pct < 50, got ${r.data_confidence_pct}`);
  for (const need of ['description', 'attributes', 'images', 'rating']) {
    assert(
      r.missing_fields.includes(need),
      `tiny card missing_fields must include ${need}, got [${r.missing_fields.join(',')}]`,
    );
  }
  console.log(`[pr26] scenario 4 OK — tiny card pct=${r.data_confidence_pct}`);
}

console.log('[pr26] OK — all checks passed');
