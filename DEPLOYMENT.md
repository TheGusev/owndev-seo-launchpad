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

## Nginx config — автодеплой из репо

Конфиг nginx живёт в репозитории: **`nginx/owndev.ru.conf`**. Workflow
`.github/workflows/deploy.yml` после сборки фронта автоматически:

1. Бэкапит текущий `/etc/nginx/sites-available/owndev.ru` в `*.bak.YYYYMMDD-HHMMSS`.
2. Копирует свежий конфиг из репо.
3. Делает `nginx -t`.
4. Если ОК → `systemctl reload nginx`. Если нет → откатывает бэкап и падает.

Поэтому правки заголовков (HSTS, CSP, X-Frame-Options, Cache-Control) и proxy_pass
делаются прямо в репо — никаких ручных действий на сервере при штатных правках.

### Одноразовая настройка sudoers (на сервере, один раз)

Чтобы CI мог копировать конфиг и перезагружать nginx без пароля, на сервере
выполнить `sudo visudo` и добавить строку (заменив `deploy` на реального CI-юзера
из `${{ secrets.SERVER_USER }}`):

```
deploy ALL=(ALL) NOPASSWD: /bin/cp, /usr/bin/cp, /usr/sbin/nginx, /bin/systemctl reload nginx, /bin/ln, /usr/bin/ln
```

Без этого первый запуск workflow упадёт на шаге `nginx config sync`. Код и
frontend при этом всё равно задеплоятся (`set -e` сработает позже).

### Ручной откат (если что-то пошло не так)

```bash
ls -t /etc/nginx/sites-available/owndev.ru.bak.* | head -1
sudo cp /etc/nginx/sites-available/owndev.ru.bak.YYYYMMDD-HHMMSS \
        /etc/nginx/sites-available/owndev.ru
sudo nginx -t && sudo systemctl reload nginx
```

### Проверка после деплоя

```bash
curl -sI https://owndev.ru/ | grep -iE 'strict-transport|content-security|x-frame|x-content-type|referrer|cache-control'
curl -s https://owndev.ru/.well-known/security.txt
```
