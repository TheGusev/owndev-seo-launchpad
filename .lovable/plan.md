

## Фикс TS-ошибки билда: `RuntimeError` требует 2 аргумента

### Что произошло

Билд упал на единственной TS-ошибке:

```
src/services/SiteFormula/index.ts:39:13 - error TS2554: Expected 2 arguments, but got 1.
39       throw new RuntimeError('raw_answers is corrupt JSON string');
```

`RuntimeError` (определён в `runtimeValidator.ts:66`) ожидает `(message: string, code: string)`. В прошлом раунде я добавил defensive guard в `runEngine`, но забыл передать `code`.

### Фикс (1 строка)

`owndev-backend/src/services/SiteFormula/index.ts:39`:

```ts
throw new RuntimeError('raw_answers is corrupt JSON string', 'CORRUPT_JSON_STRING');
```

### Что НЕ трогаем

- Логику engine, JSONB-фикс, `getConfigVersions` — всё уже корректно
- Frontend, миграции, конфиги

### Команда деплоя

```bash
cd /var/www/owndev.ru && git pull origin main && \
cd /var/www/owndev.ru/owndev-backend && npm run build && pm2 restart owndev-backend && \
echo "--- live test ---" && \
SID=$(curl -s -X POST https://owndev.ru/api/v1/site-formula/sessions -H "Content-Type: application/json" -d '{}' | python3 -c "import sys,json;print(json.load(sys.stdin)['session_id'])") && \
curl -s -X POST "https://owndev.ru/api/v1/site-formula/sessions/$SID/answers" -H "Content-Type: application/json" -d '{"answers":{"q_services":"single","q_geo":"single_city","q_traffic_sources":["seo"],"q_niche":"general","q_current_site":"none","q_conversion":["form"],"q_growth_plan":"maintain","q_legacy_migration":"no"}}' && echo "" && \
curl -s -X POST "https://owndev.ru/api/v1/site-formula/sessions/$SID/run" -H "Content-Type: application/json" -d '{}' | head -c 400
```

Если `run` вернёт `"status":"preview_ready"` — Site Formula окончательно работает.

### Self-check

- ✅ Ошибка точечная, фикс в 1 строке
- ✅ Логика defensive guard сохраняется
- ✅ После фикса билд пройдёт, JSONB-фикс задеплоится

