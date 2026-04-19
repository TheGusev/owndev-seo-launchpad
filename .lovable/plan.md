

## Деплой не прошёл — нужно найти реальные пути на сервере

Из вывода видно:
- `/var/www/owndev-backend` — **не существует**
- `/var/www/owndev-frontend` — **не существует**
- PM2 процесс `owndev-backend` есть и работает (uptime restart #206) — значит код где-то есть, просто не там, где я предположил
- `psql` упал, потому что роль `root` не существует — надо либо `sudo -u postgres psql`, либо креды из `.env`

Мне нужно сначала **найти реальные пути** на сервере, и только потом дать корректные команды. Это чисто диагностические команды — ничего не ломают.

### Шаг 1 — найди реальный путь к backend

Запусти на сервере:

```bash
# Найти, откуда запущен PM2 процесс
pm2 describe owndev-backend | grep -E "exec cwd|script path|pm_cwd"

# Альтернатива — через ps
ps -ef | grep owndev | grep -v grep
```

Один из этих способов покажет реальный путь (например `/root/owndev-backend`, `/home/owndev/backend`, или что-то ещё).

### Шаг 2 — найди путь к frontend

Frontend обычно отдаётся nginx из статической папки. Команды:

```bash
# Посмотреть конфиг nginx — найти root для owndev.ru
grep -r "owndev" /etc/nginx/sites-enabled/ 2>/dev/null | grep -E "root|server_name"

# Или сразу посмотреть основной конфиг
cat /etc/nginx/sites-enabled/owndev* 2>/dev/null | grep -E "root|server_name"
```

Это покажет директиву `root /path/to/dist;` — оттуда отдаётся frontend.

### Шаг 3 — пришли мне вывод обеих команд

После того как пришлёшь вывод — я дам **точные команды деплоя** с реальными путями, без догадок.

### Что параллельно стоит проверить (необязательно сейчас)

- Где лежит `.env` бэкенда (там DATABASE_URL для миграции) — узнаем из шага 1
- Кто owner процесса PM2 (root / owndev / другой пользователь) — `pm2 ls` сверху уже показал, что запущено под root
- Есть ли отдельный CI/CD (GitHub Actions deploy.yml уже есть в репозитории — возможно frontend катится автоматом и серверной пересборки вообще не нужно)

### Почему я не даю сейчас "универсальные" команды

Потому что если угадать путь неверно — есть риск:
- сделать `git pull` не в той папке (например в `~`) и засрать home
- запустить `npm run build` где-то не там и сломать сторонний проект
- применить миграцию не в ту БД

Лучше потратить 30 секунд на диагностику, чем потом разгребать.

### Как только пришлёшь вывод — план будет такой

1. `cd <реальный_путь_backend> && git pull`
2. `npm install` (если изменился package.json — а он изменился: добавились зависимости для marketplace audit? проверим)
3. Применить миграцию `003_marketplace_audit.sql` через креды из `.env`:
   ```bash
   set -a && . ./.env && set +a
   psql "$DATABASE_URL" -f src/db/migrations/003_marketplace_audit.sql
   ```
4. `npm run build`
5. `pm2 restart owndev-backend --update-env`
6. `pm2 logs owndev-backend --lines 30 --nostream` — убедиться что MA_WORKER стартанул
7. `curl -s http://localhost:3001/health`
8. Frontend: либо через GitHub Actions (push уже в main — проверим вкладку Actions в репо), либо ручной `git pull && npm ci && npm run build` в реальной папке frontend и `rsync dist/ /var/www/<nginx_root>/`

### Гарантия безопасности

- Все команды диагностики выше — **только чтение** (`pm2 describe`, `ps`, `grep`, `cat`)
- Ничего не меняют, ничего не удаляют
- Если какая-то команда не сработает — просто не выведет результат, не сломает систему

