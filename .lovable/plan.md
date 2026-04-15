

## Root-cause analysis и план фикса

### A. Root cause по каждому блоку

---

### 1. ИНСТРУМЕНТЫ — НЕ РАБОТАЮТ (Not Found)

**Причина:** `tools.ts` вызывает `post("/tools/check-indexation", ...)`, `post("/site-check/audit", ...)` и т.д. Функция `post()` использует `apiUrl(path)` → `/api/v1/tools/check-indexation`. 

На Node backend (server.ts) зарегистрированы только:
- `healthRoutes` (без prefix)
- `auditRoutes` (routes сами регистрируют `/api/v1/audit`)
- `monitorRoutes`
- `eventRoutes`
- `siteCheckRoutes` (prefix: `/api/v1/site-check`)

**Нет ни одного `/api/v1/tools/*` route.** Также нет `/api/v1/site-check/audit` route.

Раньше эти инструменты вызывали Supabase Edge Functions напрямую через `supabase.functions.invoke('check-indexation', ...)`. При миграции на Node backend фронтенд был переписан на `tools.ts` с новыми URL, но **backend routes для этих инструментов никогда не были созданы.**

Edge Functions по-прежнему существуют в `supabase/functions/` и деплоятся. Они полностью рабочие.

| Инструмент | Вызывает сейчас (tools.ts) | Реальный endpoint | Edge Function |
|---|---|---|---|
| SEOAuditor | `POST /api/v1/site-check/audit` | НЕТ | `seo-audit` ✅ |
| IndexationChecker | `POST /api/v1/tools/check-indexation` | НЕТ | `check-indexation` ✅ |
| CompetitorAnalysis | `POST /api/v1/tools/competitors` | НЕТ | `competitor-analysis` ✅ |
| BrandTracker | `POST /api/v1/tools/brand-tracker` | НЕТ | `brand-tracker` ✅ |
| ContentBriefGenerator | `POST /api/v1/tools/content-brief` | НЕТ | `generate-content-brief` ✅ |
| SemanticCoreGenerator | `POST /api/v1/tools/semantic-core` | НЕТ | `generate-semantic-core` ✅ |
| AITextGenerator | `POST /api/v1/tools/generate-text` | НЕТ | `generate-text` ✅ |
| InternalLinksChecker | `POST /api/v1/tools/internal-links` | НЕТ | `check-internal-links` ✅ |
| PSEOGenerator | `POST /api/v1/tools/geo-content` | НЕТ | `generate-geo-content` ✅ |

**Фикс:** Вернуть вызовы Edge Functions напрямую. В `tools.ts` заменить `post()` обратно на вызовы через `supabase.functions.invoke()`, как было раньше. Edge Functions живы и задеплоены — нужно просто восстановить транспорт.

**Файл:** `src/lib/api/tools.ts` — переписать каждую функцию на `supabase.functions.invoke(...)`.
**Импорт:** добавить `import { supabase } from "@/integrations/supabase/client"`.

Пример:
```ts
export async function checkIndexation(url: string) {
  const { data, error } = await supabase.functions.invoke('check-indexation', {
    body: { url },
  });
  if (error) throw new Error(error.message);
  return data;
}
```

**Не трогать:** config.ts, scan.ts, server.ts, siteCheck.ts.

---

### 2. "КАК РАССЧИТАНО?" — пустая детализация

**Причина (цепочка данных):**

1. `SiteCheckPipeline.ts` строка 281: `computeScores()` возвращает `{ total, seo, direct, schema, ai, breakdown: { seo: seoBreakdown, ai: llmBreakdown } }` — **breakdown есть** (для seo и ai).
2. `SiteCheckWorker.ts` строка 62: сохраняет `scores = ${JSON.stringify(result.scores)}::jsonb` — breakdown сериализуется в JSONB и сохраняется в БД внутри поля `scores`.
3. `siteCheck.ts` строки 195-204: backend возвращает:
```js
scores: {
  total, seo, direct, schema, ai, confidence,
  issues_count,
  blocks: scores?.blocks ?? [],  // ← берёт blocks, НЕ breakdown!
}
```
**`breakdown` не передаётся во фронтенд!** Backend отдаёт `scores.blocks` (которого нет), а `scores.breakdown` отбрасывает.

4. `SiteCheckResult.tsx` строка 113: ищет `rawScores?.breakdown` — его нет в ответе → `breakdown = undefined` → модалка показывает "Детальная разбивка недоступна".

**Фикс:** В `siteCheck.ts` (backend) строка 203 — добавить `breakdown` в объект `scores`:

