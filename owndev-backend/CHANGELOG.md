# Changelog

## [Unreleased]

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