

## Подготовка фронтенда к будущему backend

### Что уже есть
- `API_BASE_URL` в config.ts (переключается через `VITE_API_BASE_URL`)
- Все запросы идут через `invokeFunction()` или `request()` — hardcoded URL нет
- Логирование событий через `logEvent()`

### Изменения

| Файл | Действие |
|------|----------|
| `src/lib/api/config.ts` | Добавить `API_VERSION = "v1"`, хелпер `apiUrl()` |
| `src/lib/api/client.ts` | Обработка 401/403 в `request()` и `invokeFunction()` |
| `src/lib/auth/session.ts` | Новый — заглушка `getCurrentUser()` с типами планов |
| `src/state/audit/useAudit.ts` | TODO-комментарий с примером проверки тарифа |
| `README.md` | Секция "Architecture" — описание API-слоя |

### Детали

**1. config.ts — версионирование**
```typescript
export const API_VERSION = 'v1';

// Хелпер для будущего REST API (пока не используется активно)
export function apiUrl(path: string) {
  return `${API_BASE_URL}/${API_VERSION}${path}`;
}
```
Существующие `edgeFunctionUrl` / `edgeFunctionHeaders` не трогаем — они продолжают работать. `apiUrl()` будет использоваться при переходе на собственный backend.

**2. client.ts — 401/403**
В `request()` добавить обработку перед общим error:
```typescript
if (resp.status === 401 || resp.status === 403) {
  console.error('[OWNDEV API] unauthorized:', resp.status);
  throw new Error('Требуется авторизация');
}
```
В `invokeFunction()` — аналогичная проверка `error.message` на "unauthorized".

**3. session.ts — заглушка пользователя**
```typescript
export type Plan = 'free' | 'solo' | 'pro' | 'agency';

export interface AppUser {
  id: string;
  plan: Plan;
}

export function getCurrentUser(): AppUser | null {
  // TODO: заменить на реальную авторизацию
  return null;
}

export function canAccess(feature: string): boolean {
  // TODO: проверка лимитов по тарифу
  return true;
}
```

**4. useAudit.ts — TODO для тарифов**
Перед `logEvent('audit_start')` добавить комментарий:
```typescript
// TODO: проверить лимиты тарифа — getCurrentUser()?.plan
// if (!canAccess('audit')) throw new Error('Upgrade required');
```

**5. README.md — секция Architecture**
Добавить описание: где `API_BASE_URL`, как устроен API-слой (`invokeFunction` vs `request`), где логирование (`logger.ts`), где заглушка сессии (`auth/session.ts`), как переключить на собственный backend.

### Что НЕ трогаем
- Header, Footer, меню, UI — 0 изменений
- Реальные пути запросов — не меняем (версионирование пока только подготовка)
- Никакой авторизации/UI логина не добавляем

### Объём
~20 строк config.ts, ~10 строк client.ts, ~25 строк session.ts, ~3 строки useAudit.ts, ~40 строк README.

