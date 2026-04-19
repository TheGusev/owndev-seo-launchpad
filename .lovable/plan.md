

## Настройка VITE_API_BASE_URL для работы Preview с боевым backend

### Проблема

Сейчас `src/lib/api/config.ts` использует `import.meta.env.VITE_API_BASE_URL || '/api'`. В Lovable Preview переменная не задана, поэтому фронт бьёт в `/api/v1/...` — это relative URL внутри `*.lovable.app`, где никакого backend нет. Site Formula падает с "Failed to load questions".

В production (owndev.ru) тот же relative `/api` работает корректно, потому что nginx проксирует `/api` → `localhost:3001` (backend pm2).

### Ограничения

1. **`.env` нельзя править** — он автогенерируется Lovable Cloud (содержит только Supabase-переменные, перечислены в системных правилах).
2. Lovable не имеет UI-секрета `VITE_API_BASE_URL` для фронта — секреты доступны только для edge functions, а `VITE_*` инлайнится в build на этапе Vite.
3. Значит единственный надёжный путь — **захардкодить fallback в код**, не ломая прод.

### Решение

Изменить `src/lib/api/config.ts`:

```ts
const DEFAULT_API_BASE = typeof window !== 'undefined' && window.location.hostname.endsWith('.lovable.app')
  ? 'https://owndev.ru/api'
  : '/api';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
```

Логика:
- На `*.lovable.app` (preview / published) → бьём напрямую в `https://owndev.ru/api` (cross-origin)
- На `owndev.ru` и localhost → relative `/api` (через nginx / vite proxy) — поведение прода не меняется
- `VITE_API_BASE_URL` из env по-прежнему имеет приоритет, если кто-то задаст явно

### Требование к backend (CORS)

Чтобы запросы с `*.lovable.app` к `owndev.ru` проходили, на backend должны быть разрешены эти origin'ы в CORS. Нужно проверить `owndev-backend/src/api/server.ts` — текущий список allowed origins. Если `lovable.app` там нет, добавлю в том же шаге:

```ts
const allowedOrigins = [
  'https://owndev.ru',
  'https://www.owndev.ru',
  /\.lovable\.app$/,  // preview + published
  'http://localhost:8080',
];
```

После правки backend нужен будет деплой на сервер (`git pull && npm run build && pm2 restart owndev-backend`) — это пользователь сделает вручную как обычно.

### Что делаю в default mode

1. `code--view owndev-backend/src/api/server.ts` — посмотреть текущий CORS
2. Правлю `src/lib/api/config.ts` — добавляю auto-detect для `*.lovable.app`
3. Если в CORS нет `lovable.app` — добавляю regex
4. Сообщаю команду для деплоя backend

### Что НЕ трогаем

- `.env` (автогенерируется)
- `vite.config.ts` proxy (нужен только для локальной разработки)
- Любую другую логику API — изменение точечное

### После применения

В Lovable Preview открыть `/site-formula/wizard` → должны загрузиться вопросы (запрос пойдёт на `https://owndev.ru/api/v1/site-formula/questions`) → пройти wizard → preview сгенерируется без ошибок.

