

## Доработка BullMQ очередей и воркеров

### Что уже есть
Все файлы существуют и работают: `redis.ts`, `queues.ts`, `jobs.ts`, `AuditWorker.ts`, `MonitorWorker.ts`, `MonitorService.ts`, `index.ts`. Но есть расхождения с запрошенной архитектурой.

### Что нужно доработать

| Файл | Изменение |
|------|-----------|
| `owndev-backend/src/cache/redis.ts` | Добавить обработчик `reconnecting` |
| `owndev-backend/src/queue/queues.ts` | Добавить default job options: `attempts: 3`, `backoff`, `removeOnComplete: 100`, `removeOnFail: 50` |
| `owndev-backend/src/queue/jobs.ts` | Расширить `AuditJobData` (+ `toolId?`), `MonitorJobData` (+ `monitorId`, `userId?`); функции `addAuditJob`/`addMonitorJob` используют defaults из очереди |
| `owndev-backend/src/workers/MonitorWorker.ts` | Переписать: вместо прямого запуска аудита — создать audit через `createAudit()` + `addAuditJob()` + обновить `updateMonitorRun()` с расчётом `next_run_at` |
| `owndev-backend/src/services/MonitorService.ts` | Переписать: убрать `node-cron` + `pool.query`, использовать `getDueMonitors()` + BullMQ delayed jobs. Методы `scheduleMonitor(id)` и `startAll()` |
| `owndev-backend/src/index.ts` | Вызывать `MonitorService.startAll()` вместо `monitor.start()` |

### Ключевые решения

**MonitorService** — вместо cron каждые 6h переходим на BullMQ repeatable/delayed jobs:
- `startAll()` читает все активные мониторы из БД через `getDueMonitors()`, планирует просроченные немедленно, остальные — с delay
- `scheduleMonitor(id)` читает monitor, вычисляет delay до `next_run_at`, добавляет delayed job в `monitorQueue`

**MonitorWorker** — при обработке джоба:
1. `createAudit({ domainId, userId, url })` → получает `auditId`
2. `addAuditJob({ auditId, domainId, url, userId })` → аудит обрабатывается AuditWorker
3. `updateMonitorRun(monitorId, nextRunAt)` — сдвигает следующий запуск
4. `scheduleMonitor(monitorId)` — планирует следующий delayed job

**AuditWorker** — без изменений (уже корректно делегирует в `service.run()`).

### Что НЕ трогаем
- AuditWorker.ts — уже работает правильно
- AuditService.ts, CrawlerService.ts — без изменений
- Фронтенд — 0 изменений
- DB queries — используем существующие функции

### Объём
~6 файлов, ~80 строк изменений.

