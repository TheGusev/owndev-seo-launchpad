# Архитектурный анализ: что из v1 обязательно вшивается в v3

Документ — взгляд архитектора сайтостроения на два движка OwnDev.
Цель: понять, что в v1 является **универсальным фундаментом**,
а что — узкоспециализированной частью; и какие именно блоки v1
**обязаны** быть встроены в v3, чтобы итоговый сайт получался идеальным
по всем 23 вертикалям одновременно.

---

## 0. Атомарная разборка v1

### 0.1 Конфиги и точка входа

- `owndev-backend/config/rules.v1.json` — 416 строк; 8 вопросов,
  question_mapping, derived_scores формулы, project_class_thresholds,
  hard_triggers, 19 правил.
- `owndev-backend/config/blueprint-template.v1.json` — 17 секций отчёта
  с условиями активации.
- `owndev-backend/src/services/SiteFormula/index.ts` →
  `runEngine(rawAnswers): { engine_state, preview_payload, full_report_payload }`.
- Полностью детерминированный, **без внешних API**, без БД-вызовов
  на горячем пути — только in-memory.

### 0.2 13 dimensions (нормализованные шкалы)

Из 8 ответов wizard собирается матрица:

| Dimension | Шкала | Что измеряет |
|---|---|---|
| service_breadth | 1–3 | Сколько направлений у бизнеса |
| geo_complexity | 1–3 | Один город / районы / сеть |
| seo_weight | 0–1 | Идёт ли SEO-трафик |
| paid_weight | 0–1 | Идёт ли реклама |
| social_weight | 0–1 | Идёт ли трафик из соц. сетей |
| referral_weight | 0–1 | Идут ли рекомендации/агрегаторы |
| direct_weight | 0–1 | Идут ли прямые заходы |
| trust_requirement | 0–3 | Регулируемая ли ниша (медицина=3, юр=3) |
| restructuring_need | 0–3 | Насколько хаотичен текущий сайт |
| existing_complexity | 0–3 | Размер существующего сайта |
| conversion_complexity | 0–2 | Сколько каналов конверсии |
| scale_ambition | 0–3 | Планы по росту |
| migration_burden | 0–2 | Нужен ли перенос со старого |

### 0.3 4 derived_scores (формульные)

```
indexation_safety        = max(0, 10 - (geo_complexity*2 + service_breadth + restructuring_need))
scale_readiness          = service_breadth + geo_complexity + scale_ambition
architectural_complexity = service_breadth + geo_complexity + existing_complexity
                         + conversion_complexity + trust_requirement
restructuring_risk       = restructuring_need + migration_burden + existing_complexity
```

### 0.4 Классификация проекта

Классификатор (`projectClassifier.ts`):

- **hard_triggers** (приоритетные «жёсткие» переключатели):
  - `force_scale`: `geo_complexity≥3 AND service_breadth≥2 AND scale_ambition≥2`
  - `force_growth`: `geo_complexity≥2 AND paid_weight≥1` ИЛИ `trust_requirement≥3`
- **threshold-based**: иначе по `scale_readiness` и `architectural_complexity`.

Результат: один из трёх классов `start | growth | scale` плюс
человекочитаемая причина.

### 0.5 19 правил (P0–P4)

