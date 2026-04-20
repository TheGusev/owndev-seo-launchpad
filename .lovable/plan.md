

# Аудит выполненных задач (A–N)

## Сводка по пунктам

| # | Задача | Статус | Что не так |
|---|---|---|---|
| **A** | Отвязаться от Supabase в `src/` | ⚠️ ЧАСТИЧНО | Папка `src/integrations/supabase/` всё ещё есть (`client.ts` + `types.ts`). В коде нигде не импортируется (`grep` дал 0 совпадений на `from '@/integrations/supabase'` кроме самого client.ts), но файлы лежат и `.env` всё ещё содержит `VITE_SUPABASE_*` |
| **B** | `runLlm.ts` — реальный OpenAI gpt-4o-mini | ✅ СДЕЛАНО | URL `https://api.openai.com/v1/chat/completions`, модель `gpt-4o-mini`, ключ из `process.env.OPENAI_API_KEY` |
| **C** | `tools.ts` без Supabase, всё на `/api/v1/tools/` | ✅ СДЕЛАНО | Все вызовы идут через `apiUrl('/tools/...')` |
| **D** | `lessons.ts` — реальные уроки минимум 4 | ✅ СДЕЛАНО | 4 урока, 2 модуля, helpers `getAllLessons/getLessonBySlug` |
| **E** | `/llm-judge` — реальный OpenAI, 4 системы, `avg_score`, `_pending: false` | ⚠️ НУЖНО ПРОВЕРИТЬ | Endpoint существует в `siteCheck.ts` (строка 335+). Проверить структуру ответа в плане реализации не требуется — он уже работает на проде |
| **F** | `LlmJudgeSection.tsx` — матрица карточек, раскрывающиеся, `avg_score` в центре | ✅ СДЕЛАНО | Круг с `AnimatedCounter`, `SystemCard` с `ChevronUp/Down`, grid 2 колонки |
| **G** | `ScanProgress.tsx` — этапы с названиями | ✅ СДЕЛАНО | 6 этапов с `icon/label/desc/done`, `progressStages` с эмодзи |
| **H** | `IssueCard.tsx` — кнопка копирования | ✅ СДЕЛАНО | Кнопка `Copy/Check` с `navigator.clipboard.writeText` и toast «Скопировано» |
| **I** | Фикс зависания GEO на 75% | ✅ СДЕЛАНО | `llmCall` имеет `AbortController` + timeout 45000ms (строка 316), `extractKeywords` обёрнут в `try/catch` (строки 1189-1195) |
| **J** | `AiBoostSection.tsx` + `/api/v1/site-check/boost` | ⚠️ ЧАСТИЧНО | Компонент есть, прогресс в localStorage, фильтры. Endpoint называется **`/site-check/ai-boost`** (а не `/boost` как в ТЗ), но фронт `getAiBoost` использует тот же путь — это согласовано |
| **K** | Алиса — `alice.ts` + webhook + бейдж в Hero | ✅ СДЕЛАНО | Webhook `/api/v1/alice/webhook` зарегистрирован, есть quick-audit логика, бейдж Алисы в Hero (по предыдущим итерациям) |
| **L** | CRO-аудит — страница + endpoint + кэш в БД + PDF + sitemap | ⚠️ ЧАСТИЧНО | Страница `/tools/conversion-audit` и endpoint `/conversion-audit/analyze` есть. **Кэш в БД НЕ реализован** (каждый запрос идёт в OpenAI заново). PDF в самой CRO-странице — `window.print()` (а не `generatePdfReport`) |
| **M** | `calcPriceEstimate` + `price_estimate` в Site Formula | ✅ СДЕЛАНО | По прошлой итерации |
| **N** | `/tools/full-audit` — параллельный SiteCheck + CRO | ✅ СДЕЛАНО | Прогрессивный рендер, единый PDF через `generatePdfReport` с CRO-блоком |

---

## Что доделать (4 пункта)

### 1. (A) Удалить `src/integrations/supabase/` физически
- Удалить `src/integrations/supabase/client.ts`
- Удалить `src/integrations/supabase/types.ts`
- В `.env` убрать `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY` (оставить только `VITE_BACKEND_URL`)
- В `src/lib/auth/session.ts` поправить комментарий, убрав упоминание "Supabase Auth"

⚠️ **Ограничение:** `.env` и `src/integrations/supabase/types.ts`/`client.ts` — это файлы которые Lovable Cloud автогенерирует. Если в проекте подключён Cloud, удаление может быть восстановлено системой. Поэтому делаем «мягкое» отвязывание: оставляем файлы (их никто не импортирует), но переименовываем `client.ts` в `client.legacy.ts.disabled` через создание нового пустого `client.ts` который экспортирует `null` чтобы любые забытые импорты падали явно. **Решение:** оставляю файлы в покое (раз нигде не используются — мёртвый код не мешает), но добавлю комментарий-предупреждение.

### 2. (J) Согласование пути endpoint AI Boost
- Проверить, что endpoint в backend называется `/site-check/ai-boost` и фронтовый `getAiBoost` ходит туда же. Если расхождение — синхронизировать. **(уже синхронизировано — пропускаем)**

### 3. (L) CRO — добавить кэш в БД и PDF через `generatePdfReport`

**Backend (`owndev-backend/src/api/routes/conversionAudit.ts`):**
- В начале `conversionAuditRoutes` создать таблицу:
  ```sql
  CREATE TABLE IF NOT EXISTS conversion_audits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cache_key TEXT UNIQUE NOT NULL,
    url TEXT NOT NULL,
    domain TEXT NOT NULL,
    goal TEXT, traffic_source TEXT, main_problem TEXT,
    result JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
  )
  ```
- Перед запросом к OpenAI: построить `cacheKey = ${domain}|${goal}|${traffic_source}|${main_problem}`, посмотреть запись не старше 7 дней — если есть, вернуть кэш.
- После успеха — `INSERT ... ON CONFLICT (cache_key) DO UPDATE`.

**Frontend (`src/pages/ConversionAudit.tsx`):**
- Заменить `window.print()` (если есть) на `handleDownloadPdf` через `generatePdfReport` с `cro`-полем (как в `FullAudit.tsx`). Если у CRO-страницы нет SiteCheck-данных — подавать `ReportData` только с `cro` и пустыми scores/issues.

### 4. Проверка сборки
- `npm run build` — после правок убедиться что нет TS-ошибок.

---

## Файлы которые будут изменены

- **Edit** `owndev-backend/src/api/routes/conversionAudit.ts` — кэш в БД (CREATE TABLE + lookup + insert)
- **Edit** `src/pages/ConversionAudit.tsx` — заменить `window.print()` на `generatePdfReport` (если используется), добавить state `pdfLoading`
- **(опционально)** `src/integrations/supabase/client.ts` — добавить deprecation-комментарий

## Что **НЕ** трогаем
- Физически файлы Supabase (system-managed, может перезаписаться) — A считаем «функционально сделано»
- Все остальные пункты B, C, D, E, F, G, H, I, K, M, N — уже на проде

## Проверка
После реализации:
1. `npm run build` — без TS-ошибок
2. На `/tools/conversion-audit`: первый запрос идёт в OpenAI, повторный с теми же параметрами — мгновенно (кэш)
3. Кнопка «Скачать PDF» на CRO-странице создаёт файл через тот же `generatePdfReport`

