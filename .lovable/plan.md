

## Исправление сломанных API-вызовов на фронте

### Проблема

В `SiteCheckResult.tsx` два вызова — **LLM Judge** и **Tech Passport** — используют хардкоженные URL напрямую к Supabase Edge Functions, минуя единый API-слой. Это единственные места с прямыми `fetch` к `supabase.co/functions` (кроме `config.ts` и `MCPServerDocs`, которые корректны).

### Что сломано

| Вызов | Строка | Проблема |
|-------|--------|----------|
| `llm-judge` | SiteCheckResult.tsx:62 | Прямой fetch к Supabase вместо `invokeFunction()` |
| `tech-passport` | SiteCheckResult.tsx:76 | Прямой fetch к Supabase вместо `invokeFunction()` |

### Решение

1. **`src/lib/api/tools.ts`** — добавить две функции:
   - `judgeLlm(scanId, url, theme?)` → `invokeFunction("llm-judge", { scan_id, url, theme })`
   - `getTechPassport(url)` → `invokeFunction("tech-passport", { url })`

2. **`src/pages/SiteCheckResult.tsx`** — заменить оба хардкоженных fetch на вызовы новых функций из API-слоя. Убрать ручное построение URL и headers.

### Что НЕ трогаем

- Backend, роуты, воркеры — 0 изменений
- `MCPServerDocs.tsx` — это документация/конфиг для пользователя, не API-вызов
- Остальные инструменты — уже используют `invokeFunction()`
- UI компоненты `LlmJudgeSection`, `TechPassport` — без изменений

### Объём

~6 строк в tools.ts, ~10 строк замены в SiteCheckResult.tsx.

