

## Что не так с LLM-инструментами (root cause)

Проблема **не в одной конкретной строке**, а в **архитектурном рассогласовании** между фронтом и бэкендом. Их три, наслаиваются друг на друга.

### Проблема №1 — Бэкенд возвращает строку, фронт ждёт объект

Это **главная** причина «крутится → пустой экран».

`owndev-backend/src/api/routes/tools.ts` для всех LLM-инструментов делает:

```ts
const result = await askOpenAI(systemPrompt, userPrompt); // → string (markdown)
return reply.send({ success: true, result }); // result = "## Анализ...\n..."
```

А фронт-компоненты ждут **структурированные объекты**:

| Компонент | Ждёт | Получает реально |
|---|---|---|
| `CompetitorAnalysis.tsx` | `{ page1: PageMetrics, page2: PageMetrics }` (40+ полей: title, h1, wordCount, brokenLinks…) | `{ success: true, result: "## Сравнение...\n..." }` |
| `SemanticCoreGenerator.tsx` | `{ clusters: [{name, intent, keywords[]}] }` | `{ success: true, result: "ВЧ:\n— ремонт..." }` |
| `AITextGenerator.tsx` | `{ text: string }` | `{ success: true, result: "..." }` |
| `BrandTracker`, `ContentBrief`, `Autofix`, `GeoContent` | каждый свой объект | `{ success, result: markdown }` |

Что видит пользователь: `result?.page1?.seoScore` = `undefined` → **ничего не рендерится → пустой экран**. EmptyState срабатывает только для частных случаев (например, `clusters.length === 0`), а у `CompetitorAnalysis` условие — `!result && checkedAt`, но `result` **есть** (это `{success:true, result:"..."}`), просто внутри нет `page1`.

### Проблема №2 — Используется `OPENAI_API_KEY` напрямую, в обход правила памяти

Правило памяти `llm-provider-switch`:
> «Do not store LLM keys in backend; use proxy Edge Function.»

А `tools.ts` стучится напрямую в `https://api.openai.com/v1/chat/completions` с `process.env.OPENAI_API_KEY`. Если ключа на проде нет (или он истёк) — `askOpenAI` тихо возвращает `''` или строку `"AI недоступен..."`. Фронт всё равно получает `{success:true, result:""}` → опять же пустой экран.

У нас уже есть рабочий `supabase/functions/llm-proxy/index.ts` с `LOVABLE_API_KEY` (он точно есть в секретах). И есть `MA_LLM` в `MarketplaceAudit/llm/runLlm.ts` — он умеет делать **strict-JSON через tool-calling**. Это и есть тот шаблон, который надо применить ко всем инструментам.

### Проблема №3 — Half-LLM, half-fetch инструменты падают молча

`competitor-analysis` на бэке **не парсит сайты вообще** — просто шлёт URL в LLM и просит «сравни». Никаких `wordCount`, `brokenLinks`, `htmlSizeKB` LLM выдумать не может. Этот инструмент **никогда не работал по новой архитектуре** — раньше был на Supabase edge-функции с реальным fetch+parse, а при миграции на Node его обрезали до «спроси LLM».

Аналогично `seo-audit` — без скачивания HTML это пустой совет.

---

## Что предлагаю сделать

Чинить нужно **бэкенд**, фронт почти не трогаем (он уже корректно рендерит ожидаемые структуры).

### Шаг 1. Перевести все LLM-вызовы на `llm-proxy` + tool-calling

В `owndev-backend/src/api/routes/tools.ts` заменить функцию `askOpenAI` на `callJsonLlm` (по образцу `MarketplaceAudit/llm/runLlm.ts`), которая:
- Идёт на `https://chrsibijgyihualqlabm.supabase.co/functions/v1/llm-proxy` с заголовком `x-proxy-secret: ${EDGE_FUNCTION_SECRET}` (секрет уже есть на бэке — `backend-environment-config`).
- Передаёт `tools: [{...}]` + `tool_choice: { type:'function', function:{name} }`.
- Возвращает **уже распарсенный объект**, а не markdown.
- Default model: `google/gemini-3-flash-preview` (быстро + бесплатно по правилу `connecting-to-ai-models`).

Это устраняет проблему №2 целиком.

### Шаг 2. Под каждый инструмент — свой JSON-schema

| Эндпоинт | Schema выхода |
|---|---|
| `/tools/seo-audit` | `{ summary, issues:[{title, severity, fix}], recommendations:[] }` (фронт `SEOAuditor` принимает уже структуру) |
| `/tools/generate-semantic-core` | `{ clusters:[{name, intent: 'informational'\|'commercial'\|'transactional'\|'navigational', keywords:string[]}] }` |
| `/tools/generate-text` | `{ text: string }` |
| `/tools/generate-content-brief` | `{ goal, structure:[{h2, points[]}], keywords[], wordCount, formatting }` |
| `/tools/competitor-analysis` | **сначала fetch+parse обоих URL → metrics**, потом **LLM только для рекомендаций**. Возвращаем `{ page1, page2, recommendations? }` где page1/page2 — реальные `PageMetrics`. |
| `/tools/brand-tracker` | `{ visibility_score, gaps[], recommendations[] }` |
| `/tools/generate-autofix` | `{ explanation, steps[], code? }` |
| `/tools/generate-geo-content` | `{ pages: [{slug, h1, meta_description, intro}] }` |

