

## Каркас Node.js backend OWNDEV

### Подход

Создать директорию `owndev-backend/` в корне проекта со всей указанной структурой. Все файлы — рабочий TypeScript-каркас с реальными импортами, типами и заглушками логики. Не затрагивает фронтенд.

### Файлы (28 штук)

| Файл | Описание |
|------|----------|
| `owndev-backend/package.json` | Зависимости: fastify, pg, ioredis, bullmq, puppeteer, node-cron, zod, dotenv |
| `owndev-backend/tsconfig.json` | target ES2022, module NodeNext, strict |
| `owndev-backend/.env.example` | PORT, DATABASE_URL, REDIS_URL, PUPPETEER_TIMEOUT, MAX_CONCURRENT_AUDITS, API_KEY_SECRET |
| `owndev-backend/README.md` | Установка, запуск, структура |
| `owndev-backend/src/index.ts` | Точка входа: старт Fastify, подключение Redis/PG, graceful shutdown |
| `owndev-backend/src/utils/logger.ts` | Лёгкий логгер [OWNDEV:TAG] info/warn/error |
| `owndev-backend/src/utils/url.ts` | normalizeUrl, isValidUrl через zod |
| `owndev-backend/src/types/audit.ts` | AuditResult, AuditIssue, IssuePriority — совместимы с фронтом |
| `owndev-backend/src/types/domain.ts` | Domain, DomainStatus |
| `owndev-backend/src/types/user.ts` | User, Plan |
| `owndev-backend/src/db/client.ts` | pg Pool из DATABASE_URL |
| `owndev-backend/src/db/migrations/001_initial.sql` | Таблицы: users, domains, audits, audit_issues |
| `owndev-backend/src/db/queries/audits.ts` | insertAudit, getAuditById, listAuditsByDomain |
| `owndev-backend/src/db/queries/domains.ts` | insertDomain, getDomainByUrl |
| `owndev-backend/src/db/queries/users.ts` | getUserById, getUserByApiKey |
| `owndev-backend/src/cache/redis.ts` | ioredis клиент из REDIS_URL |
| `owndev-backend/src/queue/queues.ts` | BullMQ Queue: auditQueue, monitorQueue |
| `owndev-backend/src/queue/jobs.ts` | addAuditJob, addMonitorJob |
| `owndev-backend/src/api/server.ts` | Fastify instance, регистрация routes |
| `owndev-backend/src/api/routes/health.ts` | GET /health — статус PG + Redis |
| `owndev-backend/src/api/routes/audit.ts` | POST /api/v1/audit, GET /api/v1/audit/:id |
| `owndev-backend/src/api/routes/monitor.ts` | POST /api/v1/monitor, GET /api/v1/monitor/:domain |
| `owndev-backend/src/api/middleware/auth.ts` | Проверка API-ключа из заголовка |
| `owndev-backend/src/api/middleware/rateLimit.ts` | Rate limit через Redis (sliding window) |
| `owndev-backend/src/services/AuditService.ts` | Оркестрация аудита: crawl → анализ → сохранение |
| `owndev-backend/src/services/CrawlerService.ts` | Puppeteer: загрузка страницы, извлечение meta/schema/headers |
| `owndev-backend/src/services/SchemaService.ts` | Парсинг и валидация JSON-LD/Schema.org |
| `owndev-backend/src/services/LlmsService.ts` | Проверка llms.txt, robots.txt для AI |
| `owndev-backend/src/services/MonitorService.ts` | Периодическая проверка доменов через node-cron |
| `owndev-backend/src/workers/AuditWorker.ts` | BullMQ Worker: обработка аудит-задач |
| `owndev-backend/src/workers/MonitorWorker.ts` | BullMQ Worker: обработка мониторинг-задач |

### Ключевые решения

- **Типы совместимы с фронтом**: `AuditResult`, `AuditIssue`, `IssuePriority` — те же интерфейсы, что в `src/lib/api/types.ts`
- **API версионирование**: все эндпоинты под `/api/v1/` — совпадает с `API_VERSION` на фронте
- **Zod-валидация**: каждый route валидирует body через zod-схему
- **Graceful shutdown**: закрытие PG pool, Redis, BullMQ workers при SIGTERM
- **Логгер без зависимостей**: console.info/warn/error с тегами `[OWNDEV:service]`

### Что НЕ трогаем

Весь фронтенд (src/, supabase/, index.html, vite.config.ts) — 0 изменений. Backend живёт в отдельной директории.

### Объём

~28 файлов, ~800 строк кода-каркаса.

