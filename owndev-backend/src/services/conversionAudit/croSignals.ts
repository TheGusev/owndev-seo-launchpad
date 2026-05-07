/**
 * Детерминированные CRO-сигналы.
 *
 * Это «факты» о странице, которые мы можем установить regex/DOM-эвристиками
 * без LLM. На них опирается финальный CRO-отчёт: если факт зафиксирован —
 * LLM уже не может его выдумать или отрицать.
 *
 * Никаких внешних запросов отсюда не делаем — только разбор уже скачанного
 * HTML/text. Все проверки идемпотентны и быстрые (миллисекунды).
 */

export interface CroSignals {
  /** Есть ли HTML <form> с полями ввода — потенциальная форма заявки. */
  hasForm: boolean;
  /** Сколько форм найдено. */
  formCount: number;
  /** Найдён хотя бы один телефон в видимом тексте. */
  hasPhone: boolean;
  /** Найдён e-mail. */
  hasEmail: boolean;
  /** Есть мессенджеры (WhatsApp/Telegram) как способ контакта. */
  hasMessenger: boolean;
  /** Слова «отзыв», «кейс», «клиент сказал» и т.п. */
  hasReviewsMention: boolean;
  /** Структурированный блок Review (schema.org или класс review). */
  hasReviewSchema: boolean;
  /** Гарантии / возврат денег. */
  hasGuarantee: boolean;
  /** Цена / прайс / стоимость. */
  hasPrice: boolean;
  /** FAQ / частые вопросы. */
  hasFAQ: boolean;
  /** Призыв к действию (кнопка/ссылка с глагольным текстом). */
  hasCTA: boolean;
  /** Кол-во CTA-маркеров. */
  ctaCount: number;
  /** УТП-маркеры (почему мы / преимущества / выгоды). */
  hasUSPSection: boolean;
  /** Социальные доказательства: лицензии, награды, сертификаты. */
  hasCredibility: boolean;
  /** Сколько слов в видимом тексте. */
  wordCount: number;
}

const PHONE_RE = /(?:\+?\d[\s\-().]?){10,}/;
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;

