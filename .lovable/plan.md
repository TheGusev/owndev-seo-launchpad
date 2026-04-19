

# Marketplace Audit (WB / Ozon) — план интеграции в OWNDEV

Новый продуктовый модуль рядом с Site Check, GEO Audit, GEO Rating и Site Formula. **Ничего из существующего не трогаем** — модуль идёт изолированной вертикалью (свои routes, своя таблица, свой worker, свой queue), переиспользуя только UI-примитивы (`ScoreCards`, `IssueCard`, `PaywallCTA`, `Header`/`Footer`, design tokens) и общие паттерны (`useAudit`, `api/client`, `null-safe selectors`).

---

## 1. Архитектура модуля

```text
Frontend (React/Vite)                Backend (Fastify + BullMQ)
─────────────────────                ──────────────────────────
/marketplace-audit            POST  /api/v1/marketplace-audit/start
  └─ landing + input form     GET   /api/v1/marketplace-audit/preview/:id
/marketplace-audit/result/:id GET   /api/v1/marketplace-audit/result/:id
  └─ progress → result                    │
                                          ▼
                                    BullMQ queue: marketplace-audit
                                          │
                                          ▼
                              MarketplaceAuditWorker
                                          │
              ┌───────────────┬───────────┴────────────┬───────────────┐
              ▼               ▼                        ▼               ▼
        ParserService   ScoringService          LlmAuditService   CompetitorScraper
        (WB / Ozon /     (4 sub-scores +         (4 prompts,       (top-3 by SKU
         manual)          rule engine)            JSON output)     same category)
                                          │
                                          ▼
                              Postgres: marketplace_audits
                              Redis: progress + cache
```

Парсинг WB/Ozon делаем через **публичные JSON-эндпоинты** (`card.wb.ru/cards/v2/detail`, `api.ozon.ru/composer-api.bx/page/json/v2`) с фолбэком на HTML-скрейп через существующий `CrawlerService`. Если оба пути падают — переключаемся в `manual input mode`.

LLM — через существующий `llm-proxy` Edge Function (тот же путь, что Site Check), модель `google/gemini-3-flash-preview`, `tool_choice` для строгого JSON. Никаких новых ключей.

---

## 2. Файлы — что создать / что трогать

### Создать (backend)
- `owndev-backend/src/db/migrations/003_marketplace_audit.sql` — новая таблица + enum
- `owndev-backend/src/types/marketplaceAudit.ts` — типы (Score, Issue, Breakdown, Status)
- `owndev-backend/src/db/queries/marketplaceAudits.ts` — CRUD + progress update
- `owndev-backend/src/api/routes/marketplaceAudit.ts` — 3 ручки + zod-валидация
- `owndev-backend/src/services/MarketplaceAudit/index.ts` — оркестратор
- `owndev-backend/src/services/MarketplaceAudit/parsers/wbParser.ts`
- `owndev-backend/src/services/MarketplaceAudit/parsers/ozonParser.ts`
- `owndev-backend/src/services/MarketplaceAudit/parsers/manualNormalizer.ts`
- `owndev-backend/src/services/MarketplaceAudit/scoring/contentScore.ts`
- `owndev-backend/src/services/MarketplaceAudit/scoring/searchScore.ts`
- `owndev-backend/src/services/MarketplaceAudit/scoring/conversionScore.ts`
- `owndev-backend/src/services/MarketplaceAudit/scoring/adReadinessScore.ts`
- `owndev-backend/src/services/MarketplaceAudit/scoring/totalScore.ts`
- `owndev-backend/src/services/MarketplaceAudit/scoring/ruleEngine.ts` — issue rules без LLM
- `owndev-backend/src/services/MarketplaceAudit/llm/prompts.ts` — 4 prompt templates
- `owndev-backend/src/services/MarketplaceAudit/llm/runLlm.ts` — JSON-strict обёртка
- `owndev-backend/src/services/MarketplaceAudit/competitorService.ts`
- `owndev-backend/src/queue/marketplaceAuditQueue.ts`
- `owndev-backend/src/workers/MarketplaceAuditWorker.ts`
- `owndev-backend/config/marketplace-rules.v1.json` — rule definitions

