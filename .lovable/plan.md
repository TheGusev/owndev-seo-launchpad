

## Цель
Прогнать через наш реальный Node-аудит **все домены из `geo_rating` где `llm_score ≤ 65`** (а также параллельно проверить «подозрительно ровные» значения — это следы старого Supabase-cron). Реальные дробные баллы перезапишутся через `SiteCheckWorker`, который сам делает upsert в `geo_rating`.

## Что делаем

### 1. Скрипт массового rescan
Создать `owndev-backend/scripts/rescan-geo-rating.ts` — CLI-утилита:
- Читает домены из `geo_rating` по фильтру:
  - `--mode=low65` (новый, **по умолчанию для текущей задачи**): `llm_score <= 65 OR seo_score <= 65 OR schema_score <= 65 OR direct_score <= 65`
  - `--mode=score65`: только `llm_score = 65` (старый режим)
  - `--mode=stale`: давно не проверялись (>24ч) ИЛИ scores «ровные» (`% 5 = 0`)
  - `--mode=all`: все 80 доменов
  - `--domain=foo.ru`: один конкретный
- Для каждого:
  - POST `http://localhost:3000/api/v1/site-check/start` с `{ url: 'https://${domain}', mode: 'page', force: true }`
  - Поллит `GET /api/v1/site-check/status/:scanId` каждые 5 сек, таймаут 120 сек
  - Логирует: `✓ domain.ru: llm=87 seo=72 schema=45 direct=63` или `✗ ошибка`
- Параллелизм 3, пауза 2 сек между батчами
- В конце сводка: обработано/успешно/ошибок/среднее время

`SiteCheckWorker` уже сам делает `INSERT ... ON CONFLICT (domain) DO UPDATE` в `geo_rating` после каждого скана — отдельно записывать ничего не нужно.

### 2. Админ-эндпоинт (для удалённого запуска)
В `owndev-backend/src/api/routes/siteCheck.ts` добавить:
```
POST /api/v1/site-check/admin/rescan-geo-rating
Headers: X-Admin-Token (сверка с process.env.ADMIN_TOKEN)
Body: { mode: 'low65'|'score65'|'stale'|'all', domain?: string, dry_run?: boolean }
```
Достаёт список доменов, ставит каждый в очередь BullMQ. Возвращает `{ queued: N, domains: [...] }`. Прогресс — через существующий `/status/:scan_id`.

### 3. Депрекация старого Supabase-cron
В `supabase/functions/geo-rating-cron/index.ts` в начале хендлера возвращать **410 Gone** с сообщением «Заменено на /api/v1/site-check/admin/rescan-geo-rating». Это исключит риск что старая функция перезапишет свежие данные «бакетами».

### 4. package.json
Добавить скрипт `"rescan:geo": "tsx scripts/rescan-geo-rating.ts"`.

## Запуск после деплоя

На сервере (рекомендованный порядок):
```bash
cd /var/www/owndev-backend
npm run rescan:geo -- --mode=low65    # все домены где хоть один score ≤ 65
npm run rescan:geo -- --mode=stale    # потом «ровные» бакеты остальных
```

Удалённо (без SSH):
```bash
curl -X POST https://owndev.ru/api/v1/site-check/admin/rescan-geo-rating \
  -H "X-Admin-Token: $ADMIN_TOKEN" -H "Content-Type: application/json" \
  -d '{"mode":"low65"}'
```

## Файлы

| Файл | Действие |
|---|---|
| `owndev-backend/scripts/rescan-geo-rating.ts` | **Create** — CLI |
| `owndev-backend/src/api/routes/siteCheck.ts` | **Edit** — `POST /admin/rescan-geo-rating` |
| `owndev-backend/package.json` | **Edit** — `rescan:geo` script |
| `supabase/functions/geo-rating-cron/index.ts` | **Edit** — return 410 Gone |

## Что НЕ трогаем
- Frontend `/geo-rating` — читает из `geo_rating`, обновится автоматически.
- Логику upsert в `SiteCheckWorker.ts` — уже корректная, пишет дробные значения.
- Структуру таблицы `geo_rating`.

## Проверка
1. `npm run build` в `owndev-backend` — без TS-ошибок.
2. До запуска: `SELECT count(*) FROM geo_rating WHERE llm_score <= 65 OR seo_score <= 65 OR schema_score <= 65 OR direct_score <= 65` — увидим сколько кандидатов.
3. `npm run rescan:geo -- --domain=hh.ru --mode=all` — пробный прогон, в логах НЕровные числа.
4. После полного прогона `--mode=low65`: пересчитать тот же `count(*)` — должен резко уменьшиться, оставшиеся ≤65 — это те у кого реально низкие оценки.

