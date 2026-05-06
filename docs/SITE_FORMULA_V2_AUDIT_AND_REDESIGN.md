# Site Formula V2 — Аудит и редизайн

**Версия:** 1.0
**Дата:** 2026-05-06
**Ветка:** `core-hardening-v2`
**Последний коммит:** `9079b5b feat(v2): Phase 4 — BullMQ workers, Jina SPA fallback, Recovery UI, SiteCheck façade`

> Документ в трёх частях:
> 1. **Хирургический разбор:** что фактически реализовано в Phase 1–4, как это работает, где швы.
> 2. **Честное мнение:** где код решает задачу, а где имитирует решение, и что нужно переделать.
> 3. **Редизайн V2:** новая архитектура из 7 модулей по двум стратегическим документам и Module 9 Super Prompt; план реализации спринтами.

---

## 0. TL;DR

Phase 1–4 — это **хороший каркас, который ещё не делает того, что обещает**. У нас есть:

- 19 типов проектов, 30 JSON-LD шаблонов, репозиторий контрактов в БД;
- BullMQ-инфраструктура с воркерами и зеркалом задач в Postgres;
- Crawl engine (cheerio + Jina SPA fallback), gap-анализ, Recovery, AI Developer Pack как ZIP;
- Preflight Gate ≥ 90 как условие экспорта;
- Frontend на одной странице с шагами pick_type → fill_intake → auditing → building → ready/pack_built.

Но при этом:

- **Wordstat-клиент бьёт по неправильному эндпоинту** и почти не используется в основном пайплайне.
- **Page Contract Generator имитирует контракты** через жёстко вшитую таблицу `TEMPLATE_DEFAULTS` на 27 типов страниц, а не через отдельный модуль с правилами H1≤35 / Title≤60 / FAQ / intro answer.
- **Preflight Gate почти не различает P0/P1/P2** — есть только generic severity → score, без отдельных хард-блоков на canonical, llms.txt, schema graph.
- **Два параллельных скоринга** живут одновременно: SiteCheckPipeline (`SEO/AI/Direct/Schema` веса) и FormulaV2 preflight (severity). Они не сшиты.
- **Нет машиночитаемых артефактов уровня Module 9.** ZIP в AI Pack содержит человекочитаемые JSON, но без жёсткого JSON Schema контракта. У AI-кодера нет валидируемого «договора».
- **Tier B (mobile app) и Tier C (special) даже не начаты** — есть `mobile_app` тип, но без app-specific layers (deep links, app store schema, screen contracts).

V2 нужно собрать заново вокруг **Site Formula Platform = Core + Vertical Intelligence + Demand Data + Page Contracts + Schema Registry + AI/LLM Readiness + Compliance Gate**, а артефакт экспорта сделать **строго типизированным пакетом** (`super_prompt_pack`), пригодным для Lovable / Cursor / v0 без правок.

---

## 1. Хирургический разбор текущего репо

### 1.1 Backend — обзор по модулям

| Модуль | Файлы | LoC | Назначение | Состояние |
|---|---|---|---|---|
| `services/FormulaV2/` | intake, repository, schemaRegistry, llmsGenerator, blueprintBuilder, preflight | ~1050 | Ядро v2: классификация, контракты, JSON-LD, llms/robots/sitemap, preflight | Есть, но плоский — без Page Contract Generator как отдельной фазы |
| `services/Wordstat/` | client, cache, clusterBuilder, types | ~700 | Demand Intelligence | Эндпоинт неверный, методы не совпадают со спецификацией Yandex Cloud Search API |
| `services/CrawlEngine/` | crawler, extractor, pageClassifier, robots, jinaFallback | ~700 | Сбор сайта (cheerio + Jina) | Работает, но ограничен 50 страницами и без приоритизации |
| `services/AuditEngine/` | gapAnalyzer, recoveryBuilder | ~480 | Сравнение crawl vs контракты, recovery plan | Работает, но axis weights `seo:0.5 / geo:0.25 / cro:0.25` не совпадают с целями V2 (SEO≥85, Direct≥90, Schema=100, AI/LLM≥85) |
| `services/AiDeveloperPack/` | superPrompt, packBuilder, checklist | ~350 | Сборка ZIP-пакета | Есть, но super_prompt — это markdown без явной JSON-структуры; нет режимов Full/Structured/Platform-Specific |
| `services/SiteCheckPipeline.ts` | монолит | 2249 | Старый аудит из Edge Function (порт) | Параллельная вселенная, не интегрирован с V2 |
| `services/SiteCheck/` | types.ts, REFACTOR_PLAN.md | ~250 | Façade-обёртка для постепенного распила монолита | Только типы вынесены, шаги 2–7 отложены |
| `workers/FormulaV2Worker.ts` | BullMQ worker | 257 | Запуск build/audit/recovery/wordstat/crawl jobs | Работает, есть зеркало в `formula_jobs` |
| `queue/formulaV2Queues.ts` + `formulaV2Jobs.ts` | очереди + энкью | ~225 | 5 очередей: build, audit, recovery, wordstat, crawl | OK |

