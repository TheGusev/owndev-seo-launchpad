

## Новый инструмент: AI Content Brief Generator (`/tools/content-brief`)

### Файлы

| Файл | Действие |
|------|----------|
| `src/data/tools-registry.ts` | Добавить запись `content-brief` в массив tools + в TECHNICAL_SLUGS на странице Tools |
| `src/components/tools/ContentBriefGenerator.tsx` | Новый компонент — форма + отображение результата |
| `supabase/functions/generate-content-brief/index.ts` | Новая Edge Function — генерация брифа через Lovable AI |
| `src/pages/Tools.tsx` | Добавить `content-brief` в `TECHNICAL_SLUGS` |

### 1. tools-registry.ts — новая запись

```
id: "content-brief", slug: "content-brief",
name: "AI Content Brief Generator",
shortDesc: "ТЗ для копирайтера на основе AI-анализа: структура, ключи, GEO-рекомендации",
category: "content", icon: PenTool,
component: lazy(() => import("@/components/tools/ContentBriefGenerator")),
useCases: ["Создание ТЗ для копирайтера", "Структура статьи под AI-выдачу", "GEO-оптимизация контента"],
geoEnabled: false, status: "active",
seoTitle: "AI Content Brief Generator — ТЗ для копирайтера | OWNDEV",
seoDescription: "Генератор контент-брифа на основе AI: структура, ключи, GEO-рекомендации. Бесплатно.",
seoH1: "AI Content Brief Generator"
```

### 2. Edge Function `generate-content-brief`

- Принимает `{ query, url?, contentType }` 
- Валидация: query обязателен, contentType из whitelist
- Системный промт: эксперт по GEO/SEO-копирайтингу
- Tool calling для структурированного JSON-вывода (title_variants, meta_title, meta_description, target_word_count, structure, must_include, keywords_primary, keywords_secondary, questions_to_answer, geo_recommendations, schema_suggestion, tone, competitor_angles)
- Модель: `google/gemini-3-flash-preview`, temperature: 0.3
- Обработка 429/402 ошибок

### 3. ContentBriefGenerator.tsx (~350 строк)

**Форма:**
- Input: "Целевой запрос" (обязательное)
- Input: "URL вашего сайта" (опциональное)
- Select: "Тип контента" — Статья / Лендинг / Карточка товара / FAQ-страница
- GradientButton: "Сгенерировать бриф"

**Отображение результата (после генерации):**

1. **Верхняя панель** — 3 бейджа: объём слов, schema type, тон
2. **Заголовки** — 3 варианта H1 в glass-карточках с кнопкой "Копировать", Meta Title + Description с индикатором длины
3. **Структура статьи** — аккордеоны H2-секций с описанием и min_words
4. **Ключевые слова** — основные (крупные теги) + вторичные (мелкие), кнопка "Копировать все"
5. **Вопросы для AI-цитирования** — нумерованный список + подсказка
6. **GEO-рекомендации** — чек-лист с Lucide-иконками (CheckCircle2 / AlertTriangle)
7. **Экспорт** — "Скачать бриф (TXT)" + "Копировать бриф"

**Стиль:** dark glassmorphism, бирюзовые акценты, hover border-glow на карточках заголовков.

### 4. Tools.tsx

Добавить `"content-brief"` в массив `TECHNICAL_SLUGS`.

