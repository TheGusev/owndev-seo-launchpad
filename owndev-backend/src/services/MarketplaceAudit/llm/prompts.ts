import type { ParsedProduct, MarketplaceIssue } from '../../../types/marketplaceAudit.js';

export const SYSTEM_PROMPT =
  'Ты — эксперт по карточкам товаров Wildberries и Ozon. ' +
  'Отвечай ТОЛЬКО валидным JSON через указанный tool. Без markdown, без префиксов, без пояснений.';

export function buildContentAuditMessages(p: ParsedProduct) {
  const userPrompt = [
    `Платформа: ${p.platform.toUpperCase()}`,
    `Категория: ${p.category}`,
    `Заголовок: ${p.title}`,
    `Описание: ${p.description.slice(0, 2000)}`,
    `Характеристики: ${JSON.stringify(p.attributes ?? {})}`,
    'Найди до 4 содержательных проблем (LLM-уровень: релевантность title↔категория, USP, сценарии использования, доверие).',
    'Для каждой проблемы дай title, found, why_it_matters, how_to_fix, severity, impact_score (1..20).',
  ].join('\n');
  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: userPrompt },
  ];
}

export const CONTENT_AUDIT_TOOL = {
  type: 'function' as const,
  function: {
    name: 'submit_content_audit',
    description: 'Возвращает список проблем карточки и список сильных сторон.',
    parameters: {
      type: 'object',
      properties: {
        issues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              found: { type: 'string' },
              why_it_matters: { type: 'string' },
              how_to_fix: { type: 'string' },
              severity: { type: 'string', enum: ['critical', 'high', 'medium', 'low'] },
              impact_score: { type: 'number' },
              module: { type: 'string', enum: ['content', 'search', 'conversion', 'ads', 'technical', 'competitive'] },
            },
            required: ['title', 'found', 'why_it_matters', 'how_to_fix', 'severity', 'impact_score', 'module'],
            additionalProperties: false,
          },
        },
        strengths: { type: 'array', items: { type: 'string' } },
      },
      required: ['issues', 'strengths'],
      additionalProperties: false,
    },
  },
};

export function buildRewriteMessages(p: ParsedProduct, issues: MarketplaceIssue[], missingKeywords: string[]) {
  const userPrompt = [
    `Платформа: ${p.platform.toUpperCase()}`,
    `Категория: ${p.category}`,
    `Текущий заголовок: ${p.title}`,
    `Текущее описание: ${p.description.slice(0, 1500)}`,
    `Топ проблем: ${issues.slice(0, 5).map((i) => `${i.title} — ${i.how_to_fix}`).join('; ')}`,
    `Недостающие ключи: ${missingKeywords.slice(0, 12).join(', ') || '—'}`,
    'Сделай улучшенный title (60–100 симв), описание (600–1200 симв со структурой), 4–6 буллетов выгод, список ключей для добавления и список слов, которые лучше убрать.',
  ].join('\n');
  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: userPrompt },
  ];
}

export const REWRITE_TOOL = {
  type: 'function' as const,
  function: {
    name: 'submit_rewrite',
    description: 'Возвращает улучшенный заголовок, описание, буллеты, ключи и слова на удаление.',
    parameters: {
      type: 'object',
      properties: {
        newTitle: { type: 'string' },
        newDescription: { type: 'string' },
        bullets: { type: 'array', items: { type: 'string' } },
        addKeywords: { type: 'array', items: { type: 'string' } },
        removeWords: { type: 'array', items: { type: 'string' } },
      },
      required: ['newTitle', 'newDescription', 'bullets', 'addKeywords', 'removeWords'],
      additionalProperties: false,
    },
  },
};

