

## Цель

Перестроить Site Check с 5 фейковых скоров (`total/seo/direct/schema/ai`) на 3 честных независимых (`geoScore/seoScore/croScore`). Удалить галлюцинации (конкуренты, LLM-keywords, минус-слова, Direct в аудите). Добавить 20 детерминированных детекторов на сервере. Разбить монолит 1770 строк на 12 модулей. Синхронизировать фронт.

Документ принят как ТЗ. Реализую по спринтам 2→6 (Sprint 1 уже выполнен). Каждый спринт = отдельная итерация с проверкой `tsc --noEmit` и smoke-сканом перед переходом к следующему.

## Sprint 2 — Удаление мусора (1 итерация)

**Бэкенд (`owndev-backend/src/services/SiteCheckPipeline.ts`):**
- Удалить функции: `competitorAnalysis`, `parseCompetitorHtml`, `isExcludedUrl`, `generateDirectAd`, `extractKeywords`, `generateMinusWords`.
- Из `PipelineResult` убрать поля: `competitors`, `keywords`, `minus_words`.
- Убрать stage 4 (конкуренты) и связанные progress callbacks из `runPipeline`.

**Бэкенд (`owndev-backend/src/api/routes/siteCheck.ts`):**
- Убрать поля `competitors`, `keywords`, `minus_words` из ответа `/result/:scanId`.

**Бэкенд (`owndev-backend/src/workers/SiteCheckWorker.ts`):**
- Убрать `competitors`, `keywords`, `minus_words` из SQL upsert и `resultJsonb`.

**БД:** колонки в `site_check_scans` оставляем — это безопаснее для отката, новый код просто их не пишет/читает.

**Фронтенд — удалить файлы:**
- `src/components/site-check/CompetitorsTable.tsx`
- `src/components/site-check/MinusWordsSection.tsx`
- `src/components/site-check/KeywordsSection.tsx`
- `src/types/audit.ts` (legacy)

**Фронтенд — перенести в отдельную страницу:**
- `src/components/site-check/DirectAdPreview.tsx` → `src/components/tools/DirectAdPreview.tsx`
- `src/components/site-check/DirectMeta.tsx` → `src/components/tools/DirectMeta.tsx`
- Создать `src/pages/tools/DirectAd.tsx` + роут `/tools/direct-ad` + добавить в `tools-registry`.

**Фронтенд — удалить ссылки:**
- В `SiteCheckResult.tsx`, `SiteCheckReport.tsx`, `FullAudit.tsx`, `FullReportView.tsx` — убрать импорты и рендер удалённых компонентов и блока «Конкуренты»/«Объявление Директа».

**Проверка:** `tsc --noEmit` (фронт + бэк), один скан `/tools/site-check` → результат рендерится без секций конкурентов/keywords/Директ.

## Sprint 3 — Новые детекторы в бэкенде (1-2 итерации)

Все добавляются ПОКА в существующий монолит `SiteCheckPipeline.ts` (рефакторинг — Sprint 4).

**Stage 0 — Headers + Redirects (новый):**
- `traceRedirects(url, maxHops=5)` через `fetch(redirect:'manual')`.
- `extractHeaders()` → `Stage0Data` (httpStatus, redirectChain, redirectCount, ttfbMs, isHttps, hasHsts, hasCSP, hasXCTO, hasXFO, compression, cacheControl, server, poweredBy).

**Stage 2 — Aux files (расширить существующие):**
- `analyzeRobots()` — парсер по User-agent группам, AI-боты: GPTBot, ClaudeBot, PerplexityBot, GoogleBot, YandexBot, Applebot, anthropic-ai → `RobotsData`.
- `analyzeSitemap()` — XML-парсинг: urlCount, hasLastmod, avgLastmodDaysAgo, oldestPage, newestPage, stalePages, indexSitemapOnly → `SitemapData`.
- `analyzeLlmsTxt()` — quality scoring по llmstxt.org стандарту → `LlmsTxtData`.
- Дополнительно проверить `/llms-full.txt` и `/.well-known/security.txt` (boolean ok).

