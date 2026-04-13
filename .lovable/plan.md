

## Полное удаление OpenAI из бэкенда

### Суть

`LOVABLE_API_KEY` уже настроен в Cloud как secret — он автоматически доступен в Edge Functions. Но ваш Node.js бэкенд — это **не** Edge Function, он работает на вашем сервере. Поэтому `LOVABLE_API_KEY` нужен в `.env` на сервере (одна строка, один раз).

Хорошая новость: код уже на 95% готов. Осталось убрать последние упоминания OpenAI.

### Изменения — 2 файла

#### 1. `owndev-backend/src/services/SiteCheckPipeline.ts` (строки 291-308)

Убрать OpenAI fallback из `getLlmConfig`. Оставить только Lovable:

```typescript
// ─── LLM config (Lovable AI Gateway only) ───
function getLlmConfig(apiKey: string) {
  return {
    url: 'https://ai.gateway.lovable.dev/v1/chat/completions',
    authHeader: `Bearer ${process.env.LOVABLE_API_KEY || apiKey}`,
    defaultModel: 'google/gemini-2.5-flash',
  };
}
```

Удалить строку `const LLM_PROVIDER = ...` и все ветки `if (LLM_PROVIDER === ...)`.

#### 2. `owndev-backend/src/workers/SiteCheckWorker.ts` (строка 13)

Заменить:
```typescript
const API_KEY = process.env.OPENAI_API_KEY || process.env.LOVABLE_API_KEY || '';
```
На:
```typescript
const API_KEY = process.env.LOVABLE_API_KEY || '';
```

#### 3. `owndev-backend/.env.example`

Убрать `OPENAI_API_KEY`, `LLM_PROVIDER`. Оставить:
```
LOVABLE_API_KEY=your_lovable_api_key_here
```

### Что нужно на сервере

Одна переменная в `.env`:
```
LOVABLE_API_KEY=<значение из Lovable Cloud>
```

Чтобы узнать значение ключа: откройте проект в Lovable → Cloud → секция Secrets → скопируйте значение `LOVABLE_API_KEY`.

### Что НЕ меняем
- Промпты, парсинг JSON, типы результатов
- Worker логику записи в БД
- API endpoints
- Frontend
- Edge Functions (у них свой LOVABLE_API_KEY через Cloud)

