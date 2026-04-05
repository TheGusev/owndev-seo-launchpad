

## Cron Edge Function для обновления рейтинга + навигация

### Файлы

| Файл | Действие |
|------|----------|
| `supabase/functions/geo-rating-cron/index.ts` | Новая Edge Function — обходит все сайты из `geo_rating`, запускает аудит, обновляет скоры |
| `src/components/Header.tsx` | Добавить ссылку `/geo-rating` с бейджем NEW |
| **SQL (insert, не миграция)** | Создать cron job через `pg_cron` + `pg_net` — еженедельный вызов функции |

### 1. Edge Function `geo-rating-cron`

Логика:
1. Читает все записи из `geo_rating` (service_role)
2. Для каждого домена — вызывает `site-check-scan/start` внутренне (POST с `{ url: "https://{domain}", mode: "page" }`)
3. Поллит `site-check-scan/status/{scan_id}` каждые 5с (таймаут 120с)
4. Когда scan done — читает результат из таблицы `scans` и обновляет `geo_rating`:
   - `llm_score`, `seo_score`, `schema_score`, `direct_score`
   - `has_llms_txt`, `has_faqpage`, `has_schema`
   - `errors_count`, `top_errors` (первые 3 ошибки)
   - `last_checked_at = now()`
5. Обрабатывает сайты последовательно (чтобы не перегружать scan pipeline)
6. Возвращает JSON с результатами обработки

Таймаут функции: до 300с (обработка ~30 сайтов). Если не успевает — обрабатывает сколько может.

### 2. Header.tsx

Добавить в `navLinks` после `geo-audit`:
```
{ href: "/geo-rating", label: "GEO Рейтинг", isRoute: true, isNew: true }
```

### 3. Cron Job (SQL insert)

Включить расширения `pg_cron` и `pg_net`, затем создать задание:
- Расписание: `0 3 * * 1` (каждый понедельник в 3:00 UTC)
- Вызывает `geo-rating-cron` через `net.http_post`

### 4. Миграция для RLS

Добавить UPDATE policy для `service_role` на `geo_rating`, чтобы cron-функция могла обновлять данные.

### Объём

~150 строк Edge Function, 1 строка в Header, SQL для cron + RLS policy.