| Приоритет | ID | Условие | Эффект |
|---|---|---|---|
| **P0** | ONE_URL_ONE_ENTITY | always | flag: каждая страница = 1 уникальная сущность |
| **P0** | UTILITY_NOINDEX | always | flag: служебные/платные страницы всегда noindex |
| **P0** | UTILITY_NO_SITEMAP | always | flag: служебные не в sitemap |
| **P0** | UTILITY_NO_SEO_LINKING | always | flag: служебные не в перелинковке |
| **P0** | CENTRALIZED_ROUTING | always | flag: централизованный canonical и sitemap |
| **P0** | VERIFICATION_ON_SCALE | scale ИЛИ restructuring_risk≥5 | flag: верификационный проход обязателен |
| **P1** | DEMAND_MAP | always | layer: карта спроса |
| **P1** | INTENT_SEPARATION | always | layer: разделение интентов |
| **P1** | PAGE_ROLES | always | layer: явные роли страниц |
| **P2** | GEO_PAGES | geo_complexity≥2 | layer: гео-посадочные |
| **P2** | CITY_SEGMENTATION | geo_complexity≥3 | layer: сегментация по городам |
| **P2** | TRUST_COMPLIANCE | trust_requirement≥3 | layer + blocks: trust_signals, compliance_pages, eeat_structure |
| **P2** | PAID_LANDING_SEPARATION | paid_weight≥1 | layer: разделение SEO и Direct |
| **P3** | INTERNAL_LINKING | service_breadth≥2 ИЛИ geo_complexity≥2 | layer: модульная перелинковка |
| **P3** | CONVERSION_SYSTEM | conversion_complexity≥2 | layer: единая система конверсии |
| **P3** | RESTRUCTURING_NOTES | restructuring_need≥2 ИЛИ migration_burden≥2 | blocks: restructuring_plan, migration_checklist |
| **P4** | SAFE_SCALE_FILTER | scale | checks: thin_content, cannibalization, doorway |
| **P4** | ANALYTICS_INTEGRATION | paid_weight≥1 ИЛИ seo_weight≥1 | layer: аналитика и реклама |

Это **корпус знаний** v1: универсальные «архитектурные законы»
сайтостроения, не зависящие от вертикали. Они одинаково применимы
к стоматологии и к B2B-SaaS — потому что описывают **как** строить сайт,
а не **что** на сайте показывать.

### 0.6 17 секций отчёта v1

`executive_summary`, `demand_map`, `intent_layers`, `page_roles`,
`geo_architecture`, `city_segmentation`, `trust_compliance`,
`paid_separation`, `indexation_policy`, `internal_linking`,
`conversion_system`, `restructuring`, `migration_checklist`,
`analytics_integration`, `safe_scale`, `technical_stability`,
`next_steps`. Каждая активируется условием на `activated_layers`,
`activated_blocks` или `activated_checks` — детерминированно.

---

## 1. Атомарная разборка v3

### 1.1 23 типа проектов и их контракты

Все 23 кода (`service_geo`, `service_pro`, `service_b2b`, `ecommerce`,
`marketplace`, `saas`, `education`, `medical`, `legal`, `realestate`,
`mobile_app`, `finance`, `hospitality`, `events`, `nonprofit`, `gov`,
`portfolio`, `media`, `blog`, `promo_event`, `personal_brand`,
`franchise_multi`, `b2b_media`) имеют записи в таблице
`formula_page_contracts` (миграции 031, 035) с полями:

- `required_h1_pattern`, `required_title_pattern`,
- `required_meta_desc_min/max`, `h1_max_chars`, `title_max_chars`,
- `intro_answer_words_min/max` (40–80 слов),
- `faq_min_items`, `min_word_count`,
- `required_blocks[]`, `required_commercial_signals[]`,
- `required_schema_graph[]`, `schema_graph_root`,
- `must_be_indexable`, `must_be_in_sitemap`, `canonical_required`.

### 1.2 6-стадийный pipeline v3

`pipelineOrchestrator.run`:

```
INTAKE → DEMAND → CRAWL → AUDIT → PREFLIGHT → PACK
```

- **DEMAND**: `runDemandIntelligence(seeds)` → кластеры
  Wordstat + geo_distribution + recommended_geos. Авто-seed:
  `industry × city × modifiers_per_city` через
  `services/demand/profiles/` (9 профилей: services_default,
  services_emergency, medical, beauty, repair, education,
  b2b_wholesale, realestate, auto).
- **CRAWL**: `crawlSite(rootUrl, maxPages=30)` — cheerio + Jina fallback
  для SPA.
- **AUDIT**: `auditService.run({html, llms_txt, robots_txt, …})` →
  `PageEvidence` per page.
- **PREFLIGHT**: `preflightService.run(evidence)` — 32 правила (миграция 033)
  по 4 осям, с порогами `SEO ≥ 85`, `DIRECT ≥ 90`, `SCHEMA = 100`,
  `AI_LLM ≥ 85`. Если хоть одно P0 проваливается — ось = 0
  и весь gate red.
