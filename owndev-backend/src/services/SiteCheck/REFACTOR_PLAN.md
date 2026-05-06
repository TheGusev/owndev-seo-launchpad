# SiteCheckPipeline Refactor Plan

**Цель:** превратить монолит `SiteCheckPipeline.ts` (2350 строк) в модульный пакет, где каждый аудитор / extractor / scorer лежит в собственном файле. **Публичный API не меняется** — `runPipeline` и все типы продолжают экспортироваться из `services/SiteCheck/index.ts`.

## Зачем

1. Каждый под-аудитор (`technicalAudit`, `contentAudit`, `directAudit`, `schemaAudit`, `aiAudit`, `competitorAnalysis`) переиспользуется напрямую в Audit Mode v2 (`crawl-engine/gap-analyzer.ts`). Сейчас они закрытые `function`-ы внутри файла.
2. Тестировать 250-строчный модуль на порядок проще, чем 2350-строчный.
3. Когда AI-кодер из Lovable/Cursor работает с этими файлами через MODULE 9 super-prompt, ему не нужно держать 2350 строк в контексте.

## Целевая структура

```
services/SiteCheck/
├── index.ts                       # public re-exports (runPipeline, types)
├── types.ts                       # все Issue / Stage0Data / RobotsData / ...
├── pipeline.ts                    # runPipeline orchestrator (~250 строк)
├── audits/
│   ├── technical.ts               # technicalAudit
│   ├── content.ts                 # contentAudit
│   ├── direct.ts                  # directAudit + DirectCheck
│   ├── schema.ts                  # schemaAudit + buildSchemaBreakdown
│   ├── ai.ts                      # aiAudit + detectLlmFailuresFromHtml
│   └── competitor.ts              # competitorAnalysis
├── extractors/
│   ├── stage0.ts                  # extractStage0, traceRedirects
│   ├── robots.ts                  # analyzeRobots, parseRobotsDisallowForAll
│   ├── sitemap.ts                 # analyzeSitemap
│   ├── llms.ts                    # analyzeLlmsTxt
│   ├── resources.ts               # analyzeResources
│   ├── geoSignals.ts              # analyzeGeoSignals
│   ├── cro.ts                     # analyzeCRO
│   ├── seo.ts                     # extractSeoData, detectSeoFailuresFromHtml
│   └── benchmark.ts               # calcBenchmark
├── scoring/
│   ├── weighted.ts                # calcScoresWeighted
│   ├── geo.ts                     # calcGeoScore
│   ├── seo.ts                     # calcSeoScore
│   └── cro.ts                     # calcCroScore
├── utils/
│   ├── http.ts                    # fetchWithTimeout, fetchText, checkUrl
│   ├── spa.ts                     # isSpaPage, fetchRenderedContent (Jina)
│   ├── html.ts                    # buildEnrichedHtml, safeParseJson
│   └── issueFactory.ts            # createIssueFactory, MakeIssueFn
└── llm/
    ├── client.ts                  # llmCall, llmToolCall, getLlmConfig
    └── theme.ts                   # detectTheme

```

## Порядок переноса (по одному коммиту на шаг — зелёный билд после каждого)

### Шаг 1. Извлечь все типы (низкий риск)
- Создать `types.ts`, перенести Issue / Stage0Data / RobotsData / SitemapData / LlmsTxtData / ResourcesData / GeoSignalsData / CROData / BenchmarkData / BenchmarkGap / RedirectHop / DirectCheck / CriterionResult / DbRule / PipelineResult.
- В `SiteCheckPipeline.ts` заменить локальные `interface` на `import { ... } from './SiteCheck/types.js'`.
- В `SiteCheck/index.ts` поменять источник типов с `../SiteCheckPipeline.js` на `./types.js`.
- **Проверка:** `npm run build` без ошибок.

### Шаг 2. Извлечь utils (низкий риск, чистые функции)
- `utils/http.ts`: fetchWithTimeout, fetchText, checkUrl.
- `utils/html.ts`: buildEnrichedHtml, safeParseJson.
- `utils/spa.ts`: isSpaPage, fetchRenderedContent.
- `utils/issueFactory.ts`: createIssueFactory, MakeIssueFn.
- В монолите заменить определения на импорты.

### Шаг 3. Извлечь LLM клиент
- `llm/client.ts`: getLlmConfig, llmCall, llmToolCall.
- `llm/theme.ts`: detectTheme.

### Шаг 4. Извлечь extractors
По одному файлу за коммит: stage0 → robots → sitemap → llms → resources → geoSignals → cro → seo → benchmark.

### Шаг 5. Извлечь scoring
weighted → geo → seo → cro.

### Шаг 6. Извлечь audits
technical → content → direct → schema → ai → competitor. Все они принимают `makeIssue: MakeIssueFn` и работают над `html: string`. Это самые «толстые» функции (technicalAudit ~180 строк, directAudit ~155 строк, aiAudit ~75 строк), но изоляция упрощается тем, что они не вызывают друг друга.

### Шаг 7. Превратить SiteCheckPipeline.ts → pipeline.ts
- В `runPipeline` остаётся только orchestration: вызов extractors → audits → scoring → сборка PipelineResult.
- Старый `SiteCheckPipeline.ts` либо удаляется (с правкой `index.ts`), либо превращается в re-export shim для обратной совместимости.

## Тесты обратной совместимости

После каждого шага запустить:
```bash
cd owndev-backend
npm run build              # tsc должен пройти
npx tsx --no-warnings -e "import('./src/services/SiteCheck/index.ts').then(m => console.log(Object.keys(m)))"
```

Минимально все эти ключи должны экспортироваться из `index.ts`:
- runPipeline, PipelineResult, Issue, Stage0Data, RobotsData, SitemapData, LlmsTxtData, ResourcesData, GeoSignalsData, CROData, BenchmarkData, BenchmarkGap, RedirectHop.

## Что важно не сделать

- Не менять сигнатуру `runPipeline()`. SiteCheckWorker зовёт его как `runPipeline({ url, parsedUrl, scanId, dbRules, apiKey })` — этот контракт инвариант.
- Не менять структуру `PipelineResult`. Frontend (ScoreCards, IssueCard) и БД (`site_check_scans.result` JSONB) на неё завязаны.
- Не менять веса `OVERALL_WEIGHTS`. CHANGELOG явно фиксирует их в v0.1: `seo:0.30, ai:0.30, schema:0.15, direct:0.25` (или какие там фактически в `calcScoresWeighted`).
