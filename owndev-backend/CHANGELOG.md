# Changelog

## PR-31 — Раскрытие семантики DEMAND-seeds и вертикальные минусы

Что было:
- Авто-seed строил плоский шаблон `<industry> <city> [modifier]` (16 фраз). Для жалобы пользователя «дезинфекция» система НЕ понимала синонимы (обработка, санобработка, дезинсекция, дератизация, травля, уничтожение) и НЕ покрывала объекты (от тараканов, от клопов, от муравьёв и т.д.).
- `directCampaignExporter` использовал один захардкоженный массив `CAMPAIGN_MINUS_WORDS` для ВСЕХ вертикалей.

Что изменено:
- `IndustryProfile` расширен опциональными полями `synonyms[]`, `targets[]`, `vertical_minus_words[]`. Все 9 JSON-профилей (`services_emergency`, `services_default`, `medical`, `beauty`, `repair`, `education`, `auto`, `realestate`, `b2b_wholesale`) получили адекватные значения.
- Добавлен `services/demand/keywordSeedBuilder.ts` с диагональным обходом `synonym × target × city` и лимитом 24 (Wordstat-квота). Старые профили без synonyms/targets уходят в fallback-ветку и работают как раньше.
- `pipelineOrchestrator` в блоке `autoSeedUsed` теперь вызывает `buildKeywordSeeds(...)` и логирует `auto-seed v2: ... synonyms=N, targets=M`.
- `buildDirectExport` принимает опцию `profile: { id, vertical_minus_words }`. К глобальным минусам докидывает vertical-специфичные через Set с сохранением порядка.

Регрессы:
- Новый `test:pr31-seed-builder` (5 сценариев, включая «дезинфекция × 3 города → 24 seeds с >=3 синонимами и >=3 targets», fallback для профиля без synonyms/targets, vertical_minus_words в exporter).
- Включён в `test:bridge` (теперь 15 шагов).

Пример «до/после» для «дезинфекция» × Москва/СПб/Казань:
- До: 6-8 фраз вида `дезинфекция москва`, `дезинфекция москва цена`.
- После: 24 фразы, включая `обработка от тараканов москва`, `санобработка от клопов москва`, `дезинсекция от муравьёв москва`, `дератизация от тараканов москва`, `травля от тараканов москва`, `выведение от клопов москва`.

## PR-26 — Я.Директ-экспорт, Wordstat diag, data_confidence

- GET /api/v1/diag/wordstat — статус Wordstat-интеграции без раскрытия секретов
- POST /api/v3/direct-export/json|csv — готовые группы объявлений Я.Директа из кластеров спроса
- MarketplaceAudit: новое поле data_confidence (pct + missing_fields) для прозрачности парсинга WB/Ozon
- Новый тест test:pr26-direct-export добавлен в test:bridge (теперь 14/14)
- Frontend: кнопка «Экспорт в Я.Директ (XLSX)» в Pro-отчёте

## [Unreleased]

### Fixed (Accuracy pass 2 — 11 правок аудита точности)
- **Race condition `issueCounter`** при параллельных сканах: счётчик id вынесен в фабрику `createIssueFactory()` на каждый запуск `runPipeline`. Все аудиторы (`technicalAudit`, `contentAudit`, `directAudit`, `schemaAudit`, `aiAudit`, `competitorAnalysis`) принимают `makeIssue` параметром.
- **Mixed Content false positives**: детектор больше не триггерит на обычные `<a href="http://">`, только на `src/action/data/poster`, `<link rel="stylesheet" href="http://">`, `<script src="http://">`.
- **Двойной fetch `/llms.txt`**: убран повторный запрос в `aiAudit` — теперь один HEAD в `runPipeline`, флаг `hasLlmsTxt` пробрасывается в аудит.
- **robots.txt User-agent группировка**: новая функция `parseRobotsDisallowForAll()` учитывает только блок `User-agent: *` (раньше правила Googlebot ошибочно блокировали страницу для всех).
- **HEAD → GET fallback в `checkUrl`**: при HTTP 405 повторяем запрос GET — больше нет ложных «битых ссылок» на серверах PHP/Bitrix без HEAD.
- **TTFB вместо LCP** в issue про медленный ответ сервера.
- **OG-теги по непустому `content`** — пустой `og:title content=""` теперь fail.
- **`wordCount` через `/[\p{L}\p{N}]/u`** — пунктуация (`—`, `:`, `...`) больше не считается словом.
- **SPA detection — исключены SSR false positives**: Next.js (`__NEXT_DATA__`), Nuxt (`window.__NUXT__`), Vue (`data-server-rendered`), React (`data-reactroot`) больше не уходят в Jina Reader зря.
- **Schema required fields**: `schemaAudit` дополнительно проверяет `Organization`/`LocalBusiness`/`Corporation` на наличие `name` + `url`.
- **CTA pattern расширен**: «узнать цену», «рассчитать», «подобрать», «оформить», «связаться», «demo», «trial», «download», «order», «request», «скачать», «попробовать» и др.

