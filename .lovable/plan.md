

## Root cause найден точно

Делал реальный live-прогон Site Formula API на проде:

1. `POST /sessions` → ok, session создаётся
2. `POST /sessions/:id/answers` → возвращает `{success:true, status:"answers_saved"}`
3. `POST /sessions/:id/run` → **500 `"answers must be a non-null object"`**
4. `GET /sessions/:id` показывает критичное:
   ```json
   "raw_answers": "{\"q_services\":\"single\",...}"
   ```
   — то есть `raw_answers` сохранился как **строка JSON**, а не как объект JSONB.

Дополнительно `template_version: "unknown"` подтверждает, что engine падает на **первой же строке** `runEngine` — `validateRawAnswers`, до `loadTemplate()`.

### Почему так

В `owndev-backend/src/api/routes/siteFormula.ts`:

```ts
SET raw_answers = ${JSON.stringify(answers)}::jsonb
```

Это антипаттерн для `postgres.js`. Драйвер отправляет stringified JSON как **text-параметр**, и хотя там приписан `::jsonb`, при последующем `SELECT raw_answers` он возвращается уже как **строка** (двойная сериализация: JS-объект → JSON-string → text-параметр → jsonb-text → возврат как string).

Правильный паттерн `postgres.js` — передавать **сам объект**, драйвер сериализует его и пометит как jsonb автоматически:

```ts
SET raw_answers = ${sql.json(answers)}
// или просто
SET raw_answers = ${answers}
```

То же самое надо в `INSERT/UPDATE` для `engine_state`, `preview_payload`, `full_report_payload`.

Дальше `runEngine(session.raw_answers)` получает строку → `typeof !== 'object'` → `ValidationError: "answers must be a non-null object"` → 500.

## Что чинить (1 файл, точечно)

`owndev-backend/src/api/routes/siteFormula.ts` — заменить **все** `${JSON.stringify(x)}::jsonb` на правильную передачу объекта.

Конкретно 4 места:
1. `UPDATE ... SET raw_answers = ${JSON.stringify(answers)}::jsonb` → `${sql.json(answers)}`
2. `engine_state = ${JSON.stringify(result.engine_state)}::jsonb` → `${sql.json(result.engine_state)}`
3. `preview_payload = ${JSON.stringify(result.preview_payload)}::jsonb` → `${sql.json(result.preview_payload)}`
4. `full_report_payload = ${JSON.stringify(result.full_report_payload)}::jsonb` → `${sql.json(result.full_report_payload)}`

Плюс defensive guard в `runEngine`: если на вход пришла строка, попытаться распарсить и продолжить — это спасёт **уже существующие битые сессии в БД**, чтобы не тащить миграцию данных.

```ts
export function runEngine(rawAnswers: RawAnswers | string): RunResult {
  if (typeof rawAnswers === 'string') {
    try { rawAnswers = JSON.parse(rawAnswers); }
    catch { throw new ValidationError('raw_answers is corrupt JSON string'); }
  }
  validateRawAnswers(rawAnswers);
  ...
}
```

Это закрывает не только новые сессии, но и старые битые.

## Бонус: `template_version: "unknown"`

Сейчас `getConfigVersions()` зовёт `getTemplateVersion()`, а `loadTemplate()` ещё не вызывался → возвращает `'unknown'`. И при создании сессии в `INSERT` пишется `template_version='unknown'`. Это второстепенно, но косметически фиксится прогревом в самом `getConfigVersions`:

```ts
export function getConfigVersions() {
  loadRules();
  loadTemplate();
  return { rules_version: getRulesVersion(), template_version: getTemplateVersion() };
}
```

## Что НЕ трогаем

- Engine code (`SiteFormula/*`) — он корректен, проблема исключительно в DB-сериализации.
- Frontend — он шлёт объект правильно, проблема на бэке.
- Миграции БД — колонка JSONB, это правильно. Менять не нужно.
- Site Check, Geo Rating, edge-функции, конфиги rules.v1.json / template — вне scope.

## Файлы

| Файл | Что меняется |
|---|---|
| `owndev-backend/src/api/routes/siteFormula.ts` | 4 места `JSON.stringify(x)::jsonb` → корректная передача через postgres.js |
| `owndev-backend/src/services/SiteFormula/index.ts` | defensive: парсить string в `runEngine` |
| `owndev-backend/src/services/SiteFormula/index.ts` | прогрев `loadTemplate()` в `getConfigVersions` |

## Команда деплоя (после approve)

```bash
cd /var/www/owndev.ru && git stash && git pull origin main && \
cd /var/www/owndev.ru/owndev-backend && npm run build && pm2 restart owndev-backend && \
echo "--- live test ---" && \
SID=$(curl -s -X POST https://owndev.ru/api/v1/site-formula/sessions -H "Content-Type: application/json" -d '{}' | python3 -c "import sys,json;print(json.load(sys.stdin)['session_id'])") && \
curl -s -X POST "https://owndev.ru/api/v1/site-formula/sessions/$SID/answers" -H "Content-Type: application/json" -d '{"answers":{"q_services":"single","q_geo":"single_city","q_traffic_sources":["seo"],"q_niche":"general","q_current_site":"none","q_conversion":["form"],"q_growth_plan":"maintain","q_legacy_migration":"no"}}' && \
echo "" && \
curl -s -X POST "https://owndev.ru/api/v1/site-formula/sessions/$SID/run" -H "Content-Type: application/json" -d '{}' | head -c 400
```

Если последний `run` вернёт `"success":true,"status":"preview_ready"` — Site Formula окончательно работает end-to-end.

## Self-check

- ✅ Проблема не предположена, а **доказана через прод-API**: сохранение возвращает success, но `raw_answers` хранится как escaped string
- ✅ Объяснён механизм двойной сериализации в `postgres.js`
- ✅ Фикс корневой (правильная передача jsonb), а не маскировка
- ✅ Defensive parse спасает уже сломанные сессии без миграции
- ✅ Бизнес-логику engine не трогаем, контракт API не меняется
- ✅ Frontend менять не нужно
- ✅ Бонус-фикс `template_version: "unknown"` в одном месте

