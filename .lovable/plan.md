

## Цель

Удалить мёртвый legacy-аудит-стек на Puppeteer (~300 MB chromium): сервисы, воркер, REST-роут, регистрацию и саму зависимость. Site-check, marketplace-audit, monitor — НЕ затрагиваем.

## Подтверждение grep'ом (что действительно безопасно удалять)

- `AuditService` импортируется только из `AuditWorker.ts`.
- `CrawlerService` импортируется только из `AuditService.ts`.
- `AuditWorker` (`startAuditWorker`) импортируется только из `src/index.ts`.
- `routes/audit.ts` (`auditRoutes`) импортируется только из `src/api/server.ts`.
- `puppeteer` импортируется ровно в одном месте — `CrawlerService.ts`.
- Фронт **не вызывает** `/api/v1/audit` (поиск `apiUrl('/audit')` / `'/api/v1/audit'` пуст). Все клиенты SEO-аудита идут через Edge Function / `useAudit` хук.

Дополнительно найдено:

- `addAuditJob` / `auditQueue` используются только в legacy-цепочке + одно место в `routes/health.ts` (показ counts очереди `audit`).
- `LlmsService`, `SchemaService`, `db/queries/audits.ts`, `checkUserCredits`/`incrementUserCredits` после удаления станут «висячими», но **типобезопасны** (никто не импортирует — TS не упадёт). Их чистку — отдельной задачей.

## Файлы и правки

### 1. Удалить файлы
- `owndev-backend/src/services/AuditService.ts`
- `owndev-backend/src/services/CrawlerService.ts`
- `owndev-backend/src/workers/AuditWorker.ts`
- `owndev-backend/src/api/routes/audit.ts`

### 2. `owndev-backend/src/api/server.ts`
- Удалить импорт `import { auditRoutes } from './routes/audit.js';`
- Удалить регистрацию `await app.register(auditRoutes);`

### 3. `owndev-backend/src/index.ts`
- Удалить импорт `import { startAuditWorker } from './workers/AuditWorker.js';`
- Удалить `const auditWorker = startAuditWorker();`
- Удалить `await auditWorker.close();` в `shutdown`.

### 4. `owndev-backend/src/api/routes/health.ts`
- Убрать использование `auditQueue` из health-эндпоинта (импорт и обращение в `Promise.all`/payload). Останется только `monitorQueue`. Это нужно, чтобы корректно удалить очередь без падения health.

### 5. `owndev-backend/src/queue/queues.ts`
- Удалить экспорт `auditQueue` (очередь больше не нужна, её писатель и читатель удалены). Оставить только `monitorQueue`.

### 6. `owndev-backend/src/queue/jobs.ts`
- Удалить интерфейс `AuditJobData` и функцию `addAuditJob`, а также `auditQueue` из импорта `./queues.js`. Оставить `MonitorJobData` и `addMonitorJob`.

### 7. Зависимости
- В `owndev-backend` выполнить `npm uninstall puppeteer`. Это уберёт `puppeteer` из `dependencies` и снесёт chromium из `node_modules`.

### 8. README (косметика, по желанию)
- В `owndev-backend/README.md` строки `POST /api/v1/audit` и `GET /api/v1/audit/:id` — пометить как устаревшие или убрать, чтобы не вводить в заблуждение. (Не критично для работы.)

## Что НЕ трогаем

- `owndev-backend/src/types/audit.ts` (используется в `LlmsService`/`SchemaService`/`db/queries/audits.ts` — оставим, чтобы не разрастаться).
- `owndev-backend/src/db/queries/audits.ts` и `users.ts` — остаются, но de facto не вызываются. Чистка — отдельной задачей.
- Таблицы `audits` / `audit_results` в БД — миграции и данные не трогаем.
- `SiteCheckPipeline.ts`, marketplace-audit, monitor, conversion-audit, alice — без изменений.
- Frontend — без изменений.

## Проверка

1. `cd owndev-backend && npx tsc --noEmit` → 0 ошибок (после правок п.4–6 единственный потребитель `auditQueue` — health — тоже починен).
2. `grep -rn "puppeteer\|AuditService\|CrawlerService\|AuditWorker\|routes/audit\|addAuditJob\|auditQueue" owndev-backend/src` → пусто (кроме, возможно, упоминания в комментариях `SiteCheckPipeline.ts`).
3. `du -sh owndev-backend/node_modules` до/после `npm uninstall puppeteer` — ожидаемое падение ~300 MB.
4. `npm run dev` поднимается; `GET /health` отвечает 200 и больше не показывает `audit` queue counts.
5. Site-check / marketplace-audit / monitor продолжают работать (smoke на любом сайте).

