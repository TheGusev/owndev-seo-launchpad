

## Seed GEO Rating: вшить 80 строк прямо в скрипт миграции

### Проблема
Скрипт `migrate-geo-rating-from-supabase.ts` требует `SUPABASE_URL` и `SUPABASE_SERVICE_ROLE_KEY` для подключения к API. У тебя этих ключей нет на сервере — скрипт не запускается.

### Решение
Я вытянул все 80 строк из базы данных напрямую. Теперь заменю скрипт миграции: вместо fetch из API — захардкоженный массив данных. Скрипту нужен только `DATABASE_URL` (который уже есть на сервере).

### Что меняется

**1 файл**: `owndev-backend/scripts/migrate-geo-rating-from-supabase.ts`

Полная замена содержимого:
- Убирается fetch из Supabase API
- Убираются проверки `SUPABASE_URL` / `SUPABASE_KEY`
- Добавляется массив `SEED_DATA` с 80 объектами (domain, display_name, category, llm_score, seo_score, schema_score, direct_score, has_llms_txt, has_faqpage, has_schema, errors_count, top_errors)
- Логика остаётся: проверка дублей → unique index → UPSERT по domain → верификация
- Единственное требование: `DATABASE_URL` в `.env`

### Данные (все 80 доменов)

Топ-5 для примера:
| domain | display_name | llm | seo | schema | direct |
|--------|-------------|-----|-----|--------|--------|
| owndev.ru | OWNDEV | 90 | 100 | 100 | 79 |
| goruslugimsk.ru | ГорУслуги МСК | 90 | 82 | 100 | 79 |
| vc.ru | VC.ru | 80 | 74 | 85 | 100 |
| tinkoff.ru | Тинькофф | 80 | 65 | 85 | 58 |
| iz.ru | Известия | 80 | 69 | 85 | 100 |

Все 80 строк будут вшиты с полными `top_errors` (JSONB).

### Запуск на сервере (после git pull + build)

```bash
cd /var/www/owndev.ru/owndev-backend
npm run migrate:geo-rating
```

Никаких ключей не нужно — только `DATABASE_URL`.

### Ожидаемый вывод

```
✅ No duplicates — safe to proceed
✅ Unique index ensured
✅ Upserted 80 rows into local geo_rating
✅ Total rows: 80
📊 Top 5: owndev.ru — llm: 90, seo: 100
🎉 Done!
```

