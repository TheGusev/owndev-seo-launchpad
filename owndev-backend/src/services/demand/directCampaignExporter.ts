/**
 * directCampaignExporter — превращает кластеры спроса (DemandClusterV3)
 * в готовые группы объявлений Я.Директа.
 *
 * Один кластер = одна группа объявлений. Каждая группа содержит:
 *   - ключевые фразы с типом соответствия (зависит от длины фразы);
 *   - per-cluster минус-слова (зависят от интента и подтипа);
 *   - 3-5 шаблонов заголовков и 2-3 шаблона текстов с подстановкой
 *     {ключ}/{city}/{brand};
 *   - подсказку лендинга.
 *
 * Глобальные минус-слова и рекомендации директологу — на уровне кампании.
 *
 * Примечание: в текущих типах нет отдельного SubtypeType — подтип лежит
 * в DemandKeyword.intent_subtype (string). Для каждой группы выбирается
 * самый частый подтип среди её ключей.
 */
import type {
  DemandClusterV3,
  DemandIntentV3,
} from './types.js';

export type DirectMatchType = '!phrase' | '"exact"' | 'broad';

export interface DirectExportGroup {
  group_name: string;
  intent: DemandIntentV3;
  subtype?: string;
  keywords: Array<{ phrase: string; match_type: DirectMatchType }>;
  minus_words: string[];
  suggested_headlines: string[];
  suggested_texts: string[];
  landing_hint: string;
}

export interface DirectExportResult {
  groups: DirectExportGroup[];
  campaign_minus_words: string[];
  recommendations: string[];
  meta: {
    generated_at: string;
    clusters_count: number;
    total_keywords: number;
    data_source?: string;
  };
}

export interface BuildDirectExportOptions {
  brand?: string;
  cityName?: string;
  vertical?: string;
  data_source?: string;
  // PR-31: профиль вертикали — опциональный. Если передан, его
  // vertical_minus_words добавляются к глобальному CAMPAIGN_MINUS_WORDS
  // с дедупликацией и сохранением порядка.
  profile?: {
    id: string;
    vertical_minus_words?: string[];
  };
}

const CAMPAIGN_MINUS_WORDS: string[] = [
  'бесплатно', 'скачать', 'торрент', 'своими руками', 'википедия', 'wiki',
  'отзывы', 'обзор', 'reddit', 'pikabu', 'youtube', 'фото', 'видео',
  'инструкция', 'как сделать', 'avito', 'авито', 'юла',
  'wildberries', 'wb', 'ozon', 'озон', 'яндекс маркет',
  'aliexpress', 'алиэкспресс',
];

const INFO_STOP_FOR_TRANSACTIONAL = ['что такое', 'как выбрать', 'отличия'];
const COMMERCIAL_STOP_FOR_INFO = ['купить', 'цена', 'стоимость', 'заказать'];

function pickMatchType(phrase: string): DirectMatchType {
  const words = phrase.trim().split(/\s+/).filter(Boolean).length;
  if (words <= 2) return '"exact"';
  if (words <= 4) return '!phrase';
  return 'broad';
}

