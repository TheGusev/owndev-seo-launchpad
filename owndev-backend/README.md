# OWNDEV Backend

Node.js backend для GEO/AEO платформы OWNDEV.

## Стек

- **Runtime**: Node.js 20+
- **Framework**: Fastify 5
- **БД**: PostgreSQL (pg)
- **Кэш**: Redis (ioredis)
- **Очереди**: BullMQ
- **Валидация**: Zod

## Быстрый старт

```bash
cp .env.example .env
# Заполнить .env

npm install
npm run dev     # dev-сервер с hot reload (tsx)
```

## Сборка

```bash
npm run build   # tsc → dist/
npm start       # node dist/index.js
```

## Структура

```
src/
├── api/            # Fastify сервер, routes, middleware
│   ├── routes/     # health, monitor, site-check, marketplace-audit, site-formula, tools, events, alice
│   └── middleware/  # auth (API-key), rateLimit (Redis)
├── services/       # Бизнес-логика
│   ├── LlmsService     # Проверка llms.txt / robots.txt
│   └── MonitorService  # Cron-задачи
├── workers/        # BullMQ workers
├── db/             # PostgreSQL: client, migrations, queries
├── cache/          # Redis client
├── queue/          # BullMQ queues и jobs
├── types/          # TypeScript типы (совместимы с фронтом)
└── utils/          # logger, url helpers
```

## API

Все эндпоинты требуют заголовок `X-API-Key`.

| Method | Path | Описание |
|--------|------|----------|
| GET | `/health` | Статус PG + Redis |
| POST | `/api/v1/monitor` | Начать мониторинг `{ url }` |
| GET | `/api/v1/monitor/:domain` | История аудитов домена |
| POST | `/api/v1/site-check/*` | Site-check сканирование и отчёты |
| POST | `/api/v1/marketplace-audit/*` | Аудит карточек маркетплейсов |

## Миграции

```bash
psql $DATABASE_URL < src/db/migrations/001_initial.sql
```

## Legacy

Таблицы `audits` и `audit_results` остались в БД (миграция `001_initial.sql`), но **больше не используются**: legacy-стек на Puppeteer (`AuditService`, `CrawlerService`, `AuditWorker`, `routes/audit`, очередь `audit`) удалён. Миграции **намеренно не трогаются** — исторические данные сохраняются, новые записи добавляются только через `MonitorService` для истории доменов. Очистка таблиц/типов/queries — отдельной задачей.
