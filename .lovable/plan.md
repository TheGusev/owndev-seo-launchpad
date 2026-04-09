

## Исправление "Invalid input" — автодобавление https://

### Причина бага

Пользователь вводит `owndev.ru` (без протокола). Фронтенд отправляет `{"url": "owndev.ru"}` на backend. Backend валидирует через `z.string().url()`, который требует полный URL с протоколом → возвращает 400 "Invalid input".

### Решение

Добавить функцию `ensureProtocol(url)` в `src/lib/api/tools.ts` и применить её перед отправкой в `auditSite()`. Также применить на уровне UI в `SEOAuditor.tsx` и других формах, где пользователь вводит URL.

### Файлы

| Файл | Изменение |
|------|-----------|
| `src/lib/api/tools.ts` | Добавить `ensureProtocol()` — если нет `http://` или `https://`, добавить `https://`. Вызвать в `auditSite()` перед POST |
| `src/components/tools/SEOAuditor.tsx` | Применить `ensureProtocol()` к `url` перед передачей в `auditSite()` |
| `src/components/scenarios/ScenarioDemoForm.tsx` | Применить `ensureProtocol()` в формах сценариев, где URL передаётся в навигацию |

### Логика `ensureProtocol`

```typescript
function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}
```

### Что НЕ трогаем

- Backend валидацию (zod `.url()` корректно требует протокол)
- Header, Footer, меню — 0 изменений
- Polling логику — без изменений

### Объём

~5 строк новая функция, ~3 строки применения.

