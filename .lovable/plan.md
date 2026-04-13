

## Basic / Full режим проверки — разделение pipeline

### Обзор

Разделить скан на два режима: `basic` (быстрый, без LLM-вызовов) и `full` (полный, как сейчас). Backend пропускает LLM-шаги для basic. Frontend показывает PaywallCTA для заблокированных блоков.

### Backend — 3 файла

#### 1. `owndev-backend/src/api/routes/siteCheck.ts`

**a) Колонка `scan_mode`** — добавить в CREATE TABLE и ALTER:
```sql
ALTER TABLE site_check_scans ADD COLUMN IF NOT EXISTS scan_mode TEXT DEFAULT 'basic';
```
Название `scan_mode` вместо `mode` потому что `mode` уже используется (page/site).

**b) POST `/start`** — принимать `scan_mode` из body, дефолт `'basic'`, сохранять в БД и передавать в очередь.

**c) GET `/result/:scanId`** — добавить `scan_mode` в SELECT и в ответ.

**d) Кеш-проверка** — для basic и full считать отдельно (full не блокируется basic-кешем того же домена):
```ts
const cached = await sql`
  SELECT id FROM site_check_scans
  WHERE url LIKE ${'%' + hostname + '%'}
    AND status = 'done'
    AND scan_mode = ${scan_mode}
    AND created_at::date = ${today}::date
  ORDER BY created_at DESC LIMIT 1
`;
```

#### 2. `owndev-backend/src/services/SiteCheckPipeline.ts`

**a) `runPipeline` получает `scan_mode`** — добавить параметр. Если `scan_mode === 'basic'`:
- Пропустить `detectTheme` LLM-вызов (вернуть 'Общая тематика')
- Пропустить `competitorAnalysis` (вернуть пустой результат)
- Пропустить `extractKeywords` (вернуть `[]`)
- Пропустить `generateMinusWords` (вернуть `[]`)
- Пропустить `generateDirectAd` (вернуть `null`)
- НЕ пропускать: HTML-краулинг, technicalAudit, contentAudit, directAudit, schemaAudit, aiAudit, calcScores, extractSeoData

**b) Конкретная реализация** — обернуть LLM-шаги в условия:
```ts
const theme = scanMode === 'basic' ? 'Общая тематика' : await detectTheme(html, url, apiKey);
// ...
const compResult = scanMode === 'basic'
  ? { competitors: [], gap_issues: [], directMeta: null, comparisonTable: null }
  : await competitorAnalysis(...);
const keywords = scanMode === 'basic' ? [] : await extractKeywords(...);
const minusWords = scanMode === 'basic' ? [] : await generateMinusWords(...);
const adSuggestionPromise = scanMode === 'basic' ? Promise.resolve(null) : generateDirectAd(...);
```

#### 3. `owndev-backend/src/workers/SiteCheckWorker.ts`

Передать `job.data.scan_mode` в `runPipeline`.

### Frontend — 5 файлов

#### 4. `src/lib/api/scan.ts`

`startScan` — принимать `scanMode?: 'basic' | 'full'`, передавать в body как `scan_mode`.

#### 5. `src/components/site-check/ScanForm.tsx`

Две кнопки вместо одной:
- "Быстрая проверка" (secondary) → `onSubmit(url, "site", "basic")`
- "Полный GEO-аудит" (hero/primary) → `onSubmit(url, "site", "full")`
  с подписью: "Ключевые слова, конкуренты, Яндекс.Директ"

Обновить `ScanFormProps.onSubmit` сигнатуру: добавить `scanMode`.

#### 6. `src/pages/SiteCheck.tsx`

Передать `scanMode` из ScanForm → `startScan(url, mode, scanMode)`. Поддержать `?mode=full` из query params.

#### 7. `src/components/site-check/PaywallCTA.tsx`

Полностью переработать — новый "locked" блок:
- Props: `title: string`, `features: string[]`, `onUnlock: () => void`
- Визуал: dashed border, Lock иконка, заголовок, 3 фичи, кнопка "Запустить полный аудит", подпись "Бесплатно · 30-60 сек"

#### 8. `src/pages/SiteCheckResult.tsx`

**a) Читать `data.scan_mode`**, определить `isBasic = data.scan_mode === 'basic'`

**b) Badge режима** в шапке:
- basic → серый Badge "Базовый"
- full → зелёный Badge "Полный"

**c) PaywallCTA** для заблокированных блоков (когда `isBasic` И данные пустые):
- Keywords → PaywallCTA с title "Ключевые слова" и 3 фичами
- MinusWords → PaywallCTA
- Competitors → PaywallCTA
- DirectAd → PaywallCTA
- LlmJudge → не вызывать `triggerLlmJudge` при basic, показать PaywallCTA

**d) `onUnlock`** — `navigate(\`/tools/site-check?url=${data.url}&mode=full\`)`

**e) Убрать raw-fallback блоки** — заменить на PaywallCTA для basic.

#### 9. `src/components/site-check/DownloadButtons.tsx`

Принять проп `isBasic?: boolean`. Если basic — кнопки PDF/Word/CSV заблокированы (disabled + тултип). llms.txt — доступен всегда.

### Не меняем
- Логику scores/issues — работают в обоих режимах
- GeoRating auto-upsert в worker — работает в обоих режимах
- Tech passport — работает в обоих режимах (не LLM)
- Типы IssueCard, KeywordEntry, MinusWord
- Существующие API-контракты (только добавляем поле `scan_mode`)

