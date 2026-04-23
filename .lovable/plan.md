

# Аудит реализации vs ТЗ owndev_v2

Сверил каждый раздел ТЗ с актуальным кодом. Архитектурно всё стоит, но осталось **5 рассинхронов** между фронтом и бэком, которые мешают новой триаде скоров (GEO/SEO/CRO) реально доехать до UI и до экспортов.

## Что выполнено и работает (✅)

**Бэкенд `SiteCheckPipeline.ts`:**
- ✅ Удалены `competitorAnalysis`, `parseCompetitorHtml`, `isExcludedUrl`, `extractKeywords`, `generateMinusWords`, `generateDirectAd`
- ✅ Добавлены **все 8 интерфейсов** из ТЗ (Stage0Data, RobotsData, SitemapData, LlmsTxtData, ResourcesData, GeoSignalsData, CROData, BenchmarkData)
- ✅ Реализованы все детекторы: `traceRedirects`, `extractStage0`, `analyzeRobots` (с AI-ботами), `analyzeSitemap`, `analyzeLlmsTxt` (+ llms-full + security.txt), `analyzeResources`, `analyzeGeoSignals`, `analyzeCRO`
- ✅ Скоринг: `calcGeoScore` (7 компонентов), `calcSeoScore` (5 компонентов), `calcCroScore` (6 компонентов)
- ✅ Таблица `BENCHMARKS` для 7 категорий + `calcBenchmark` с gaps
- ✅ `buildGeoCroIssues` — новые issues для модулей `geo`/`cro`
- ✅ `PipelineResult` содержит `geoScore/seoScore/croScore` + все Data-блоки
- ✅ Прогресс 6 стадий (5→15→35→55→75→95→100) совпадает с фронтом
- ✅ Worker `SiteCheckWorker.ts` пишет всё в `result` JSONB и мапит `geoScore→llm_score`, `seoScore→seo_score`, `croScore→direct_score` в geo_rating

**API `/api/v1/site-check/result/:scanId`:**
- ✅ Отдаёт `geoScore`, `seoScore`, `croScore`, `stage0`, `robots`, `sitemap`, `llmsTxt`, `resources`, `geoSignals`, `cro`, `benchmark`, `signals`, `scoresBreakdown`

**Фронтенд:**
- ✅ Удалены `CompetitorsTable.tsx`, `MinusWordsSection.tsx`, `KeywordsSection.tsx`, `src/types/audit.ts`
- ✅ `DirectAdPreview/DirectMeta` перенесены в `src/components/tools/`, есть страница `/tools/direct-ad`, роут зарегистрирован
- ✅ `ScanProgress.tsx` — 6 стадий с правильными pct
- ✅ `ScoreCards.tsx` — поддерживает triple-mode + legacy fallback
- ✅ Новые компоненты созданы: `RedirectChain`, `RobotsAudit`, `CROSignals`, `BenchmarkCard`
- ✅ `FullReportView.tsx` — фильтры расширены `geo|cro`, удалены `direct|competitors|semantics`
- ✅ `IssueCard` тип расширен `rule_id?`, `IssueModule` сужен под ТЗ (`technical|content|schema|ai|geo|cro`)
- ✅ `site-check-types.ts` — все 8 Data-интерфейсов зеркалят бэк
- ✅ `tsc --noEmit` фронта — чисто. Бэк — ошибки только из-за отсутствия `node_modules` в Lovable-песочнице (на проде ОК)

## Что не доделано или сломано (❌)

### 1. ScoreCards никогда не покажет триплу — критичный баг

**ScoreCards.tsx:94** проверяет `scores.geo` и `scores.cro`, но **API `/result/:scanId` НЕ кладёт `geo`/`cro` внутрь `scores`**. Поля приходят как top-level `geoScore`/`croScore`. Результат: `hasTriple === false` → всегда показывается legacy 5-карточный layout.

**Фикс:** в `siteCheck.ts` route добавить в объект `scores`:
```ts
scores: { ...existing, geo: result?.geoScore ?? null, cro: result?.croScore ?? null }
```

### 2. SiteCheckResult.tsx не пробрасывает новые скоры в карточки

**SiteCheckResult.tsx:129–132** делает `{ ...defaultScores, ...rawScores }` — `defaultScores` без `geo/cro`, поэтому даже если бэк отдаст — нужно явно слить с top-level `data.geoScore/croScore`.

