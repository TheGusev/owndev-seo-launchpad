

## Добавление EDGE_FUNCTION_SECRET и создание llm-proxy

### Что происходит

`EDGE_FUNCTION_SECRET` — это пароль, который мы сами придумываем. Он нужен в двух местах:
1. В Lovable Cloud (Secrets) — чтобы Edge Function знала, какой пароль проверять
2. В `.env` на вашем сервере — чтобы бэкенд отправлял этот пароль при запросе

### Что я сделаю

1. **Сгенерирую секрет** (случайная строка) и добавлю его в Lovable Cloud Secrets как `EDGE_FUNCTION_SECRET`
2. **Создам Edge Function** `llm-proxy` — она проверяет этот секрет и проксирует запросы в AI Gateway
3. **Обновлю `.env.example`** — уберу `LOVABLE_API_KEY`, добавлю `EDGE_FUNCTION_URL` и `EDGE_FUNCTION_SECRET`
4. **Обновлю `SiteCheckPipeline.ts`** — `getLlmConfig` будет использовать Edge Function URL
5. **Задеплою и протестирую** Edge Function

### Что вам нужно будет сделать после

Добавить в `.env` на сервере две строки (я напишу точные значения после деплоя):
```
EDGE_FUNCTION_URL=https://chrsibijgyihualqlabm.supabase.co/functions/v1/llm-proxy
EDGE_FUNCTION_SECRET=<значение которое я сгенерирую>
```

Больше никаких LLM-ключей на сервере.

### Файлы

| Файл | Действие |
|------|----------|
| `supabase/functions/llm-proxy/index.ts` | Создать |
| `owndev-backend/src/services/SiteCheckPipeline.ts` | Изменить `getLlmConfig` |
| `owndev-backend/.env.example` | Обновить переменные |

