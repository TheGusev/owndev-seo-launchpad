

## Добавить 10 новых статей в блог с LLM-оптимизацией

### Текущее состояние
- 18 статей в 6 кластерах (по 3 в каждом): LLM, AI Overviews, pSEO, Schema, Content, Technical
- Related posts работают по совпадению тегов
- Article JSON-LD уже генерируется в `BlogPost.tsx`

### Новые статьи (10 шт.)

Распределяю по кластерам для усиления семантического покрытия. Каждая статья будет содержать:
- H2-заголовки в формате вопросов (LLM-friendly)
- Списки и пошаговые инструкции
- FAQ-блок в конце (3-5 вопросов)
- Внутренние ссылки на инструменты OWNDEV (`/tools/seo-auditor`, `/tools/schema-generator` и т.д.)
- Ссылки на другие статьи блога (перелинковка между кластерами)
- Теги, пересекающиеся с существующими (для related posts)

| # | Кластер | Slug | Тема |
|---|---------|------|------|
| 1 | LLM | `kak-rabotat-s-gptbot-i-crawlerami` | Как работать с GPTBot, PerplexityBot и AI-краулерами: robots.txt, доступ, стратегия |
| 2 | AI Overviews | `ai-overviews-dlya-ecommerce` | AI Overviews для e-commerce: как товарным страницам попасть в AI-выдачу |
| 3 | AI Overviews | `featured-snippets-vs-ai-overviews` | Featured Snippets vs AI Overviews: в чём разница и как оптимизировать |
| 4 | pSEO | `pseo-oshibki-i-kak-izbezhat` | Типичные ошибки pSEO: thin content, каннибализация и как их избежать |
| 5 | Schema | `schema-faqpage-howto-polnoe-rukovodstvo` | Schema FAQPage и HowTo: полное руководство с примерами JSON-LD |
| 6 | Schema | `schema-dlya-saas-i-instrumentov` | Schema.org для SaaS и онлайн-инструментов: SoftwareApplication разметка |
| 7 | Content | `kak-obnovlyat-staryj-kontent-dlya-ai` | Как обновлять старый контент для AI-выдачи: чек-лист рефреша |
| 8 | Technical | `xml-sitemap-best-practices-2025` | XML Sitemap в 2025: best practices для индексации и AI-краулеров |
| 9 | Technical | `canonical-i-dubli-kak-ne-poteryat-trafik` | Canonical и дубли страниц: как не потерять трафик и AI-видимость |
| 10 | Content | `kontent-kotoryj-ne-ustarevaet-evergreen-seo` | Evergreen-контент для SEO: как создавать статьи, которые не устаревают |

### Перелинковка

Каждая статья будет содержать 2-4 внутренние ссылки:
- На релевантные инструменты OWNDEV (SEO Auditor, Schema Generator, pSEO Generator, Sitemap Generator и др.)
- На существующие статьи из других кластеров (кросс-кластерная перелинковка)
- Упоминания через markdown-ссылки формата `[текст](/tools/slug)` и `[текст](/blog/slug)`

### Файловые изменения

| Файл | Изменение |
|------|-----------|
| `src/data/blog/cluster-llm.ts` | +1 статья |
| `src/data/blog/cluster-ai-overviews.ts` | +2 статьи |
| `src/data/blog/cluster-pseo.ts` | +1 статья |
| `src/data/blog/cluster-schema.ts` | +2 статьи |
| `src/data/blog/cluster-content.ts` | +2 статьи |
| `src/data/blog/cluster-technical.ts` | +2 статьи |

Индексный файл `src/data/blog/index.ts` менять не нужно -- он уже импортирует все кластеры и сортирует по дате. Related posts в `BlogPost.tsx` автоматически подхватят новые статьи по тегам.

### LLM-формат контента

Каждая статья следует шаблону:
```text
## Вопрос-заголовок H2
Прямой ответ 2-3 предложения.
- Список ключевых пунктов
- С конкретными данными

## Следующий вопрос H2
...

## FAQ
**Вопрос?**
Ответ в 2-3 предложениях.
```

Даты публикации: июль-август 2025 (хронологически после существующих).

