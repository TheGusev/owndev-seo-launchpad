

## Диагностика и исправление: SEO Auditor не работает

### Проблема

Функция `auditSite()` в `src/lib/api/tools.ts` пытается обращаться к собственному бэкенду по адресу `/api/v1/audit` (POST + polling). Этот бэкенд (`owndev-backend/`) — отдельный Node.js сервер, который **не запущен** в среде Lovable. В результате все запросы аудита падают с ошибкой «Не удалось создать аудит».

Все остальные инструменты (indexation, semantic core, competitor analysis и т.д.) работают корректно — они используют Edge Functions через `invokeFunction()`.

### Решение

**Файл: `src/lib/api/tools.ts`**

Заменить функцию `auditSite()` (POST + polling через собственный бэкенд) на прямой вызов Edge Function `seo-audit` через `invokeFunction()`:

```typescript
export async function auditSite(url: string, options?: { toolId?: string }) {
  return invokeFunction("seo-audit", { url });
}
```

Удалить неиспользуемые хелперы `backendPost`, `backendGet`, интерфейс `AuditPollOptions`, `ApiResponse`, и импорты `apiUrl`, `apiHeaders` из config.

### Что это даст

- SEO Auditor заработает — запросы пойдут через Edge Function `seo-audit`, которая уже развернута и функционирует
- Остальные инструменты не затрагиваются
- Код бэкенда в `owndev-backend/` остаётся на месте для будущего использования

