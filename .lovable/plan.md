

## Стабилизация LLM в site-check-scan

### Обзор LLM-вызовов (5 шт)

| # | Шаг | Строка | Текущая модель | Новая модель |
|---|------|--------|---------------|-------------|
| 1 | `detectTheme` | 198 | `gemini-3-flash-preview` | `google/gemini-2.0-flash` |
| 2 | Competitor: search queries | 1228 | `gemini-3-flash-preview` | `google/gemini-2.0-flash` |
| 3 | Competitor: URLs | 1251 | `gemini-2.5-pro` | `google/gemini-2.5-pro` (без изменений) |
| 4 | `extractKeywords` (×3 batch) | 1471 | `gemini-2.5-pro` | `google/gemini-2.5-pro` (без изменений) |
| 5 | `generateMinusWords` | 1531 | `gemini-2.5-flash` | `google/gemini-2.5-flash` (без изменений) |

### Изменения (1 файл: `supabase/functions/site-check-scan/index.ts`)

#### A. Модели и параметры генерации

- Вызовы 1, 2: сменить модель на `google/gemini-2.0-flash`
- Ко всем 5 вызовам добавить: `temperature: 0.1, top_p: 0.85, top_k: 20, max_tokens: 8192` (для keywords оставить `max_tokens: 16000`)
- В конец каждого system prompt добавить: `"ВАЖНО: Отвечай СТРОГО на русском языке. Возвращай ТОЛЬКО валидный JSON без markdown-блоков, без пояснений, без ```json, только сам JSON."`

#### B. Единый JSON-парсер

Заменить `tryParseJsonArray` (строки 47-66) на `safeParseJson<T>(raw, fallback)`:
- Очистка: убрать ````json`, control chars
- Извлечение: regex для `[...]` и `{...}`
- Fallback: truncated array recovery
- Логирование ошибок

Заменить все вызовы `tryParseJsonArray(...)` → `safeParseJson(...)`:
- Строка 1479 (keywords)
- Строка 1541 (minus words)
- Строки 1238, 1261 (competitor queries/urls — inline `JSON.parse` → `safeParseJson`)

#### C. Строгие промпты

1. **extractKeywords** (строка 1454): полная замена system prompt на схему из ТЗ — 150 запросов, кластеры ≤7, поля `phrase/cluster/intent/frequency/landing_needed`
2. **generateMinusWords** (строка 1533): замена на схему из ТЗ — 50-80 слов, поля `word/category/reason`
3. **detectTheme**: оставить как есть (простая классификация)
4. **Competitor queries/URLs**: добавить суффикс про JSON

#### D. Логирование

Перед каждым `fetch` к AI Gateway:
```
console.log(`[OWNDEV] Шаг: ${stepName} | Модель: ${model} | URL: ${url}`);
```
После получения raw response:
```
console.log(`[OWNDEV] Ответ ${stepName}:`, rawContent.slice(0, 200));
```
После парсинга:
```
console.log(`[OWNDEV] Распарсено ${stepName}: ${Array.isArray(r) ? r.length + ' элементов' : 'объект'}`);
```

#### Замечание по схемам данных

Промпт keywords меняет формат с `type/priority/use_for_seo/use_for_direct/landing_needed(string)` на `cluster/intent/frequency/landing_needed(bool)`. Интерфейс `KeywordEntry` (строка 1424) будет обновлён соответственно. UI-компонент `KeywordsSection.tsx` уже поддерживает `cluster` и `intent` — поля `frequency` и `landing_needed` будут доступны в данных, но рендер не меняется (задача — только стабилизация бэкенда).

Промпт minus words меняет `type: general|thematic` на `category: informational|irrelevant|competitor|geo|other`. Интерфейс `MinusWordEntry` обновится. Hardcoded `GENERAL_MINUS_WORDS` массив получит поле `category` вместо `type`.

### Файлы

| Файл | Изменение |
|------|-----------|
| `supabase/functions/site-check-scan/index.ts` | Модели, параметры, safeParseJson, промпты, логирование |