- **PACK**: `developerPackService.buildPack({strategy, passport, schema_per_page, brand}, mode)`
  → super_prompt_pack ZIP.

### 1.3 Schema-recipes (per project_code × page_type)

В `services/schemaRegistry/verticalVariants.ts` лежит матрица RECIPES:
для каждой пары `(project_code, page_type)` указан перечень нод графа
(`org`, `website`, `localbusiness`, `webpage`, `breadcrumb`, `service`,
`product`, `faq`, `article`, `event`, `person`) и вариант
(default / ecommerce / education / medical / legal / realestate /
mobile_app / finance / restaurant). Для каждой пары известно,
квалифицируется ли страница для Rich Results Google и Yandex.

### 1.4 strategyBuilder.ts — что он реально делает

Сейчас это «дамповщик контрактов из БД с привязкой кластеров»:

```
buildStrategy({project_code, brand, clusters, recommended_geos}) →
  contracts = listV3Contracts(project_code)        // из БД
  for c in contracts:
    cluster = pickClusterForPage(c.page_type, clusters)
    pages.push(generatePageContract(c, cluster))
  funnel = buildFunnelStages(pages)                // по PAGE_FUNNEL map
  primary_cta = PRIMARY_CTA[project_code]
```

То есть **structureBuilder ничего не знает** о бизнес-контексте, кроме
`project_code`. Не знает: SEO/Direct/реферал-вес, размер существующего
сайта, амбиции масштаба, нужна ли реструктуризация. **Все эти вещи
у v1 уже посчитаны** — но в strategyBuilder не приходят.

---

## 2. Что v3 уже делает из того, что умеет v1

| v1-знание | v3-аналог | Состояние |
|---|---|---|
| ONE_URL_ONE_ENTITY (P0) | `must_be_indexable`/`canonical_required` per контракт | ✅ Эквивалентно |
| UTILITY_NOINDEX (P0) | контракты для служебных страниц с `must_be_indexable=false` | ✅ Эквивалентно |
| CENTRALIZED_ROUTING (P0) | technicalPassport генерит единый sitemap.xml/robots.txt | ✅ Эквивалентно |
| DEMAND_MAP (P1) | DEMAND-стадия с Wordstat и кластерами | ✅ Сильнее (реальные данные, не теория) |
| PAGE_ROLES (P1) | page_type из контрактов + funnel_stages | ✅ Эквивалентно |
| GEO_PAGES (P2) при geo≥2 | пейджи `service-geo`, `location` в контрактах | ⚠️ Частично (нет автоматического разворачивания по городам) |
| TRUST_COMPLIANCE (P2) при trust≥3 | в pageContracts медицинских/юр-типов: required_blocks=trust_signals | ⚠️ Частично (есть в контрактах, но НЕ перевзвешено в preflight) |
| PAID_LANDING_SEPARATION (P2) при paid≥1 | — | ❌ ОТСУТСТВУЕТ в v3 |
| INTENT_SEPARATION (P1) | — | ❌ ОТСУТСТВУЕТ (нет понятия «коммерческий vs информационный интент») |
| INTERNAL_LINKING (P3) | — | ❌ ОТСУТСТВУЕТ (нет ни графа перелинковки, ни хабов) |
| CONVERSION_SYSTEM (P3) | DIRECT-ось preflight | ⚠️ Частично (per-page, без единой системы) |
| RESTRUCTURING / MIGRATION (P3) | — | ❌ ОТСУТСТВУЕТ полностью |
| SAFE_SCALE filters (P4) | — | ❌ ОТСУТСТВУЕТ (нет проверок на thin/cannibalization/doorway) |
| ANALYTICS_INTEGRATION (P4) | — | ❌ ОТСУТСТВУЕТ |
| Классификация start/growth/scale | — | ❌ ОТСУТСТВУЕТ полностью (контракты одинаковы для всех размеров) |
| derived_scores | — | ❌ ОТСУТСТВУЕТ (preflight не учитывает архитектурную сложность) |
| project_class_reason | — | ❌ ОТСУТСТВУЕТ |