### 1.2 Frontend — обзор

- **`pages/SiteFormulaV2.tsx`** (619 строк) — единая SPA-страница с 6 стейджами: `pick_type → fill_intake → auditing → building → ready → pack_built`. Карточки результатов: Audit Results, Preflight Gate, Топ-проблемы, Recovery Plan, AI Developer Pack.
- **`lib/api/formulaV2.ts`** — типы и REST-обёртки (listProjectTypes, runAudit, buildBlueprint, buildRecovery, exportPack, downloadPack).
- Параллельные старые страницы (`SiteFormula.tsx`, `SiteFormulaWizard.tsx`, `SiteFormulaPreview.tsx`, `SiteFormulaReport.tsx`) висят в `pages/` и не удалены — фронт «двоится».

### 1.3 БД — миграции 020–023

| Миграция | Что создаёт |
|---|---|
| `020_formula_v2.sql` | `formula_project_types` (19), `formula_page_contracts`, `formula_schema_templates`, `formula_jobs` |
| `020a_schema_templates_seed.sql` | 30 INSERT-ов: Organization, LocalBusiness, Service, FAQPage, BreadcrumbList, Product, Course, Article, Person, Hotel, MedicalBusiness, ProfessionalService, SoftwareApplication, Restaurant, Event и др. |
| `020b_page_contracts_seed.sql` | Контракты для 19 типов проектов |
| `021_wordstat.sql` | `wordstat_phrase_cache`, `wordstat_clusters` |
| `022_crawl.sql` | `crawl_sessions`, `crawl_pages` |
| `023_audit.sql` | `site_audit_results`, `recovery_blueprints`, `ai_developer_packs` |

Засев есть, схема стройная — это сильная сторона.

### 1.4 Что фактически работает end-to-end

Нажатие «Запустить аудит» в UI:

1. POST `/api/v2/formula/types` → список 19 типов из БД (✓ работает).
2. POST `/api/v2/audit/run` → CrawlEngine (cheerio, до 50 URL) → Jina fallback при SPA → page extraction (title/h1/meta/JSON-LD) → AuditEngine.gapAnalyzer считает overall_score / seo / geo / cro и выдаёт `gaps[]` + `recommendations[]` (✓ работает).
3. POST `/api/v2/formula/build` → BlueprintBuilder.buildBlueprintV2 → классификация → загрузка контрактов из БД → рендер JSON-LD из шаблонов → llms.txt + robots.txt + sitemap.xml → Preflight (✓ работает).
4. POST `/api/v2/audit/recovery` → recoveryBuilder сводит gaps в fixes/schema_patches/content_patches (✓ работает).
5. POST `/api/v2/pack/export` → buildAiDeveloperPack: проверяет preflight ≥ 90, генерирует ZIP с 10–12 артефактами, считает sha256, кладёт BLOB в `ai_developer_packs` (✓ работает).

Это **рабочий минимальный пайплайн**. Главный вопрос — насколько содержание этих шагов соответствует тому, что обещают V2-документы.

---

## 2. Честное мнение — где имитация решения

### 2.1 🔴 Wordstat: неверный эндпоинт + не подключён к Strategy Layer

**Что в коде** (`services/Wordstat/client.ts:83`):

```ts
const SEARCH_API_BASE = 'https://search.api.cloud.yandex.net/v2';
// ...
'/keyword/search'
'/keyword/dynamics'
'/keyword/regions'
```

**Что должно быть** (по `Site-Formula-v2-Glubokii-plan-rasshireniia.docx`):