### Создать (frontend)
- `src/pages/MarketplaceAudit.tsx` — landing + form
- `src/pages/MarketplaceAuditResult.tsx` — progress + результат
- `src/components/marketplace/InputModeTabs.tsx` (URL / SKU / Manual)
- `src/components/marketplace/MarketplaceForm.tsx`
- `src/components/marketplace/ManualInputForm.tsx`
- `src/components/marketplace/MarketplaceProgress.tsx`
- `src/components/marketplace/MarketplaceHero.tsx`
- `src/components/marketplace/MarketplaceScoreCards.tsx` (тонкая обёртка над общим UI)
- `src/components/marketplace/IssuesByImpact.tsx`
- `src/components/marketplace/RewriteSuggestions.tsx`
- `src/components/marketplace/CompetitorGap.tsx`
- `src/components/marketplace/KeywordCoverage.tsx`
- `src/components/marketplace/MarketplacePaywallCTA.tsx`
- `src/components/marketplace/EmptyStates.tsx`
- `src/lib/api/marketplaceAudit.ts` — API клиент
- `src/lib/marketplace-audit-types.ts` — типы (frontend mirror)
- `src/hooks/useMarketplaceAudit.ts` — polling + null-safe selectors

### Минимально трогаем (без рефакторинга)
- `src/App.tsx` — добавить 2 route'а (`/marketplace-audit`, `/marketplace-audit/result/:id`)
- `src/components/ToolsShowcase.tsx` — карточка нового инструмента
- `src/data/tools-registry.ts` — регистрация инструмента
- `owndev-backend/src/api/server.ts` — `app.register(marketplaceAuditRoutes, { prefix: '/api/v1/marketplace-audit' })`
- `owndev-backend/src/index.ts` — `startMarketplaceAuditWorker()`
- `owndev-backend/src/api/middleware/rateLimit.ts` — добавить новые пути в логику (отдельный bucket, 30/min для anon)

**НЕ трогаем:** `Header.tsx`, mobile drawer, site-check/, geo-rating/, site-formula/, audit/, всё что под `state/audit/`.

---

## 3. SQL Schema (safe migration)

```sql
-- 003_marketplace_audit.sql
CREATE TYPE marketplace_platform AS ENUM ('wb', 'ozon');
CREATE TYPE marketplace_input_type AS ENUM ('url', 'sku', 'manual');
CREATE TYPE marketplace_audit_status AS ENUM ('pending','parsing','scoring','llm','done','error');

CREATE TABLE marketplace_audits (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_platform      marketplace_platform NOT NULL,
  input_type           marketplace_input_type NOT NULL,
  input_value          text NOT NULL,
  status               marketplace_audit_status NOT NULL DEFAULT 'pending',
  progress_pct         int  NOT NULL DEFAULT 0,
  product_title        text,
  product_description  text,
  attributes_json      jsonb NOT NULL DEFAULT '{}'::jsonb,
  category             text,
  images_json          jsonb NOT NULL DEFAULT '[]'::jsonb,
  scores_json          jsonb NOT NULL DEFAULT '{}'::jsonb,
  issues_json          jsonb NOT NULL DEFAULT '[]'::jsonb,
  keywords_json        jsonb NOT NULL DEFAULT '{}'::jsonb,
  competitors_json     jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommendations_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_summary           text,
  error_msg            text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_ma_status_created ON marketplace_audits (status, created_at DESC);
CREATE INDEX idx_ma_platform_input ON marketplace_audits (source_platform, input_value);

CREATE OR REPLACE FUNCTION ma_set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_ma_updated_at BEFORE UPDATE ON marketplace_audits
  FOR EACH ROW EXECUTE FUNCTION ma_set_updated_at();
```

Изоляция полная — никаких FK на `audits`/`scans`/`domains`. Откат = `DROP TABLE marketplace_audits; DROP TYPE …;`

---

## 4. API Contracts

