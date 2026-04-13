

## Edge Function прокси для LLM-вызовов

### Суть

Создаём Edge Function `llm-proxy`, которая принимает запросы от Node.js бэкенда и проксирует их в AI Gateway, используя внутренний `LOVABLE_API_KEY`. На сервере нужны только `EDGE_FUNCTION_URL` и `EDGE_FUNCTION_SECRET`.

### Архитектура

```text
[Node.js сервер]                    [Lovable Cloud]                [AI Gateway]
     │                                    │                              │
     │── POST /functions/v1/llm-proxy ──→ │                              │
     │   Auth: Bearer EDGE_FUNCTION_SECRET│                              │
     │   Body: {messages, tools, ...}     │── POST /v1/chat/completions→ │
     │                                    │   Auth: Bearer LOVABLE_API_KEY│
     │←── JSON (OpenAI-compatible) ──────│←── JSON response ────────────│
```

### Изменения — 3 файла

#### 1. Новый: `supabase/functions/llm-proxy/index.ts`

Edge Function, которая:
- Проверяет `Authorization: Bearer EDGE_FUNCTION_SECRET` (из Deno.env) → 401 если не совпадает
- Проверяет размер body ≤ 50KB → 413 если превышен
- Принимает тело в формате OpenAI API: `{ model, messages, tools?, tool_choice?, max_tokens?, temperature? }`
- Проксирует запрос в `https://ai.gateway.lovable.dev/v1/chat/completions` с `LOVABLE_API_KEY`
- Возвращает ответ as-is (тот же JSON что вернул Gateway)
- При ошибке Gateway → 502 с деталями
- CORS headers для совместимости
- НЕ логирует payload, только статусы и ошибки

Важно: прокси работает на уровне OpenAI-совместимого API (messages/tools), а НЕ на уровне task/payload. Это проще и не требует менять промпты — `llmCall` и `llmToolCall` просто меняют URL.

#### 2. Изменить: `owndev-backend/src/services/SiteCheckPipeline.ts`

Только функция `getLlmConfig` (строки 291-298):

```typescript
function getLlmConfig(apiKey: string) {
  const proxyUrl = process.env.EDGE_FUNCTION_URL;
  if (proxyUrl) {
    return {
      url: proxyUrl,
      authHeader: `Bearer ${process.env.EDGE_FUNCTION_SECRET || ''}`,
      defaultModel: 'google/gemini-2.5-flash',
    };
  }
  // Fallback: direct gateway (for local dev if needed)
  return {
    url: 'https://ai.gateway.lovable.dev/v1/chat/completions',
    authHeader: `Bearer ${process.env.LOVABLE_API_KEY || apiKey}`,
    defaultModel: 'google/gemini-2.5-flash',
  };
}
```

Также убрать `LLM_PROVIDER` из логов (заменить на `'llm-proxy'`).

`llmCall` и `llmToolCall` — без изменений, они уже шлют стандартный OpenAI-формат.

#### 3. Изменить: `owndev-backend/.env.example`

```
EDGE_FUNCTION_URL=https://chrsibijgyihualqlabm.supabase.co/functions/v1/llm-proxy
EDGE_FUNCTION_SECRET=owndev-llm-proxy-secret-2024
```

Убрать `LOVABLE_API_KEY` (больше не нужен на сервере).

### Secrets в Lovable Cloud

Добавить один новый secret:
- `EDGE_FUNCTION_SECRET` = `owndev-llm-proxy-secret-2024` (или другое значение по вашему выбору)

`LOVABLE_API_KEY` уже есть — Edge Function использует его автоматически.

### На сервере в .env

```
EDGE_FUNCTION_URL=https://chrsibijgyihualqlabm.supabase.co/functions/v1/llm-proxy
EDGE_FUNCTION_SECRET=owndev-llm-proxy-secret-2024
```

Больше ничего LLM-связанного.

### Что НЕ меняем

- `llmCall` / `llmToolCall` — формат запросов и парсинг ответов остаётся
- `SiteCheckWorker.ts` — передаёт apiKey как раньше (он просто не используется если есть EDGE_FUNCTION_URL)
- Промпты, типы, pipeline логику
- Frontend
- Другие Edge Functions

### Тест после деплоя

```bash
curl -X POST https://chrsibijgyihualqlabm.supabase.co/functions/v1/llm-proxy \
  -H "Authorization: Bearer owndev-llm-proxy-secret-2024" \
  -H "Content-Type: application/json" \
  -d '{"model":"google/gemini-2.5-flash","messages":[{"role":"user","content":"Скажи привет"}],"max_tokens":50}'
```

200 + JSON с `choices` → работает. 401 → секрет не совпадает. 502 → Gateway недоступен.

