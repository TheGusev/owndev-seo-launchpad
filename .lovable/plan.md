

## Проблема: rate limit 429 на `/site-formula/questions`

### Что происходит

На скриншоте: `GET /api/v1/site-formula/questions → 429 Too Many Requests`. Вопросы не загружаются, fallback "Не удалось загрузить вопросы" — это и есть симптом.

### Почему

В `owndev-backend/src/api/middleware/rateLimit.ts`:

```ts
const PLAN_LIMITS = { anon: 10, free: 20, ... };
```

НО: в `authMiddleware` анонимы получают `plan: 'free'`, **не** `'anon'`. То есть лимит — 20 req/min. Однако ключ rate limit'а — `rl:${plan}:${req.ip}` — общий по IP **на все эндпоинты вместе** (questions, sessions, answers, run, sessions/:id для polling — это легко 20+ за минуту, особенно когда мы во время отладки несколько раз перезагружали страницу и делали preflight'ы).

Плюс: в `useSiteFormulaSession.resumeSession` + `fetchQuestions` + `createSession` + любые повторные клики "Обновить" — всё уходит в один и тот же bucket. После наших тестов с curl + reload preview лимит исчерпан.

### Решение (двух-уровневое)

**Уровень 1 — немедленная разблокировка (1 команда на сервере):**
```bash
redis-cli --scan --pattern "rl:*" | xargs -r redis-cli del
```
Сбросит счётчики, и Site Formula заработает прямо сейчас.

**Уровень 2 — правильный фикс в коде (чтобы не повторялось):**

Проблема архитектурная: лимит 20/мин для анонимного юзера — это слишком мало для wizard'а, который делает несколько запросов подряд. Меняем три вещи в `owndev-backend/src/api/middleware/rateLimit.ts`:

1. Поднять лимит для `anon`/`free` с 10/20 до **60** (1 запрос/сек в среднем)
2. Skip rate limit для **GET-запросов к статическим эндпоинтам** (`/questions`, `/config-version`, `/health`) — это read-only конфиги, нет смысла их лимитить
3. Считать `anon` отдельно от `free` (сейчас анонимы попадают в `free`, потому что `authMiddleware` ставит `plan: 'free'`)

Конкретно — поправить `authMiddleware` чтобы анонимы получали `plan: 'anon'` (тогда у них свой бакет), и в `rateLimit` добавить whitelist путей.

### Что меняем

**1. `owndev-backend/src/api/middleware/auth.ts`**
- `ANON_USER.plan: 'free'` → `'anon'` (новое значение enum)

**2. `owndev-backend/src/types/user.ts`**
- Добавить `'anon'` в тип `Plan` (или сделать отдельный тип)

**3. `owndev-backend/src/api/middleware/rateLimit.ts`**
- Лимиты: `anon: 60, free: 60, solo: 200, pro: 200, agency: 500`
- Skip whitelist:
  ```ts
  const SKIP_PATHS = ['/api/v1/site-formula/questions', '/api/v1/site-formula/config-version', '/health'];
  if (SKIP_PATHS.includes(req.url)) return;
  ```
- Опционально: разделить bucket по методу (`GET` vs `POST`)

**4. Деплой:**
```bash
cd /var/www/owndev.ru/owndev-backend && git pull && npm run build && pm2 restart owndev-backend && redis-cli --scan --pattern "rl:*" | xargs -r redis-cli del
```

### Что НЕ трогаем

- Frontend (там всё ок)
- CORS (работает, проверено)
- Бизнес-логику Site Formula
- Другие routes (audit/monitor) — лимиты для них оставляем как было через PLAN_LIMITS

### После применения

Site Formula в Lovable Preview должен открываться без 429, даже после многократных reload'ов.

