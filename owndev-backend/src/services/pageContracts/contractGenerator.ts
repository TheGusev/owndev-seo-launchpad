/**
 * Page contract generator — V3.
 *
 * Inputs:
 *   • PageContractRow (from DB, the rules)
 *   • DemandClusterV3 (the keyword → page assignment)
 *   • Brand context (brand_name, city, year, etc.)
 *
 * Output: GeneratedPageContract — concrete H1/Title/intro/FAQ rendered
 *         with brand variables, ready to be handed to a developer.
 */

import type { DemandClusterV3 } from '../demand/types.js';
import type { PageContractRow, GeneratedPageContract } from './types.js';

export interface BrandRenderContext {
  brand_name: string;
  city?: string;
  year?: number;
  service_main?: string;
  phone?: string;
}

/**
 * Apply brand variables to a template string. Supports {brand}, {city}, {year},
 * {service}, {service_main}, {phone}.
 */
export function renderTemplate(tpl: string, ctx: BrandRenderContext, extras: Record<string, string> = {}): string {
  const map: Record<string, string> = {
    brand: ctx.brand_name,
    city: ctx.city ?? 'Москве',
    year: String(ctx.year ?? new Date().getFullYear()),
    service_main: ctx.service_main ?? '',
    phone: ctx.phone ?? '',
    N: '10',
    ...extras,
  };
  return tpl.replace(/\{(\w+)\}/g, (_, key) => map[key] ?? `{${key}}`);
}

function clampString(s: string, maxChars: number): string {
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars - 1).trim().replace(/[,;:.\-—]+$/, '');
}

function generateIntroAnswer(
  pageType: string,
  cluster: DemandClusterV3 | null,
  ctx: BrandRenderContext,
  minWords: number,
  maxWords: number,
): string {
  const seed = cluster?.seed_keyword ?? ctx.service_main ?? ctx.brand_name;
  const city = ctx.city ?? 'Москве';
  const fallbacks: Record<string, string> = {
    home: `${ctx.brand_name} — это ${seed} в ${city}. Мы предлагаем профессиональные услуги, гарантируем результат и берём на себя все этапы работ. Работаем по договору, фиксируем стоимость до начала и завершаем точно в срок. Оставьте заявку — менеджер свяжется в течение пяти минут и подберёт решение под вашу задачу.`,
    service: `${seed} в ${city} от ${ctx.brand_name}: фиксированная цена, гарантия результата, выезд специалиста день в день. Мы знаем все нюансы этой услуги и доводим её до конца — без скрытых доплат и ожиданий. Свяжитесь с нами, чтобы рассчитать стоимость и согласовать удобное время.`,
    pricing: `Стоимость ${seed} в ${city} зависит от объёма и сложности задачи. Базовый прайс начинается с минимального тарифа, итоговая цена фиксируется в договоре до старта работ. Никаких доплат и сюрпризов — заплатите ровно столько, сколько согласовали. Получите расчёт по вашему случаю за пять минут.`,
    contacts: `Свяжитесь с ${ctx.brand_name} в ${city}: позвоните по телефону, напишите в мессенджер или оставьте заявку через сайт. Мы отвечаем в рабочие часы в течение пяти минут, в нерабочие — на следующий рабочий день. Адрес офиса и время приёма указаны ниже.`,
    article: `Эта статья объясняет, что такое ${seed} и как им пользоваться. Мы собрали ключевые факты, разобрали типичные вопросы и привели практические рекомендации. Прочитав материал, вы поймёте логику процесса и сможете принять обоснованное решение, обращаться ли к специалистам или действовать самостоятельно.`,
    course: `Курс ${seed} от ${ctx.brand_name} рассчитан на тех, кто хочет освоить навык от базы до уверенного применения. Программа построена на практике: каждое занятие закрепляется задачей, обратная связь — лично от преподавателя. По итогу — сертификат и портфолио, которое можно показать работодателю.`,
    listing: `Объект "${seed}" в ${city}: подробное описание, актуальные фото, точная локация и цена без скрытых комиссий. Мы помогаем с подбором, оформлением документов и сопровождаем сделку на всех этапах. Запишитесь на показ или задайте вопрос менеджеру.`,
    product: `${seed} в ${ctx.brand_name}: проверенное качество, гарантия и быстрая доставка. Подробные характеристики, реальные отзывы покупателей и условия возврата собраны на этой странице. Закажите сейчас, чтобы получить товар уже в ближайшее время.`,
    event: `${seed} — событие, которое нельзя пропустить. Полная программа, состав спикеров и условия участия описаны ниже. Билет можно купить онлайн, количество мест ограничено. Регистрируйтесь, чтобы зафиксировать своё участие по текущей цене.`,
    location: `${ctx.brand_name} в ${city} — местный филиал нашей сети. Адрес, часы работы и контактные телефоны указаны ниже. Мы работаем по единым стандартам качества и с теми же гарантиями, что и в других городах сети.`,
    feature: `${seed} в приложении ${ctx.brand_name} — это удобная функция для решения вашей задачи. Установите приложение бесплатно из App Store или Google Play, чтобы попробовать прямо сейчас.`,
  };
  let answer = fallbacks[pageType] ?? fallbacks.home;
  // Trim by approximate word count
  const words = answer.split(/\s+/);
  if (words.length > maxWords) {
    answer = words.slice(0, maxWords).join(' ').replace(/[,;:.\-—]+$/, '') + '.';
  }
  void minWords;
  return answer;
}

