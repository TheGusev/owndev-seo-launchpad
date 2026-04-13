

## Edge Function прокси для LLM — финальный план

### Архитектура

```text
[Node.js сервер]                      [Lovable Cloud]                  [AI Gateway]
     │                                      │                                │
     │── POST /functions/v1/llm-proxy ────→ │                                │
     │   Auth: Bearer EDGE_FUNCTION_SECRET  │                                │
     │   Body: OpenAI-compatible as-is      │── POST /v1/chat/completions ──→│
     │                                      │   Auth: Bearer LOVABLE_API_KEY │
     │←── JSON response as-is ─────────────│←── JSON response ──────────────│
```

### Что делаем

#### 1. Добавить секрет `EDGE_FUNCTION_SECRET` в Lovable Cloud

Сгенерирую криптографически случайную строку длиной 48 символов (hex). Покажу вам точное значение после создания, чтобы вы вставили его в `.env` на сервере.

#### 2. Создать `supabase/functions/llm-proxy/index.ts`

Edge Function со следующей логикой:
- **OPTIONS** → CORS headers, 200
- **POST** → проверка `Authorization: Bearer <EDGE_FUNCTION_SECRET>` → 401 если нет/не совпадает
- Проверка размера body ≤ 50KB → 413
- Если `stream: true` в body → 400 "Streaming not supported yet"
- Проксирование body as-is в `https://ai.gateway.lovable.dev/v1/chat/completions` с `LOVABLE_API_KEY`
- Ответ Gateway возвращается as-is (никаких обёрток `{success, data}`)
- Ошибка Gateway → 502 с коротким сообщением без утечки секретов
- Логирование: только статус, размер запроса, duration. Без payload/messages
- CORS headers на всех ответах

#### 3. Изменить `owndev-backend/src/services/SiteCheckPipeline.ts`

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
  // Fallback: direct gateway (local dev only)
  return {
    url: 'https://ai.gateway.lovable.dev/v1/chat/completions',
    authHeader: `Bearer ${process.env.LOVABLE_API_KEY || apiKey}`,
    defaultModel: 'google/gemini-2.5-flash',
  };
}
```

Больше ничего в файле не трогаем. `llmCall`, `llmToolCall`, промпты, типы, Basic/Full — всё остаётся.

#### 4. Обновить `owndev-backend/.env.example`

Убрать `LOVABLE_API_KEY`, добавить:
```
EDGE_FUNCTION_URL=https://chrsibijgyihualqlabm.supabase.co/functions/v1/llm-proxy
EDGE_FUNCTION_SECRET=<значение>
```

### Что НЕ меняем

- `llmCall` / `llmToolCall` — формат запросов OpenAI-compatible
- `SiteCheckWorker.ts`
- Basic/Full режимы, промпты, типы
- Фронтенд
- Другие Edge Functions

### Тестирование после деплоя

A. `curl` с правильным Bearer → 200 + JSON choices  
B. `curl` без секрета → 401  
C. Запрос > 50KB → 413  
D. Запрос с `stream: true` → 400  

### Что вы получите после

- Точное значение `EDGE_FUNCTION_SECRET` (длинная случайная строка)
- Точный `EDGE_FUNCTION_URL`
- Инструкцию: вставить 2 строки в `.env`, `git pull && npm run build && pm2 restart owndev-backend`

