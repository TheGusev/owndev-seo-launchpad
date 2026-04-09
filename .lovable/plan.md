

## Production-Grade патч OWNDEV — P0/P1/P2

Все изменения ниже **confirmed by code**, не гипотезы.

---

### P0 — Блокеры продакшена

**1. Duplicate import в server.ts (line 5 + 7)**
- `owndev-backend/src/api/server.ts` — удалить строку 7 (`import { monitorRoutes } from './routes/monitor.js'` — дубль строки 5)
- Compile-break: TypeScript не допускает два одинаковых идентификатора

**2. Polling status mismatch (confirmed)**
- `src/lib/api/tools.ts:93` — фронт проверяет `'success' || 'completed'`
- `owndev-backend/src/services/AuditService.ts:51` — backend пишет `'done'`
- Результат: пользователь **никогда** не получает результат аудита, видит таймаут через 30 сек
- **Фикс**: строка 93 → `audit.status === 'done'`, строка 97 → оставить `'error'` (backend пишет `'error'`)

---

### P1 — Надёжность pipeline

**3. Двойной authMiddleware (confirmed)**
- `server.ts:23` — глобальный `addHook('onRequest', authMiddleware)`
- `audit.ts:24` и другие routes — `preHandler: [authMiddleware]` повторно
- **Фикс**: убрать `preHandler: [authMiddleware]` из route-файлов `audit.ts`, `monitor.ts`, `events.ts` — middleware уже работает глобально

**4. logEvent без try/catch в AuditService (confirmed)**
- `AuditService.ts:52` и `59` — `await logEvent(...)` без обёртки
- Если events-таблица недоступна → весь аудит падает, хотя результат уже сохранён
- **Фикс**: обернуть оба вызова в `try { await logEvent(...) } catch { /* non-critical */ }`

**5. addAuditJob userId: undefined вместо null (confirmed)**
- `audit.ts:53` — `userId: user.id === 'anon' ? undefined : user.id`
- Тип `AuditJobData.userId` ожидает `string | null`, не `undefined`
- **Фикс**: заменить `undefined` → `null`

**6. getOrCreateDomain не принимает null (confirmed)**
- `domains.ts:3` — сигнатура `(userId: string, hostname: string)`, но вызывается с `null`
- PostgreSQL `UNIQUE(user_id, hostname)` + NULL → `ON CONFLICT` не срабатывает для анонимов → дубли
- **Фикс**: сигнатура → `userId: string | null`, для null — отдельная логика SELECT + INSERT без ON CONFLICT

---

### P2 — Архитектурные дефекты

**7. MonitorWorker: weekly = 6 часов (confirmed)**
- `MonitorWorker.ts:22` — `periodMs = 6 * 60 * 60 * 1000` используется как fallback для "weekly"
- **Фикс**: `7 * 24 * 60 * 60 * 1000`

**8. MonitorService: пустой URL (confirmed)**
- `MonitorService.ts:19` — `url: ''` передаётся в job
- Worker получит пустую строку и попытается краулить `https://`
- **Фикс**: резолвить hostname из domain record или хранить URL в monitors-таблице

---

### Файлы и объём

| Файл | Изменение | Строк |
|------|-----------|-------|
| `owndev-backend/src/api/server.ts` | Удалить дубль импорта (строка 7) | -1 |
| `src/lib/api/tools.ts` | `'done'` вместо `'success'/'completed'` (строка 93) | ~2 |
| `owndev-backend/src/api/routes/audit.ts` | Убрать дублирующий preHandler auth, fix userId undefined→null | ~4 |
| `owndev-backend/src/services/AuditService.ts` | try/catch вокруг logEvent (строки 52, 59) | ~6 |
| `owndev-backend/src/db/queries/domains.ts` | Принимать null userId, fix UNIQUE bug | ~10 |
| `owndev-backend/src/workers/MonitorWorker.ts` | weekly = 7d | ~1 |
| `owndev-backend/src/services/MonitorService.ts` | TODO/fix пустой URL | ~2 |
| `owndev-backend/src/api/routes/monitor.ts` | Убрать дублирующий preHandler auth | ~2 |
| `owndev-backend/src/api/routes/events.ts` | Убрать дублирующий preHandler auth | ~2 |

### Что НЕ трогаем

- UI компоненты, Header, Footer — 0 изменений
- CrawlerService — без изменений
- Redis, BullMQ конфиг — без изменений
- Supabase Edge Functions — без изменений
- Route paths (оставляем абсолютные `/api/v1/...` — работает, не ломаем)

