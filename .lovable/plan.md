

# OwnDev Site Formula — План внедрения

## Суть модуля

Backend-driven decision engine, который принимает ответы пользователя через wizard и генерирует архитектурный blueprint для service-site system. Вся бизнес-логика на backend, frontend только собирает ответы и рендерит payload.

## Текущее состояние

- Модуля Site Formula **не существует** — начинаем с нуля
- Backend: Fastify + postgres.js + BullMQ + Redis на собственном сервере
- Frontend: React 18 + Vite + Tailwind, тёмная тема с cyan/purple акцентами
- Существующие паттерны: routes в `owndev-backend/src/api/routes/`, сервисы в `services/`, типы в `types/`

## Архитектура

```text
┌─────────────────────────────────────────────────────┐
│  FRONTEND (React)                                    │
│  /site-formula         — product landing             │
│  /site-formula/wizard  — wizard (steps)              │
│  /site-formula/preview — preview result              │
│  /site-formula/report  — full blueprint (gated)      │
│                                                      │
│  State: sessionId + answers in localStorage          │
│  API calls → POST/GET /api/v1/site-formula/*         │
│  Renders only server payload, no business logic      │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP (proxied via Vite / nginx)
┌──────────────────────▼──────────────────────────────┐
│  BACKEND (Fastify)                                   │
│                                                      │
│  Routes: owndev-backend/src/api/routes/siteFormula   │
│  Service: owndev-backend/src/services/SiteFormula/   │
│    ├─ configLoader.ts                                │
│    ├─ answerNormalizer.ts                             │
│    ├─ engineStateFactory.ts                           │
│    ├─ priorityRuleExecutor.ts                        │
│    ├─ derivedScoreCalculator.ts                      │
│    ├─ projectClassifier.ts                           │
│    ├─ decisionTraceBuilder.ts                        │
│    ├─ reportBlockActivator.ts                        │
│    ├─ previewPayloadBuilder.ts                       │
│    ├─ fullReportPayloadBuilder.ts                    │
│    └─ runtimeValidator.ts                            │
│                                                      │
│  Config: config/rules.v1.json                        │
│          config/blueprint-template.v1.json           │
│                                                      │
│  DB: blueprint_sessions, blueprint_reports           │
└─────────────────────────────────────────────────────┘
```

## Поэтапный план реализации

Из-за масштаба задачи — разбиваем на **4 итерации** (каждая — отдельный approve):

---

### Итерация 1: Backend Runtime Engine + DB + API

**Создаваемые файлы:**

**Config (JSON source of truth):**
- `owndev-backend/config/rules.v1.json` — полный ruleset с P0-P4 rules, thresholds, hard triggers, question mappings
- `owndev-backend/config/blueprint-template.v1.json` — template contract для report blocks

**Backend service modules (`owndev-backend/src/services/SiteFormula/`):**
- `configLoader.ts` — загрузка + checksum validation JSON конфигов
- `answerNormalizer.ts` — нормализация raw ответов wizard
- `engineStateFactory.ts` — создание initial engine state из normalized answers
- `questionMapper.ts` — маппинг вопросов wizard → engine dimensions
- `priorityRuleExecutor.ts` — применение rules P0→P4, conflict logging
- `derivedScoreCalculator.ts` — расчёт composite scores (indexation_safety, scale_readiness и т.д.)
- `projectClassifier.ts` — определение project_class (start/growth/scale) через thresholds + hard triggers
- `decisionTraceBuilder.ts` — формирование decision_trace с rule_id, priority, effect, reason_human
- `reportBlockActivator.ts` — активация блоков blueprint на основе engine state
- `previewPayloadBuilder.ts` — сборка preview payload (project_class, key layers, reasons)
- `fullReportPayloadBuilder.ts` — сборка полного report payload из activated blocks
- `runtimeValidator.ts` — валидация payload contracts, version check
- `index.ts` — orchestrator: run(answers) → engine state → payload

**DB migration:**
- `owndev-backend/src/db/migrations/002_site_formula.sql` — таблицы: `blueprint_sessions`, `blueprint_reports`

**Types:**
- `owndev-backend/src/types/siteFormula.ts` — все TypeScript типы модуля

