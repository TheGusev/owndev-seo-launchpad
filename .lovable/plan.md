

## CORS работает корректно — backend готов к Preview

### Результаты проверки

1. **`src/api/server.ts:15`** — `/\.lovable\.app$/` присутствует ✓
2. **`dist/api/server.js:14`** — regex доехал до собранного кода ✓
3. **CORS preflight** на `OPTIONS /api/v1/site-formula/questions` с Origin `id-preview--...lovable.app`:
   - `HTTP/1.1 204 No Content` ✓
   - `access-control-allow-origin: https://id-preview--94bce625-b0b6-4f86-92cc-6cf024c7f7a1.lovable.app` ✓
   - `access-control-allow-credentials: true` ✓
   - `access-control-allow-methods: GET,HEAD,PUT,PATCH,POST,DELETE` ✓

Backend полностью готов принимать запросы из Lovable Preview.

### Что осталось — финальный smoke-test в Preview

Открыть в браузере:
```
https://id-preview--94bce625-b0b6-4f86-92cc-6cf024c7f7a1.lovable.app/site-formula/wizard
```

Что должно произойти:
1. Wizard загружается без белого экрана
2. В DevTools Network: `GET https://owndev.ru/api/v1/site-formula/questions` → `200 OK`
3. Появляются 4 шага с вопросами
4. Заполнить → "Собрать архитектуру" → редирект на `/site-formula/preview?session=...`
5. PreviewCard рендерится с данными от backend
6. В консоли — никаких ошибок CORS / Invariant Violation

### Если что-то не так

Возможные точки отказа после деплоя:
- **`401 Unauthorized`** на `/questions` — значит `authMiddleware` блокирует анонимные запросы. В этом случае нужно проверить, что роуты `site-formula/questions`, `site-formula/sessions` помечены как public (без обязательного токена).
- **`Mixed Content` warning** — не должен возникать, т.к. оба домена `https`.
- **Endpoint 404** — маршрут не зарегистрирован в `server.ts` (но мы видели `siteFormulaRoutes` в коде, должно быть ок).

### План действий

В default mode:
1. Открыть Preview через `browser--navigate_to_sandbox` на `/site-formula/wizard`
2. Через `browser--read_console_logs` и `browser--list_network_requests` проверить, что:
   - Нет ошибок в консоли
   - Запрос `GET /api/v1/site-formula/questions` идёт на `owndev.ru` и возвращает 200
3. Сделать скриншот wizard'а для подтверждения
4. Если всё ок — задача закрыта. Если есть проблемы (например `401` на public-endpoint) — отдельным фиксом разберёмся с auth-логикой.

### Что НЕ трогаем

- Backend (всё работает)
- Фронт config (auto-detect lovable.app уже в проде через билд Lovable)
- Auth-middleware (трогаем только если выяснится, что он блокирует public routes)