### Шаг 3. Реальный парсинг для `competitor-analysis` и `seo-audit`

Добавить во временный helper (внутри `tools.ts` или новый `owndev-backend/src/services/Tools/pageMetrics.ts`):
- `fetchPageMetrics(url)` — скачивает HTML, считает: title, description, h1, h2/h3 count, wordCount, image count, alt missing, JSON-LD, canonical, OG, internal/external links, htmlSizeKB, loadTimeMs, lang.
- Возвращает `PageMetrics` 1:1 как ждёт фронт (40+ полей).

`competitor-analysis` вызывает `Promise.all([fetchPageMetrics(url1), fetchPageMetrics(url2)])`, без LLM на старте — данные точные и быстрые. LLM-комментарий — опциональным полем `recommendations`.

`seo-audit` — fetchPageMetrics + правила (HTTPS missing? canonical missing? wordCount<300?) → формирует `issues[]` детерминистично, LLM добавляет «как починить» только текстом для каждого issue.

### Шаг 4. Убрать молчаливые провалы

- Если `callJsonLlm` вернул `null` — отвечать `reply.status(503).send({ error: 'AI временно недоступен, попробуйте через минуту' })`. Фронт уже умеет ловить это в `catch` и показывать toast.
- Если у инструмента есть нон-AI часть (как fetchPageMetrics) — отдавать её даже когда LLM упал.

### Шаг 5. Маленькая фронтовая правка для устойчивости

В `src/lib/api/tools.ts` функция `callTool` сейчас возвращает весь `{success, result, ...}`. Компоненты иногда обращаются к корню (`result.page1`), иногда к `.result`. Чтобы не править 11 компонентов, **в `callTool` развернуть конверт**: если ответ выглядит как `{success:true, result:X}` и `X` — объект, вернуть `X`; если `X` — строка, вернуть `{text: X}` (для простых текстовых инструментов). Это обратно-совместимо.

---

## Файлы

| Файл | Действие |
|---|---|
| `owndev-backend/src/services/Tools/llmCall.ts` | **New** — обёртка над `llm-proxy` с tool-calling, по образцу `MarketplaceAudit/llm/runLlm.ts` |
| `owndev-backend/src/services/Tools/pageMetrics.ts` | **New** — `fetchPageMetrics(url): PageMetrics` с реальным fetch+regex-парсингом |
| `owndev-backend/src/services/Tools/schemas.ts` | **New** — JSON-схемы для всех 8 LLM-инструментов |
| `owndev-backend/src/api/routes/tools.ts` | **Edit** — переписать каждый эндпоинт: использовать `callJsonLlm` + соответствующую schema; для competitor-analysis и seo-audit добавить fetchPageMetrics; на ошибку LLM возвращать 503 |
| `src/lib/api/tools.ts` | **Edit** — в `callTool` развернуть конверт `{success, result}` (5 строк) |

## Что НЕ трогаем

- `supabase/functions/llm-proxy/index.ts` — он уже работает.
- 11 фронтовых компонентов в `src/components/tools/*` — они уже корректно ждут структурированные объекты (после правки `callTool` всё совпадёт).
- Header/Footer/маршруты/БД-схему/правила памяти.
- `MarketplaceAudit/*` — у них своя цепочка с tool-calling, она в порядке.
- SiteCheck/SSE/scan-events — недавняя работа, не пересекается.

## Проверка

1. Открыть `/tools/competitor-analysis`, ввести `vk.com` и `ok.ru`, нажать «Сравнить» — через ~5 сек видно две колонки SEO Score, метрики Title/H1/wordCount, бейджи HTTPS/JSON-LD и т.п. **Без пустого экрана.**
2. Открыть `/tools/semantic-core`, тема «ремонт квартир в Москве» — приходит 3+ кластеров с keywords.
3. Открыть `/tools/text-generator`, тип «meta», тема «доставка цветов» — приходит готовый текст.
4. Network вкладка: запросы идут на `https://owndev.ru/api/v1/tools/...`, ответы JSON со структурой, не markdown-строки.
5. Если бэк временно без AI (имитация: уронить `EDGE_FUNCTION_SECRET`) — toast «AI временно недоступен», экран не пустой, кнопка «Попробовать снова» работает.
6. `/tools/seo-audit` для `example.com` — реальные метрики из fetch + LLM-рекомендации к каждой проблеме.
7. Остальные 5 инструментов (brand-tracker, content-brief, autofix, geo-content, internal-links) — отдают свой ожидаемый JSON, рендерятся, не молчат.

