

## План: Перенос всех инструментов /tools с Supabase Edge Functions на Node.js backend

### Что будет сделано

**Backend (owndev-backend)**
1. **Создать `owndev-backend/src/api/routes/tools.ts`** — Fastify роутер с 11 endpoints:
   - `/tools/seo-audit` — OpenAI анализ
   - `/tools/check-indexation` — fetch + robots.txt
   - `/tools/generate-semantic-core` — OpenAI
   - `/tools/generate-text` — OpenAI
   - `/tools/generate-content-brief` — OpenAI
   - `/tools/check-internal-links` — fetch + parse HTML
   - `/tools/competitor-analysis` — OpenAI
   - `/tools/brand-tracker` — OpenAI
   - `/tools/generate-autofix` — OpenAI
   - `/tools/generate-geo-content` — OpenAI
   - `/tools/send-telegram` — прямой вызов Telegram Bot API
2. **Зарегистрировать роутер в `owndev-backend/src/api/server.ts`** — `app.register(toolsRoutes, { prefix: '/api/v1' })`.

**Frontend**
3. **Полностью переписать `src/lib/api/tools.ts`** — убрать `supabase.functions.invoke`, заменить на `fetch(apiUrl('/tools/...'))` через `apiHeaders()` из `config.ts`. Сохранить публичные сигнатуры функций (`auditSite`, `checkIndexation`, `generateSemanticCore`, `generateText`, `generateContentBrief`, `checkInternalLinks`, `analyzeCompetitors`, `trackBrand`, `generateAutofix`, `generateGeoContent`, `sendTelegram`, `judgeLlm`, `getTechPassport`, `ensureProtocol`), чтобы не сломать вызовы из 11 компонентов в `src/components/tools/*` и `src/components/site-check/*`.

### Что НЕ трогаю
- Supabase edge functions в `supabase/functions/*` — оставляю на диске (можно удалить отдельным промтом). Frontend на них больше не ссылается.
- `judgeLlm` и `getTechPassport` — уже идут на Node backend через `/site-check/...`, оставляю как есть (только переношу из старого файла, если они там были).
- Компоненты в `src/components/tools/*` — публичный API сохранён, изменений не требуется.

### Проверки
- Прочитаю `src/lib/api/tools.ts` и `src/lib/api/config.ts` → убедиться в актуальных сигнатурах и хелперах.
- Прочитаю `owndev-backend/src/api/server.ts` → найти место регистрации роутов.
- Грепом по `src/components/tools/` сверю, какие функции реально используются (нельзя случайно удалить экспорт).
- После правок: `tsc --noEmit` для frontend (для backend — TS ошибки в sandbox ожидаемы из-за отсутствия `node_modules`, но синтаксис проверю).
- Греп `supabase` в `src/lib/api/tools.ts` после правки → должен быть пустым.

### Риски
- Если в старом `tools.ts` есть экспорты, не упомянутые в новом коде (например, какие-нибудь утилиты), компоненты сломаются. Минимизирую через греп перед перезаписью.
- `apiHeaders()` уже добавляет `Content-Type` — учту, чтобы не дублировать (в текущем `config.ts` Content-Type ставится только при наличии body — проверю и адаптирую).

### Формат финального ответа
Короткое summary в `<final-text>` + предложения для тестирования.