### Added (новые проверки)
- **Twitter Card** (`<meta name="twitter:card" content="...">`) — severity `low` в `contentAudit`.
- **Security headers**: `X-Content-Type-Options` (nosniff) и `X-Frame-Options`/CSP `frame-ancestors` — severity `low` в `technicalAudit`. Заголовки ответа собираются в `runPipeline`.
- **`Cache-Control`**: фиксируем отсутствие или жёсткий `no-store/no-cache` без `private` — severity `low`.
- **Sitemap freshness**: самый свежий `<lastmod>` старше 6 мес → medium issue.
- **Viewport `width=device-width`**: если meta viewport есть, но без `width=device-width` → medium issue.

### Notes
- Rate limiting на `POST /start` (5 сканов/час на IP) из плана **не применён**: бэкенд платформы пока не имеет надёжных primitives для rate-limit, фича отложена до общей инфраструктуры.
- Все 11 fixes + 5 новых проверок не меняют структуру JSONB-результата сканов и не требуют миграций БД. Фронтенд (`IssueCard`, `ScoreCards`) рендерит новые `low/medium` issues автоматически.

---

## [Unreleased — previous]

### Removed
- Legacy Puppeteer-аудит: `AuditService`, `CrawlerService`, `AuditWorker`, роут `POST/GET /api/v1/audit`, очередь BullMQ `audit`, зависимость `puppeteer` (~300 MB chromium).
- Поля и счётчики `auditQueue` из ответа `GET /api/v1/health`.

### Changed
- `GET /api/v1/health` теперь отдаёт два явных блока: `services` (db, redis) и `queues` (monitor).
- README: убраны упоминания Puppeteer и legacy-роутов аудита, добавлен раздел Legacy.

### Notes
- Таблицы БД `audits` и `audit_results` сохранены (миграция `001_initial.sql` не изменена). Исторические данные не удаляются.
- `MonitorService` продолжает писать строки в `audits` для истории доменов.

---

## [Unreleased] — Cleanup pass 2

### Removed
- Зависимости `puppeteer`, `node-cron`, `@types/node-cron` (нигде не импортировались).
- Мёртвый класс `SchemaService.ts` — валидация JSON-LD реализована inline в `SiteCheckPipeline.ts`.

### Fixed
- Рассинхрон весов фронт ↔ бэк в `src/utils/scoreCalculation.ts`: `OVERALL_WEIGHTS.schema` 0.20 → 0.15, `OVERALL_WEIGHTS.ai` 0.25 → 0.30. Теперь UI совпадает с `calcScoresWeighted`.

### Added
- `GET /api/v1/health` теперь включает счётчики очереди `site_check` (waiting/active/completed/failed) — `data.queues.site_check`.
- Экспорт `siteCheckQueue` из `src/queue/queues.ts`.
- Верификация URL конкурентов через `checkUrl()` в `competitorAnalysis()` — отсекает 404-галлюцинации LLM до парсинга.
- Функция `normalizeCategoryFromTheme()` в `SiteCheckWorker` — маппит свободную тему от LLM в фиксированный каталог категорий geo_rating (`Магазин` / `Медиа` / `Образование` / `Маркетинг` / `B2B` / `Финансы` / `Сервисы`).
- SSE heartbeat (`: ping` каждые 15с) в `GET /api/v1/site-check/events/:scanId` — защита от silent disconnect через nginx.

---

## [Unreleased] — Accuracy pass 1

### Added
- Валидация ключевых слов через Google Suggest API: новая функция `validateKeywordsViaSuggest()` в `SiteCheckPipeline.ts`. Каждый ключ обогащается полями `verified: boolean` и `suggestions: string[]`. Активируется автоматически когда LLM-генерация ключей включена обратно (сейчас отключена в пайплайне).
- Эндпоинт `GET /api/v1/site-check/history/:domain?limit=20` — возвращает последние N завершённых сканов для домена (substring ILIKE) с разложенными оценками `total/seo/ai/schema/direct`.
- Компонент `HistoryChart.tsx` (Recharts LineChart, 5 линий) на странице результата `/site-check/result/:scanId` — показывается под `ScoreCards` при ≥2 сканах того же домена. Подпись «+N баллов за {дней}» / «−N баллов» / «без изменений».
- Блок `result.signals` (11 структурированных полей: `has_llms_txt`, `has_faqpage`, `has_schema_org`, `has_organization_jsonld`, `word_count`, `schema_types_count`, `internal_links_count`, `external_links_count`, `has_meta_description`, `has_og_tags`, `title_length`) — falls в `site_check_scans.result` JSONB без миграций. Основа для будущей offline-калибровки `OVERALL_WEIGHTS`.
- Метод `getDomainHistory(domain, limit?)` в `src/lib/api/scan.ts`.

### Notes
- LLM-judge блок (6 эмулированных AI-систем) НЕ изменён — уже честно помечен `simulated: true` + `disclaimer`. Реальная Perplexity-интеграция отложена.
- `OVERALL_WEIGHTS` НЕ менялись — только сбор данных для будущего пересмотра.