**API routes:**
- `owndev-backend/src/api/routes/siteFormula.ts` — 6 endpoints:
  - `POST /sessions` — создать сессию
  - `POST /sessions/:id/answers` — сохранить ответы шага
  - `POST /sessions/:id/run` — запустить engine
  - `POST /sessions/:id/unlock` — разблокировать полный отчёт
  - `GET /sessions/:id` — получить сессию с preview/full payload
  - `GET /sessions/:id/debug-trace` — admin-only debug

**Изменяемые файлы:**
- `owndev-backend/src/api/server.ts` — регистрация нового route plugin
- `owndev-backend/src/index.ts` — без изменений (server.ts подтянет автоматически)

---

### Итерация 2: Frontend — Product Page + Wizard + Session

**Создаваемые файлы:**

**Pages:**
- `src/pages/SiteFormula.tsx` — product landing page
- `src/pages/SiteFormulaWizard.tsx` — wizard page (step-based)
- `src/pages/SiteFormulaPreview.tsx` — preview result page
- `src/pages/SiteFormulaReport.tsx` — full blueprint page (gated)

**Components (`src/components/site-formula/`):**
- `WizardStepRenderer.tsx` — рендер текущего шага
- `WizardProgress.tsx` — прогресс-бар
- `WizardNavigation.tsx` — next/back buttons с валидацией
- `PreviewCard.tsx` — карточка preview результата
- `PreviewReasons.tsx` — human-readable объяснения решений
- `BlueprintSection.tsx` — секция полного отчёта
- `UnlockCTA.tsx` — paywall/unlock block
- `FormulaProductHero.tsx` — hero секция product page

**Hooks/API:**
- `src/lib/api/siteFormula.ts` — API client для site-formula endpoints
- `src/hooks/useSiteFormulaSession.ts` — hook для управления сессией

**Изменяемые файлы:**
- `src/App.tsx` — добавить 4 новых Route
- `src/data/tools-registry.ts` — добавить Site Formula в реестр инструментов

---

### Итерация 3: Full Blueprint Rendering + Export + Paywall

- Рендер полного blueprint документа из server payload
- Export PDF/Word (аналогично существующему `generatePdfReport.ts`)
- Paywall flow (unlock → показ полного отчёта)
- Mobile-first адаптация всех страниц
- Loading skeletons, error states, empty states

---

### Итерация 4: Admin/Debug Layer + QA + Hardening

- Admin debug trace UI (internal only)
- 15+ scenario tests
- Race condition protection (repeated run/unlock)
- Config checksum validation
- Rule conflict logging
- Smoke tests
- QA report

---

## Архитектурные риски и защита

| Риск | Защита |
|------|--------|
| Бизнес-логика утечёт на frontend | Frontend получает готовый payload, не имеет rules.v1.json |
| Template начнёт принимать решения | Template только описывает структуру блоков, активация — на backend |
| P0 guardrails обойдут | P0 применяются первыми, их effects immutable для нижних приоритетов |
| Utility pages попадут в sitemap | Page `/site-formula/report` — noindex; sitemap plugin не включает динамические пути |
| Повторный run/unlock сломает state | Backend: idempotent run, unlock с проверкой статуса |
| Сломает существующий проект | Модуль изолирован: отдельные routes, отдельные DB таблицы, отдельные компоненты |
| Поврежденный JSON config | configLoader валидирует schema + checksum при загрузке |

## Что НЕ меняем

- Header.tsx / mobile drawer (memory constraint)
- Существующие API routes (audit, monitor, siteCheck)
- Существующие DB таблицы
- src/integrations/supabase/client.ts и types.ts
- .env

## Технические детали

- JSON configs (`rules.v1.json`, `blueprint-template.v1.json`) будут содержать полное описание вопросов wizard, rules с приоритетами, thresholds для project_class, template blocks
- Backend runtime детерминирован: одинаковые ответы → одинаковый результат
- Все решения traceability: каждый effect привязан к rule_id в decision_trace
- Frontend wizard: 5-7 шагов, вопросы на бизнес-языке (не SEO-термины)
- Session persistence: localStorage (sessionId) + server-side storage (answers, state)

## Запрос на подтверждение

Предлагаю начать с **Итерации 1** (Backend Runtime Engine + DB + API). После её завершения и проверки — перейдём к frontend. Это гарантирует, что engine работает корректно до подключения UI.

