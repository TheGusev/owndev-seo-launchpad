

## Backend задеплоен с новыми лимитами — финальный smoke-test

### Что произошло на сервере

`git pull` подтянул коммит `2313272` с обновлёнными `auth.ts`, `rateLimit.ts`, `user.ts`. Build прошёл, pm2 рестартанул (↺ 205, online). Redis-очистка не выполнилась (текст "Готово./На:" из моего ответа случайно попал в shell как команды), но это **не критично**: новые лимиты — 60/min для anon + полный skip для `/questions`, `/config-version`, `/health`. Старые счётчики в Redis истекут сами через 60 секунд, плюс `/questions` теперь вообще не лимитится.

### План end-to-end проверки (default mode)

1. **`browser--navigate_to_sandbox`** → `/site-formula/wizard`
2. **`browser--read_console_logs`** — отсутствие 429, CORS, Invariant ошибок
3. **`browser--list_network_requests`** — `GET https://owndev.ru/api/v1/site-formula/questions` → **200 OK** (не 429)
4. **`browser--screenshot`** — подтверждение что 1-й шаг wizard'а с вопросами отрендерился
5. Если ок — пройти 4 шага через `browser--act`, дойти до `/site-formula/preview?session=...`, финальный скрин

### Реакция на возможные проблемы

- **Опять 429 на `/questions`** → значит код в `dist/` не обновился, проверим `dist/api/middleware/rateLimit.js` через `code--view`
- **401 на `/sessions` POST** → анонимный POST блокируется auth, разберём отдельно
- **PreviewCard крашится на финальном шаге** → стек из консоли, фиксим отдельно

### На всякий случай — команда чистки Redis

Если в логах увижу остаточный 429 от старых счётчиков, попрошу выполнить:
```bash
redis-cli --scan --pattern "rl:*" | xargs -r redis-cli del
```
Но скорее всего не понадобится — `/questions` теперь в SKIP_PATHS.

### Что НЕ трогаем

- Backend код (всё задеплоено)
- Frontend (всё на месте)
- CORS, auth-логику для других routes

