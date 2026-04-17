

## План фикса: Site Formula — пустой body в POST-запросах

### Root cause

Fastify по умолчанию требует наличие body, если в запросе есть `Content-Type: application/json`. Наш `apiHeaders()` в `src/lib/api/config.ts` всегда добавляет `Content-Type: application/json`, даже когда мы шлём `POST` без тела. Endpoints `POST /sessions`, `POST /sessions/:id/run`, `POST /sessions/:id/unlock` тела не передают — Fastify отбивает их с 400 `Body cannot be empty when content-type is set to 'application/json'`. Из-за этого:
- сессия создаётся, но кнопка "Создать" может молчаливо падать на повторе
- `runEngine` падает, фронт показывает ошибку  
- иногда `raw_answers` сохранены, но engine не запускается → следующий retry даёт `answers must be a non-null object`

### Фикс — frontend (одна правка)

**`src/lib/api/siteFormula.ts`** — для POST без body отправлять пустой JSON-объект `{}`:

```ts
export async function createSession() {
  return sfRequest('/sessions', { method: 'POST', body: '{}' });
}

export async function runEngine(sessionId: string) {
  return sfRequest(`/sessions/${sessionId}/run`, { method: 'POST', body: '{}' });
}

export async function unlockReport(sessionId: string) {
  return sfRequest(`/sessions/${sessionId}/unlock`, { method: 'POST', body: '{}' });
}
```

Это совместимо с backend: handlers `_req`/без чтения `req.body` — игнорируют тело.

### Дополнительная защита — frontend hook

**`src/hooks/useSiteFormulaSession.ts`** — в `executeEngine` добавить guard: не запускать engine, если `answers` пустой объект, и явно дождаться успеха `saveAnswers` перед `runEngine` (сейчас уже последовательно, но нет проверки что answers не пустые):

```ts
const executeEngine = useCallback(async () => {
  if (!sessionId) return;
  if (!answers || Object.keys(answers).length === 0) {
    setError('Заполните все шаги перед запуском');
    return;
  }
  // ... остальное как есть
});
```

### Что НЕ трогаем

- Backend остаётся как есть — никаких изменений в `siteFormula.ts`, `server.ts`, `runtimeValidator.ts`. Текущее поведение Fastify (требовать body при `Content-Type: application/json`) — это правильная защита, ломать её не надо.
- `apiHeaders()` не меняем — он используется десятками других мест (audit, monitor, siteCheck), где body всегда есть.
- Существующие сессии в БД с `status='error'` останутся, новые сессии будут работать корректно.

### Изменяемые файлы

- ✏️ `src/lib/api/siteFormula.ts` — добавить `body: '{}'` в 3 POST-вызова
- ✏️ `src/hooks/useSiteFormulaSession.ts` — guard на пустые answers в `executeEngine`

### Команда деплоя после фикса

Только фронт, backend перекомпилировать не нужно:

```bash
cd /var/www/owndev.ru && \
git pull origin main && \
npm run build && \
pm2 status
```

### Self-check

- ✅ Root cause найден в логах (`Body cannot be empty`)  
- ✅ Изменение минимальное и точечное (5 строк в одном файле + guard в хуке)
- ✅ Никаких изменений в backend → не ломаем engine, миграции, другие routes
- ✅ После фикса исчезнут оба типа ошибок в логах: и `Body cannot be empty`, и `answers must be a non-null object`
- ✅ Существующие модули (audit/monitor/siteCheck) не затронуты — там body всегда передаётся

