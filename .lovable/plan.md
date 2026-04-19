

## Рефакторинг result-страницы + Phase 1 LLM (keyword_fit + competitor_gap)

### Часть 1 — Frontend: разнос на компоненты

Создаю `src/components/marketplace/` и выношу секции один-в-один из текущей `MarketplaceAuditResult.tsx`. Никакой логики не меняем — только структура.

**Новые файлы:**
- `MarketplaceHero.tsx` — фото + Badge платформы/категории + title + AI-summary
- `MarketplaceScoreCards.tsx` — 5 карточек (Total + 4 sub-scores) + внутренний `ScoreCard`
- `IssuesByImpact.tsx` — список top-8 issues, sort by impact desc, severity-бейдж, why/how/example
- `RewriteSuggestions.tsx` — newTitle/newDescription с copy-to-clipboard, bullets, addKeywords/removeWords
- `CompetitorGap.tsx` — новый блок: weakerThan / strongerThan / priorityAdds (Phase 1 LLM)
- `KeywordCoverage.tsx` — donut-progress + chips covered/missing + бейдж source ('llm'/'naive')
- `MarketplacePaywallCTA.tsx` — финальный блок CTA
- `EmptyStates.tsx` — `MarketplaceLoadingCard`, `MarketplaceErrorCard` (вынесенные loading/error из page)
- `index.ts` — barrel export

**Что меняется в `MarketplaceAuditResult.tsx`:**
- Удаляются inline-секции и `ScoreCard`/`Label` хелперы
- Page становится тонким composer'ом: `<Header/> → <Hero/> → <ScoreCards/> → <IssuesByImpact/> → <RewriteSuggestions/> → <CompetitorGap/> → <KeywordCoverage/> → <PaywallCTA/> → <Footer/>` с null-safe условиями
- Loading/error → `<MarketplaceLoadingCard/>` / `<MarketplaceErrorCard/>`

### Часть 2 — Backend: добавить 2 LLM-промпта (Phase 1)

**`owndev-backend/src/services/MarketplaceAudit/llm/prompts.ts`** — добавить:

1. `buildKeywordFitMessages(p)` + `KEYWORD_FIT_TOOL`
   - Вход: title, description, category, attributes
   - Выход: `{ covered: string[], missing: string[], coveragePct: number, suggestedKeywords: string[] }`
   - Цель: LLM знает специфику ниши и даёт реальные ключи категории

2. `buildCompetitorGapMessages(p, competitors)` + `COMPETITOR_GAP_TOOL`
   - Вход: наша карточка (title/desc/attrs) + список manual competitor URL'ов (только URL — без скрейпа на этом этапе) ИЛИ список названий, если есть
   - Выход: `{ weakerThan: [{aspect, evidence}], strongerThan: [{aspect, evidence}], priorityAdds: string[] }`
   - Если конкурентов нет — секция вообще не запускается (фронт показывает empty state)

**`owndev-backend/src/types/marketplaceAudit.ts`** — расширить:
- `CompetitorBlock` оставляем как есть (используется для списка URL)
- Новый `CompetitorGapBlock { weakerThan: GapItem[]; strongerThan: GapItem[]; priorityAdds: string[]; source: 'llm'|'fallback' }`
- В `MarketplaceAuditRow` добавить `competitor_gap_json` (или храним внутри `competitors_json` как `{ list: CompetitorBlock[]; gap: CompetitorGapBlock | null }`) — выберу второй вариант, чтобы не делать миграцию.
- Расширить `KeywordsBlock` полем `source: 'llm'|'naive'` (опционально, default 'naive')

**`src/lib/marketplace-audit-types.ts`** — зеркалить эти изменения.

**`owndev-backend/src/services/MarketplaceAudit/index.ts`** — обновить оркестратор:
- После `content_audit` + до `rewrite` запустить параллельно `keyword_fit` и (если есть competitorUrls) `competitor_gap`
- Если `keyword_fit` успешен → перезаписать `keywords` (covered/missing/coveragePct/source='llm') + добавить suggested в `search.missing` для последующего rewrite
- Если `competitor_gap` успешен → положить в `competitors` структуру `{ list, gap }`
- Все try/catch + best-effort (не валим аудит при сбое LLM)

**`owndev-backend/src/db/queries/marketplaceAudits.ts`** + route `/result/:id`:
- Поле `competitors_json` теперь хранит `{ list: CompetitorBlock[]; gap: CompetitorGapBlock | null }` — обратная совместимость через детект формы (если массив — старый формат, оборачиваем `{ list: ..., gap: null }`)

### Часть 3 — Component tree (итог)

```text
MarketplaceAuditResult
├── Header
├── EmptyStates.MarketplaceErrorCard         (если error)
├── EmptyStates.MarketplaceLoadingCard       (если !result)
└── (result) :
    ├── MarketplaceHero
    ├── MarketplaceScoreCards
    ├── IssuesByImpact          (если issues.length)
    ├── RewriteSuggestions      (если recommendations.newTitle)
    ├── CompetitorGap           (если competitors.gap || competitors.list)
    ├── KeywordCoverage         (если keywords.* > 0)
    ├── MarketplacePaywallCTA
└── Footer
```

### Часть 4 — Что НЕ трогаю
- Парсеры, scoring engine, rule engine, queue/worker, миграцию (всё работает)
- Routing, App.tsx, Header
- Site Check / GEO Rating / Site Formula
- Никаких новых таблиц / миграций — всё в существующих jsonb-полях

### Часть 5 — Деплой после approve
1. Frontend live сразу (Lovable build)
2. Backend требует `git pull && npm run build && pm2 restart owndev-backend` на сервере (как и в прошлый раз)