function pickDominantSubtype(cluster: DemandClusterV3): string | undefined {
  const counts = new Map<string, number>();
  for (const kw of cluster.keywords) {
    if (kw.intent_subtype) {
      counts.set(kw.intent_subtype, (counts.get(kw.intent_subtype) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return undefined;
  let best: string | undefined;
  let bestN = -1;
  for (const [k, n] of counts) {
    if (n > bestN) {
      best = k;
      bestN = n;
    }
  }
  return best;
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^a-z0-9а-я]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function buildClusterMinusWords(
  intent: DemandIntentV3,
  subtype: string | undefined,
): string[] {
  const minus = new Set<string>();
  if (intent === 'transactional' || intent === 'commercial') {
    for (const w of INFO_STOP_FOR_TRANSACTIONAL) minus.add(w);
  }
  if (intent === 'informational') {
    for (const w of COMMERCIAL_STOP_FOR_INFO) minus.add(w);
  }
  // Если подтип явно про цену — не блокируем «цена»
  if (subtype && /price|цен/i.test(subtype)) {
    minus.delete('цена');
    minus.delete('стоимость');
  }
  return Array.from(minus);
}

function buildHeadlines(
  brand: string | undefined,
  city: string | undefined,
): string[] {
  const cityPart = city ? city : 'вашем городе';
  const brandPart = brand ? brand : 'проверенного исполнителя';
  return [
    `{ключ} — ${cityPart}`,
    `{ключ} с доставкой`,
    `{ключ}: цены от ${brandPart}`,
    `Закажите {ключ} онлайн`,
    `{ключ} — официальный сайт`,
  ];
}

function buildTexts(city: string | undefined): string[] {
  const cityPart = city ? city : 'по всей России';
  return [
    'Профессиональные услуги. Гарантия качества. Звоните.',
    `Большой выбор. Быстрая доставка ${cityPart}. Оставьте заявку.`,
    'Работаем по договору. Чек и гарантия. Закажите расчёт.',
  ];
}

function buildLandingHint(
  cluster: DemandClusterV3,
  subtype: string | undefined,
): string {
  const slug = slugify(cluster.cluster_label || cluster.seed_keyword || 'cluster');
  if (subtype && /price|цен/i.test(subtype)) {
    return '/прайс или категорийная страница';
  }
  if (subtype && /service|услуг/i.test(subtype)) {
    return `/услуги/${slug}`;
  }
  // Эвристика по recommended_page_type, если он есть
  const pt = (cluster.recommended_page_type || '').toLowerCase();
  if (pt.includes('article') || pt.includes('blog') || pt.includes('faq')) {
    return `/блог/${slug}`;
  }
  return `/каталог/${slug}`;
}

function buildGroupName(cluster: DemandClusterV3, city?: string): string {
  const cityPart = city ? ` — ${city}` : '';
  const short = (cluster.cluster_label || cluster.seed_keyword || 'Группа').slice(0, 60);
  return `[${cluster.intent}] ${short}${cityPart}`;
}

function buildRecommendations(): string[] {
  return [
    'Стартуйте со средних ставок (медиана аукциона −20%) и поднимайте по CR, а не по CTR.',
    'Подключите ретаргетинг на посетителей лендинга без заявки — окупаемость обычно в 2-3 раза выше холодного.',
    'Чистите минус-словарь каждые 3-5 дней по поисковым запросам — это снижает CPA быстрее изменения ставок.',
    'Если по группе статус «Мало показов» — объединяйте близкие подтипы или переводите широкие фразы в шаблон без принудительного типа соответствия.',
    'Настройте корректировки по гео: вне основного города ставка −30..−50% (если не запускаете гео-расширение явно).',
    'Корректировки по устройствам: для услугового B2C мобайл обычно даёт более низкий CR — начните с −10..−15% на mobile, проверяйте по факту.',
    'A/B заголовков: ротируйте 2-3 варианта на группу, удаляйте проигравший при разнице CTR > 20% при ≥200 кликов.',
    'Передавайте оффлайн-конверсии (звонки, заявки CRM) — без них Я.Директ оптимизирует на трафик, а не на деньги.',
  ];
}

export function buildDirectExport(
  clusters: DemandClusterV3[],
  options: BuildDirectExportOptions = {},
): DirectExportResult {
  const { brand, cityName, data_source, profile } = options;
  const groups: DirectExportGroup[] = [];
  let totalKw = 0;

  for (const cluster of clusters ?? []) {
    if (!cluster?.keywords || cluster.keywords.length < 2) continue;

    const subtype = pickDominantSubtype(cluster);
    const minus = buildClusterMinusWords(cluster.intent, subtype);
    const headlines = buildHeadlines(brand, cityName);
    const texts = buildTexts(cityName);
    const landingHint = buildLandingHint(cluster, subtype);

    const keywords = cluster.keywords.map((kw) => ({
      phrase: kw.phrase,
      match_type: pickMatchType(kw.phrase),
    }));

    totalKw += keywords.length;

    groups.push({
      group_name: buildGroupName(cluster, cityName),
      intent: cluster.intent,
      subtype,
      keywords,
      minus_words: minus,
      suggested_headlines: headlines,
      suggested_texts: texts,
      landing_hint: landingHint,
    });
  }

  // PR-31: к глобальным минусам докидываем vertical_minus_words из профиля,
  // дедуп через Set с сохранением порядка (сначала глобальные, потом vertical).
  const campaignMinus: string[] = [];
  const seenMinus = new Set<string>();
  for (const w of CAMPAIGN_MINUS_WORDS) {
    const k = w.toLowerCase();
    if (!seenMinus.has(k)) {
      seenMinus.add(k);
      campaignMinus.push(w);
    }
  }
  for (const w of profile?.vertical_minus_words ?? []) {
    const trimmed = String(w).trim();
    if (trimmed.length === 0) continue;
    const k = trimmed.toLowerCase();
    if (!seenMinus.has(k)) {
      seenMinus.add(k);
      campaignMinus.push(trimmed);
    }
  }

  return {
    groups,
    campaign_minus_words: campaignMinus,
    recommendations: buildRecommendations(),
    meta: {
      generated_at: new Date().toISOString(),
      clusters_count: groups.length,
      total_keywords: totalKw,
      data_source,
    },
  };
}
