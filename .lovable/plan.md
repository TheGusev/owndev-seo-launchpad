

## Полный переход на Lovable API — убираем OpenAI

### Что сейчас

Код уже готов на 95%. В `SiteCheckPipeline.ts` есть `getLlmConfig()` с поддержкой двух провайдеров. Единственное место, где упоминается `OPENAI_API_KEY` — строка 14 в `SiteCheckWorker.ts`:

```ts
const API_KEY = process.env.OPENAI_API_KEY || process.env.LOVABLE_API_KEY || '';
```

### Что делаем — 2 файла

#### 1. `owndev-backend/src/workers/SiteCheckWorker.ts`

Убрать `OPENAI_API_KEY`:
```ts
const API_KEY = process.env.LOVABLE_API_KEY || '';
```

#### 2. `owndev-backend/src/services/SiteCheckPipeline.ts`

Изменить дефолт провайдера с `'openai'` на `'lovable'`:
```ts
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'lovable';
```

Код `getLlmConfig` для `openai` оставляем — на случай если когда-то нужно будет вернуться (переключается через `LLM_PROVIDER=openai` в env).

#### 3. `owndev-backend/.env.example`

Убрать `OPENAI_API_KEY`, оставить:
```
LOVABLE_API_KEY=your_lovable_api_key_here
LLM_PROVIDER=lovable
```

### Итог

На сервере нужно только:
- `LOVABLE_API_KEY` — ключ от Lovable AI Gateway
- `LLM_PROVIDER=lovable` (или вообще не указывать — это дефолт)
- `OPENAI_API_KEY` можно удалить из `.env` на сервере

### Не меняем
- Всю логику `llmCall`, `llmToolCall`, `getLlmConfig` — работает как есть
- Frontend — никаких изменений
- Basic/Full режимы — без изменений
- Pipeline — без изменений (только дефолт провайдера)

