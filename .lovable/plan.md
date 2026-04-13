

## Реализация Edge Function прокси для LLM

### Файлы

#### 1. Создать `supabase/functions/llm-proxy/index.ts`

Edge Function которая:
- Проверяет `Authorization: Bearer <EDGE_FUNCTION_SECRET>` → 401
- Проверяет размер body ≤ 50KB → 413
- Проксирует запрос as-is в `https://ai.gateway.lovable.dev/v1/chat/completions` с `LOVABLE_API_KEY`
- Возвращает ответ Gateway as-is
- Ошибки Gateway → 502
- CORS headers на всех ответах

#### 2. Изменить `owndev-backend/src/services/SiteCheckPipeline.ts`

Только `getLlmConfig` (строки 291-298):

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
  return {
    url: 'https://ai.gateway.lovable.dev/v1/chat/completions',
    authHeader: `Bearer ${process.env.LOVABLE_API_KEY || apiKey}`,
    defaultModel: 'google/gemini-2.5-flash',
  };
}
```

Больше ничего в файле не трогаем.

#### 3. Обновить `owndev-backend/.env.example`

Убрать `LOVABLE_API_KEY`, добавить:
```
EDGE_FUNCTION_URL=https://chrsibijgyihualqlabm.supabase.co/functions/v1/llm-proxy
EDGE_FUNCTION_SECRET=owndev-llm-proxy-secret-2024
```

### Secrets

Добавить в Lovable Cloud:
- `EDGE_FUNCTION_SECRET` = `owndev-llm-proxy-secret-2024`

### После деплоя

На сервере в `.env` добавить:
```
EDGE_FUNCTION_URL=https://chrsibijgyihualqlabm.supabase.co/functions/v1/llm-proxy
EDGE_FUNCTION_SECRET=owndev-llm-proxy-secret-2024
```

Убрать `LOVABLE_API_KEY` из `.env`.

Затем: `git pull && npm run build && pm2 restart owndev-backend`

### Что НЕ меняем

- `llmCall` / `llmToolCall` — формат запросов остаётся OpenAI-совместимый
- `SiteCheckWorker.ts` — не трогаем
- Промпты, типы, Basic/Full, фронт — не трогаем