const KEYWORDS = {
  reviews: /\b(отзыв|отзывов|отзывы|кейс[ыа]?|клиент(ы|ов|ам)?\s+(говорят|сказал|пишут)|благодарн)/i,
  guarantee: /\b(гаранти[яйи]|возврат денег|вернём деньги|обязательство|без предоплат|сертификат качества)/i,
  price: /\b(цена|стоимость|прайс|тариф[ыа]?|расценк|от\s*\d{2,}|стоит)\b/i,
  faq: /\b(faq|часто задаваемые|частые вопросы|вопрос[\s-]+ответ|ваши вопросы)/i,
  uspSection: /\b(почему мы|наши преимущества|преимущества|выгод[ыа]\s+работ|чем мы лучше|что вы получите)/i,
  credibility: /\b(лицензи[яийе]|сертификат|награда|член[\s-]+ассоциации|аккредитац|опыт\s+\d+\s*(лет|года))/i,
  messenger: /\b(whatsapp|вотсап|telegram|телеграм|t\.me\/|wa\.me\/|вайбер|viber)/i,
  reviewSchema: /(schema\.org\/Review|"@type"\s*:\s*"Review"|class=["'][^"']*\b(review|testimonial)\b)/i,
};

const CTA_VERBS = [
  'заказать', 'купить', 'оставить заявку', 'получить', 'консультаци', 'позвонить',
  'связаться', 'оформить', 'записаться', 'попробовать', 'начать', 'узнать стоимость',
  'рассчитать', 'забронировать', 'подобрать', 'отправить', 'хочу',
];

export function extractCroSignals(html: string, bodyText: string): CroSignals {
  const lc = bodyText.toLowerCase();
  const formMatches = html.match(/<form\b[^>]*>/gi) || [];

  // CTA-кнопки/ссылки. Считаем глагольные тексты внутри <a>/<button>/role=button.
  const ctaTexts: string[] = [];
  const ctaRe = /<(?:a|button)\b[^>]*>([\s\S]*?)<\/(?:a|button)>/gi;
  let m: RegExpExecArray | null;
  let safety = 0;
  while ((m = ctaRe.exec(html)) && safety++ < 1000) {
    const inner = m[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
    if (!inner || inner.length > 80) continue;
    if (CTA_VERBS.some((v) => inner.includes(v))) ctaTexts.push(inner);
  }
  // Дополнительно: <input type="submit" value="..."> и кнопки с типичными классами.
  const submitInputs = (html.match(/<input[^>]+type=["']submit["'][^>]*>/gi) || []).length;

  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  return {
    hasForm: formMatches.length > 0,
    formCount: formMatches.length,
    hasPhone: PHONE_RE.test(bodyText),
    hasEmail: EMAIL_RE.test(bodyText),
    hasMessenger: KEYWORDS.messenger.test(html) || KEYWORDS.messenger.test(lc),
    hasReviewsMention: KEYWORDS.reviews.test(lc),
    hasReviewSchema: KEYWORDS.reviewSchema.test(html),
    hasGuarantee: KEYWORDS.guarantee.test(lc),
    hasPrice: KEYWORDS.price.test(lc),
    hasFAQ: KEYWORDS.faq.test(lc),
    hasCTA: ctaTexts.length > 0 || submitInputs > 0,
    ctaCount: ctaTexts.length + submitInputs,
    hasUSPSection: KEYWORDS.uspSection.test(lc),
    hasCredibility: KEYWORDS.credibility.test(lc),
    wordCount,
  };
}

/**
 * На базе сигналов строит набор детерминированных CRO-барьеров.
 * Это НЕ догадки LLM, это «холодная правда» о странице. LLM потом может
 * их дополнить мягкими барьерами (копирайтинг, тон, структура), но
 * жёсткие факты не сможет ни выдумать, ни перебить.
 */
export interface DeterministicBarrier {
  category: 'Доверие' | 'CTA' | 'Контент' | 'УТП' | 'Форма';
  severity: 'critical' | 'high' | 'medium';
  title: string;
  description: string;
  fix: string;
  /** Ожидаемый эффект на конверсию в %. */
  impact: string;
  /** Что именно из сигналов триггернуло барьер — для отладки/прозрачности. */
  signal: string;
}

export function deriveDeterministicBarriers(s: CroSignals): DeterministicBarrier[] {
  const out: DeterministicBarrier[] = [];

  if (!s.hasForm) {
    out.push({
      category: 'Форма',
      severity: 'critical',
      title: 'На странице нет формы заявки',
      description: 'Без формы посетителю некуда отправить запрос — лиды теряются на главном шаге воронки.',
      fix: 'Добавьте короткую форму (имя + телефон) на видном месте: в hero и/или в блоке цены/услуг.',
      impact: '+15–30%',
      signal: 'has_form=false',
    });
  } else if (s.formCount === 1 && s.wordCount > 800) {
    out.push({
      category: 'Форма',
      severity: 'medium',
      title: 'Только одна форма на длинной странице',
      description: 'Форма должна повторяться рядом с каждым логическим блоком, иначе пользователь дочитает и уйдёт.',
      fix: 'Продублируйте форму или добавьте «прилипающую» CTA-кнопку, ведущую к форме.',
      impact: '+5–10%',
      signal: 'form_count=1, words>800',
    });
  }

  if (!s.hasPhone) {
    out.push({
      category: 'Доверие',
      severity: 'high',
      title: 'Нет телефона на странице',
      description: 'Часть аудитории звонит, а не пишет — отсутствие телефона снижает доверие и режет звонящий сегмент.',
      fix: 'Разместите телефон в шапке (кликабельный tel:) и в блоке контактов.',
      impact: '+8–15%',
      signal: 'has_phone=false',
    });
  }

  if (!s.hasCTA) {
    out.push({
      category: 'CTA',
      severity: 'critical',
      title: 'Нет внятного призыва к действию',
      description: 'Кнопок с глагольным текстом («заказать», «оставить заявку», «получить» и т.п.) на странице не найдено.',
      fix: 'Добавьте 2–3 заметные кнопки с конкретным действием в первом экране и перед формой.',
      impact: '+10–20%',
      signal: 'cta_count=0',
    });
  } else if (s.ctaCount === 1) {
    out.push({
      category: 'CTA',
      severity: 'medium',
      title: 'Слабая плотность CTA',
      description: 'Найдена только одна кнопка с призывом — длинная страница без повторных CTA снижает конверсию.',
      fix: 'Повторите CTA в каждом 2–3 экране прокрутки и в конце страницы.',
      impact: '+5–8%',
      signal: 'cta_count=1',
    });
  }

  if (!s.hasReviewsMention && !s.hasReviewSchema) {
    out.push({
      category: 'Доверие',
      severity: 'high',
      title: 'Нет отзывов и кейсов',
      description: 'На странице не найдены упоминания отзывов клиентов или примеров работ — посетителю не на что опереться при выборе.',
      fix: 'Добавьте блок с 3–6 реальными отзывами (фото/имя/город) и 2–3 кейса с цифрами.',
      impact: '+15–25%',
      signal: 'has_reviews=false',
    });
  }

  if (!s.hasGuarantee) {
    out.push({
      category: 'Доверие',
      severity: 'medium',
      title: 'Не сформулированы гарантии',
      description: 'Без явных обязательств (гарантия, возврат, договор) посетитель ощущает риск.',
      fix: 'Добавьте короткий блок «Наши гарантии» с 3–5 пунктами.',
      impact: '+5–10%',
      signal: 'has_guarantee=false',
    });
  }

  if (!s.hasPrice) {
    out.push({
      category: 'Контент',
      severity: 'high',
      title: 'Нет цены или ориентира по стоимости',
      description: 'Посетители не понимают, во что обойдётся услуга, и уходят сравнивать к конкурентам, у которых цена видна.',
      fix: 'Покажите хотя бы вилку «от — до» или калькулятор стоимости.',
      impact: '+10–20%',
      signal: 'has_price=false',
    });
  }

  if (!s.hasUSPSection && s.wordCount > 300) {
    out.push({
      category: 'УТП',
      severity: 'high',
      title: 'Не выделено уникальное торговое предложение',
      description: 'На странице нет блока «почему мы / преимущества» — посетителю неясно, чем вы отличаетесь от конкурентов.',
      fix: 'Сформулируйте 4–6 конкретных преимуществ с цифрами и разместите их выше первого экрана.',
      impact: '+10–15%',
      signal: 'has_usp=false',
    });
  }

  if (!s.hasFAQ && s.wordCount > 500) {
    out.push({
      category: 'Контент',
      severity: 'medium',
      title: 'Нет блока FAQ',
      description: 'Без FAQ менеджеры тратят время на одни и те же вопросы, а сомневающиеся посетители уходят без ответа.',
      fix: 'Добавьте 5–8 частых вопросов с краткими ответами в нижней части страницы.',
      impact: '+3–7%',
      signal: 'has_faq=false',
    });
  }

  if (!s.hasMessenger && s.hasPhone) {
    out.push({
      category: 'Доверие',
      severity: 'medium',
      title: 'Нет мессенджеров для связи',
      description: 'Часть аудитории не звонит и не пишет на e-mail — им удобнее WhatsApp/Telegram.',
      fix: 'Добавьте кнопки WhatsApp и Telegram рядом с телефоном.',
      impact: '+3–8%',
      signal: 'has_messenger=false',
    });
  }

  return out;
}

/**
 * Считаем «детерминированный» CRO-скор: 100 минус штраф за каждый барьер,
 * взвешенно по severity. Это пол: LLM может только опустить число (если
 * найдёт мягкие барьеры), но не задрать выше.
 */
export function deterministicScore(barriers: DeterministicBarrier[]): number {
  let score = 100;
  for (const b of barriers) {
    if (b.severity === 'critical') score -= 18;
    else if (b.severity === 'high') score -= 10;
    else score -= 5;
  }
  return Math.max(0, Math.min(100, score));
}