**Главный вывод**: v3 — это технический исполнитель.
Он знает, **что** должно быть на странице (контракт), и проверяет,
**как** это сделано (preflight). Но он **не знает, какой это сайт по
размеру и характеру**, и поэтому строит одинаковую структуру для
маленькой бригады и сетевой клиники.

v1 — это архитектурный мозг.
Он не знает про JSON-LD, llms.txt и Rich Results, но **знает закон**:
«при geo_complexity≥3 нужно разворачивать пейдж × город», «при
trust≥3 обязательны блоки доверия», «при scale обязателен
verification pass».

---

## 3. Что в v1 — универсальный фундамент (вшивать ВСЕМ 23 типам)

Эти 9 пунктов **не зависят от вертикали** и должны быть прошиты в v3
как обязательное ядро для ЛЮБОГО проекта:

### 3.1 P0-guardrails (5 штук) — как универсальный gate

`ONE_URL_ONE_ENTITY`, `UTILITY_NOINDEX`, `UTILITY_NO_SITEMAP`,
`UTILITY_NO_SEO_LINKING`, `CENTRALIZED_ROUTING`. Сейчас они
неявно прошиты в page_contracts; нужно сделать их явными
правилами `preflight_rules` уровня P0 — чтобы любая попытка нарушить
проваливала gate во всех вертикалях.

### 3.2 P1-фундамент (3 штуки) — три обязательных слоя

`DEMAND_MAP`, `INTENT_SEPARATION`, `PAGE_ROLES` — это базовый
фундамент архитектуры сайта. v3 имеет DEMAND_MAP и PAGE_ROLES,
но **не имеет INTENT_SEPARATION**. Должна быть явная разметка:
каждый кластер Wordstat → один из четырёх интентов
(commercial / informational / navigational / transactional),
и pageContracts должны быть промечены интентами. Это нужно
**всем 23 типам** без исключения.

### 3.3 derived_scores — общая шкала размера

`scale_readiness`, `architectural_complexity`,
`indexation_safety`, `restructuring_risk`. Эти 4 числа должны
влиять на:

- размер `SiteStrategy.pages` (start: ≤8, growth: 8–25, scale: 25–60+),
- веса осей в `preflight.totalScore`,
- решение о развёртывании пейдж × город,
- решение о включении hub-страниц и тег-страниц.

### 3.4 Классификация start / growth / scale

Сейчас v3 строит ОДНУ структуру для всех. После интеграции
у каждого `project_code` появится 3 «размера» структуры —
и `buildStrategy` будет выбирать нужный.

### 3.5 P4-фильтры безопасного масштабирования

`thin_content_risk`, `cannibalization_risk`, `doorway_risk`. Должны
быть подключены **на всех scale-проектах** независимо от
вертикали. Сейчас в preflight 0 таких правил.

---

## 4. Per-vertical: где v1 даёт уникальную ценность каждому из 23 типов

Семейства из PR #18 как раз нужны здесь — они задают, **какие именно**
части v1-знания каждой вертикали критичны.

### 4.1 Семейство `local_service` (9 типов)

`service_geo`, `service_pro`, `service_b2b`, `medical`, `legal`,
`realestate`, `hospitality`, `events`, `finance`.

| Из v1 — критично | Что даёт |
|---|---|
| `geo_complexity` → GEO_PAGES + CITY_SEGMENTATION | Разворачивание `service-geo` и `location` пейджей по городам с правильными canonical |
| `trust_requirement` → TRUST_COMPLIANCE | Для medical/legal/finance: обязательные блоки trust_signals, compliance_pages, eeat_structure (Person schema, лицензии) |
| `paid_weight` → PAID_LANDING_SEPARATION | Отдельный layer paid-landings с noindex и параллельным URL-pattern (например, `/lp/...`) |
| `conversion_complexity` → CONVERSION_SYSTEM | Единая система обработки заявок (form + booking + phone) с одним dataLayer-событием |
| `restructuring_need` ≥ 2 → restructuring_plan + migration_checklist | Критично для medical/legal: переезд старого сайта без потери индексации |

Без v1 эти 9 типов получают «лендинг + контакты», даже если бизнес —
сетевая стоматология в 12 городах с паркингом из 200 услуг.

### 4.2 Семейство `ecom` (2 типа)

`ecommerce`, `marketplace`.

