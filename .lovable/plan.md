

## Событийное логирование аудитов

### Подход

Создать `src/lib/analytics/logger.ts` с функцией `logEvent()`. Интегрировать в `useAudit.ts` — единственную точку запуска всех аудитов. Три события: `audit_start`, `audit_success`, `audit_error`.

### Файлы

| Файл | Действие |
|------|----------|
| `src/lib/analytics/logger.ts` | Новый — `logEvent()` с console.info и TODO для backend |
| `src/state/audit/useAudit.ts` | Добавить 3 вызова `logEvent` в `run()` |

### logger.ts

```typescript
type EventPayload = Record<string, unknown>;

export function logEvent(name: string, payload?: EventPayload): void {
  // TODO: replace with backend API call (POST /api/events)
  if (import.meta.env.DEV) {
    console.info(`[OWNDEV] ${name}`, payload);
  }
}
```

- В production — тишина (никакого шума в консоли)
- В dev — видно для отладки
- Единая точка замены на любой analytics-сервис

### useAudit.ts — 3 точки интеграции

```typescript
// Before API call (line ~22)
logEvent('audit_start', { url, toolId, timestamp: new Date().toISOString() });

// After success (line ~25)
logEvent('audit_success', { url, toolId, score: (result as any)?.score, timestamp: new Date().toISOString() });

// On error (line ~28)
logEvent('audit_error', { url, toolId, errorMessage: msg, timestamp: new Date().toISOString() });
```

### Что НЕ трогаем

Header, Footer, меню, UI компонентов, `analytics.ts` (Яндекс.Метрика) — 0 изменений.

### Объём

~15 строк новый файл, ~6 строк добавлений в useAudit.ts.

