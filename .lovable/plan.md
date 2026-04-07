

## Доработка API роутов, rate limiting и подготовка к связи с фронтом

### Что уже есть
- `auth.ts` — блокирует без API-ключа (нужно: пускать анонимных)
- `rateLimit.ts` — единый лимит 30/мин для всех (нужно: по плану)
- `health.ts` — `/health` без очередей (нужно: `/api/v1/health` + queue stats)
- `audit.ts` — POST + GET по ID (нужно: + GET список по домену, единый формат ответа)
- `monitor.ts` — использует несуществующие `getDomainByUrl`/`insertDomain`/`listAuditsByDomain` (нужно: переписать на реальные query-функции + DELETE)
- `server.ts` — CORS `origin: true` (нужно: whitelist + error handler)

### Файлы

| Файл | Изменение |
|------|-----------|
| `owndev-backend/src/api/middleware/auth.ts` | Анонимный доступ: без ключа — `req.user = { id: 'anon', plan: 'free', credits_limit: 5 }` |
| `owndev-backend/src/api/middleware/rateLimit.ts` | Plan-based лимиты через Redis: anon 10/мин, free 20/мин, solo+ 200/мин |
| `owndev-backend/src/api/routes/health.ts` | Перенести на `/api/v1/health`, добавить queue stats (waiting/active/completed) |
| `owndev-backend/src/api/routes/audit.ts` | Добавить `GET /api/v1/audits` (по hostname), единый формат `{ success, data/error }`, event logging |
| `owndev-backend/src/api/routes/monitor.ts` | Полная переработка: POST создаёт monitor через `createMonitor()`, GET список, DELETE отключает. Требует авторизацию (не анонимно) |
| `owndev-backend/src/api/server.ts` | CORS whitelist, глобальный error handler, prefix `/api/v1` |

### Ключевые решения

**auth.ts** — не блокирует без ключа, а ставит анонимного пользователя:
```
if (!apiKey) → req.user = { id: 'anon', plan: 'free', ... }
if (apiKey invalid) → 403
if (apiKey valid) → req.user = dbUser
```

**rateLimit.ts** — читает `req.user.plan` (после auth middleware):
```
anon → 10/мин, free → 20/мин, solo/pro/agency → 200/мин
```
Redis ключ: `rl:{plan}:{ip}`.

**monitor.ts** — полная переработка:
- `POST /api/v1/monitors` — body: `{ url, period }`, zod-валидация, требует не-анонимного пользователя, вызывает `createMonitor()` + `MonitorService.scheduleMonitor()`
- `GET /api/v1/monitors` — список мониторов пользователя через `getMonitorsByUser()`
- `DELETE /api/v1/monitors/:id` — `toggleMonitor(id, false)`

**Единый формат ответа:**
```typescript
// Успех: { success: true, data: {...} }
// Ошибка: { success: false, error: "message", code: "CREDIT_LIMIT" }
```

**server.ts** — глобальный error handler скрывает стеки:
```typescript
app.setErrorHandler((error, req, reply) => {
  logger.error('SERVER', error.message);
  reply.status(500).send({ success: false, error: 'Internal error' });
});
```

CORS: `['https://owndev.ru', 'http://localhost:5173', 'http://localhost:3000']`

**Event logging** — после каждого успешного действия вызов `logEvent()`:
- `audit_created` в POST audit
- `monitor_created` в POST monitors

### Что НЕ трогаем
- Фронтенд — 0 изменений (фронт уже готов через `apiUrl()`)
- CrawlerService, AuditService, workers — без изменений
- DB queries — используем существующие функции
- Redis, BullMQ конфиг — без изменений

### Объём
~6 файлов, ~200 строк изменений.

