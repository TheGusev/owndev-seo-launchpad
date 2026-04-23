

## Автодеплой nginx-конфига + замена Telegram на @one_help

### Часть 1 — почему nginx-заголовки требуют отдельного шага

`.github/workflows/deploy.yml` сейчас деплоит только **код**: `git pull` → собрать backend (`npm run build` + `pm2 restart`) → собрать frontend (`npm run build` в `dist/`). Конфиг nginx живёт в `/etc/nginx/sites-available/owndev.ru` — это **системный файл вне репозитория**, workflow его не касается. Поэтому HSTS/CSP/Cache-Control не применятся, пока конфиг не окажется на сервере физически.

**Решение:** положить nginx-конфиг в репо и расширить workflow, чтобы он сам копировал конфиг и перезагружал nginx. После этого правки заголовков будут ехать так же автоматически, как код.

### Часть 2 — что делаю

#### A. Telegram-контакт `@The_Suppor_t` → `@one_help`

Заменить во всех 5 местах:
1. `index.html:48` — `Organization → sameAs`
2. `index.html:183` — видимый `<address>` в SEO-fallback
3. `src/components/Footer.tsx:95` — иконка соцсети в футере
4. `src/pages/Index.tsx:33` — JSON-LD Organization
5. `public/.well-known/security.txt:2` — Contact для security researchers
6. `DEPLOYMENT.md` — упоминание в комментариях про security headers (если есть)

#### B. Nginx-конфиг как часть репозитория

**Новый файл:** `nginx/owndev.ru.conf` — полный server-блок с:
- `listen 443 ssl http2;` + `server_name owndev.ru www.owndev.ru;`
- SSL paths (Let's Encrypt по дефолту: `/etc/letsencrypt/live/owndev.ru/...`)
- `root /var/www/owndev.ru/dist;`
- Security headers: HSTS, CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- `location /api/` → `proxy_pass http://127.0.0.1:3001;`
- `location ~* \.(js|css|woff2|svg|png|jpg|jpeg|webp|ico)$` → `Cache-Control: max-age=31536000, immutable`
- `location /` → `try_files $uri /index.html;` + `Cache-Control: max-age=300, must-revalidate`
- `location = /.well-known/security.txt` → `Content-Type: text/plain`
- HTTP→HTTPS redirect (`server { listen 80; return 301 https://$host$request_uri; }`)

> Я не знаю текущих SSL-путей и точных директив существующего конфига сервера. Чтобы не сломать работающий сайт, перед автоприменением нужен **бэкап** и **тестовый прогон** — см. шаги в workflow ниже.

#### C. Расширение `.github/workflows/deploy.yml`

Добавить шаги после `frontend build`:

```bash
echo "=== nginx config sync ==="
# Бэкап текущего конфига (на случай отката)
sudo cp /etc/nginx/sites-available/owndev.ru \
        /etc/nginx/sites-available/owndev.ru.bak.$(date +%Y%m%d-%H%M%S) || true

# Скопировать новый конфиг из репо
sudo cp /var/www/owndev.ru/nginx/owndev.ru.conf \
        /etc/nginx/sites-available/owndev.ru

# Проверить синтаксис
if sudo nginx -t; then
  sudo systemctl reload nginx
  echo "nginx reloaded ok"
else
  echo "nginx config invalid — rolling back"
  sudo cp $(ls -t /etc/nginx/sites-available/owndev.ru.bak.* | head -1) \
          /etc/nginx/sites-available/owndev.ru
  exit 1
fi
```

**Требование к серверу:** пользователь `${{ secrets.SERVER_USER }}` должен иметь NOPASSWD-sudo на команды `cp`, `nginx`, `systemctl reload nginx`. Если sudo требует пароль — workflow упадёт, и заголовки придётся применить вручную одним разом, а дальше автодеплой заработает.

#### D. `DEPLOYMENT.md` — переписать секцию

Убрать «применить вручную» — теперь это делает CI. Оставить только:
- путь `nginx/owndev.ru.conf` в репо
- одноразовая настройка sudoers на сервере (`visudo`):
  ```
  deploy ALL=(ALL) NOPASSWD: /usr/bin/cp, /usr/sbin/nginx, /bin/systemctl reload nginx
  ```
- как сделать ручной откат (`cp .bak → /etc/nginx/sites-available/`)

### Файлы

- **edit** `index.html` — Telegram в JSON-LD `sameAs` и в `<address>`.
- **edit** `src/pages/Index.tsx` — Telegram в Organization JSON-LD.
- **edit** `src/components/Footer.tsx` — ссылка на Telegram в футере.
- **edit** `public/.well-known/security.txt` — Contact-строка.
- **new** `nginx/owndev.ru.conf` — полный nginx server-блок.
- **edit** `.github/workflows/deploy.yml` — шаг nginx config sync с бэкапом и rollback.
- **edit** `DEPLOYMENT.md` — секция про автодеплой nginx и одноразовый sudoers-setup.

### Что должен сделать пользователь после мерджа (1 раз, потом всё авто)

На сервере выполнить `sudo visudo` и добавить строку с NOPASSWD для команд из списка выше — иначе CI не сможет перезагрузить nginx. После этого все будущие правки заголовков/кэша/прокси едут автоматически вместе с кодом.