function generateFaqs(cluster: DemandClusterV3 | null, ctx: BrandRenderContext, n: number): string[] {
  const fromCluster = cluster?.recommended_faq_questions ?? [];
  const seed = cluster?.seed_keyword ?? ctx.service_main ?? '';
  const stock = [
    `Сколько стоит ${seed} в ${ctx.city ?? 'Москве'}?`,
    `Как заказать ${seed}?`,
    `Какие сроки выполнения ${seed}?`,
    `Какие гарантии вы даёте на ${seed}?`,
    `Можно ли отменить или вернуть ${seed}?`,
    `В каких районах работаете?`,
    `Какие способы оплаты доступны?`,
  ];
  const merged = [...fromCluster, ...stock];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const q of merged) {
    if (!q) continue;
    const k = q.trim().toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(q.trim());
    if (out.length >= n) break;
  }
  return out;
}

export function generatePageContract(
  contract: PageContractRow,
  cluster: DemandClusterV3 | null,
  ctx: BrandRenderContext,
): GeneratedPageContract {
  // 1. URL pattern from cluster (if any) else convention
  const urlPattern = cluster?.recommended_url_pattern
    ?? defaultUrlPattern(contract.page_type);

  // 2. H1
  const h1Tpl = cluster?.recommended_h1_template ?? defaultH1Template(contract.page_type);
  let h1 = renderTemplate(h1Tpl, ctx, {
    service: cluster?.seed_keyword ?? ctx.service_main ?? '',
  });
  h1 = clampString(h1, contract.h1_max_chars);

  // 3. Title
  const titleTpl = cluster?.recommended_title_template ?? defaultTitleTemplate(contract.page_type);
  let title = renderTemplate(titleTpl, ctx, {
    service: cluster?.seed_keyword ?? ctx.service_main ?? '',
  });
  title = clampString(title, contract.title_max_chars);

  // 4. Meta description
  const metaTpl = defaultMetaDescriptionTemplate(contract.page_type);
  let meta = renderTemplate(metaTpl, ctx, {
    service: cluster?.seed_keyword ?? ctx.service_main ?? '',
  });
  if (meta.length > contract.required_meta_desc_max) {
    meta = meta.slice(0, contract.required_meta_desc_max - 1).trim() + '…';
  }

  // 5. Intro answer
  const intro = generateIntroAnswer(
    contract.page_type,
    cluster,
    ctx,
    contract.intro_answer_words_min,
    contract.intro_answer_words_max,
  );

  // 6. FAQ
  const faq = generateFaqs(cluster, ctx, contract.faq_min_items);

  return {
    page_type: contract.page_type,
    url_pattern: urlPattern,
    h1_template: h1,
    title_template: title,
    meta_description_template: meta,
    intro_answer_template: intro,
    faq_questions: faq,
    required_blocks: contract.required_blocks,
    required_commercial_signals: contract.required_commercial_signals,
    required_schema_graph: contract.schema_graph_required,
    notes_ru: contract.notes_ru,
  };
}