```ts
// POST /api/v1/marketplace-audit/start
Request: {
  platform: 'wb' | 'ozon';
  inputType: 'url' | 'sku' | 'manual';
  value: string;          // url, sku, или 'manual'
  manual?: {              // обязательно при inputType='manual'
    title: string;
    description: string;
    specs: Record<string,string>;
    category: string;
    competitorUrls?: string[];
  };
}
Response: { id: string; status: 'pending' }

// GET /api/v1/marketplace-audit/preview/:id  (для polling, лёгкий payload)
Response: {
  id; status; progress_pct;
  product_title?; category?; image?: string;
  preview_scores?: { total: number; content: number; search: number; conversion: number; ads: number };
}

// GET /api/v1/marketplace-audit/result/:id  (полный отчёт)
Response: {
  id; status; platform; inputType;
  product: { title; description; category; images: string[]; attributes: Record<string,string> };
  scores: { total; content; search; conversion; ads; breakdown: BreakdownJson };
  issues: Issue[];
  keywords: { covered: string[]; missing: string[]; coveragePct: number };
  competitors: { url; title; score; gap: string[] }[];
  recommendations: { newTitle; newDescription; addKeywords: string[]; removeWords: string[] };
  ai_summary: string;
  meta: { duration_ms; created_at; rules_version };
}
```

Все 3 ручки — публичные (как site-check), zod-валидация на входе, rate-limit отдельным bucket'ом.

---

## 5. Scoring Engine

### 5.1 Sub-scores (0–100, веса видимые в UI)

| Score | Что меряет | Вес в Total |
|---|---|---|
| **Content** | заголовок, описание, фото, attributes completeness | 30% |
| **Search** | покрытие ключей, релевантность категории | 30% |
| **Conversion** | факторы доверия: фото ≥5, видео, infographics, отзывы (если есть), bullets | 25% |
| **Ad Readiness** | готовность к рекламе: уникальность, минус-слова, длина title под рекламные форматы | 15% |

### 5.2 Total

```text
Total = round(0.30·Content + 0.30·Search + 0.25·Conversion + 0.15·AdReadiness)
```

Без магии: каждый sub-score = взвешенная сумма факторов (`factors[]`), каждый фактор имеет `name`, `weight`, `score`, `reason`, `dataPresent`. UI "Как рассчитано?" показывает таблицу.

### 5.3 Rule engine (без LLM, MVP)

`marketplace-rules.v1.json` — ~25 правил, например:
- `MA-C-001` Title < 40 симв → severity:high, impact:12 → Content −15
- `MA-C-002` Описание < 300 симв → high, impact:10 → Content −12
- `MA-C-003` Photos < 3 → critical, impact:18 → Conversion −20
- `MA-S-001` Title не содержит категорию → high → Search −15
- `MA-S-002` Coverage ключей < 30% → high → Search −20
- `MA-K-001` Дубли слов в title → low → Ad Readiness −5
- `MA-A-001` Запрещённые слова ("лучший", "№1") → high → Ad Readiness −15

Каждое правило: `{ id, module, severity, impact_score, weight, why_it_matters, how_to_fix, example_fix, visible_in_preview }`.

### 5.4 LLM-rules (Phase 1 minimal)

LLM добавляет 4 типа issues, которые rule engine не может проверить:
1. Релевантность title ↔ category
2. Качество структуры описания (USP, выгоды, scenario of use)
3. Gap vs competitors (что есть у топ-3, нет у нас)
4. Качество ключевых слов (релевантность ниши)

### 5.5 Breakdown JSON

```json
{
  "content": {
    "score": 64,
    "weight": 0.30,
    "factors": [
      { "name": "title_length", "score": 80, "weight": 0.20, "reason": "Title 52 симв (норма 60–100)", "dataPresent": true },
      { "name": "description_quality", "score": 50, "weight": 0.30, "reason": "Описание 280 симв, нет bullets", "dataPresent": true },
      { "name": "images_count", "score": 60, "weight": 0.30, "reason": "4 фото из рекомендуемых 7+", "dataPresent": true },
      { "name": "attributes_completeness", "score": 70, "weight": 0.20, "reason": "12 из 18 атрибутов заполнены", "dataPresent": true }
    ],
    "missingData": []
  },
  "search": { "score": 41, "weight": 0.30, "factors": [...], "missingData": ["search_volume"] },
  "conversion": { ... },
  "ads": { ... }
}
```