**Stage 3 — Deep HTML (новые регекспы):**
- `analyzeResources()` → `ResourcesData` (blockingCss/Js, htmlSizeKB, modernImageRatio, lazyImages, fontDisplaySwap, preloadHints).
- `checkAiPermissionsInHtml()` → metaRobots анализ.
- `analyzeGeoSignals()` → `GeoSignalsData` (citationReadyRatio, semanticScore, semanticTags, questionHeadingRatio, readabilityGrade, avgWordsPerSentence, authorityLinks, paragraphCount).
- `analyzeCRO()` → `CROData` (полный набор из ТЗ: trust, CTA, forms, price, social proof, urgency, channels).

**Benchmarks (`benchmarks.ts`):**
- Таблица `BENCHMARKS` по категориям (Сервисы / Магазин / Медиа / Образование / Маркетинг / B2B / Финансы) с полями minWords, minH2, minSchemas, cronLlmsTxt, faqRequired, trustSignals, ctaRequired, priceRequired, eDateRequired, authorRequired.
- Функция `calcBenchmark(category, signals)` → `BenchmarkData` (gaps array).

**Scoring — 3 новых калькулятора:**
- `calcGeoScore(robots, llmsTxt, schemaTypes, geoSignals, eeatSignals)` — 7 компонентов × веса (25+20+15+15+10+10+5).
- `calcSeoScore(stage0, contentSignals, resources, schemaSignals, robots, sitemap)` — 5 компонентов × веса (30+25+20+15+10).
- `calcCroScore(cro)` — 6 компонентов × веса (25+25+15+15+10+10).

**Issues — расширить:**
- Новые модули: `'geo'`, `'cro'` (в дополнение к technical/content/schema/ai).
- Все новые детекторы генерируют issues через существующую `createIssueFactory()`.
- Каждый issue: `id`, `module`, `severity`, `title`, `found`, `location`, `why_it_matters`, `how_to_fix`, `example_fix`, `visible_in_preview`, `impact_score`, `docs_url`, `is_auto_fixable`, опционально `rule_id`.

**Обновить `PipelineResult`:**
- Добавить: `geoScore`, `seoScore`, `croScore`, `stage0`, `robots` (как объект `RobotsData`, не boolean), `sitemap` (как `SitemapData`), `llmsTxt` (как `LlmsTxtData`), `resources`, `geoSignals`, `cro`, `benchmark`.
- Сохранить: `theme`, `is_spa`, `seo_data` (для TechPassport), `signals` (сырые), `issues`, `summary`, `blocks`.

**Обновить `runPipeline`:**
- Стадии: 0→1→2 (parallel)→3→4 (1 LLM)→5 (scoring).
- Прогресс: 5→15→35→55→75→95→100.
- Параметр `includeDirect?: boolean` — опционально оставляет старый `directAudit()` для будущего инструмента `/tools/direct-ad` (по умолчанию `false`).

**SQL миграция:** новая колонка не нужна (все новые поля идут в `result` JSONB), но добавим `scores` и `result.geoScore/seoScore/croScore` через worker.

**SiteCheckWorker.ts:** обновить SQL upsert для `geo_rating` — взять `result.geoScore` вместо `scores.ai`, `result.seoScore` вместо `scores.seo` (mapping старых колонок таблицы `geo_rating` на новые поля).

**Проверка:** `tsc --noEmit` бэкенд → запустить скан 3 разных сайтов (магазин, сервис, медиа) → проверить логи на отсутствие ошибок → API `/result/:scanId` отдаёт все новые поля.

## Sprint 4 — Рефакторинг монолита (1 итерация)

Создать структуру (по аналогии с `services/MarketplaceAudit/` и `services/SiteFormula/`):

