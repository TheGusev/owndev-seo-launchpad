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

## Security headers (nginx) — применить вручную на сервере

Эти заголовки даны вручную в `/etc/nginx/sites-available/owndev.ru` внутри блока
`server { listen 443 ssl; ... }`. Без них наш собственный аудитор показывает
низкий балл «Безопасность» и помечает отсутствие HSTS, CSP, X-Frame-Options,
корректного `Cache-Control`.

```nginx
# --- Security headers ---
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' https://mc.yandex.ru; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' https://mc.yandex.ru https://*.supabase.co https://api.owndev.ru; frame-ancestors 'self';" always;

# --- Cache-Control ---
# Статика — immutable на год (имена файлов хешируются Vite).
location ~* \.(js|css|woff2|svg|png|jpg|jpeg|webp|ico)$ {
  add_header Cache-Control "public, max-age=31536000, immutable" always;
  try_files $uri =404;
}

# HTML — короткий кэш, чтобы релизы быстро доезжали до пользователей.
location / {
  add_header Cache-Control "public, max-age=300, must-revalidate" always;
  try_files $uri /index.html;
}

# .well-known/security.txt — статический файл из public/.
location = /.well-known/security.txt {
  add_header Content-Type "text/plain; charset=utf-8" always;
  try_files $uri =404;
}
```

Применить:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

Проверить:

```bash
curl -sI https://owndev.ru/ | grep -iE 'strict-transport|content-security|x-frame|x-content-type|referrer|cache-control'
curl -s https://owndev.ru/.well-known/security.txt
```
