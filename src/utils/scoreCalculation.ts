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
  schema: 0.20,
  ai: 0.25,
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
