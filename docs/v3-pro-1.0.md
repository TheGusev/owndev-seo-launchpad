# v3 PRO 1.0 — внутренняя документация

> Релиз от 2026-05-08. Этот документ описывает архитектуру PRO-режима v3, контракты, инварианты и рабочие команды для разработчика, который будет дальше развивать движок.

## 1. Цель режима

PRO-режим v3 — это **отраслевой ROI-инструмент**. На вход подаётся проект (`project_code` + `engine_state` из v1) и обогащается отчётом, который пользователь видит **в баллах, в страницах, в деньгах и в контексте ниши**:

- Класс проекта (start / growth / scale)
- 23 отраслевых профиля с KPI-бенчмарками
- ROI-прогноз: визиты → лиды → продажи → выручка
- Рекламные условия: CPC, бюджет Я.Директа, конкуренция, сезонность
- Decision trace движка — все правила, которые сработали

Все 23 ниши × 3 размера × 3 геокомплексности × 3 ширины направлений (621 комбинация) при правильно заполненном `engine_state` гарантированно дают total ≥ 90.

## 2. Архитектура

```
┌──────────────────────────────────────────────────────────┐
│                 SiteFormulaV3.tsx (UI)                   │
│  • InfoQuestionnaire → /api/site-formula-v3/run          │
│  • Result: { pro_report? } → <ProReportPanel />          │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│         pipelineOrchestrator.ts (pipeline v3)            │
│  intake → demand → crawl → audit → preflight → pack      │
│                       │                                  │
│                       └─► buildProReport(input, result)  │
└────────────────────────┬─────────────────────────────────┘
                         │
┌────────────────────────▼─────────────────────────────────┐
│              proReportBuilder.ts (PR-6/7/8)              │
│                                                          │
│  • project_class из engine_state.project_class           │
│  • decision_trace (max 50)                               │
│  • vertical_profile = getVerticalProfile(project_code)   │
│  • kpi_summary = formatKpiSummary(profile.kpi)           │
│  • axis_weights, total_score_threshold                   │
│  • roi_estimate (PR-6)                                   │
│  • ad_market_estimate (PR-7)                             │
└──────────────────────────────────────────────────────────┘
```

## 3. Контракты

### 3.1 PipelineInput

Опциональное поле `engine_state` — если есть, активирует PRO-расчёты:

```ts
interface PipelineInput {
  job_id: string;
  project_code: ProjectTypeCodeV3;
  brand: { name; industry; target_audience };
  engine_state?: EngineState;   // PR-1
  tier_size?: 'start' | 'growth' | 'scale';
}
```

Без `engine_state` PRO-отчёт не строится — `pro_report = undefined`. Это дружественно к v1: бесплатные пользователи получают тот же результат, что и до v3 PRO.

### 3.2 ProReportV3

```ts
interface ProReportV3 {
  project_class?: 'start' | 'growth' | 'scale';
  project_class_reason?: string;
  decision_trace?: Array<{...}>;        // max 50
  vertical_profile?: VerticalProfile;   // из 23 шт.
  kpi_summary?: string[];
  axis_weights?: { SEO; DIRECT; SCHEMA; AI_LLM };
  total_score_threshold?: number;
  roi_estimate?: {                      // PR-6
    expected_monthly_visits;
    expected_monthly_leads?;
    expected_monthly_sales?;
    expected_monthly_revenue_rub?;
    expected_monthly_acquisition_cost_rub?;
    rationale_ru;
  };
  ad_market_estimate?: {                // PR-7
    cpc_high_intent_rub?;
    transactional_share?;
    monthly_paid_budget_rub?;
    competition_level?: 'low' | 'medium' | 'high';
    seo_payback_months?;
    seasonality_now?;
    seasonality_peak?: { month; factor };
    seasonality_low?: { month; factor };
    rationale_ru?;
  };
}
```

## 4. 23 вертикальных профиля

Файл: `owndev-backend/src/services/verticals/profiles/all.json`.

| Поле | Что хранит |
|---|---|
| `project_code` | Один из 23 кодов |
| `title_ru`, `description_ru` | Только кириллица (PR-8 проверяет) |
| `monetization` | `lead_gen` / `transaction` / `subscription` / `commission` / `donation` / `institutional` / `brand` / `advertising` / `install` |
| `kpi` | `cr_visit_to_lead`, `cr_lead_to_sale`, `average_order_rub`, `cpa_rub` |
| `benchmarks` | `cpc_high_intent_rub`, `seo_payback_months` |
| `seasonality` | Вектор из 12 коэффициентов (1.0 = средний год) |
| `intent_distribution` | Доли informational/commercial/transactional/navigational/local (сумма ≤ 1.0) |
| `demand_triggers` | Список триггеров спроса (≥ 3 элементов) |

API: `getVerticalProfile(code)`, `listVerticalProfiles()`, `seasonalityFactor(profile, month)`, `formatKpiSummary(kpi)`.

