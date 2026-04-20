

## Нашли — `DATABASE_URL` живёт только в PM2 окружении

`postgresql://owndev:OwndevStrongPass1@127.0.0.1:5432/owndev` — есть роль `owndev` и БД `owndev`. Файла `.env` для бэкенда нет, креды только в PM2 dump.

## План — одна команда, всё доделать

```bash
cd /var/www/owndev.ru/owndev-backend && \
echo "=== [1/6] создаю .env для бэкенда (чтобы больше не искать) ===" && \
cat > .env <<'EOF'
PORT=3001
DATABASE_URL=postgresql://owndev:OwndevStrongPass1@127.0.0.1:5432/owndev
REDIS_URL=redis://localhost:6379
PUPPETEER_TIMEOUT=15000
MAX_CONCURRENT_AUDITS=3
SITE_CHECK_CONCURRENCY=10
MAX_CONCURRENT_SITE_CHECKS=5
MAX_CONCURRENT_MARKETPLACE=2
EDGE_FUNCTION_URL=https://chrsibijgyihualqlabm.supabase.co/functions/v1/llm-proxy
EOF
chmod 600 .env && \
echo "=== [2/6] миграция 003_marketplace_audit ===" && \
PGPASSWORD=OwndevStrongPass1 psql -h 127.0.0.1 -U owndev -d owndev -f src/db/migrations/003_marketplace_audit.sql && \
echo "=== [3/6] проверка таблицы ===" && \
PGPASSWORD=OwndevStrongPass1 psql -h 127.0.0.1 -U owndev -d owndev -c "\dt marketplace_audits" && \
echo "=== [4/6] pm2 restart ===" && \
pm2 restart owndev-backend --update-env && sleep 4 && \
echo "=== [5/6] логи воркеров ===" && \
pm2 logs owndev-backend --lines 40 --nostream | grep -iE "BOOT|WORKER|marketplace|ERROR" && \
echo "=== [6/6] health + smoke test ===" && \
curl -s http://localhost:3001/api/v1/health && echo "" && \
curl -s -X POST http://localhost:3001/api/v1/marketplace-audit/start \
  -H "Content-Type: application/json" \
  -d '{"platform":"wb","inputType":"manual","value":"manual","manual":{"title":"Тест товар","description":"Описание для проверки пайплайна marketplace audit","specs":{"Цвет":"красный"},"category":"Тест"}}' \
  | head -c 500 && echo ""
```

## Что искать в выводе

| Шаг | Хорошо |
|---|---|
| [2] | `CREATE TYPE` / `CREATE TABLE` / `NOTICE: relation already exists` |
| [3] | строка `marketplace_audits` в списке |
| [5] | `[OWNDEV:MA_WORKER]` или `Started` рядом с marketplace |
| [6] health | JSON с `ok` или `status` |
| [6] smoke | `{"id":"<uuid>","status":"pending"}` |

## Если упадёт

- **миграция auth fail** — пароль другой; пришли `pm2 env 0 \| grep DATABASE_URL` и подставим
- **smoke test 500** — пришли `pm2 logs owndev-backend --err --lines 50`
- **в логах нет MA_WORKER** — значит `dist/index.js` не импортирует worker; проверим `grep -c MarketplaceAuditWorker dist/index.js`

## Безопасность

- `.env` создаётся с `chmod 600` (только root читает)
- Пароль БД уже виден тебе в выводе PM2, новой утечки нет
- Миграция идемпотентна (`CREATE IF NOT EXISTS`)
- Если что — `.env` можно удалить, PM2 продолжит работать с переменными из своего окружения