### 5.6 Issue taxonomy

```ts
type Issue = {
  id: string;                        // 'MA-C-001'
  module: 'content'|'search'|'conversion'|'ads'|'technical'|'competitive';
  severity: 'critical'|'high'|'medium'|'low';
  title: string;
  found: string;                     // что нашли в карточке
  why_it_matters: string;
  how_to_fix: string;
  example_fix?: string;
  impact_score: number;              // 1..20
  visible_in_preview: boolean;
  source: 'rule'|'llm';
};
```

### 5.7 Phase 2 (после MVP)
CTR / conversion из seller API (требует OAuth), price gap, sentiment отзывов, анализ A+ контента, динамика ранжирования по запросам, batch-аудит каталога, weekly monitoring.

---

## 6. LLM Prompts (структура, JSON-strict через tool calling)

Все 4 промпта используют `tool_choice` → строгий JSON, никакого парсинга markdown.

1. **`content_audit`** — вход: title, description, attributes, category. Выход: `{ issues: Issue[], strengths: string[] }`
2. **`keyword_fit`** — вход: title+description, category, optional seed keywords. Выход: `{ covered: [], missing: [], coveragePct, suggestedKeywords: [] }`
3. **`competitor_gap`** — вход: наша карточка + 3 конкурента. Выход: `{ weakerThan: [{competitor, aspect, evidence}], strongerThan: [...], priorityAdds: [] }`
4. **`rewrite`** — вход: текущая карточка + issues + missing keywords. Выход: `{ newTitle, newDescription, bullets: [], removeWords: [], addKeywords: [] }`

Системный промпт каждого: «Ты — эксперт по карточкам WB/Ozon. Отвечай ТОЛЬКО валидным JSON через указанный tool. Без markdown, без префиксов».

---

## 7. Frontend UX

### 7.1 User flow
```text
/marketplace-audit
  ├─ Hero + 3 tabs (URL | SKU | Ручной ввод)
  ├─ Platform toggle [WB / Ozon]
  └─ [Анализировать карточку] → POST /start
        │
        ▼
/marketplace-audit/result/:id
  ├─ MarketplaceProgress (polling /preview каждые 1.5с)
  └─ при status='done' → полный result
```

### 7.2 Component tree (result page)
```text
<MarketplaceAuditResult>
  ├─ <Header/> (общий)
  ├─ <MarketplaceHero>             // фото + title + платформа + total + AI-вывод 1 строкой
  ├─ <MarketplaceScoreCards>       // обёртка над общим ScoreCards: Content/Search/Conversion/Ads/Total
  ├─ <IssuesByImpact title="Что мешает росту">  // top-5, sort by impact_score desc
  │     └─ <IssueCard /> (общий)
  ├─ <RewriteSuggestions title="Что переписать">
  │     ├─ NewTitleBlock (copy-to-clipboard)
  │     ├─ NewDescriptionBlock
  │     ├─ KeywordsToAdd
  │     └─ WordsToRemove
  ├─ <CompetitorGap title="Отрыв от конкурентов">
  │     ├─ WeakerTable
  │     ├─ StrongerTable
  │     └─ PriorityAdds
  ├─ <KeywordCoverage title="Покрытие ключевых слов">
  │     └─ donut + chips covered/missing
  ├─ <MarketplacePaywallCTA>       // тонкая обёртка над PaywallCTA
  │     └─ buttons: Полный аудит / Скачать отчёт / Массовая проверка / Weekly monitoring
  └─ <Footer/>
```

### 7.3 UI copy (русский, для селлера)

- Главный CTA: **«Проверить карточку за 30 секунд»**
- Tabs: **«Ссылка»**, **«Артикул»**, **«Заполнить вручную»**
- Заголовок секции score: **«Оценка карточки»** (не "Score Cards")
- Секции:
  - **«Что мешает росту»** — top issues
  - **«Что переписать»** — rewrite
  - **«Отрыв от конкурентов»** — gap
  - **«Покрытие ключевых слов»** — keywords
