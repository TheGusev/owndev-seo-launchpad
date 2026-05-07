// ═══ Transparent SEO & LLM Score Calculation ═══
// Weights and labels for score breakdown display

export interface ScoreCriterion {
  key: string;
  label: string;
  description: string;
  weight: number;
  category: 'seo' | 'ai';
}

export const SEO_CRITERIA: ScoreCriterion[] = [
  { key: 'titleTag', label: 'Title', description: 'Title 50-60 символов', weight: 8, category: 'seo' },
  { key: 'metaDescription', label: 'Meta Description', description: 'Meta description 120-160 символов', weight: 8, category: 'seo' },
  { key: 'h1Tag', label: 'Заголовок H1', description: 'Один H1 на странице', weight: 8, category: 'seo' },
  { key: 'headingStructure', label: 'Иерархия заголовков', description: 'H1-H6 без пропусков уровней', weight: 5, category: 'seo' },
  { key: 'canonical', label: 'Canonical URL', description: 'Canonical ссылка указана', weight: 4, category: 'seo' },
  { key: 'ogTags', label: 'Open Graph', description: 'OG title + description + image', weight: 5, category: 'seo' },
  { key: 'robots', label: 'Meta Robots', description: 'Meta robots / X-Robots-Tag', weight: 3, category: 'seo' },
  { key: 'contentLength', label: 'Объём контента', description: '> 300 слов текста', weight: 8, category: 'seo' },
  { key: 'images', label: 'Alt у изображений', description: 'Alt у всех img (кроме tracking)', weight: 5, category: 'seo' },
  { key: 'internalLinks', label: 'Внутренние ссылки', description: '≥ 3 внутренних ссылки', weight: 5, category: 'seo' },
  { key: 'externalLinks', label: 'Внешние ссылки', description: '≥ 1 внешняя ссылка', weight: 3, category: 'seo' },
  { key: 'https', label: 'HTTPS', description: 'Сайт доступен по HTTPS', weight: 5, category: 'seo' },
  { key: 'mobileViewport', label: 'Viewport', description: 'Viewport meta tag', weight: 5, category: 'seo' },
  { key: 'performance', label: 'Скорость загрузки', description: 'Время загрузки < 3 сек', weight: 8, category: 'seo' },
  { key: 'sitemap', label: 'Sitemap.xml', description: 'sitemap.xml доступен', weight: 5, category: 'seo' },
  { key: 'robotsTxt', label: 'Robots.txt', description: 'robots.txt доступен', weight: 5, category: 'seo' },
  { key: 'noMixedContent', label: 'Без mixed content', description: 'Нет HTTP ресурсов на HTTPS', weight: 5, category: 'seo' },
  { key: 'favicon', label: 'Favicon', description: 'Favicon найден', weight: 3, category: 'seo' },
  { key: 'langAttr', label: 'Атрибут lang', description: 'html lang="..." указан', weight: 2, category: 'seo' },
];

export const LLM_CRITERIA: ScoreCriterion[] = [
  { key: 'schemaOrg', label: 'Schema.org', description: 'JSON-LD разметка', weight: 15, category: 'ai' },
  { key: 'faqPresent', label: 'FAQ секция', description: 'FAQ с Schema разметкой', weight: 10, category: 'ai' },
  { key: 'llmsTxt', label: 'llms.txt', description: '/llms.txt доступен', weight: 10, category: 'ai' },
  { key: 'contentStructure', label: 'Структура контента', description: 'Абзацы, списки, таблицы', weight: 10, category: 'ai' },
  { key: 'contentClarity', label: 'Читаемость', description: 'Без keyword stuffing', weight: 10, category: 'ai' },
  { key: 'directAnswers', label: 'Прямые ответы', description: 'Ответы в первых абзацах', weight: 10, category: 'ai' },
  { key: 'entityMentions', label: 'Сущности', description: 'Упоминания бренда, продукта', weight: 8, category: 'ai' },
  { key: 'citationReady', label: 'Цитируемость', description: 'Короткие блоки 2-3 предложения', weight: 7, category: 'ai' },
  { key: 'freshness', label: 'Актуальность', description: 'Дата публикации/обновления', weight: 5, category: 'ai' },
  { key: 'authorEeat', label: 'E-E-A-T', description: 'Авторство (для статей)', weight: 5, category: 'ai' },
  { key: 'semanticHtml', label: 'Семантический HTML', description: '<article>, <section>, <nav>, <main>', weight: 5, category: 'ai' },
  { key: 'multimodal', label: 'Мультимодальность', description: 'Подписи к изображениям, alt', weight: 5, category: 'ai' },
];