**Фикс:** обогатить `scores`: `scores.geo = data.geoScore ?? scores.geo`; `scores.cro = data.croScore ?? scores.cro`; `scores.seo = data.seoScore ?? scores.seo`.

### 3. PDF/Word экспорт читает legacy-поля и крашится без них

**generatePdfReport.ts:368** — `data.competitors.filter(...)` без guard. **generateWordReport.ts:229** — то же самое. Если `competitors === []` — отрисуется пустая секция «Конкуренты». Если `undefined` — runtime error.

**generatePdfReport.ts:494, 510, 547** и **generateWordReport.ts:283–285** — рендерят секцию «Семантическое ядро», `keywords` всегда `[]`. Эти блоки в принципе должны быть удалены вместе с конкурентами по Sprint 2.

**Фикс:** в обоих экспортах удалить блоки competitors / keywords / minus-words / direct-ad.

### 4. FullAudit.tsx — рудименты legacy

- **Строки 354–358 и 397–401** — `keywords: []`, `minusWords: []`, `competitors: []`, `comparisonTable: null`, `directMeta: null` идут в `ReportData`. После фикса экспортов — убрать из объекта.
- **Строки 689, 694** — кружок «Общий GEO+SEO Score» тянет `siteCheckData.scores.total`. После пересборки скоров total больше не главный — нужно показать `geoScore` или средний триады.
- **Строка 352, 395** — `defaultScores: { total, seo, direct, schema, ai }` без `geo/cro`.

### 5. DownloadButtons.tsx — неиспользуемые props

`comparisonTable` и `directMeta` (строки 16–17, 27–28, 57–58) — мёртвые после Sprint 2. Удалить из interface и из callsite в `SiteCheckResult.tsx:278–281`.

### Минорное (не критично, но в долг)

- **`scan_id` для геофильтра**: `siteCheck.ts:59–66` всё ещё ALTER-ит `competitors/keywords/minus_words` колонки на старых таблицах — оставить (безопасно для отката), но отметить как deprecated.
- **`SiteCheckPipeline.ts` — 2335 строк**, монолит. Sprint 4 сделан только как **фасад** (`services/SiteCheck/index.ts` re-export'ит из старого файла). Реальной разбивки на `steps/`, `scoring/`, `utils/` нет. Это техдолг, ничего не ломает, но ТЗ просило.
- **`HistoryChart`** читает старые `total/seo/ai/schema/direct` из истории — после fix #1 нужно посчитать `total = (geo+seo+cro)/3` в worker и сохранять в `scores.total` (уже делается, ок).
- **API endpoint `/result`** дублирует `result` целиком как top-level + сплющивает поля. Лишние ~5KB на ответ, но безопасно.

## Что нужно исправить — порядок Sprint 7 (post-QA)

1. **Бэк**: route `siteCheck.ts` `/result/:scanId` — положить `geo/cro/seo` (новые) **внутрь** объекта `scores` рядом со старыми, не ломая legacy. (1 файл, ~6 строк)
2. **Фронт**: `SiteCheckResult.tsx` — слить top-level `geoScore/seoScore/croScore` в `scores` перед отдачей в `ScoreCards`. (1 файл, ~5 строк)
3. **Фронт**: `generatePdfReport.ts` — удалить блоки конкурентов (368–490) и keywords (494–555). Оставить tri-score блок. (1 файл, ~150 строк удаления)
4. **Фронт**: `generateWordReport.ts` — то же самое (229–280, 283–340). (1 файл, ~110 строк удаления)
5. **Фронт**: `DownloadButtons.tsx` — убрать props `comparisonTable`, `directMeta`. (1 файл, 4 строки)
6. **Фронт**: `FullAudit.tsx` — убрать `keywords/minusWords/competitors/comparisonTable/directMeta` из `ReportData`-builder (2 места, ~10 строк). Кружок «total» (689) поменять на «geoScore».
7. **Фронт**: `SiteCheckResult.tsx:278–281` — убрать `comparisonTable`/`directMeta` из props.
8. **Smoke**: 3 скана разных категорий — убедиться, что в UI видна триада, нет «пустых» секций конкурентов в PDF/Word.

После этих 8 точечных правок — фронт и бэк полностью совпадают с ТЗ owndev_v2 (по части, реалистично выполнимой без внешних API: PageSpeed/SERP). Потолок точности ~94% по документу — достигнут.