| Из v1 — критично | Что даёт |
|---|---|
| `service_breadth` (через категории) + `INTERNAL_LINKING` | Хаб-категории, тег-страницы, sibling-links между категориями |
| `paid_weight` → PAID_LANDING_SEPARATION | Карточки товара под Direct/Маркет vs SEO-листинги |
| `scale_ambition` → SAFE_SCALE_FILTER | Каннибализация между «купить X» / «X купить» / «X цена» — критично для каталога 1000+ позиций |
| `trust_requirement` → trust_signals | Возвраты, гарантии, отзывы как обязательные блоки |
| `conversion_complexity` → cart-конверсия как отдельный paid-flow | — |

### 4.3 Семейство `digital_product` (2 типа)

`saas`, `mobile_app`. Из PR #18 — **без городов**, индустриально-нишевые.

| Из v1 — критично | Что даёт |
|---|---|
| `INTENT_SEPARATION` | Разделение informational (статьи / glossary) от transactional (pricing / signup) — критично для конверсии в trial |
| `INTERNAL_LINKING` | Hub-страницы Use Case, перелинковка integration-страниц |
| `ANALYTICS_INTEGRATION` | dataLayer + product-analytics ивенты на каждый CTA — это уровень minimum для SaaS |
| `SAFE_SCALE_FILTER` (для mobile_app) | App-store-страница vs feature-страницы vs blog — anti-cannibalization |

`geo_complexity` и `TRUST_COMPLIANCE` НЕ нужны (NB: внутри `medical_app`
trust возвращается обратно). `paid_weight` критично — для SaaS он
обычно близок к 1.0, и без `PAID_LANDING_SEPARATION` бюджет уходит
в SEO-страницы, ломая конверсию.

### 4.4 Семейство `content_media` (3 типа)

`media`, `blog`, `b2b_media`. Без городов, без услуг.

| Из v1 — критично | Что даёт |
|---|---|
| `INTENT_SEPARATION` (informational-only) | Все страницы — informational. v3 должна это явно знать (иначе пытается ставить commercial-сигналы) |
| `INTERNAL_LINKING` | Тематические hub-страницы (теги), related-articles, автор-страницы — основа архитектуры медиа |
| `SAFE_SCALE_FILTER` | Каннибализация между статьями на схожие темы — главная проблема медиа |
| Из v1 НЕ нужно | TRUST_COMPLIANCE, PAID_LANDING_SEPARATION, CITY_SEGMENTATION, CONVERSION_SYSTEM |

Здесь как раз правильно убрать большую часть v1-слоёв — но
`INTENT_SEPARATION` критичнее, чем где-либо ещё.

### 4.5 Семейство `education` (1 тип)

`education`.

| Из v1 — критично | Что даёт |
|---|---|
| `geo_complexity` (опц.) → GEO_PAGES | Для офлайн-курсов в нескольких городах |
| `INTENT_SEPARATION` | Курс-страница (transactional) ≠ программа-страница (informational) ≠ блог о методике |
| `trust_requirement` (1 по правилам v1) → eeat_structure | Person schema преподавателей, отзывы выпускников |
| `CONVERSION_SYSTEM` | Регистрация + предоплата + бесплатное занятие — три разных flow |

### 4.6 Семейство `personal` (2 типа)

`personal_brand`, `portfolio`.

| Из v1 — критично | Что даёт |
|---|---|
| `trust_requirement` (через E-E-A-T) | Обязательны Person schema, биография, sameAs (соцсети) |
| `INTENT_SEPARATION` | Услуга / консультация / медиа-площадка — разные интенты |
| `geo_complexity` (опц.) | Для эксперта в одном городе — нужны GEO_PAGES; для онлайн-эксперта — нет |

### 4.7 Семейство `special` (4 типа)

`promo_event`, `franchise_multi`, `nonprofit`, `gov`.