```
POST https://searchapi.api.cloud.yandex.net/v2/wordstat/topRequests   (1 ед./запрос)
POST https://searchapi.api.cloud.yandex.net/v2/wordstat/getDynamics    (2 ед./запрос)
POST https://searchapi.api.cloud.yandex.net/v2/wordstat/getRegionsDistribution (2 ед./запрос)
GET  https://searchapi.api.cloud.yandex.net/v2/wordstat/getRegionsTree (free)
```

**Хост, путь, имена методов — все три ошибки.** Текущий код никогда не вернёт реальные данные — он всегда упадёт в `mock` ветку через `logger.warn(... falling back to mock)`.

Дополнительно: Wordstat-данные **не передаются** в `BlueprintBuilder` и не влияют ни на priority pages, ни на FAQ, ни на cluster pages — то есть Demand Intelligence существует параллельно и не используется.

**Вывод:** Strategy Layer (модуль 2) не получает данные от Demand Intelligence (модуль 1). Это критический дефект архитектуры, а не баг.

### 2.2 🔴 Page Contract Generator подменён жёсткой таблицей шаблонов

`blueprintBuilder.ts:60-90` — `TEMPLATE_DEFAULTS: Record<page_type, { h1, title, meta, url }>` на 27 page-типов. Это не контракт, а **fallback-словарь**.

Что в новой концепции должно быть на месте:

- H1 ≤ 35 символов (для совместимости с быстрыми ссылками Direct).
- Title ≤ 60 символов.
- Обязательная **intro answer** (40–80 слов прямого ответа в первом параграфе) — для AI-цитируемости.
- FAQ блок с 5+ вопросами.
- Schema graph: для service/geo обязательно `LocalBusiness + Service + FAQPage + BreadcrumbList` в одном `@graph`.
- Обязательные `commercialSignals`: цены, отзывы, гарантии, телефон в hero.

В текущем `formula_page_contracts` есть `required_h1_pattern`, `required_title_pattern`, `min_word_count`, но проверки на 35/60 символов и intro answer **нет ни в БД, ни в preflight**.

### 2.3 🟡 Preflight Gate: ровный severity вместо ярусов P0/P1/P2

`FormulaV2/preflight.ts:25-30`:

```ts
const SEVERITY_WEIGHT = { critical: 25, high: 12, medium: 5, low: 2 };
const PUBLISH_THRESHOLD = 90;
```

Это **один уровень severity**. По V2 должно быть три уровня с разной семантикой:

- **P0 (publish-block):** H1 присутствует, canonical корректен, валидный JSON-LD-граф, llms.txt в корне, robots.txt разрешает GPTBot/ClaudeBot/Google-Extended. **Любой провал → publishable=false независимо от score.**
- **P1 (rich-features):** FAQ-блок, commercial signals, dateModified, breadcrumbs. Снижает score, но не блокирует.
- **P2 (style):** длина title, plural/singular в slug, ARIA, OG-теги.

Текущая реализация смешивает их — критический промах схемы и косметика вычитают из одного score без явного флага «этот провал = блок публикации».

Нет также раздельных целей по осям: SEO ≥ 85, Direct ≥ 90, Schema = 100, AI/LLM ≥ 85. Сейчас есть только один совокупный score.

### 2.4 🟡 Два параллельных скоринга, не сшитых друг с другом

| Скоринг | Где живёт | Веса |
|---|---|---|
| **SiteCheckPipeline** (порт из Edge Function) | `services/SiteCheckPipeline.ts:578` | `total = seo*0.35 + direct*0.20 + schema*0.15 + ai*0.30` |
| **FormulaV2 audit** | `services/AuditEngine/gapAnalyzer.ts:266` | `overall = seo*0.5 + geo*0.25 + cro*0.25` |
| **FormulaV2 preflight** | `services/FormulaV2/preflight.ts` | severity-based, threshold 90 |

Они не пересекаются. Результат: **пользователь может получить SiteCheck-score 87, FormulaV2-overall 72, Preflight 91 на одном и том же сайте.**

V2-документы прямо говорят: «единый скоринг, четыре оси, цели SEO≥85 Direct≥90 Schema=100 AI/LLM≥85». Нужно один правильный скоринг и переход остальных на него (или удаление).

### 2.5 🟡 SiteCheckPipeline = монолит на 2249 строк, не интегрирован с V2

