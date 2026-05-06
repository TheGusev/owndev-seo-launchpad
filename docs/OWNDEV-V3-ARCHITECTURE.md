# OWNDEV Site Formula V3 — Архитектура

**Версия:** 3.0.0 · **Ветка:** `core-hardening-v3` · **Engine:** v3

## 1. Назначение

Site Formula V3 — генератор сайтов и AI-Developer-Pack с гарантированным
прохождением **Preflight Gate V3 (4 оси)**:

| Ось     | Порог | Что измеряет |
|---------|-------|---------------|
| SEO     | ≥ 85  | Title/H1/intro/canonical/sitemap/internal links |
| DIRECT  | ≥ 90  | CTA above-the-fold, телефон, форма, trust signals, цена |
| SCHEMA  | = 100 | JSON-LD `@graph`, обязательные типы, Rich Results |
| AI/LLM  | ≥ 85  | `llms.txt`, robots для 17 AI-ботов, `.well-known/ai.txt`, FAQ ≥ 5, citable facts |

**Total ≥ 90** — публикация разрешена.

## 2. Стек (immutable)

- Fastify 5 · PostgreSQL 16 · Redis 7 · BullMQ
- TypeScript ESM (moduleResolution: nodenext, импорты с `.js`)
- Своё железо `155.212.188.244`, PM2, Nginx
- HTML-парсинг — cheerio (no puppeteer); Jina Reader fallback для SPA
- DB-клиент — `postgres` tagged-template syntax: `sql\`SELECT ...\``
- **NO Supabase**

## 3. Слои движка

```
┌──────────────────────────────────────────────────────┐
│             services/pipeline (orchestrator)          │
│   intake → demand → crawl → audit → preflight → pack  │
└──────────────────────────────────────────────────────┘
        │           │          │         │         │
        ▼           ▼          ▼         ▼         ▼
   demand     CrawlEngine   audit   preflight  developerPack
    │             │          │         │           │
    ▼             ▼          ▼         ▼           ▼
 wordstat    cheerio +   extractors  ruleEngine  composer
  v2 API     Jina SPA    + audits    + axisScorer + serializers
                                                 + zipBuilder
```

### 3.1 services/demand
Wordstat v2 endpoints (`topRequests`, `getDynamics`, `getRegionsDistribution`).
Daily quota log (100k unit/day), кластеризация, geo targeting.

### 3.2 services/strategy
Карта сайта на базе page_contracts + кластеров спроса. Маппинг
`cluster.recommended_page_type → SitePage`. Funnel stages, primary_cta.

### 3.3 services/pageContracts (v3.0.0)
38+ контрактов в БД. Лимиты: H1 ≤ 35, Title ≤ 60, intro 40-80 слов,
FAQ ≥ 5, min 400 слов, обязательные коммерческие сигналы.

### 3.4 services/schemaRegistry
Recipe per project_code/page_type → собирает JSON-LD `@graph`.
Валидация Rich Results (Google + Yandex).

### 3.5 services/technicalPassport
- `llms.txt` (Anthropic spec)
- `robots.txt` с 17 AI-ботами (GPTBot, ClaudeBot, PerplexityBot, …)
- `.well-known/ai.txt` (JSON политики)
- `sitemap.xml`
- dataLayer (GA4 events + Yandex goals)
- HTTP headers (CSP, Cache-Control, X-Robots-Tag, HSTS)

### 3.6 services/audit (V3 PageEvidence collector)
- `extractors/` — head meta, schema, content (cheerio)
- `audits/` — DIRECT (CTA/trust/forms), AI/LLM (llms.txt + bots), SCHEMA
- `scoring/evidenceBuilder.ts` — собирает `PageEvidence` для preflight

### 3.7 services/preflight
- `preflight_rules` (35+ правил, P0/P1/P2)
- `ruleEngine.ts` — EVALUATORS map по rule_code
- `axisScorer.ts` — взвешивание (P1×1.0, P2×0.5; P0 fail → axis=0)
- Результат пишется в `preflight_results`

### 3.8 services/conversion
CTA-аудитор (русские ключи: заказать/купить/оставить заявку), trust signals,
form flow auditor (152-ФЗ consent чек).

### 3.9 services/developerPack
- `composer.ts` — собирает SuperPromptPack v1 (схема в `docs/super_prompt_pack.schema.json`)
- `validator.ts` — ajv (CommonJS interop fix)
- 5 сериализаторов: `structured` (JSON + per-section MD), `lovable` (PROMPT.md),
  `cursor` (.cursor/rules), `v0` (prompt.txt), `claude_code` (CLAUDE.md + specs)