```text
owndev-backend/src/services/SiteCheck/
├── types.ts                    (Issue, PipelineResult + 8 Data-интерфейсов)
├── benchmarks.ts               (таблица BENCHMARKS + calcBenchmark)
├── steps/
│   ├── stage0.ts               (fetchWithTimeout, traceRedirects, extractHeaders)
│   ├── stage1_technical.ts     (technicalAudit, contentAudit обновлённые)
│   ├── stage2_auxFiles.ts      (analyzeRobots, analyzeSitemap, analyzeLlmsTxt)
│   ├── stage3_deepHtml.ts      (analyzeResources, checkAiPermissionsInHtml,
│   │                            analyzeGeoSignals, analyzeCRO, schemaAudit)
│   ├── stage4_llm.ts           (detectTheme, aiAudit — 1 LLM-вызов)
│   └── stage5_scoring.ts       (вызов calc* + сборка issues)
├── scoring/
│   ├── geoScore.ts
│   ├── seoScore.ts
│   └── croScore.ts
├── utils/
│   ├── issueFactory.ts         (createIssueFactory из Sprint 1)
│   └── htmlExtractors.ts       (общие regex-хелперы)
└── index.ts                    (runPipeline — оркестратор)
```

**Замена импортов:**
- `SiteCheckWorker.ts`: `import { runPipeline } from '../services/SiteCheck/index.js'`.
- Старый `SiteCheckPipeline.ts` удалить после успешного `tsc --noEmit`.

**Проверка:** `tsc --noEmit` бэкенд → скан с теми же URL что в Sprint 3 → результаты идентичные → удалить старый монолит.

## Sprint 5 — Фронтенд (1-2 итерации)

**Типы (`src/lib/site-check-types.ts`):**
- `IssueModule = "technical" | "content" | "schema" | "ai" | "geo" | "cro"`.
- `ScanScores = { geo: number; seo: number; cro: number }`.
- Добавить экспорт `Stage0Data`, `RobotsData`, `SitemapData`, `LlmsTxtData`, `ResourcesData`, `GeoSignalsData`, `CROData`, `BenchmarkData` (зеркало бэка).
- `IssueCard.impact_score` → `number` (required, sync с бэком).
- Добавить `IssueCard.rule_id?: string`.

**API client (`src/lib/api/scan.ts`):**
- `getFullScan(scanId): Promise<PipelineResult>` — заменить `any` на типизированный возврат.

**ScoreCards.tsx — переделать:**
- Props: `{ geoScore, seoScore, croScore, previousScores? }`.
- 3 карточки в ряд (GEO / SEO / CRO), каждая кликабельна → открывает `ScoreDetailsModal` с breakdown.

**ScoreDetailsModal.tsx — обновить:**
- Поддержка трёх режимов (geo/seo/cro), показ компонентов с весами.

**ScanProgress.tsx — 9→6 стадий:**
- 5% Запуск → 15% Загрузка+Headers → 35% Aux Files → 55% Deep HTML → 75% LLM тема+контент → 95% Scoring → 100% Готово.
- Heartbeat-логика остаётся, но станет менее заметной (скан 15-25с вместо 45-90с).

**TechPassport.tsx:**
- Добавить prop `stage0?: Stage0Data`.
- Новый блок «Производительность»: redirectChain визуализация, compression badge, cacheControl quality, TTFB.

**FullReportView.tsx:**
- Фильтры: добавить `'geo'`, `'cro'`, убрать `'direct'`, `'competitors'`, `'semantics'`.

**Новые компоненты (создать в `src/components/site-check/`):**
- `RobotsAudit.tsx` — таблица AI-ботов из `RobotsData`.
- `LlmsTxtQuality.tsx` — quality score, missingElements, прогресс-бар.
- `ResourcesAudit.tsx` — blockingCss/Js/modernImages с цветовыми индикаторами.
- `GeoSignals.tsx` — citationReadyRatio, semanticScore (radar/bars), readabilityGrade.
- `CROSignals.tsx` — trustScore, CTA presence, formFriction, channels.
- `BenchmarkCard.tsx` — сравнение со стандартом категории (вместо конкурентов).
- `RedirectChain.tsx` — визуализация цепочки `url1 → url2 → url3`.

Все в дизайн-системе проекта (cyan/primary токены, dark theme, никакого хардкода цветов).

**Родительские страницы (`SiteCheckResult.tsx`, `SiteCheckReport.tsx`, `FullAudit.tsx`):**
- Новый порядок секций:
  1. ScoreCards (GEO/SEO/CRO)
  2. TechPassport + RedirectChain
  3. RobotsAudit
  4. LlmsTxtQuality
  5. ResourcesAudit
  6. GeoSignals
  7. CROSignals
  8. BenchmarkCard
  9. LlmJudgeSection (без изменений)
  10. AiBoostSection (без изменений)
  11. HistoryChart (без изменений)
  12. FullReportView (issues list)

