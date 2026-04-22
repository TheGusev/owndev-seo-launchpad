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