- `zipBuilder.ts` — JSZip
- 3 режима экспорта: `structured` · `full` · `platform_specific`

## 4. Project Types (23 шт.)

| Tier | Кол-во | Коды |
|------|--------|------|
| A — Web/SEO | 10 | service_geo, service_pro, service_b2b, ecommerce, marketplace, saas, education, medical, legal, realestate |
| B — App-driven | 1 | mobile_app |
| C — Special | 12 | finance, hospitality, events, nonprofit, gov, portfolio, media, blog, **promo_event**, **personal_brand**, **franchise_multi**, **b2b_media** |

Жирным — добавлено в V3 (миграция 030).

## 5. Миграции БД (V3)

| № | Что вводит |
|---|------------|
| 030 | `formula_project_types.tier`, 4 новых типа |
| 031 | `formula_page_contracts` v2 (H1 max, Title max, intro_min/max, FAQ min, commercial_signals) |
| 032 | `demand_quota_log`, `demand_clusters`, `demand_geo_distribution` |
| 033 | `preflight_rules`, `preflight_results` |
| 034 | `pack_artifacts`, `pack_export_modes` |
| 035 | Tier B/C сиды (mobile_app, promo_event, personal_brand, franchise_multi, b2b_media + service_b2b) |

## 6. API V3 (`/api/v3`)

| Метод | Эндпоинт | Назначение |
|-------|----------|------------|
| GET   | `/project-types` | 23 типа, разбивка по tier |
| GET   | `/project-types/:code` | один тип |
| GET   | `/page-contracts/:projectCode` | контракты для типа |
| POST  | `/schema/build` | собрать JSON-LD `@graph` |
| GET   | `/schema/recipes` | список рецептов |
| POST  | `/pipeline/run` | запустить pipeline (синхронно) |
| GET   | `/pipeline/result/:job_id` | результат (in-memory cache 1h) |
| GET   | `/pack/:job_id` | super_prompt_pack JSON |
| GET   | `/pack/:job_id.zip` | ZIP бандл |
| POST  | `/pack/export` | реэкспорт в другой режим/платформу |
| GET   | `/pack/:job_id/validate` | ajv-валидация пака |

## 7. Frontend

- `/site-formula/v3` — основной флоу (Tabs Tier A/B/C → форма бренда → запуск → визуализация 6 стадий → preflight 4 оси → ZIP)
- `/site-formula/v2` — редирект на V3
- `/site-formula/v2-legacy` — старая V2 для совместимости

API-клиент: `src/lib/api/formulaV3.ts`.

## 8. BullMQ (V2 reuse)

V3 переиспользует существующую BullMQ-инфру (5 очередей в
`src/queue/formulaV2Queues.ts`, 5 воркеров в `src/workers/`). V3-сервисы
доступны воркерам через прямой импорт. Pipeline orchestrator (синхронный)
живёт в `services/pipeline/` — для асинхронных запусков фронтенд должен
использовать `/api/v2/jobs`.

## 9. Sushka911 baseline

| Ось     | Sushka911 | V3 цель |
|---------|-----------|---------|
| SEO     | 67 | 95-100 |
| Direct  | 35 | 95-100 |
| Schema  | 0  | 100    |
| AI/LLM  | 25 | 95-100 |
| Total   | 38 | ≥ 90   |

## 10. Smoke test

```bash
cd owndev-backend
npx tsx scripts/v3-smoke-test.ts
```

Проверяет: `composer → ajv-validation → ZIP for Lovable (7 файлов)`.

## 11. Коммиты ветки `core-hardening-v3`

- `12e87e2` S1 — миграция 030 + types
- `b6bfcc4` S2 — services/demand + миграция 032
- `cad2c6c` S3 — services/schemaRegistry
- `08acba4` S4 — миграция 031 + pageContracts + strategy
- `ed55aca` S5 — services/technicalPassport
- `5183cb0` S6 — preflight + conversion + миграция 033
- `8a1c249` S7 — services/developerPack + миграция 034
- `8cb6bfe` S8 — Tier B/C сиды (миграция 035)
- `19ddf73` S9 — services/audit (V3 PageEvidence collector)
- `_____` S10 — services/pipeline + API v3 + SiteFormulaV3.tsx
