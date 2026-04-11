

## Диагностика и план исправления: GEO-аудит + GEO-рейтинг

### Корневая проблема

Сейчас существуют **две параллельные системы** проверки сайтов:

1. **Edge Function `site-check-scan`** (2855 строк, работает через Supabase) — полный пайплайн: тема, SEO, контент, Директ, конкуренты, ключевые слова, минус-слова, Schema, AI. Сохраняет в таблицу `scans` в Supabase.

2. **Бэкенд `owndev-backend`** (SiteCheckWorker + AuditService) — упрощённый анализ: 7 блоков через Puppeteer. Сохраняет в таблицу `site_check_scans` в PostgreSQL бэкенда.

**Фронтенд** (`src/lib/api/scan.ts`) обращается к бэкенду (`/api/v1/site-check/*`), но бэкенд возвращает **бедный** результат:
- `scores`: `{ seo: 75, confidence: 80, issues_count: 5, blocks: [...] }` — а фронт ожидает `{ total, seo, direct, schema, ai }`
- `result`: `{ score, issues, blocks }` — а фронт ожидает `issues`, `competitors`, `keywords`, `minus_words`, `theme` на верхнем уровне
- Итог: пустой отчёт, нет конкурентов, нет ключевиков, нет минус-слов

Вторая проблема: прогресс зависает на 5% потому что воркер, вероятно, падает на этапе Puppeteer `crawl()` (таймаут, отсутствие Chromium), и ошибка не доходит до фронта корректно.

### GEO Рейтинг

GEO Рейтинг (`src/pages/GeoRating.tsx`) читает данные из **Supabase таблицы `geo_rating`** через `supabase.from("geo_rating").select("*")`. Это единственный источник данных рейтинга. Чтобы отвязать от Supabase — нужно добавить API-эндпоинт на бэкенд.

### Ошибка сборки

Edge Function `mcp-server` использует `npm:mcp-lite@^0.10.0` — Deno не может разрешить пакет. Нужен `deno.json` с маппингом импортов.

---

### План исправления (5 шагов)

#### Шаг 1: Исправить `mcp-server` (ошибка сборки)

Создать `supabase/functions/mcp-server/deno.json` с маппингом npm-зависимостей, чтобы Deno мог резолвить `mcp-lite` и `hono`.

#### Шаг 2: Перенести полный пайплайн проверки на бэкенд

Основная работа. Перенести логику из Edge Function `site-check-scan` (2855 строк) в бэкенд-воркер `SiteCheckWorker`:

- **Заменить Puppeteer на fetch** — Edge Function использует простой `fetch` + Jina Reader для SPA. Это надёжнее и не требует Chromium.
- Перенести все шаги пайплайна:
  1. Theme detection (LLM через Lovable API)
  2. Technical SEO audit
  3. Content audit
  4. Direct audit + AI ad generation
  5. Schema audit
  6. AI readiness audit
  7. Competitor analysis (LLM)
  8. Keywords extraction (LLM)
  9. Minus words generation (LLM)
- Перенести `calcScoresWeighted()` для расчёта `{ total, seo, direct, schema, ai }`
- Сохранять результат в формате, который ожидает фронтенд: `scores`, `issues`, `competitors`, `keywords`, `minus_words`, `theme`, `seo_data`, `is_spa` — всё на верхнем уровне

#### Шаг 3: Исправить `/result/:scanId` эндпоинт

Изменить ответ так, чтобы данные из JSONB-колонки `result` «разворачивались» на верхний уровень:

```text
Было:  { id, url, scores, result: { issues, ... }, ... }
Стало: { id, url, scores, issues, competitors, keywords, minus_words, theme, seo_data, ... }
```

Также обновить таблицу `site_check_scans` — добавить колонки `theme`, `keywords`, `competitors`, `minus_words`, `seo_data`, `is_spa` (или хранить всё в `result` JSONB и разворачивать при отдаче).

#### Шаг 4: Перенести GEO Рейтинг на бэкенд

- Добавить эндпоинт `GET /api/v1/geo-rating` на бэкенд, который читает из таблицы `geo_rating` в PostgreSQL бэкенда
- Создать таблицу `geo_rating` в PostgreSQL бэкенда (миграция)
- В `GeoRating.tsx` заменить `supabase.from("geo_rating")` на `fetch(apiUrl('/geo-rating'))`
- В `GeoRatingNomination.tsx` — уже использует бэкенд, оставить как есть

#### Шаг 5: Убрать неиспользуемые Edge Functions

Удалить или деактивировать `site-check-scan` и `site-check-report` — они больше не нужны, вся логика на бэкенде.

---

### Что НЕ трогаем

- Остальные Edge Functions (seo-audit, brand-tracker, generate-text и пр.) — они работают как инструменты и не связаны с основным пайплайном проверки
- `src/lib/api/tools.ts` — уже настроен правильно
- `src/lib/api/scan.ts` — уже ходит через бэкенд

### Порядок реализации

Шаги 1-3 критичны и будут сделаны в первую очередь. Шаг 2 — самый объёмный (перенос ~2000 строк логики). Шаг 4 вторичен. Шаг 5 — cleanup.

### Важно

Все LLM-вызовы (тема, конкуренты, ключевики, минус-слова, объявления Директ) будут использовать Lovable AI API через HTTPS-запросы из бэкенда (тот же эндпоинт, что и Edge Functions).

