

## Исправление 7 ошибок компиляции бэкенда + предупреждение CSS

Бэкенд не собирается из-за 7 TypeScript-ошибок в 4 файлах. Пока `tsc` не проходит, PM2 запускает старый код (или падает), поэтому фронт получает «Сервер загружен».

### Файлы и фиксы

#### 1. `owndev-backend/src/api/server.ts` — 3 ошибки (error is unknown)
Fastify 5 типизирует `error` как `FastifyError`, но TS strict видит `unknown`. Решение — явный каст:
```typescript
app.setErrorHandler((error, _req, reply) => {
  const err = error as any;
  logger.error('SERVER', err?.message || String(err));
  const status = err?.statusCode ?? 500;
  const message = status >= 500 ? 'Internal error' : (err?.message || 'Unknown error');
  reply.status(status).send({ success: false, error: message, code: 'INTERNAL' });
});
```

#### 2. `owndev-backend/src/cache/redis.ts` — 2 ошибки (Redis not constructable + err any)
`ioredis@5` с ESM экспортирует `Redis` как default, но TS strict + `moduleResolution: NodeNext` ломает конструктор. Фикс:
```typescript
import Redis from 'ioredis';
// ...
export const redis = new (Redis as any)(process.env.REDIS_URL ?? 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.on('error', (err: unknown) => {
  logger.error('REDIS', (err as Error)?.message || String(err));
});
```

#### 3. `owndev-backend/src/db/queries/audits.ts` — 1 ошибка (sql.json type)
```typescript
VALUES (${auditId}, ${sql.json(result as any)})
```

#### 4. `owndev-backend/src/db/queries/events.ts` — 1 ошибка (sql.json type)
```typescript
${payload ? sql.json(payload as any) : null}
```

#### 5. `src/index.css` — `@import` должен быть первым
Переместить строку `@import url(...)` выше `@tailwind` директив (строка 5 → строка 1).

### Результат
После этих 5 правок `tsc` в бэкенде пройдёт, деплой завершится, и сканирование снова заработает.