## 5. Логика ROI и Ad Market

### 5.1 ROI (PR-6, скорректирован в PR-8)

```
visits = demand.total_volume × 0.18
       (или fallback: preflight_rollup.total_pages × 30)
leads = visits × kpi.cr_visit_to_lead
sales = leads × kpi.cr_lead_to_sale

revenue = sales × kpi.average_order_rub
        ТОЛЬКО ЕСЛИ monetization ∈ {lead_gen, transaction, subscription}
```

Для `donation`, `brand`, `advertising`, `institutional`, `install`, `commission` revenue=0 — у них нет прямой денежной транзакции (фикс PR-8).

### 5.2 Ad Market (PR-7)

```
transactional_share =
  если есть demand.clusters:
    (transactional + commercial + local) / total_frequency
  иначе:
    profile.intent_distribution: transactional + commercial + local

monthly_paid_budget_rub = demand.total_volume × transactional_share × 0.18 × CPC
  (только если cpc>0 и demand.total_volume>0)

competition_level:
  score = (CPC≥300 → 2, CPC≥100 → 1) + (share≥0.7 → 1, share≥0.4 → 0.5)
  score≥2.5 → 'high'
  score≥1   → 'medium'
  иначе     → 'low'

seasonality_now  = profile.seasonality[currentMonth]
seasonality_peak = argmax(profile.seasonality)
seasonality_low  = argmin(profile.seasonality)
```

**Важно:** никаких внешних вызовов Wordstat / API. Всё считается из уже собранного demand-снэпшота и бенчмарков ниши.

## 6. Hard rules (инварианты, нарушать нельзя)

1. **v1 (Free) изолирован.** `services/SiteFormula/` не модифицируется. Все новые поля в типах должны быть опциональными.
2. **Wordstat в PRO-отчёте не вызывается.** Используется только `result.demand`, который уже собран pipeline'ом, и бенчмарки из 23 профилей.
3. **Без `engine_state` или с неизвестным `project_code` → `pro_report = undefined`.** Фронт спокойно скрывает блок.
4. **Telegram, geo-аудит, гео-рейтинг не тронуты.**
5. **Кириллица в `title_ru`/`description_ru`/`rationale_ru`.** PR-8 проверяет регэкспом.
6. **Revenue только для прямой монетизации.** См. §5.1.

## 7. Команды разработчика

```bash
# Полный регресс (8 тестов)
cd owndev-backend && npm run test:bridge

# По отдельности
npm run test:v1-untouched           # v1 не сломали
npm run test:pr2-rules-weights      # правила и веса
npm run test:pr3-page-fanout        # разворачивание страниц
npm run test:pr4-self-test-matrix   # 621 комбинация, total ≥ 90
npm run test:pr5-vertical-profiles  # валидация 23 профилей
npm run test:pr6-pro-report         # сборка pro_report
npm run test:pr7-ad-market          # Wordstat / реклама / сезонность
npm run test:pr8-vertical-audit     # аудит 69 комбинаций

# TS-gate
cd owndev-backend && npx tsc --noEmit          # backend
cd owndev-seo-launchpad && npx tsc --noEmit    # frontend
```

## 8. Расширение: как добавить 24-ю вертикаль

1. В `services/verticals/profiles/all.json` добавить новый объект с обязательными полями (project_code, title_ru, description_ru, monetization, kpi, benchmarks, seasonality, intent_distribution, demand_triggers).
2. В `types/formulaV3.ts` добавить новый код в union `ProjectTypeCodeV3`.
3. Прогнать `npm run test:bridge` — если не падает, новая вертикаль работает во всех PR-блоках.
4. Опционально: добавить эталонный сценарий в `pr8-vertical-audit.ts` для специфичной проверки.

## 9. Карта файлов PRO-режима

| Файл | Слой | Назначение |
|---|---|---|
| `services/pipeline/types.ts` | контракты | `PipelineInput`, `PipelineResultV3`, `ProReportV3` |
| `services/pipeline/pipelineOrchestrator.ts` | pipeline | Запускает стадии, в конце собирает `pro_report` |
| `services/pipeline/proReportBuilder.ts` | PRO-отчёт | `buildProReport` + `buildAdMarketEstimate` |
| `services/verticals/index.ts`, `types.ts`, `profiles/all.json` | бенчмарки | 23 профиля + API |
| `services/strategy/pageFanout.ts` | страницы | geo × directions, hub-страницы |
| `services/preflight/axisScorer.ts` | оценка | total_score, axis_avg |
| `src/components/site-formula-v3/ProReportPanel.tsx` | UI | 5 секций PRO-отчёта |
| `src/pages/SiteFormulaV3.tsx` | страница | Подключает ProReportPanel |
| `src/lib/api/formulaV3.ts` | UI-контракты | Зеркало `ProReportV3` |
