

## Переход DB-слоя на postgres.js + новая схема

### Что делаем

Заменяем `pg` (node-postgres) на `postgres` (postgres.js) в `owndev-backend`, обновляем миграцию под новую расширенную схему, переписываем все query-функции и типы.

### Файлы

| Файл | Действие |
|------|----------|
| `owndev-backend/package.json` | Заменить `pg` / `@types/pg` на `postgres` |
| `owndev-backend/src/db/client.ts` | Переписать — `postgres()` вместо `pg.Pool` |
| `owndev-backend/src/db/migrations/001_initial.sql` | Заменить на новую схему (users с credits, domains с user_id+hostname, audits с url/tool_id/score/duration, audit_results, monitors, events) |
| `owndev-backend/src/types/user.ts` | Добавить `credits_used`, `credits_limit` |
| `owndev-backend/src/types/domain.ts` | Переделать: `user_id` + `hostname` вместо `url` + `status` |
| `owndev-backend/src/types/audit.ts` | Добавить `url`, `tool_id`, `score`, `confidence`, `duration_ms`, `error_msg` в `AuditRecord` |
| `owndev-backend/src/types/monitor.ts` | Новый — Monitor interface |
| `owndev-backend/src/types/event.ts` | Новый — Event interface |
| `owndev-backend/src/db/queries/users.ts` | Переписать на postgres.js + добавить `incrementUserCredits`, `checkUserCredits` |
| `owndev-backend/src/db/queries/domains.ts` | Переписать — `getOrCreateDomain(userId, hostname)`, `getDomainsByUser` |
| `owndev-backend/src/db/queries/audits.ts` | Переписать — `createAudit`, `updateAuditStatus`, `saveAuditResult`, `getAuditById`, `getAuditsByDomain` |
| `owndev-backend/src/db/queries/monitors.ts` | Новый — CRUD для monitors |
| `owndev-backend/src/db/queries/events.ts` | Новый — `logEvent` |
| `owndev-backend/src/index.ts` | Обновить импорт — `sql.end()` вместо `pool.end()` |
| `owndev-backend/src/services/AuditService.ts` | Обновить вызовы query-функций под новые сигнатуры |
| `owndev-backend/src/api/routes/audit.ts` | Обновить вызовы query-функций |
| `owndev-backend/src/api/middleware/auth.ts` | Без изменений (getUserByApiKey сохраняет сигнатуру) |

### Ключевые моменты

**client.ts** — минимальный клиент:
```typescript
import postgres from 'postgres';
export const sql = postgres(process.env.DATABASE_URL!);
```

**Query-функции** используют tagged template literals postgres.js:
```typescript
const [user] = await sql`SELECT * FROM users WHERE api_key = ${apiKey}`;
```

**Новые таблицы**: `audit_results` (JSONB отдельно от audits), `monitors` (периодические задачи), `events` (логирование).

**Обратная совместимость**: все существующие импорты в routes/services/middleware продолжают работать — меняются только реализации функций внутри.

### Что НЕ трогаем

Весь фронтенд, supabase/, Redis, BullMQ, workers (кроме обновления импортов из db).

### Объём

~15 файлов, ~400 строк.