**Проверка:** `tsc --noEmit` фронт → ручной обход всех 3 страниц с реальным `scanId` → скриншоты desktop+mobile.

## Sprint 6 — QA (1 итерация)

- Прогон на 10 сайтах разных категорий: магазин (wildberries-like), сервис, медиа (rbc), образование, b2b, финансы, маркетинг.
- Проверить `geoScore/seoScore/croScore` в разумных диапазонах.
- Проверить `BenchmarkCard` показывает реальные gaps.
- Калибровка весов скоринга (если средние скоры выходят за 30-90 — корректировка коэффициентов).
- E2E SSE: подписка на `/events/:scanId` → 6 событий прогресса → `done`.
- Проверить mobile responsive всех новых компонентов.

## Что НЕ меняем (фиксируем явно)

- `IssueCard.tsx` рендер — формат issue совместим.
- `HistoryChart.tsx` — поля совместимы (`total` берём из `(geo+seo+cro)/3` в worker).
- `LlmJudgeSection.tsx`, `AiBoostSection.tsx` — lazy-endpoints не трогаем.
- SSE `/events/:scanId` — механика та же, меняются только labels.
- Redis cache, очереди BullMQ, воркеры (только импорт runPipeline).
- Авторизация (`auth.ts`), rate limit (`rateLimit.ts`).
- БД миграции, RLS, таблица `site_check_scans` (только не пишем удалённые поля).
- `/report/*` эндпоинты, `/llm-judge`, `/ai-boost`.
- Header, Footer, мобильный drawer.
- Все недавние декоративные эффекты (`MatrixRain`, `FloatingCodeSnippets` и т.д.).

## Технический контракт типов (фиксируется в Sprint 3, синхронизируется в Sprint 5)

`PipelineResult` (бэк) ≡ `FullScanResponse` (фронт). Единый источник правды — `services/SiteCheck/types.ts`. Поля строго по документу:

```text
status, url, mode, theme, is_spa,
geoScore, seoScore, croScore,
issues[],
stage0, robots, sitemap, llmsTxt, resources, geoSignals, cro, benchmark,
seo_data, signals, summary?, blocks?
```

## Порядок выполнения по запросу пользователя

После аппрува плана я начинаю **только Sprint 2** (удаление мусора). После проверки `tsc --noEmit` + smoke-теста жду команды «дальше» → Sprint 3 → проверка → Sprint 4 → проверка → Sprint 5 → проверка → Sprint 6.

Это даёт контролируемые точки отката: на любом этапе можно остановиться и сайт продолжит работать с уже применёнными изменениями. Никаких «больших rewrite в одной итерации».

## Риски и митигации

1. **БД совместимость** — таблица `site_check_scans` имеет колонки `competitors`, `keywords`, `minus_words`. Не дропаем, просто перестаём писать. Старые scan_id остаются читаемыми.
2. **`geo_rating` upsert** — текущий маппинг `scores.ai → llm_score, scores.seo → seo_score`. После Sprint 3 маппим: `result.geoScore → llm_score`, `result.seoScore → seo_score`. Старые записи не ломаются.
3. **Кэшированные сканы в Redis** — после Sprint 3 структура ответа меняется. Прогрев кэша через bypass `force=true` на первых сканах после деплоя, либо просто очистка ключей с префиксом site-check.
4. **PDF/Word экспорт** (`generatePdfReport.ts`, `generateWordReport.ts`) — читают `scores.total/seo/direct/schema/ai`. В Sprint 5 обновить на `geoScore/seoScore/croScore` (в плане эти файлы упомянуты в «не трогаем шаблон», но логика чтения скоров требует правки — добавляю в Sprint 5).
5. **SiteCheckBanner.tsx, ScoreBreakdown.tsx, ScoreCards.tsx** — все компоненты, читающие старые скоры, перечислю и обновлю в Sprint 5.

