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
