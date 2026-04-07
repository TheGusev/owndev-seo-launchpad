# OWNDEV Backend

Node.js backend для GEO/AEO платформы OWNDEV.

## Стек

- **Runtime**: Node.js 20+
- **Framework**: Fastify 5
- **БД**: PostgreSQL (pg)
- **Кэш**: Redis (ioredis)
- **Очереди**: BullMQ
- **Рендеринг**: Puppeteer
- **Валидация**: Zod
- **Cron**: node-cron

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
│   ├── routes/     # health, audit, monitor
│   └── middleware/  # auth (API-key), rateLimit (Redis)
├── services/       # Бизнес-логика
│   ├── AuditService    # Оркестрация аудита
│   ├── CrawlerService  # Puppeteer рендеринг
│   ├── SchemaService   # Валидация JSON-LD
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
| POST | `/api/v1/audit` | Создать аудит `{ url }` |
| GET | `/api/v1/audit/:id` | Получить результат аудита |
| POST | `/api/v1/monitor` | Начать мониторинг `{ url }` |
| GET | `/api/v1/monitor/:domain` | История аудитов домена |

## Миграции

```bash
psql $DATABASE_URL < src/db/migrations/001_initial.sql
```