| Тип | Уникальная критичность v1 |
|---|---|
| `promo_event` | Сильное `paid_weight` → обязателен PAID_LANDING_SEPARATION + utility_noindex для UTM-копий лендинга. Без этого Direct убивает SEO. |
| `franchise_multi` | Сильное `geo_complexity=3` → CITY_SEGMENTATION с поддоменами или `/city/...` + унифицированная архитектура для всех точек. **Это самый сложный кейс v1**. |
| `nonprofit` | TRUST_COMPLIANCE (отчётность, прозрачность, лицензии), CONVERSION_SYSTEM (donate-flow). |
| `gov` | TRUST_COMPLIANCE максимальный, INDEXATION_POLICY жёсткая (контракты, тендеры — noindex для архивных версий), Доступность (ARIA) как обязательный блок. |

---

## 5. Итоговая матрица: что куда вшивать

### 5.1 Уровень 1 — ЯДРО (всем 23 типам без исключений)

Все 5 P0-guardrails + 3 P1-слоя + классификация по size:

```
ALWAYS_ENABLED = {
  guardrails: [
    'one_url_one_entity',
    'utility_noindex',
    'utility_no_sitemap',
    'utility_no_seo_linking',
    'centralized_routing',
  ],
  layers: ['demand_map', 'intent_separation', 'page_roles'],
  classification: enabled,                  // start | growth | scale
  derived_scores: computed_for_pipeline,    // влияет на preflight веса
}
```

Это **обязательный фундамент** в любом проекте.

### 5.2 Уровень 2 — ПО СЕМЕЙСТВАМ (из PR #18)

```
local_service:    +geo_pages +city_segmentation +trust_compliance(если trust≥3)
                  +paid_landing_separation(если paid≥1) +conversion_system

ecom:             +internal_linking +paid_landing_separation +safe_scale_filter
                  +trust_signals(базовые) +cart_conversion_flow

digital_product:  +intent_separation(жёстко) +internal_linking +analytics_integration
                  +paid_landing_separation +safe_scale(для mobile_app)
                  -geo_pages -trust_compliance

content_media:    +intent_separation(жёстко) +internal_linking +safe_scale_filter
                  +author_eeat
                  -geo -trust -paid_landing_separation -conversion_system

education:        +intent_separation +eeat_structure(преподаватели)
                  +conversion_system(многоканальный)
                  +geo_pages(опционально)

personal:         +eeat_structure(жёстко) +intent_separation
                  +geo_pages(опционально)

special:          разный per-type → таблица 4.7
```

### 5.3 Уровень 3 — ПО SCALE-КЛАССУ (start / growth / scale)

Для **одного и того же** project_code структура должна меняться:

```
start:   pages.length ≤ 8, без hub-страниц, без тег-страниц,
         INTERNAL_LINKING выключен, SAFE_SCALE выключен,
         один primary CTA, один lead-flow

growth:  pages.length 8–25, INTERNAL_LINKING включён,
         CONVERSION_SYSTEM включён, hub-страницы появляются для
         основных категорий, ANALYTICS_INTEGRATION обязателен

scale:   pages.length 25–60+, полная развёртка пейдж × город /
         пейдж × категория, SAFE_SCALE_FILTER включён,
         RESTRUCTURING_NOTES если приходим на старый сайт,
         VERIFICATION_REQUIRED перед публикацией
```

### 5.4 Уровень 4 — ПО PRESET-КОМБИНАЦИЯМ (per dimension)

```
trust_requirement ≥ 3   → +blocks: trust_signals, compliance_pages, eeat_structure
paid_weight ≥ 1         → +layer: paid_landing_separation
geo_complexity ≥ 2      → +layer: geo_pages
geo_complexity ≥ 3      → +layer: city_segmentation
service_breadth ≥ 2     → +layer: internal_linking_system
restructuring_need ≥ 2  → +blocks: restructuring_plan, migration_checklist
project_class == 'scale'→ +checks: thin_content, cannibalization, doorway
                         +flag: verification_required
seo_weight ≥ 1 OR
paid_weight ≥ 1         → +layer: analytics_integration
```

Это **зеркало 19 правил v1**, перенесённое в v3-словарь.

---

## 6. Как это технически реализовать (без поломок)

### 6.1 Швы

Только три точки изменения:

1. `PipelineInput` — добавить `engine_state?: EngineState` (опц.)
2. `pipelineOrchestrator.run` — если есть `engine_state`, прокинуть его в:
   - `buildStrategy(...)` (новый параметр) — для класса размера и слоёв
   - `preflightService.run(...)` (новый параметр) — для весов осей
