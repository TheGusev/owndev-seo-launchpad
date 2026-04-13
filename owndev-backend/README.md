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
# Заполнить .env (см. раздел "Переменные окружения")

npm install
npm run dev     # dev-сервер с hot reload (tsx)
```

## Переменные окружения

| Переменная | Обязательная | Описание |
|---|---|---|
| `DATABASE_URL` | да | PostgreSQL connection string |
| `REDIS_URL` | да | Redis connection string |
| `API_KEY_SECRET` | да | Секрет для X-API-Key аутентификации |
| `LOVABLE_API_KEY` | да | Ключ Lovable AI Gateway для LLM-вызовов |
| `LLM_PROVIDER` | нет | `lovable` (по умолчанию) или `openai` |
| `PORT` | нет | Порт сервера (по умолчанию 3001) |
| `PUPPETEER_TIMEOUT` | нет | Таймаут Puppeteer в мс (по умолчанию 15000) |
| `MAX_CONCURRENT_AUDITS` | нет | Макс. параллельных аудитов (по умолчанию 3) |
| `SITE_CHECK_CONCURRENCY` | нет | Параллельность site-check (по умолчанию 10) |
| `MAX_CONCURRENT_SITE_CHECKS` | нет | Макс. параллельных site-check (по умолчанию 5) |

> **OpenAI API Key не нужен.** Все LLM-вызовы идут через Lovable AI Gateway по умолчанию. Для переключения на OpenAI установите `LLM_PROVIDER=openai` и добавьте `OPENAI_API_KEY` (не рекомендуется).

## Сборка

```bash
npm run build   # tsc → dist/
npm start       # node dist/index.js
```

## Структура

```
src/
├── api/            # Fastify сервер, routes, middleware
│   ├── routes/     # health, audit, monitor, siteCheck
│   └── middleware/  # auth (API-key), rateLimit (Redis)
├── services/       # Бизнес-логика
│   ├── AuditService    # Оркестрация аудита
│   ├── CrawlerService  # Puppeteer рендеринг
│   ├── SchemaService   # Валидация JSON-LD
│   ├── LlmsService     # Проверка llms.txt / robots.txt
│   ├── SiteCheckPipeline # Пайплайн проверки сайта (basic/full)
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
| POST | `/api/v1/site-check` | Запустить проверку `{ url, mode }` |
| GET | `/api/v1/site-check/result/:id` | Результат проверки |

## Миграции

```bash
psql $DATABASE_URL < src/db/migrations/001_initial.sql
```
