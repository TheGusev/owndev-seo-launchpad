

## Проблема

Секрет `EDGE_FUNCTION_SECRET` в Lovable Cloud всё ещё содержит старое значение (48-символьная hex-строка), а не `owndev-llm-proxy-secret-2024`. Логи подтверждают: `secret-len=48, token-len=28, match=false`.

Все файлы уже готовы и правильно написаны:
- `supabase/functions/llm-proxy/index.ts` — создан, проверяет `x-proxy-secret`
- `owndev-backend/src/services/SiteCheckPipeline.ts` — `getLlmConfig` обновлён
- `owndev-backend/.env.example` — обновлён

## Что нужно сделать

**Единственное действие**: обновить значение `EDGE_FUNCTION_SECRET` в Lovable Cloud на `owndev-llm-proxy-secret-2024`, затем передеплоить `llm-proxy` и протестировать.

После успешного теста выдам:
- Точный `EDGE_FUNCTION_URL`
- Точные строки для `.env` на сервере
- curl-команды для проверки