export const DIRECT_CRITERIA: ScoreCriterion[] = [
  { key: 'h1Specificity', label: 'Конкретность H1', description: 'H1 содержит конкретную услугу/продукт', weight: 20, category: 'seo' },
  { key: 'h1TitleMatch', label: 'H1 ↔ Title соответствие', description: 'Семантическое совпадение H1 и Title >50%', weight: 20, category: 'seo' },
  { key: 'textCoherence', label: 'Когерентность текста', description: 'Текст страницы логически связан', weight: 15, category: 'seo' },
  { key: 'noMixedTopics', label: 'Единая тематика', description: 'Страница посвящена одной теме', weight: 15, category: 'seo' },
  { key: 'commercialSignals', label: 'Коммерческие сигналы', description: 'Наличие цен, CTA, контактов', weight: 15, category: 'seo' },
  { key: 'adHeadlineReady', label: 'Готовность заголовка', description: 'Заголовок подходит для рекламы (до 35 символов)', weight: 15, category: 'seo' },
];

export const SCHEMA_CRITERIA: ScoreCriterion[] = [
  { key: 'hasJsonLd', label: 'JSON-LD разметка', description: 'Наличие JSON-LD на странице', weight: 25, category: 'seo' },
  { key: 'orgSchema', label: 'Organization', description: 'Schema Organization или LocalBusiness', weight: 20, category: 'seo' },
  { key: 'breadcrumb', label: 'BreadcrumbList', description: 'Хлебные крошки в разметке', weight: 15, category: 'seo' },
  { key: 'faqSchema', label: 'FAQPage', description: 'FAQ секция с Schema разметкой', weight: 20, category: 'seo' },
  { key: 'productOrService', label: 'Product / Service', description: 'Разметка продукта или услуги', weight: 20, category: 'seo' },
];

export const OVERALL_WEIGHTS = {
  seo: 0.35,
  direct: 0.20,
  schema: 0.15, // совпадает с backend calcScoresWeighted
  ai: 0.30,     // совпадает с backend calcScoresWeighted
};

export const SEO_MAX = SEO_CRITERIA.reduce((s, c) => s + c.weight, 0);
export const LLM_MAX = LLM_CRITERIA.reduce((s, c) => s + c.weight, 0);
export const DIRECT_MAX = DIRECT_CRITERIA.reduce((s, c) => s + c.weight, 0);
export const SCHEMA_MAX = SCHEMA_CRITERIA.reduce((s, c) => s + c.weight, 0);

export type CriterionStatus = 'pass' | 'fail' | 'partial';

export interface CriterionResult {
  key: string;
  weight: number;
  earned: number;
  status: CriterionStatus;
}

export interface ScoreBreakdown {
  seo: CriterionResult[];
  ai: CriterionResult[];
}

// ═══════════════════════════════════════════════════════════════
// Sprint 9 — BACKEND-driven breakdown labels.
// Backend calcSeoScore / calcCroScore / calcGeoScore возвращают
// breakdown вида [{ key, weight, earned }]. Здесь — человеческие
// лейблы и описания для модалки «Как рассчитан?».
// Источник правды: owndev-backend/src/services/SiteCheckPipeline.ts
// (calcSeoScore — line 1804, calcCroScore — 1865, calcGeoScore — 1763).
// ═══════════════════════════════════════════════════════════════
export const SEO_BACKEND_CRITERIA: ScoreCriterion[] = [
  { key: 'technical', label: 'Техническая база', description: 'HTTPS, 200 OK, редиректы, TTFB, gzip/brotli, HSTS', weight: 30, category: 'seo' },
  { key: 'content', label: 'Контент-минимум', description: 'Title 30–70, description 120–160, один H1, ≥600 слов', weight: 25, category: 'seo' },
  { key: 'performance', label: 'Производительность', description: 'Блокирующий CSS/JS, modern images, lazy, font-display', weight: 20, category: 'seo' },
  { key: 'schema', label: 'Schema.org', description: 'JSON-LD, ≥3 типа, Organization/LocalBusiness, BreadcrumbList', weight: 15, category: 'seo' },
  { key: 'crawl', label: 'Индексация', description: 'robots.txt, sitemap.xml, ссылка на sitemap из robots', weight: 10, category: 'seo' },
];