- Tooltip на "Как рассчитано?": _«Показываем все факторы и веса. Никакой магии — только проверяемые сигналы.»_
- Empty state (нет конкурентов): _«Не нашли близких конкурентов в категории. Можно добавить ссылки вручную.»_
- Error state (парсер упал): _«Не удалось получить данные с {WB/Ozon}. Перейдите на вкладку «Заполнить вручную» — это займёт 1 минуту.»_

### 7.4 Mobile UX
- Score cards: 1+2+2 grid (total full-width сверху, как в site-check)
- Секции — в accordion
- Sticky CTA "Полный аудит" внизу
- Все таблицы (CompetitorGap) → карточки
- ManualInputForm — single column, sticky "Анализировать"

### 7.5 Null-safe / fallback
- Все жирные операции через `??` и `?.`, типы — partial по умолчанию
- Каждая секция: `if (!data?.length) return <EmptySectionCard reason="…"/>` — никаких blank screens
- При `status='error'` → `<ErrorCard withRetry withManualMode/>`
- При незаполненных полях в манульном режиме показываем sub-score с пометкой «недостаточно данных», а не 0
- В `useMarketplaceAudit`: на каждый poll — try/catch + exponential backoff на 429

---

## 8. Минимальный safe MVP (что в этой итерации)

✅ Включаем:
- Таблица + миграция
- Парсер WB+Ozon (JSON endpoint, fallback HTML)
- Manual input mode
- 4 sub-scores + Total + breakdown
- Rule engine (~25 правил из конфига)
- 2 LLM-prompt'а: `content_audit` + `rewrite`
- 3 API ручки + worker + polling
- Frontend pages + все секции с null-safe
- Карточка в `/tools` + регистрация

🚫 Откладываем (Phase 2):
- Competitor scraping для топ-3 (в MVP — только manual competitor URLs от юзера)
- `keyword_fit` и `competitor_gap` LLM-prompts (заглушки на UI «Скоро»)
- PDF/Word экспорт (CTA ведёт в paywall)
- Batch-проверка каталога / weekly monitoring (CTA → форма заявки)
- CTR/конверсии/отзывы/seller analytics
- OAuth WB/Ozon

---

## 9. Деплой / совместимость

- **CORS**: ничего не меняем, новые ручки идут под тем же `/api/v1/*`, существующие origins покрывают.
- **Rate-limit**: добавляем `marketplace-audit` пути в новый bucket в `rateLimit.ts`, по аналогии с site-formula (anon 30/min, skip whitelist для `GET /preview/:id` на polling).
- **Auth**: публично, как site-check. `authMiddleware` уже глобальный — анонимы получают `plan:'anon'`.
- **Workers**: `MarketplaceAuditWorker` поднимается в `index.ts` рядом с другими, отдельный concurrency=2.
- **Migration**: запускается через тот же механизм `db/migrations/`. Идемпотентный (`IF NOT EXISTS`).
- **PM2**: тот же процесс `owndev-backend`, рестарт после деплоя.

---

## 10. Что я НЕ буду трогать (memory-rules check)

- `Header.tsx` и mobile drawer — protected ✓
- Site-check / GEO Rating / GEO Audit / Site Formula — изолированы ✓
- `src/integrations/supabase/*` — не трогаем (Marketplace Audit не идёт через Supabase, только через owndev-backend Postgres) ✓
- `authMiddleware` — глобальный, новый не добавляем ✓
- Footer "Сделано ❤️ в России 🇷🇺" — остаётся ✓
- Цвета/шрифты/BrandHeroTitle — переиспользуем ✓
- LLM ключи в backend — не храним, всё через существующий llm-proxy ✓

---

## Порядок работы (после approve)

1. Миграция SQL + типы
2. Парсеры (WB, Ozon, manual normalizer) + unit-тест на фикстурах
3. Rule engine + scoring + конфиг правил
4. LLM сервис + 2 prompt'а (content_audit, rewrite)
5. Routes + worker + queue + регистрация в server.ts/index.ts
6. Frontend: API клиент → hook → pages → компоненты
7. Регистрация в tools-registry + ToolsShowcase + 2 route'а в App.tsx
8. Rate-limit whitelist для polling
9. Деплой (git pull → npm run build → migrate → pm2 restart)
10. E2E smoke-тест: WB url → preview → result; manual → result; error path