`services/SiteCheckPipeline.ts` содержит technicalAudit, contentAudit, directAudit, schemaAudit, aiAudit, competitorAnalysis, parseRobotsTxt, analyzeLlmsTxt и три скоринга. Хорошие функции, но они **закрытые внутри файла** и недоступны из `AuditEngine/gapAnalyzer.ts`.

Phase 4 шаг 4 был «façade-pattern», по факту вынесли только `types.ts` и приостановились (см. `services/SiteCheck/REFACTOR_PLAN.md`). Шаги 2–7 не сделаны.

Решение проще, чем рефакторинг: при V2 редизайне **выпиливаем технический долг**: либо распиливаем монолит на extractors/audits/scoring и используем их в gapAnalyzer, либо удаляем SiteCheckPipeline целиком (оставив только нужные функции в новой папке `services/Audit/`).

### 2.6 🟡 AI Developer Pack — markdown super_prompt без машиночитаемого контракта

`services/AiDeveloperPack/superPrompt.ts` — это `lines.push('...')` 88 раз. Получается нечто вроде:

```
# OWNDEV AI DEVELOPER PACK — SUPER PROMPT v1
Тип проекта: **service_geo**
...
```

Это **prose**, а не machine-readable contract. Lovable/Cursor могут это съесть, но не валидируют. У нас нет:

- JSON Schema для `super_prompt_pack`;
- разных режимов экспорта: Full Super Prompt / Structured Pack / Platform-Specific (Lovable / Cursor / v0);
- семантических секций в духе "Agent Role / Mission / Non-Negotiable Rules / Tech Stack / Business Context / Route Map / Page Contracts / SEO/GEO/Schema Contract / UI Component Rules / Acceptance Criteria" — а это и есть основа Module 9.

### 2.7 🟢 Что хорошо

- **БД-схема стройная.** Project types + page contracts + schema templates как таблицы, а не как код. Легко добавлять варианты.
- **30 JSON-LD шаблонов засеяно** с required/optional vars и pruneEmpty — это правильное решение для Schema Registry.
- **CrawlEngine + Jina fallback** — рабочий компромисс между cheerio и puppeteer-беспределом.
- **BullMQ + zeкало в `formula_jobs`.** Дурак-proof: статус видно и в Redis, и в Postgres.
- **Recovery UI** на фронте есть, и он показывает фиксы + schema patches + кнопку «применить».
- **Preflight Gate ≥ 90 как hard-gate** для экспорта — правильный мускул, его просто надо «накачать» правильным содержанием.

### 2.8 Гэп-анализ: текущее vs V2 (7 модулей)

| Модуль V2 | Что есть | Что нужно |
|---|---|---|
| **0. Project Intake** (10 web + 5 app + 4 special) | 19 типов в одном пуле, без Tier A/B/C | Реклассифицировать, добавить app-specific (mobile_app screens, deep links) и special (promo, personal_brand, franchise, b2b_media) |
| **1. Demand Intelligence** | Wordstat-клиент с неправильным эндпоинтом, не подключён к Strategy | Исправить URL/methods, добавить cluster builder, пробросить кластеры в page contracts |
| **2. Strategy Layer** | Имплицитно живёт в `blueprintBuilder` | Выделить в отдельный модуль: priority pages, content depth, geo expansion |
| **3. Page Contract Generator** | Жёсткая таблица `TEMPLATE_DEFAULTS` | Полноценный контракт-генератор: H1≤35, Title≤60, intro answer, FAQ, схема-граф, commercial signals |
| **4. Schema Registry** | 30 шаблонов засеяно | Добавить `@graph`-сборщик, варианты per-vertical, валидация Rich Results-совместимости |
| **5. Technical Passport** | llms.txt + robots.txt + sitemap.xml генерятся | Добавить dataLayer (GTM), security.txt, .well-known/ai.txt, security headers рекомендации |
| **6. Conversion System** | Имплицитно через required_blocks | Выделить отдельный аудитор conversion (CTA, форма, телефон, мессенджеры, отзывы) |
| **7. Preflight Audit Contract** | Один уровень severity, threshold 90 | Три яруса P0/P1/P2 + цели по осям SEO/Direct/Schema/AI |

---

## 3. Редизайн V2 — новая архитектура

### 3.1 Принципы