// ─────────────────────────────────────────────────────────────────
// keyword_fit — реальные ключи ниши, покрытие текстом карточки
// ─────────────────────────────────────────────────────────────────
export function buildKeywordFitMessages(p: ParsedProduct) {
  const userPrompt = [
    `Платформа: ${p.platform.toUpperCase()}`,
    `Категория: ${p.category || 'не указана'}`,
    `Заголовок: ${p.title}`,
    `Описание: ${p.description.slice(0, 1500)}`,
    `Характеристики: ${JSON.stringify(p.attributes ?? {}).slice(0, 800)}`,
    '',
    'Задача: ты эксперт по этой нише на маркетплейсе. Сгенерируй до 20 РЕАЛЬНЫХ ключевых запросов,',
    'которые покупатели вводят при поиске такого товара (учти синонимы, типы, сценарии, бренд-агностичные).',
    'Для каждого запроса определи: covered=true если он явно встречается в title+description+attributes, иначе missing.',
    'coveragePct = round(covered.length / (covered.length + missing.length) * 100).',
    'suggestedKeywords — топ-8 самых важных недостающих ключей для добавления в карточку.',
  ].join('\n');
  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: userPrompt },
  ];
}

export const KEYWORD_FIT_TOOL = {
  type: 'function' as const,
  function: {
    name: 'submit_keyword_fit',
    description: 'Возвращает покрытие ключей ниши и приоритетные ключи к добавлению.',
    parameters: {
      type: 'object',
      properties: {
        covered: { type: 'array', items: { type: 'string' } },
        missing: { type: 'array', items: { type: 'string' } },
        coveragePct: { type: 'number' },
        suggestedKeywords: { type: 'array', items: { type: 'string' } },
      },
      required: ['covered', 'missing', 'coveragePct', 'suggestedKeywords'],
      additionalProperties: false,
    },
  },
};

// ─────────────────────────────────────────────────────────────────
// competitor_gap — анализ относительно URL'ов конкурентов
// ─────────────────────────────────────────────────────────────────
export function buildCompetitorGapMessages(p: ParsedProduct, competitorUrls: string[]) {
  const userPrompt = [
    `Платформа: ${p.platform.toUpperCase()}`,
    `Категория: ${p.category || 'не указана'}`,
    `НАША карточка:`,
    `  Заголовок: ${p.title}`,
    `  Описание: ${p.description.slice(0, 1200)}`,
    `  Характеристики: ${JSON.stringify(p.attributes ?? {}).slice(0, 600)}`,
    `  Фото: ${p.images?.length ?? 0} шт`,
    '',
    `Ссылки на конкурентов в этой категории (${competitorUrls.length}):`,
    ...competitorUrls.slice(0, 5).map((u, i) => `  ${i + 1}. ${u}`),
    '',
    'Задача: ты эксперт по нише. На основе ТИПИЧНЫХ карточек по таким URL и знаний о категории сделай gap-анализ:',
    '- weakerThan: 2-4 аспекта где наша карточка слабее (заголовок/описание/атрибуты/визуал/доверие). aspect+evidence.',
    '- strongerThan: 1-3 аспекта где наша карточка сильнее. aspect+evidence.',
    '- priorityAdds: 3-6 конкретных элементов (атрибут, фраза, блок) которые срочно добавить.',
    'Если данных мало — пиши осторожно, evidence без выдуманных цифр.',
  ].join('\n');
  return [
    { role: 'system' as const, content: SYSTEM_PROMPT },
    { role: 'user' as const, content: userPrompt },
  ];
}

export const COMPETITOR_GAP_TOOL = {
  type: 'function' as const,
  function: {
    name: 'submit_competitor_gap',
    description: 'Возвращает gap-анализ относительно конкурентов.',
    parameters: {
      type: 'object',
      properties: {
        weakerThan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string' },
              evidence: { type: 'string' },
            },
            required: ['aspect', 'evidence'],
            additionalProperties: false,
          },
        },
        strongerThan: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string' },
              evidence: { type: 'string' },
            },
            required: ['aspect', 'evidence'],
            additionalProperties: false,
          },
        },
        priorityAdds: { type: 'array', items: { type: 'string' } },
      },
      required: ['weakerThan', 'strongerThan', 'priorityAdds'],
      additionalProperties: false,
    },
  },
};
