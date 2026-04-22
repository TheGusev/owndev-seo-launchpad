

## Цель

Завершить чистку legacy-аудита: структурный `/health`, актуальный README, новый CHANGELOG.

## Правки

### 1. `owndev-backend/src/api/routes/health.ts`

Переписать payload в два явных блока:

```ts
return reply.status(ok ? 200 : 503).send({
  success: true,
  data: {
    status: ok ? 'ok' : 'degraded',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    services: {
      db: pg ? 'connected' : 'error',
      redis: rd ? 'connected' : 'error',
    },
    queues: {
      monitor: mq,
    },
  },
});
```

Никаких полей `auditQueue` — структурно фиксируем разделение «сервисы» vs «очереди».

### 2. `owndev-backend/README.md`

- Из секции **Стек** убрать `Puppeteer`.
- Из секции **Структура** убрать `AuditService`, `CrawlerService`; поправить список `routes/` на актуальный.
- В таблице **API** удалить строки `POST /api/v1/audit` и `GET /api/v1/audit/:id`. Добавить строки про `/api/v1/site-check/*` и `/api/v1/marketplace-audit/*`.
- В конец добавить раздел **Legacy**:

> Таблицы `audits` и `audit_results` остались в БД (миграция `001_initial.sql`), но больше не используются: legacy-стек на Puppeteer (`AuditService`, `CrawlerService`, `AuditWorker`, `routes/audit`, очередь `audit`) удалён. Миграции намеренно не трогаются — исторические данные сохраняются, новые записи добавляются только через `MonitorService` для истории доменов. Очистка таблиц/типов/queries — отдельной задачей.

### 3. `owndev-backend/CHANGELOG.md` (новый файл)

Формат Keep a Changelog:

```md
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
```

## Что НЕ трогаем

- Миграции и таблицы в БД.
- `MonitorService`, site-check, marketplace-audit, фронтенд.
- Любые другие роуты/сервисы.

## Проверка

1. `cd owndev-backend && npx tsc --noEmit` → 0 ошибок.
2. `curl $API/api/v1/health` → JSON с `data.services.{db,redis}` и `data.queues.monitor`, без `audit*`.
3. `grep -rn "auditQueue\|/api/v1/audit\b" owndev-backend/src` → пусто.