1. **Один источник истины — БД.** Контракты, схемы, типы, веса — всё в `formula_*` таблицах. Код только исполняет.
2. **Pipeline = одна очередь, прозрачные стейджи.** Каждый модуль 0–7 = отдельная BullMQ-job. Состояние — в `formula_jobs`.
3. **Артефакт экспорта = типизированный пакет (`super_prompt_pack v1`)** с JSON Schema валидацией, тремя режимами экспорта и нулём ручных правок для AI-кодера.
4. **Скоринг един:** четыре оси (SEO, Direct, Schema, AI/LLM), пороги и P0/P1/P2 ярусы, один блок publishable.
5. **Выпиливаем legacy:** SiteCheckPipeline монолит → расщепляем нужное в `Audit/`, остальное удаляем. Старые SiteFormula-страницы → редирект на v2.
6. **Архитектурный бан Supabase сохраняется**, как и стек Fastify 5 / PG 16 / Redis 7 / BullMQ на 155.212.188.244.

### 3.2 Целевая структура backend

```
owndev-backend/src/
├── services/
│   ├── intake/              # Module 0: Project Intake (10/5/4)
│   │   ├── projectTypes.ts        # каталог Tier A/B/C
│   │   ├── classifier.ts          # rule + LLM-assist
│   │   └── intakeValidator.ts
│   ├── demand/              # Module 1: Demand Intelligence (Wordstat)
│   │   ├── yandexSearchApi.ts     # ПРАВИЛЬНЫЕ эндпоинты
│   │   ├── topRequests.ts         # /wordstat/topRequests
│   │   ├── dynamics.ts            # /wordstat/getDynamics
│   │   ├── regions.ts             # /wordstat/getRegionsDistribution + getRegionsTree
│   │   ├── clusterBuilder.ts      # семантические кластеры → priority pages
│   │   └── quotaTracker.ts        # 100k sync/day учёт
│   ├── strategy/            # Module 2: Strategy Layer
│   │   ├── priorityPages.ts       # MUST/SHOULD/COULD
│   │   ├── contentDepth.ts        # word_count by intent
│   │   └── geoExpansion.ts        # multi-city slugs
│   ├── pageContracts/       # Module 3: Page Contract Generator
│   │   ├── contractRules.ts       # H1≤35, Title≤60, intro answer
│   │   ├── faqGenerator.ts        # 5+ вопросов из demand
│   │   ├── commercialSignals.ts   # CTA, цены, отзывы
│   │   └── pageContractBuilder.ts
│   ├── schemaRegistry/      # Module 4: Schema Registry
│   │   ├── templates.ts           # рендер из БД
│   │   ├── graphBuilder.ts        # сборка @graph (LocalBusiness+Service+FAQPage+BreadcrumbList)
│   │   ├── verticalVariants.ts    # MedicalBusiness vs LegalService vs Restaurant
│   │   └── richResultsValidator.ts
│   ├── technicalPassport/   # Module 5
│   │   ├── llmsTxt.ts             # spec-compliant
│   │   ├── robotsTxt.ts           # GPTBot/ClaudeBot/Google-Extended
│   │   ├── sitemapXml.ts
│   │   ├── dataLayer.ts           # GTM-friendly events
│   │   ├── wellKnown.ts           # /.well-known/ai.txt, security.txt
│   │   └── headers.ts             # CSP, HSTS recommendations
│   ├── conversion/          # Module 6: Conversion System
│   │   ├── ctaAuditor.ts
│   │   ├── trustSignals.ts        # отзывы, гарантии, лицензии
│   │   └── formFlowAuditor.ts
│   ├── preflight/           # Module 7: Preflight Audit Contract
│   │   ├── p0Rules.ts             # blocking
│   │   ├── p1Rules.ts             # rich features
│   │   ├── p2Rules.ts             # style
│   │   ├── axisScorer.ts          # SEO/Direct/Schema/AI/LLM
│   │   └── publishableGate.ts     # ALL P0=pass && score >= targets
│   ├── crawl/               # переименован из CrawlEngine
│   │   ├── cheerioCrawler.ts
│   │   ├── jinaFallback.ts
│   │   ├── pageClassifier.ts
│   │   └── prioritizer.ts         # по priority_pages из strategy
│   ├── audit/               # переименован из AuditEngine + расщеплённый SiteCheck
│   │   ├── extractors/            # stage0, robots, sitemap, llms, geo, cro, seo
│   │   ├── audits/                # technical, content, direct, schema, ai
│   │   ├── gapAnalyzer.ts
│   │   └── recoveryBuilder.ts
│   └── developerPack/       # AI Developer Pack v2
│       ├── superPromptBuilder.ts  # Module 9 структура (10 секций)
│       ├── packExporter.ts        # 3 режима: full / structured / platform
│       ├── platforms/
│       │   ├── lovable.ts
│       │   ├── cursor.ts
│       │   └── v0.ts
│       └── schemas/
│           ├── super_prompt.schema.json
│           ├── routes.schema.json
│           ├── page_contracts.schema.json
│           ├── schema_pack.schema.json
│           └── acceptance_checklist.schema.json
├── workers/
│   ├── pipelineOrchestrator.ts   # вызывает 0→1→2→3→4→5→6→7
│   ├── intakeWorker.ts
│   ├── demandWorker.ts
│   ├── crawlWorker.ts
│   ├── auditWorker.ts
│   ├── preflightWorker.ts
│   └── packWorker.ts
└── api/routes/
    ├── pipeline.ts          # POST /api/v3/pipeline/run, GET /api/v3/pipeline/:id
    ├── projectTypes.ts
    ├── pageContracts.ts
    ├── schemaRegistry.ts
    └── pack.ts              # /export, /:id/download
```

