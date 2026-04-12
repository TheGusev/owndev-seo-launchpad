

## Починка GEO-аудита + GEO-рейтинга + ошибок сборки

### Найденные проблемы

**Ошибки сборки (7 штук):**

1. **Edge Functions** — 6 функций используют `error.message` где `error` имеет тип `unknown`. Нужно `(error as Error).message`.
2. **`AutoFixGenerator.tsx`** — использует `size="xs"`, но Button не имеет такого варианта. Нужно `size="sm"`.
3. **`AutoFixGenerator.tsx`** — интерфейс `AutoFixGeneratorProps` ожидает `templateKey` + `generated`, но вызывается с `issueTitle` + `url`. Нужно обновить интерфейс.
4. **`TechPassport.tsx`** — импортирует из `@/types/site-check`, которого не существует. Нужно определить тип inline.
5. **`SiteCheckResult.tsx`** — передаёт `data={techPassport}` в TechPassport, а тот ожидает `tech` + `geoip`.

**Функциональные проблемы:**

6. **SiteCheckPipeline.ts** — LLM-вызовы идут на `ai.gateway.lovable.dev` с `LOVABLE_API_KEY`. На продакшн-сервере этот ключ не работает. Нужно заменить на `https://api.openai.com/v1/chat/completions` + `OPENAI_API_KEY`.
7. **SiteCheckWorker.ts** — читает `LOVABLE_API_KEY`, нужно `OPENAI_API_KEY`.
8. **Модели** — используются `google/gemini-*` алиасы, которых нет в OpenAI. Нужно заменить на `gpt-4o-mini`.

---

### План изменений

#### 1. `owndev-backend/src/services/SiteCheckPipeline.ts`
- Заменить `https://ai.gateway.lovable.dev/v1/chat/completions` → `https://api.openai.com/v1/chat/completions` (2 вхождения)
- Заменить все модели `google/gemini-2.5-flash-lite` и `google/gemini-2.5-flash` → `gpt-4o-mini`
- Добавить логирование HTTP-статуса и тела ответа при ошибке LLM

#### 2. `owndev-backend/src/workers/SiteCheckWorker.ts`
- `LOVABLE_API_KEY` → `OPENAI_API_KEY`

#### 3. `src/components/site-check/AutoFixGenerator.tsx`
- Обновить интерфейс: `templateKey` → `issueTitle: string; url: string; pageTitle?: string; pageDescription?: string`
- `size="xs"` → `size="sm"`

#### 4. `src/components/site-check/TechPassport.tsx`
- Убрать импорт `@/types/site-check`, определить тип `TechPassportData` inline
- Обновить интерфейс: добавить проп `data` который разворачивается в `tech` + `geoip`

#### 5. `src/pages/SiteCheckResult.tsx`
- Исправить передачу пропсов в `<TechPassport>`: `data={techPassport}` → прокидывать как ожидает компонент

#### 6. Edge Functions (6 файлов) — исправить `error.message` → `(error as Error).message`:
- `check-indexation/index.ts`
- `generate-text/index.ts`
- `generate-semantic-core/index.ts`
- `competitor-analysis/index.ts`
- `send-telegram/index.ts`
- `seo-audit/index.ts`

---

### Как проверить

1. **Сборка** — все TS-ошибки исчезнут
2. **GEO-аудит** — запустить проверку сайта, прогресс должен дойти до 100%, LLM-поля (theme, keywords, competitors, minus_words) должны быть заполнены
3. **GEO-рейтинг** — страница /geo-rating должна отображать таблицу с данными