// ─── Page-type defaults ──────────────────────────────────────

function defaultUrlPattern(pageType: string): string {
  const map: Record<string, string> = {
    home: '/',
    service: '/services/{slug}',
    'service-geo': '/services/{geo}/{slug}',
    pricing: '/pricing',
    contacts: '/contacts',
    article: '/blog/{slug}',
    category: '/category/{slug}',
    product: '/product/{slug}',
    course: '/courses/{slug}',
    listing: '/listings/{slug}',
    event: '/events/{slug}',
    location: '/locations/{city}',
    feature: '/features/{slug}',
  };
  return map[pageType] ?? `/${pageType}`;
}

function defaultH1Template(pageType: string): string {
  const map: Record<string, string> = {
    home: '{brand} — {service_main} в {city}',
    service: '{service} в {city}',
    pricing: 'Цены на {service_main}',
    contacts: 'Контакты {brand}',
    article: '{service}',
    category: '{service}',
    product: '{service}',
    course: 'Курс {service}',
    listing: '{service}',
    event: '{service}',
    location: '{brand} в {city}',
    feature: '{service}',
  };
  return map[pageType] ?? '{service}';
}

function defaultTitleTemplate(pageType: string): string {
  const map: Record<string, string> = {
    home: '{brand} — {service_main} в {city} | Цены, отзывы',
    service: '{service} в {city} {year} | {brand}',
    pricing: 'Цены {service_main} {year} | {brand}',
    contacts: 'Контакты — {brand}',
    article: '{service} | {brand}',
    category: '{service} в {city} — {brand}',
    product: '{service} — купить в {brand}',
    course: 'Курс {service} | {brand}',
    listing: '{service} в {city} | {brand}',
    event: '{service} {year} — {brand}',
    location: '{brand} в {city} — адреса и телефоны',
    feature: '{service} — приложение {brand}',
  };
  return map[pageType] ?? '{service} | {brand}';
}

function defaultMetaDescriptionTemplate(pageType: string): string {
  const map: Record<string, string> = {
    home: '{brand} — {service_main} в {city}: цены, гарантии, отзывы. Оставьте заявку — расчёт за 5 минут.',
    service: '{service} в {city} от {brand}: фиксированная цена, гарантия, выезд день в день. Закажите онлайн.',
    pricing: 'Актуальные цены на {service_main} в {city} от {brand} {year}. Никаких скрытых платежей. Узнать стоимость онлайн.',
    contacts: 'Контакты {brand} в {city}: телефон, адрес, мессенджеры, время работы. Свяжитесь любым удобным способом.',
    article: '{service}: подробное руководство от экспертов {brand}. Простыми словами, с примерами и ответами на популярные вопросы.',
    category: '{service} в {city}: каталог, фильтры, цены, FAQ. Доставка по всей России, гарантия качества.',
    product: '{service}: характеристики, отзывы, цена. Купить онлайн в {brand} с доставкой и гарантией.',
    course: 'Курс {service} в {brand}: программа, цена, отзывы. Сертификат по итогам обучения. Записаться онлайн.',
    listing: '{service} в {city}: описание, фото, цена. Запишитесь на показ или задайте вопрос менеджеру {brand}.',
    event: '{service}: дата, программа, спикеры, цена билета. Регистрируйтесь онлайн в {brand}.',
    location: '{brand} в {city}: адрес, телефон, часы работы. Те же стандарты и гарантии, что и во всей сети.',
    feature: '{service} в приложении {brand}: установите бесплатно и попробуйте прямо сейчас в App Store или Google Play.',
  };
  return map[pageType] ?? '{service} — {brand}.';
}