### 3.3 Целевая БД (новые миграции 030–034)

| Миграция | Таблицы / изменения |
|---|---|
| `030_v3_project_types_tier.sql` | Добавить колонку `tier` (`A`/`B`/`C`) в `formula_project_types`; реклассифицировать 19 → 19+. Вставить 4 special-типа: `promo_event`, `personal_brand`, `franchise_multi`, `b2b_media` |
| `031_v3_page_contracts_v2.sql` | Колонки: `max_h1_chars` (35), `max_title_chars` (60), `intro_answer_min_words` (40), `intro_answer_max_words` (80), `min_faq_items` (5), `required_commercial_signals` (text[]), `axis_seo_target` / `axis_direct_target` / `axis_schema_target` / `axis_ai_target` |
| `032_v3_demand_intelligence.sql` | `demand_quota_log` (учёт 100k/день), `demand_clusters` (head/middle/tail), `demand_geo_distribution` |
| `033_v3_preflight_rules.sql` | `preflight_rules` с колонкой `tier` (`P0`/`P1`/`P2`), `axis` (`seo`/`direct`/`schema`/`ai_llm`), `weight`, `blocks_publish` (bool) — переносим логику из кода в БД |
| `034_v3_pack_artifacts.sql` | `pack_artifacts` (по одной строке на файл в ZIP), `pack_export_modes` (full / structured / platform_specific) |

### 3.4 Module 9 Super Prompt — JSON Schema контракт

Главный машиночитаемый артефакт. Структура (10 секций):

```json
{
  "$schema": "https://owndev.ru/schemas/super_prompt.schema.json",
  "version": "1.0",
  "agent_role": {
    "title": "string",
    "expertise": ["string"],
    "tone": "professional | friendly | technical"
  },
  "mission": {
    "primary_goal": "string",
    "success_criteria": ["string"],
    "out_of_scope": ["string"]
  },
  "non_negotiable_rules": [
    {"rule": "string", "rationale": "string", "violation_consequence": "fail_acceptance"}
  ],
  "tech_stack": {
    "framework": "Next.js 14 | Vite + React | Astro",
    "styling": "Tailwind | CSS Modules",
    "deployment": "Vercel | self-hosted",
    "constraints": ["no client-side puppeteer", "no Supabase"]
  },
  "business_context": {
    "brand": "string",
    "industry": "string",
    "target_audience": "string",
    "geo": {"country": "RU", "regions": ["213","2"]},
    "languages": ["ru"],
    "competitive_position": "string"
  },
  "route_map": {
    "$ref": "routes.schema.json"
  },
  "page_contracts": {
    "$ref": "page_contracts.schema.json"
  },
  "seo_geo_schema_contract": {
    "$ref": "schema_pack.schema.json"
  },
  "ui_component_rules": {
    "design_tokens": {"primary_color": "#...","font_heading": "..."},
    "required_components": ["Header","Footer","Breadcrumbs","FAQ","CTA","ContactForm"],
    "accessibility": "WCAG AA"
  },
  "acceptance_criteria": {
    "$ref": "acceptance_checklist.schema.json"
  }
}
```

