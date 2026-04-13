

## Обновление README backend

### Что делаем — 1 файл

#### `owndev-backend/README.md`

Добавить раздел **"Переменные окружения"** после "Быстрый старт" с таблицей всех env-переменных из `.env.example`:

| Переменная | Обязательная | Описание |
|---|---|---|
| `PORT` | нет | Порт сервера (по умолчанию 3001) |
| `DATABASE_URL` | да | PostgreSQL connection string |
| `REDIS_URL` | да | Redis connection string |
| `API_KEY_SECRET` | да | Секрет для X-API-Key аутентификации |
| `LOVABLE_API_KEY` | да | Ключ Lovable AI Gateway для LLM-вызовов |
| `LLM_PROVIDER` | нет | `lovable` (по умолчанию) или `openai` |
| `PUPPETEER_TIMEOUT` | нет | Таймаут Puppeteer в мс (по умолчанию 15000) |
| `MAX_CONCURRENT_AUDITS` | нет | Макс. параллельных аудитов (по умолчанию 3) |
| `SITE_CHECK_CONCURRENCY` | нет | Параллельность site-check (по умолчанию 10) |
| `MAX_CONCURRENT_SITE_CHECKS` | нет | Макс. параллельных site-check (по умолчанию 5) |

Плюс добавить примечание:

> **OpenAI API Key не нужен.** Все LLM-вызовы идут через Lovable AI Gateway. Для переключения на OpenAI установите `LLM_PROVIDER=openai` и добавьте `OPENAI_API_KEY` (не рекомендуется).

Также добавить в таблицу API эндпоинты site-check:

| POST | `/api/v1/site-check` | Запустить проверку `{ url, mode }` |
| GET | `/api/v1/site-check/result/:id` | Результат проверки |

