

## Диагностика прошла — backend жив, теперь нужно дожать smoke-test

### Что показал вывод

**Хорошие новости:**
- `/health` → 200, db+redis connected
- `POST /sessions` → 200, `{"session_id":"af7ff922-...","status":"draft"}` ✅
- В логах видно: `Loaded blueprint-template.v1.json v1.0.0` — значит **fix `template_version: "unknown"` сработал**
- После рестарта в 20:22 новых ошибок `Engine error` нет

**Что произошло с прошлым curl:**
- В bash-цепочке `&&` упал именно `python3 -c ...` — НЕ из-за пустого ответа от API, а скорее всего из-за гонки: `pm2 restart` отдал управление до того, как Fastify забиндил `:3001`
- Сейчас, спустя 2 минуты, `POST /sessions` отвечает корректным JSON
- То есть **JSONB-фикс задеплоен, но мы ещё ни разу не прогнали полный цикл** `/answers` → `/run` после фикса

**Что НЕ доказано:**
- работает ли `/answers` (запись JSONB)
- работает ли `/run` (engine на свежей сессии)
- последняя ошибка `Engine error ... f612eb67` в 20:13 — это **до** деплоя в 20:22, поэтому она не считается

### План — повторить smoke-test без python и без гонок

Один запрос за раз, с `jq` (или sed) для извлечения id, и без зависимости от `python3`. Используем `&` и явный `wait` не нужен — последовательно через `;`/`&&`.

#### Команда (копипастом)

```bash
echo "=== 1. CREATE SESSION ===" && \
RESP=$(curl -sS -X POST https://owndev.ru/api/v1/site-formula/sessions \
  -H "Content-Type: application/json" -d '{}') && \
echo "$RESP" && \
SID=$(echo "$RESP" | sed -n 's/.*"session_id":"\([^"]*\)".*/\1/p') && \
echo "SID=$SID" && \
echo "" && echo "=== 2. SAVE ANSWERS ===" && \
curl -sS -X POST "https://owndev.ru/api/v1/site-formula/sessions/$SID/answers" \
  -H "Content-Type: application/json" \
  -d '{"answers":{"q_services":"single","q_geo":"single_city","q_traffic_sources":["seo"],"q_niche":"general","q_current_site":"none","q_conversion":["form"],"q_growth_plan":"maintain","q_legacy_migration":"no"}}' && \
echo "" && echo "=== 3. CHECK STORAGE TYPE ===" && \
curl -sS "https://owndev.ru/api/v1/site-formula/sessions/$SID" | head -c 600 && \
echo "" && echo "" && echo "=== 4. RUN ENGINE ===" && \
curl -sS -X POST "https://owndev.ru/api/v1/site-formula/sessions/$SID/run" \
  -H "Content-Type: application/json" -d '{}' | head -c 800 && \
echo "" && echo "" && echo "=== 5. PM2 LOGS ===" && \
pm2 logs owndev-backend --lines 20 --nostream
```

### Что ожидается

| Шаг | Хороший признак |
|---|---|
| 1 | `{"session_id":"...","status":"draft"}` |
| 2 | `{"success":true,"status":"answers_saved"}` |
| 3 | `"raw_answers":{"q_services":"single",...}` — **объект, НЕ строка с `\"`** |
| 4 | `{"success":true,"status":"preview_ready","preview_payload":{...}}` |
| 5 | НЕТ `Engine error ... answers must be a non-null object` |

### Если шаг 3 покажет `raw_answers` как строку с `\"`

Значит `${sql.json(answers)}` тоже не сериализует в чистый JSONB через `postgres.js` (зависит от версии). Тогда фикс — заменить на bare `${answers}`:
```ts
SET raw_answers = ${answers}
```
Это проверим уже после прогона, не вслепую.

### Если шаг 4 вернёт 500

Запросим из БД напрямую (`/sessions/:id/debug-trace` требует agency-роли — обойдёмся через свежие pm2 logs из шага 5, где будет точная ошибка).

### Что НЕ трогаем

- Код больше не меняем до получения результата
- Frontend, миграции, конфиги, Site Check, Geo Rating — вне scope