Каждая `$ref` — отдельный JSON Schema, валидируется через `ajv` на этапе `packExporter`. Ровно так же, как Sushka911-боевой пример из вашего сообщения про Module 9 — но не markdown, а валидируемый JSON.

### 3.5 Три режима экспорта

| Режим | Что в ZIP | Для кого |
|---|---|---|
| **Full Super Prompt** | один `super_prompt.txt` (markdown с inline JSON блоков) | Claude / GPT в чате |
| **Structured Pack** | super_prompt.json + routes.json + page_contracts.json + schema_pack.json + acceptance_checklist.md + llms.txt + robots.txt + sitemap.xml + README_for_AI.md | Cursor / Copilot |
| **Platform-Specific** | под Lovable: `lovable.config.json` + prompts/; под v0: компоненты как `.tsx` skeletons; под Cursor: `.cursor/rules/*.mdc` | Lovable / v0 / Cursor |

Все три собираются из одного и того же `super_prompt_pack v1` объекта — отличаются только сериализаторами.

### 3.6 Обновлённый Preflight Contract

```ts
type PreflightLevel = 'P0' | 'P1' | 'P2';
type AuditAxis = 'seo' | 'direct' | 'schema' | 'ai_llm';

interface PreflightRule {
  id: string;
  level: PreflightLevel;
  axis: AuditAxis;
  weight: number;
  blocks_publish: boolean;          // только P0 = true
  human_message_ru: string;
  detector: (page: CrawlPageRecord, contract: PageContract) => boolean;
}

interface PreflightReportV3 {
  axes: {
    seo:      { score: number; target: 85;  passed: boolean };
    direct:   { score: number; target: 90;  passed: boolean };
    schema:   { score: number; target: 100; passed: boolean };
    ai_llm:   { score: number; target: 85;  passed: boolean };
  };
  p0_violations: Violation[];       // ANY → publishable=false
  p1_violations: Violation[];
  p2_violations: Violation[];
  publishable: boolean;             // p0_violations.length === 0 && all axes passed
  total_score: number;
}
```

P0-правила (минимум):
- H1 присутствует на каждой странице.
- Canonical корректный и self-referencing.
- JSON-LD граф валиден (через `ajv` + Schema.org subset).
- llms.txt есть в корне.
- robots.txt разрешает GPTBot, ClaudeBot, Google-Extended (если ai_bots_policy=allow).
- Title ≤ 60 символов, H1 ≤ 35 символов на критичных страницах (home, service, category).

### 3.7 План реализации спринтами

| Спринт | Цель | Артефакты |
|---|---|---|
| **S1 — Type Matrix v3** | Реклассифицировать 19 → 19+ типов с tier A/B/C, миграция 030, добавить 4 special-типа. Frontend: переключатели Tier. | `030_v3_project_types_tier.sql`, обновить `intake.ts`, обновить `SiteFormulaV2.tsx` группировки |
| **S2 — Demand Intelligence (правильный)** | Исправить эндпоинты Wordstat, реализовать topRequests/getDynamics/getRegionsDistribution/getRegionsTree, quota tracker, cluster builder, **подключить к Strategy Layer** | `services/demand/*`, миграция 032, новые routes `/api/v3/demand/*` |
| **S3 — Schema Registry v2** | `@graph`-сборщик, vertical variants, Rich Results validator | `services/schemaRegistry/graphBuilder.ts`, обновлённые seed-шаблоны |
| **S4 — Page Contract Generator** | H1≤35, Title≤60, intro answer, FAQ из demand, commercial signals | миграция 031, `services/pageContracts/*`, удалить `TEMPLATE_DEFAULTS` |
| **S5 — Technical Passport v2** | llms.txt spec-compliant, dataLayer, .well-known/ai.txt, security headers | `services/technicalPassport/*` |
| **S6 — Preflight Contract P0/P1/P2** | Перенос правил в БД (миграция 033), четыре оси, axis targets, blocking gate | `services/preflight/*`, новые поля в `formula_jobs` |
| **S7 — Module 9 Super Prompt Pack** | JSON Schema контракты, 3 режима экспорта, ajv-валидация, Lovable/Cursor/v0 сериализаторы | `services/developerPack/schemas/*.json`, `services/developerPack/platforms/*` |
| **S8 — Geo + App expansion** | Tier B (mobile_app со screens, deep links, AppSchema), Tier C special verticals | новые seed контракты |
| **S9 — Migration off SiteCheckPipeline** | Расщепить монолит на extractors/audits, удалить дубли скоринга | `services/audit/*`, удалить `SiteCheckPipeline.ts` |
| **S10 — Frontend V3 redesign** | Чистый visual flow: Intake → Demand preview → Strategy preview → Build → Preflight → Pack export modes | `pages/SiteFormulaV3.tsx`, удалить старые SiteFormula страницы |

