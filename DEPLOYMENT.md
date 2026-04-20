# Deployment — owndev.ru

## Структура

- Frontend: `/var/www/owndev.ru` (Vite build → `dist/`, раздаётся nginx)
- Backend: `/var/www/owndev.ru/owndev-backend` (Node + Fastify, PM2 процесс `owndev-backend`, порт `3001`)
- nginx: `/api/` → `http://127.0.0.1:3001`

## CI/CD

Workflow: `.github/workflows/deploy.yml` — деплой по push в `main` через SSH.

Шаги:
1. `git pull`
2. backend: `npm install --include=dev` → `npm run build` → `pm2 restart owndev-backend`
3. frontend: `npm install` → `npm run build`

`set -e` — любой шаг упал = деплой стоп.

## Переменные окружения

### Frontend — `/var/www/owndev.ru/.env`

```dotenv
VITE_SUPABASE_URL=https://chrsibijgyihualqlabm.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<anon key>
```

`VITE_API_BASE_URL` НЕ задаём — фронт автоматически использует относительный `/api`,
который nginx проксирует на бэкенд (`127.0.0.1:3001`). Это работает и для прод, и для preview.

⚠️ Удалить устаревшую переменную `VITE_BACKEND_URL` (нигде не читается).

### Backend — `/var/www/owndev.ru/owndev-backend/.env`

```dotenv
PORT=3001
DATABASE_URL=postgresql://owndev:<pass>@127.0.0.1:5432/owndev
REDIS_URL=redis://localhost:6379

# AI / LLM — прямой вызов OpenAI API.
# Без этого ключа Marketplace Audit и LLM Judge пропускают AI-анализ
# (в логах: "No OPENAI_API_KEY — skipping LLM call").
OPENAI_API_KEY=sk-proj-...        # ключ от platform.openai.com
```

Файл должен быть с `chmod 600` и владельцем root.

## Проверка после деплоя

```bash
# фронт собрался свежий
ls -la /var/www/owndev.ru/dist/index.html

# бэк живой
curl -s http://localhost:3001/api/v1/health

# pm2 процесс online
pm2 list | grep owndev-backend
```