export const GEO_BACKEND_CRITERIA: ScoreCriterion[] = [
  { key: 'ai_bot_access', label: 'Доступ AI-ботов', description: 'GPTBot/ClaudeBot/PerplexityBot/Applebot/CCBot/anthropic-ai не запрещены в robots.txt', weight: 25, category: 'ai' },
  { key: 'llms_txt_quality', label: 'Качество llms.txt', description: 'Полнота /llms.txt по стандарту llmstxt.org', weight: 20, category: 'ai' },
  { key: 'structured_data', label: 'Структурированные данные', description: 'Кол-во Schema-типов + бонус за FAQPage', weight: 15, category: 'ai' },
  { key: 'citation_ready', label: 'Цитируемость', description: 'Короткие самостоятельные блоки, готовые к цитированию AI', weight: 15, category: 'ai' },
  { key: 'semantic_html', label: 'Семантический HTML', description: '<article>, <section>, <main>, <nav>, <header>, <footer>', weight: 10, category: 'ai' },
  { key: 'eeat', label: 'E-E-A-T сигналы', description: 'Автор + дата публикации/обновления', weight: 10, category: 'ai' },
  { key: 'qa_format', label: 'Q&A-формат', description: 'Заголовки-вопросы и/или FAQ-секция', weight: 5, category: 'ai' },
];

export const CRO_BACKEND_CRITERIA: ScoreCriterion[] = [
  { key: 'trust', label: 'Доверие', description: 'Телефон, email, адрес, реквизиты, гарантии', weight: 25, category: 'seo' },
  { key: 'cta', label: 'CTA / Призывы', description: 'Кол-во CTA, выше первого экрана, есть основной', weight: 25, category: 'seo' },
  { key: 'forms', label: 'Формы', description: 'Наличие, контактная форма, ≤5 полей', weight: 15, category: 'seo' },
  { key: 'pricing', label: 'Цены', description: 'Прайс на сайте, калькулятор стоимости', weight: 15, category: 'seo' },
  { key: 'social_proof', label: 'Соц. доказательства', description: 'Отзывы, кейсы, логотипы клиентов', weight: 10, category: 'seo' },
  { key: 'channels', label: 'Каналы связи', description: 'Мессенджеры, обратный звонок, онлайн-чат', weight: 10, category: 'seo' },
];

/**
 * Нормализует backend breakdown ({key,weight,earned}) к формату
 * фронта (CriterionResult с полем status).
 * pass — earned >= weight; fail — earned === 0; partial — между.
 */
export function normalizeBackendBreakdown(
  raw: Array<{ key: string; weight: number; earned: number }> | null | undefined,
): CriterionResult[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  return raw.map((r) => {
    const earned = Math.max(0, Math.min(r.weight, r.earned ?? 0));
    const status: CriterionStatus =
      earned >= r.weight ? 'pass' : earned === 0 ? 'fail' : 'partial';
    return { key: r.key, weight: r.weight, earned, status };
  });
}

export function computePotentialScore(
  currentScore: number,
  breakdown: CriterionResult[]
): number {
  const missed = breakdown
    .filter(c => c.status !== 'pass')
    .reduce((s, c) => s + (c.weight - c.earned), 0);
  const maxWeight = breakdown.reduce((s, c) => s + c.weight, 0);
  if (maxWeight === 0) return 100;
  const currentWeighted = (currentScore / 100) * maxWeight;
  return Math.min(100, Math.round(((currentWeighted + missed) / maxWeight) * 100));
}