Минимальный путь до публикуемого пилота — **S1 + S2 + S4 + S6 + S7** (≈ 2 спринта по 5 рабочих дней).

### 3.8 Что выпиливаем

- `pages/SiteFormula.tsx`, `SiteFormulaWizard.tsx`, `SiteFormulaPreview.tsx`, `SiteFormulaReport.tsx` → редирект на `/site-formula/v3`.
- `services/SiteFormula/` (v1) → перевод в `_legacy/`.
- `services/SiteCheckPipeline.ts` → расщепляем на `audit/extractors` и `audit/audits`, удаляем монолит после S9.
- Дублирующий `services/SiteCheck/` façade → нужен только до завершения S9.

### 3.9 Целевой пайплайн (BullMQ jobs)

```
intake.classify  ──►  demand.fetch  ──►  strategy.plan  ──►  pageContracts.generate
       │                  │                   │                       │
       ▼                  ▼                   ▼                       ▼
crawl.priorityPages  schemaRegistry.render  technical.passport  conversion.audit
       │                  │                   │                       │
       └────────────►  preflight.evaluate  ◄───┴───────────────────────┘
                              │
                              ▼
                     pack.export (3 modes)
```

Все шаги — отдельные jobs со своим status/progress в `formula_jobs`. Если P0 провален — пайплайн помечает job как `blocked`, но не как `failed` (пользователь дотуть и пере-запускает).

---

## 4. Инвентарь действий

| # | Действие | Эффект | Срок |
|---|---|---|---|
| 1 | Принять/скорректировать редизайн | Зафиксировать архитектуру V2 | сегодня |
| 2 | Создать ветку `core-hardening-v3` от текущей `core-hardening-v2` | Старт нового цикла | S1 |
| 3 | Миграции 030+031 | Type matrix tier + page contracts с правильными лимитами | S1 |
| 4 | Исправить Wordstat client | Demand Intelligence реально работает | S2 |
| 5 | Подключить demand к page contracts | FAQ и priority pages берутся из реальных кластеров | S2 |
| 6 | Реализовать `services/preflight/*` с P0/P1/P2 | Гарантия публикации = реальная гарантия | S6 |
| 7 | Module 9 Super Prompt JSON Schema | AI-кодер получает валидируемый контракт | S7 |
| 8 | Удалить SiteCheckPipeline монолит | Один скоринг, один источник истины | S9 |
| 9 | Frontend V3 | Пользователь видит этапы 0–7 как явные карточки | S10 |
| 10 | Документация: `OWNDEV-V3-ARCHITECTURE.md` + `MODULE-9-SUPER-PROMPT-SPEC.md` | Контракт для команды и AI-ассистентов | параллельно S7 |

---

## 5. Закрывающие комментарии

Текущая Phase 1–4 — **не выкинуть**. БД-схема, BullMQ-инфраструктура, crawl + Jina, Recovery UI, ZIP-экспорт — это всё переиспользуется в V3. Меняем не каркас, а **смысловое наполнение каждого слоя**:

- Wordstat → реально работает и реально влияет на план страниц.
- Page Contracts → не словарь fallback'ов, а правила с лимитами и intro answer.
- Preflight → три яруса, четыре оси, явный publish-блок на P0.
- AI Developer Pack → машиночитаемый контракт по Module 9, три режима экспорта.

После S1–S7 у вас будет то, ради чего всё затевалось: **«загрузил URL → через 3 минуты получил ZIP, который Lovable/Cursor/v0 превратит в сайт со score 95+ без ручных правок».** Это ценность V2.

— Конец отчёта.
