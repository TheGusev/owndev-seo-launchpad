

## Миграция GEO Rating из Supabase → локальный Postgres

### Что делаем

Создаём одноразовый скрипт миграции (Вариант A) и npm-скрипт для запуска.

### Файлы

**1. Создать `owndev-backend/scripts/migrate-geo-rating-from-supabase.ts`**

Скрипт:
- Загружает `dotenv/config`
- Проверяет наличие `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (или `SUPABASE_ANON_KEY`), `DATABASE_URL` в env
- Fetch все строки из `${SUPABASE_URL}/rest/v1/geo_rating?select=*` с Authorization header
- Перед созданием unique index — проверяет дубли: `SELECT domain, count(*) FROM geo_rating GROUP BY domain HAVING count(*) > 1`
- Если дубли найдены — выводит список и количество, завершается с exit(1)
- Если дублей нет — `CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_rating_domain ON geo_rating(domain)`
- UPSERT каждой строки: `INSERT INTO geo_rating (...15 полей...) VALUES (...) ON CONFLICT (domain) DO UPDATE SET display_name=EXCLUDED.display_name, category=..., llm_score=..., seo_score=..., schema_score=..., direct_score=..., has_llms_txt=..., has_faqpage=..., has_schema=..., errors_count=..., top_errors=..., last_checked_at=..., created_at=...`
- Логирует: `Fetched N rows from Supabase`, `Upserted N rows`, `Done`
- Использует `postgres` из `../src/db/client.js` (тот же клиент что и runtime)

**2. Изменить `owndev-backend/package.json`**

Добавить в scripts:
```
"migrate:geo-rating": "tsx scripts/migrate-geo-rating-from-supabase.ts"
```

### Колонки (полное совпадение Supabase ↔ локальная)

id, domain, display_name, category, llm_score, seo_score, schema_score, direct_score, has_llms_txt, has_faqpage, has_schema, errors_count, top_errors, last_checked_at, created_at

### Не трогаем

- Runtime route `/geo-rating`
- Никакие другие файлы

### Запуск на сервере

```bash
cd /var/www/owndev.ru/owndev-backend
npm run migrate:geo-rating
```

### Ожидаемый результат

```
Fetched 80 rows from Supabase
No duplicates in local geo_rating — safe to proceed
Created unique index on domain
Upserted 80 rows into local geo_rating
Done!
```

