

## AI-генерация уникального контента для GEO-страниц

### Обзор

Сейчас PSEOGenerator создаёт шаблонные тексты (одинаковые паттерны "Услуга в Городе" для всех страниц). Нужно добавить опциональную AI-генерацию уникального контента через существующую Edge Function `generate-text`, которая уже подключена к Lovable AI.

### Архитектура

Страниц может быть до 500, поэтому генерировать контент для каждой по отдельности — слишком дорого и медленно. Решение: **батчевая генерация** — отправляем один запрос на группу из 5-10 страниц, просим LLM вернуть уникальные тексты для каждой.

### Файлы

| Файл | Действие |
|------|----------|
| `supabase/functions/generate-geo-content/index.ts` | Новая Edge Function для батчевой генерации |
| `src/components/tools/PSEOGenerator.tsx` | Добавить AI-режим, прогресс, обновлённый UI |

### 1. Новая Edge Function `generate-geo-content`

Принимает массив страниц (до 10 за запрос), нишу, тональность и блоки контента. Возвращает уникальные тексты для каждой:

```typescript
// Input:
{ 
  pages: [{city, service, slug}], // до 10 штук
  niche: string,
  tone: "commercial" | "strict" | "expert",
  blocks: string[] // ["intro","faq","cta"]
}

// Output (structured via tool calling):
{
  results: [{
    slug: string,
    title: string,       // уникальный, до 60 символов
    metaDescription: string, // уникальный, до 160 символов
    h1: string,
    h2_1: string,
    h2_2: string,
    intro?: string,      // 2-3 предложения
    faq?: [{q, a}, {q, a}],
    cta?: string
  }]
}
```

Используем `tool_choice` для структурированного вывода (как в документации Lovable AI). Модель: `google/gemini-3-flash-preview` (быстрая, дешёвая).

### 2. Изменения в PSEOGenerator.tsx

**Step 2 — новый переключатель:**
- Добавить toggle "AI-контент" (по умолчанию выключен)
- Когда включён: генерация идёт через Edge Function батчами
- Когда выключен: всё работает как раньше (шаблоны)

**Step 3 — предупреждение:**
- Если AI включён, показать: "AI сгенерирует уникальные тексты для каждой страницы. Это займёт ~{estimate} секунд."
- Оценка: `Math.ceil(totalPages / 8) * 3` секунд

**Кнопка генерации:**
- Шаблон: "Создать GEO-страницы" (мгновенно)
- AI: "Создать с AI-контентом" (с прогрессом)

**Прогресс AI-генерации:**
- Progress bar: "Генерация контента: {done}/{total} страниц..."
- Батчи по 8 страниц, последовательно (чтобы не превысить rate limit)
- Задержка 1.5с между батчами
- Если батч упал — fallback на шаблон для этих страниц

**Step 4 — маркер AI:**
- В таблице результатов добавить колонку/бейдж "AI" для страниц с AI-контентом
- В PreviewCard показывать intro-текст если он есть
- Экспорт CSV/JSON включает все AI-поля (intro, уникальные FAQ)

### Детали реализации

**Батчевая обработка (фронтенд):**
```typescript
const generateWithAI = async (templateRows: PageRow[]) => {
  const batches = chunk(templateRows, 8);
  const results: PageRow[] = [];
  
  for (const batch of batches) {
    try {
      const { data } = await supabase.functions.invoke('generate-geo-content', {
        body: { pages: batch.map(r => ({city: r.city, service: r.service, slug: r.slug})), niche, tone, blocks }
      });
      // Merge AI data into template rows
      results.push(...mergeAIResults(batch, data.results));
    } catch {
      // Fallback: use template rows as-is
      results.push(...batch);
    }
    setProgress(results.length);
    if (batches.indexOf(batch) < batches.length - 1) await delay(1500);
  }
  return results;
};
```

**Ограничения:**
- Максимум 50 страниц с AI-контентом (свыше — предупреждение о времени и стоимости)
- Rate limit handling: 429 → pause 5s, retry once