3. `developerPackService.buildPack` — фильтрация секций пака по
   `activated_layers` из engine_state.

### 6.2 Правила безопасности

- v1 остаётся **полностью нетронутой**: тот же `runEngine`,
  тот же конфиг, тот же бесплатный flow.
- `engine_state` опционален: если его нет — всё работает как сейчас.
- Изменения в `preflight` весах применяются ТОЛЬКО при наличии
  `engine_state`; иначе равные веса как сегодня.
- `buildStrategy` без `engine_state` строит как раньше; с ним —
  выбирает «start/growth/scale» вариант контрактов (контракты в БД
  можно расширить полем `tier_size: 'start'|'growth'|'scale'`).

### 6.3 UI-привязка

PRO-визард (после PR #18 он уже корректен по полям) получает
дополнительный шаг 0: «Экспресс-классификация» из 8 вопросов v1.
Можно сделать его опциональным (skip-кнопка), но при заполнении
v3-pipeline получает `engine_state` и строит идеальный сайт. Без
заполнения — работает как сейчас.

В отчёте PRO появляется секция «Архитектурное обоснование» с
выводами v1: project_class, derived_scores, decision_trace.

---

## 7. Что получит TheMaks по итогу

### 7.1 Качественно

- **Один проект — один правильный сайт**. Стоматология в одном
  городе перестанет получать 30 страниц «на всякий случай», а
  сетевая клиника — 8 страниц «как лендинг».
- **Реалистичный preflight-балл**. Сайт лендинг-формата
  не будет проваливать AI_LLM-ось из-за отсутствия 30+ JSON-LD-узлов,
  потому что для start-класса вес AI_LLM ниже.
- **Detected risks**. Скейл-проекты получат предупреждения о
  thin-content / cannibalization / doorway-рисках ДО публикации.
- **Migration-план** автоматически появляется, если приходим на
  существующий сайт.
- **Decision trace** в отчёте инвестору — «почему мы выбрали именно
  такую структуру» с привязкой к ответам клиента.

### 7.2 Численно (грубые оценки)

- Среднее время «гео-аудит зелёный» сократится ~в 2 раза для
  start-проектов (меньше пустых проверок).
- Конверсия PRO-отчёта в реальную внедрённую структуру вырастет:
  пользователь видит **обоснование**, а не «universal-pack» из 50
  страниц.

### 7.3 Что для инвестора

«У нас не один движок генерации сайта, а **два, которые работают
вместе**: архитектурный мозг (классифицирует и решает что строить)
и технический исполнитель (строит и проверяет). Это даёт нам моат
против конкурентов, у которых только одно из двух».

---

## 8. Стоп-лист (что делать НЕ нужно)

- НЕ переписывать v1. Реюзаем как есть, через прямой импорт `runEngine`.
- НЕ дублировать конфиги v1 в v3. `rules.v1.json` — единственный
  источник истины для классификации.
- НЕ удалять текущий strategyBuilder. Оборачиваем — старый код
  становится fallback для сценария «engine_state отсутствует».
- НЕ менять preflight_rules сидер. Веса осей мы перевзвешиваем
  не в БД, а runtime — по `engine_state.dimensions`.

---

## 9. Дальнейшие шаги (рекомендуемая последовательность)

1. **Документ → ревью у тебя** (этот файл). Согласуем подход.
2. **PoC-ветка** `feat/v1-v3-bridge`: расширение `PipelineInput`,
   ленивая интеграция `runEngine` без UI. Цель — увидеть на одном
   и том же вводе разницу `SiteStrategy.pages` с/без enrichment.
3. **Расширение page_contracts**: поле `tier_size`, версии start/growth/scale
   для каждого project_code.
4. **Перевзвешивание preflight**: weighted total_score по dimensions.
5. **UI**: добавление мини-визарда v1 в PRO.
6. **Отчёт**: секция «Архитектурное обоснование» с decision_trace.

Каждый шаг — отдельная feature-ветка, каждый шаг — TS-gate green,
каждый шаг — обратно совместим.
