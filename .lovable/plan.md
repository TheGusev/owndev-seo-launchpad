

## Проблема
На скриншоте `/tools/site-check` застрял на 75% и не редиректит на результаты. Это значит: воркер на проде записал `progress_pct` где-то в районе 60–75 и **не дошёл до `status='done'`** — либо упал с ошибкой и не дописал `error_message`, либо завис в одном из шагов пайплайна (LLM-вызов, краулинг, schema-парсер).

## Root cause hypothesis
1. `SiteCheckWorker.processSiteCheckJob` падает внутри `runPipeline`, исключение глотается, но финальный `UPDATE status='error'` не отрабатывает (например, из-за обрыва Redis-коннекта или `OOM`/таймаута процесса PM2).
2. Либо BullMQ-job выбит из очереди при рестарте PM2, и запись в `site_check_scans` осталась `running` навсегда — фронт поллит её бесконечно.
3. Frontend нет таймаута поллинга — он будет крутить бар до бесконечности, без UX-выхода.

## Что делаем

### 1. Инструмент диагностики (новый эндпоинт)
В `owndev-backend/src/api/routes/siteCheck.ts` добавить **админ-эндпоинт** `GET /api/v1/site-check/admin/stuck-scans` (защита `X-Admin-Token`). Возвращает все сканы со `status='running'` старше 5 минут: id, url, progress_pct, created_at, updated_at, error_message. Это даст моментальный ответ «что зависло».

И парный `POST /api/v1/site-check/admin/reset-stuck` — помечает все такие зависшие сканы как `status='error', error_message='Превышено время выполнения'`. Освобождает слот в `CONCURRENCY_LIMIT` и даёт пользователям возможность перезапустить.

### 2. Авто-«пинок» в воркере: cleanup stale scans при старте
В `owndev-backend/src/workers/SiteCheckWorker.ts` в `startSiteCheckWorker()` перед запуском воркера выполнить:
```sql
UPDATE site_check_scans 
SET status='error', error_message='Прервано рестартом сервера', updated_at=NOW()
WHERE status='running' AND updated_at < NOW() - INTERVAL '5 minutes'
```
Это страхует от ситуации «PM2 рестартнул процесс — сканы остались висеть».

### 3. Frontend: таймаут поллинга + кнопка «прервать»
В `src/pages/SiteCheck.tsx` (`pollStatus`):
- Засечь `startedAt` начала поллинга. Если прошло **>120 сек** и status всё ещё `running` И `progress_pct === lastProgress` — показать toast «Проверка зависла, попробуйте ещё раз», `setScanning(false)`, `setScanError(...)`.
- В `ScanProgress` добавить кнопку «Отменить и попробовать снова» (только после 60 сек ожидания) — сбрасывает state, возвращает форму.

### 4. Защита SiteCheckWorker от молчаливого падения
Обернуть весь `processSiteCheckJob` дополнительным `try/finally`, в `finally` проверять — если `status` всё ещё `running` (т.е. ни `done`, ни `error` не записался), форсированно выставлять `error` с сообщением «Внутренняя ошибка пайплайна». Это закроет дыру когда исключение в `runPipeline` пробрасывается мимо catch (например, из-за необработанного промиса).

### 5. Watchdog таймаут на сам job
BullMQ job опции: добавить `attempts: 1` (без ретраев — они только маскируют проблему) и `removeOnComplete/removeOnFail` для гигиены. Главное — `lockDuration` или явный `setTimeout(180_000)` обёрнутый вокруг `runPipeline`, который через `Promise.race` бросает `new Error('Pipeline timeout 180s')`. Это гарантирует что воркер всегда завершается.

## Файлы

| Файл | Действие |
|---|---|
| `owndev-backend/src/api/routes/siteCheck.ts` | **Edit** — добавить `GET /admin/stuck-scans`, `POST /admin/reset-stuck` |
| `owndev-backend/src/workers/SiteCheckWorker.ts` | **Edit** — cleanup при старте, `Promise.race` таймаут на `runPipeline`, гарантированный финалайзер |
| `src/pages/SiteCheck.tsx` | **Edit** — таймаут поллинга 120 сек, отслеживание stale `progress_pct` |
| `src/components/site-check/ScanProgress.tsx` | **Edit** — кнопка «Отменить» после 60 сек |

## Что НЕ трогаем
- Frontend `/geo-rating`, Header, мобильное меню.
- Логику самого `runPipeline` и его подсервисов (`SchemaService`, `LlmsService` и т.д.) — мы только страхуем их таймаутом сверху.
- Структуру таблиц.

## Запуск после деплоя
1. На проде: `curl https://owndev.ru/api/v1/site-check/admin/stuck-scans -H "X-Admin-Token: $ADMIN_TOKEN"` — узнаём какие конкретно сканы зависли (включая тот, что у пользователя на скрине).
2. `curl -X POST .../reset-stuck -H "X-Admin-Token: $ADMIN_TOKEN"` — разблокировать слоты.
3. Пользователь жмёт «Перепроверить» на странице — проходит чисто.
4. В дальнейшем зависания будут автозакрываться watchdog-ом + cleanup-ом при старте PM2.

## Проверка
- В логах PM2 на проде после деплоя: `pm2 logs owndev-backend | grep "Pipeline timeout\|Cleanup\|stuck"` — увидим работу новых страховок.
- На фронте после 120 сек простоя на /tools/site-check появляется красное сообщение «Проверка зависла» вместо вечного 75%.
- `npm run build` в `owndev-backend` и в корне — без TS-ошибок.

