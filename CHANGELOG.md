# Changelog

Все значимые изменения проекта документируются в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.1.0/),
проект следует [Semantic Versioning](https://semver.org/lang/ru/).

## [v3 PRO 1.0] — 2026-05-08

Первый релиз v3 PRO как живого инструмента для 23 вертикалей.
PRO-движок генерирует не просто баллы и страницы, а **отраслевой ROI-отчёт под доход**: класс проекта, decision-trace, KPI ниши, рекламные условия и сезонность.

### Added
- **9 PR-серия v3 PRO** объединена в единую релизную версию:
  - PR-1: швы — `PipelineInput.engine_state`, `tier_size` без ломки v1
  - PR-2: 6 P0-guardrails из v1, scale-фильтры, взвешивание totalScore
  - PR-3: разворачивание страниц — service-geo × N городов, category × M направлений, hub-страницы из кластеров
  - PR-4: self-test матрица 23 × 3 × 3 × 3 = **621 комбинация**, порог total ≥ 90
  - PR-5: 23 отраслевых профиля с KPI-словарём (ЧИ, CR, CPA, AOV, сезонность, intent_distribution)
  - PR-6: фронт PRO-отчёта — `ProReportPanel` с project_class, KPI, ROI, decision_trace
  - PR-7: блок «Рынок и реклама» — CPC, бюджет Я.Директа, transactional_share, competition_level, сезонность peak/now/low
  - PR-8: аудит 23 × 3 = **69 комбинаций** на 12+ инвариантов здравости отчёта
  - PR-9 (этот релиз): changelog, внутренняя документация, релизная сборка
- Тип `ProReportV3` в `pipeline/types.ts` — `project_class`, `decision_trace`, `vertical_profile`, `kpi_summary`, `axis_weights`, `roi_estimate`, `ad_market_estimate`
- Сервис `services/verticals/`: 23 профиля, `getVerticalProfile`, `listVerticalProfiles`, `seasonalityFactor`, `formatKpiSummary`
- Регресс-каркас `npm run test:bridge` — 8 регрессов, прогоняется одним скриптом

### Changed
- `pipelineOrchestrator.ts` теперь после генерации результата собирает `pro_report` через `buildProReport`
- `SiteFormulaV3.tsx` отображает `ProReportPanel` после блока Preflight Rollup, если в результате есть `pro_report`
- Расчёт ROI: revenue считается только для `monetization in {lead_gen, transaction, subscription}` — для `donation`, `brand`, `advertising`, `institutional`, `install`, `commission` revenue=0 (фикс PR-8)

### Fixed
- PR-8: revenue более не отображается у `nonprofit`/`portfolio`/`personal_brand`/`media`/`blog`/`b2b_media`/`gov`/`mobile_app` — у них нет прямой денежной транзакции
- PR-4: в self-test матрице любая из 621 комбинаций выдаёт total ≥ 90

### Hard rules (соблюдены в каждом PR)
- v1 (Free) полностью изолирован — `services/SiteFormula/` не тронут
- Wordstat не вызывается из PRO-отчёта — `ad_market_estimate` использует только уже собранный demand-снэпшот и бенчмарки
- Telegram, geo-аудит, гео-рейтинг не тронуты
- Все новые поля в типах опциональные — legacy-поведение сохранено

### Test coverage (test:bridge)
| Регресс | Что проверяет | Сценариев |
|---|---|---|
| `test:v1-untouched` | v1-фикстуры без изменений | 3 |
| `test:pr2-rules-weights` | P0-guardrails, scale-фильтры, взвешивание | — |
| `test:pr3-page-fanout` | geo × directions, hub-страницы | — |
| `test:pr4-self-test-matrix` | 23 × 3 × 3 × 3, порог total ≥ 90 | 621 |
| `test:pr5-vertical-profiles` | 23 профиля валидны | 23 |
| `test:pr6-pro-report` | Сборка pro_report | 6 |
| `test:pr7-ad-market` | Wordstat / реклама / сезонность | 9 |
| `test:pr8-vertical-audit` | Аудит 23 × 3 на здравость | 69 |
