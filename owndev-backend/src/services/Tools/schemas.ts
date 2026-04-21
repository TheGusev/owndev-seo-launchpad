/**
 * JSON-схемы (OpenAI tool-calling) для всех LLM-инструментов.
 * Форма результатов соответствует ожиданиям фронта в src/components/tools/*.
 */
import type { ToolJsonSchema } from './llmCall.js';

export const SEO_AUDIT_SCHEMA: ToolJsonSchema = {
  name: 'seo_audit_result',
  description: 'Результат базового SEO-аудита страницы',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      seoScore: { type: 'number', description: 'SEO-оценка 0–100' },
      llmScore: { type: 'number', description: 'AI/GEO-готовность 0–100' },
      summary: { type: 'string', description: 'Короткое резюме (2–3 предложения) на русском' },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            type: { type: 'string' },
            severity: { type: 'string', enum: ['critical', 'warning', 'info'] },
            message: { type: 'string' },
            recommendation: { type: 'string' },
            category: { type: 'string', enum: ['seo', 'llm'] },
          },
          required: ['type', 'severity', 'message', 'recommendation', 'category'],
        },
      },
      meta: {
        type: 'object',
        additionalProperties: true,
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          h1: { type: 'string' },
          wordCount: { type: 'number' },
        },
      },
    },
    required: ['seoScore', 'llmScore', 'summary', 'issues', 'meta'],
  },
};

export const SEMANTIC_CORE_SCHEMA: ToolJsonSchema = {
  name: 'semantic_core_result',
  description: 'Семантическое ядро по теме, сгруппированное в кластеры',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      clusters: {
        type: 'array',
        minItems: 3,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            name: { type: 'string', description: 'Название кластера' },
            intent: {
              type: 'string',
              enum: ['informational', 'commercial', 'transactional', 'navigational'],
            },
            keywords: {
              type: 'array',
              minItems: 3,
              items: { type: 'string' },
            },
          },
          required: ['name', 'intent', 'keywords'],
        },
      },
    },
    required: ['clusters'],
  },
};

export const TEXT_GEN_SCHEMA: ToolJsonSchema = {
  name: 'text_generation_result',
  description: 'Готовый текст на заданную тему',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      text: { type: 'string', description: 'Готовый текст в формате plain или markdown' },
    },
    required: ['text'],
  },
};

export const CONTENT_BRIEF_SCHEMA: ToolJsonSchema = {
  name: 'content_brief_result',
  description: 'Подробный контент-бриф для SEO-страницы',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      brief: {
        type: 'object',
        additionalProperties: false,
        properties: {
          title_variants: { type: 'array', minItems: 3, maxItems: 3, items: { type: 'string' } },
          meta_title: { type: 'string' },
          meta_description: { type: 'string' },
          target_word_count: { type: 'number' },
          structure: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              properties: {
                tag: { type: 'string', description: 'H1/H2/H3' },
                text: { type: 'string' },
                description: { type: 'string' },
                min_words: { type: 'number' },
              },
              required: ['tag', 'text', 'description', 'min_words'],
            },
          },
          must_include: { type: 'array', items: { type: 'string' } },
          keywords_primary: { type: 'array', items: { type: 'string' } },
          keywords_secondary: { type: 'array', items: { type: 'string' } },
          questions_to_answer: { type: 'array', items: { type: 'string' } },
          geo_recommendations: { type: 'array', items: { type: 'string' } },
          schema_suggestion: { type: 'string' },
          tone: { type: 'string' },
          competitor_angles: { type: 'array', items: { type: 'string' } },
        },
        required: [
          'title_variants',
          'meta_title',
          'meta_description',
          'target_word_count',
          'structure',
          'must_include',
          'keywords_primary',
          'keywords_secondary',
          'questions_to_answer',
          'geo_recommendations',
          'schema_suggestion',
          'tone',
          'competitor_angles',
        ],
      },
    },
    required: ['brief'],
  },
};

export const COMPETITOR_RECOMMENDATIONS_SCHEMA: ToolJsonSchema = {
  name: 'competitor_recommendations',
  description: 'Краткие выводы и рекомендации по сравнению двух страниц',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      summary: { type: 'string' },
      strengths_page1: { type: 'array', items: { type: 'string' } },
      strengths_page2: { type: 'array', items: { type: 'string' } },
      recommendations: { type: 'array', items: { type: 'string' } },
    },
    required: ['summary', 'strengths_page1', 'strengths_page2', 'recommendations'],
  },
};

export const BRAND_TRACKER_SCHEMA: ToolJsonSchema = {
  name: 'brand_tracker_result',
  description: 'Анализ упоминаний бренда в AI-системах',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            prompt: { type: 'string' },
            aiSystem: { type: 'string' },
            mentioned: { type: 'boolean' },
            sentiment: {
              type: ['string', 'null'],
              enum: ['positive', 'neutral', 'negative', null],
            },
            position: { type: ['number', 'null'] },
            competitors: { type: 'array', items: { type: 'string' } },
            fullResponse: { type: 'string' },
          },
          required: ['prompt', 'aiSystem', 'mentioned', 'sentiment', 'position', 'competitors', 'fullResponse'],
        },
      },
    },
    required: ['results'],
  },
};

export const AUTOFIX_SCHEMA: ToolJsonSchema = {
  name: 'autofix_result',
  description: 'Пошаговое объяснение и код для исправления SEO-проблемы',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      explanation: { type: 'string' },
      steps: { type: 'array', items: { type: 'string' } },
      code: { type: 'string' },
    },
    required: ['explanation', 'steps', 'code'],
  },
};

export const GEO_CONTENT_SCHEMA: ToolJsonSchema = {
  name: 'geo_content_result',
  description: 'Готовые тексты для региональных страниц',
  parameters: {
    type: 'object',
    additionalProperties: false,
    properties: {
      pages: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            slug: { type: 'string' },
            h1: { type: 'string' },
            meta_title: { type: 'string' },
            meta_description: { type: 'string' },
            intro: { type: 'string' },
          },
          required: ['slug', 'h1', 'meta_title', 'meta_description', 'intro'],
        },
      },
    },
    required: ['pages'],
  },
};