```js
scores: {
  total: totalScore,
  seo: scores?.seo ?? null,
  direct: scores?.direct ?? null,
  schema: scores?.schema ?? null,
  ai: scores?.ai ?? null,
  confidence: scores?.confidence ?? null,
  issues_count: scores?.issues_count ?? issues.length ?? null,
  breakdown: scores?.breakdown ?? null,   // ← ДОБАВИТЬ
},
```

Фронтенд (`SiteCheckResult.tsx`, строка 113) уже корректно читает `rawScores?.breakdown` — работает без изменений.

**Файл:** `owndev-backend/src/api/routes/siteCheck.ts` — одна строка.
**Не трогать:** ScoreDetailsModal, ScoreCards, SiteCheckResult.tsx, SiteCheckPipeline.

---

### 3. ПОВТОРНЫЙ СКАН — СТАРЫЕ ДАННЫЕ

**Причина:** `siteCheck.ts` строки 96-116:

```js
// Check cache
const today = new Date().toISOString().slice(0, 10);
const cached = await sql`
  SELECT id FROM site_check_scans
  WHERE url LIKE ${'%' + hostname + '%'}
    AND status = 'done'
    AND created_at::date = ${today}::date
  ORDER BY created_at DESC LIMIT 1
`;
if (cached[0]) {
  return reply.status(429).send({
    error: 'Этот домен уже проверялся сегодня.',
    code: 'CONCURRENCY_LIMIT',
    last_scan_id: cached[0].id,
  });
}
```

Backend **жёстко блокирует** повторный скан того же домена в течение дня, возвращая 429 с `last_scan_id`. Фронт ловит это в `SiteCheck.tsx` строка 106: `if (e.lastScanId) { setLimitScanId(e.lastScanId); }` — и перенаправляет на старый результат.

Это не баг кэша React-query и не polling проблема. Это **явное бизнес-правило backend**: один скан на домен в сутки.

Проблема: пользователь исправил сайт и хочет перепроверить, но получает вчерашний / сегодняшний старый результат. Нет кнопки/опции "принудительная проверка".

**Фикс (минимальный):** Добавить параметр `force: true` в `POST /start`:
- Если `force === true` — пропустить проверку кэша, создать новый скан.
- На фронте (`SiteCheck.tsx`): когда backend возвращает 429 с `last_scan_id`, показывать кнопку "Перепроверить принудительно" рядом со ссылкой на старый результат. Эта кнопка вызывает `startScan(url, mode, { force: true })`.

**Файлы:**
- `owndev-backend/src/api/routes/siteCheck.ts` — route `/start`: добавить `force` в body, если `force === true` — пропустить cache check.
- `src/lib/api/scan.ts` — `startScan()`: добавить optional param `force?: boolean`.
- `src/pages/SiteCheck.tsx` — UI для кнопки "Перепроверить".

**Не трогать:** SiteCheckWorker, SiteCheckPipeline, GeoRating.

---

### B. Сводка изменений

| Файл | Что менять |
|---|---|
| `src/lib/api/tools.ts` | Вернуть вызовы через `supabase.functions.invoke()` для всех 9 инструментов |
| `owndev-backend/src/api/routes/siteCheck.ts` | Строка 203: добавить `breakdown: scores?.breakdown ?? null` в ответ. Строки 96-116: добавить `force` param для пропуска cache. |
| `src/lib/api/scan.ts` | `startScan`: добавить `force?: boolean` param |
| `src/pages/SiteCheck.tsx` | UI кнопки "Перепроверить принудительно" при 429 |

### Что НЕ менять
- `config.ts`, `server.ts`, `ScoreDetailsModal.tsx`, `ScoreCards.tsx`, `SiteCheckResult.tsx`
- `SiteCheckWorker.ts`, `SiteCheckPipeline.ts`
- `GeoRating.tsx`, `GeoRatingNomination.tsx`, `GeoAudit.tsx`
- Никакие Edge Functions не удалять и не менять

### C. Safe fix plan (порядок)

1. **tools.ts** — вернуть `supabase.functions.invoke()` для 9 инструментов (восстановление рабочего транспорта)
2. **siteCheck.ts (backend)** — добавить `breakdown` в ответ `/result/:scanId` (1 строка)
3. **siteCheck.ts (backend)** — добавить `force` param в `/start` (5-7 строк)
4. **scan.ts** — добавить `force` param в `startScan()` (2 строки)
5. **SiteCheck.tsx** — кнопка "Перепроверить" при 429 (10-15 строк)

Всё — точечные изменения, без рефакторинга, без заглушек.

