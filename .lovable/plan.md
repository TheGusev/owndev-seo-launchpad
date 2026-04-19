

## PDF/Word экспорт + Score Breakdown modal для Marketplace Audit

### Часть 1 — Экспорт PDF/Word

**Создаю** `src/lib/generateMarketplaceReport.ts` — две функции в одном файле:
- `generateMarketplacePdf(data)` — копия структуры `generatePdfReport`, адаптированная под marketplace-данные
- `generateMarketplaceWord(data)` — то же, по образцу `generateWordReport`

Переиспользую `reportHelpers.ts` (PRINT_COLORS, getSeverityLabel, formatDate, truncate, шрифты Roboto). Для Word — те же стили `W` из `generateWordReport`.

**Структура отчёта** (одинаково в PDF и Word):
1. **Шапка** — OWNDEV · Аудит карточки {Платформа} · {дата}
2. **Hero** — название товара, категория, ссылка/SKU, image (только PDF)
3. **Total + 4 sub-scores** — таблица с весами (`Content 30% · Search 30% · Conversion 25% · Ads 15%`)
4. **Score breakdown** — для каждого sub-score: список факторов (`name | weight | score | reason`)
5. **AI summary** — текстовый блок
6. **Issues по impact** — таблица (severity badge | title | found | how_to_fix)
7. **Rewrite suggestions** — newTitle, newDescription, bullets, addKeywords, removeWords
8. **Keyword coverage** — covered / missing chips, coveragePct
9. **Competitor gap** — weakerThan / strongerThan / priorityAdds (если есть)
10. **Footer** — `Сделано ❤️ в России 🇷🇺` (per memory)

**Создаю** `src/components/marketplace/MarketplaceDownloadButtons.tsx` — по образцу `DownloadButtons` site-check:
- 2 кнопки: PDF / Word
- toast-уведомления "Генерируем..." → "Готово"
- состояния `isGeneratingPdf`/`isGeneratingWord` с `Loader2`
- имя файла: `owndev_marketplace_${platform}_${slug}.pdf`

**Меняю** `MarketplacePaywallCTA.tsx`:
- Принимает опциональный `result?: ResultResponse`
- Если result передан — рендерит `<MarketplaceDownloadButtons result={result} />` над текущими кнопками
- Текст хедера меняется на "Скачать отчёт" (а нижние кнопки "Связаться с нами" / "Проверить ещё карточку" остаются)

**Меняю** `MarketplaceAuditResult.tsx`:
- Передаю `result` в `<MarketplacePaywallCTA result={result} />`

### Часть 2 — Score Breakdown modal

**Создаю** `src/components/marketplace/MarketplaceScoreModal.tsx` — по образцу `ScoreDetailsModal`:
- Принимает `{ type: 'total'|'content'|'search'|'conversion'|'ads', score, breakdown: BreakdownJson, onClose }`
- Для `type='total'` — рендерит формулу:
  ```
  0.30·Content + 0.30·Search + 0.25·Conversion + 0.15·AdReadiness
  ```
  с табличкой Component × Weight = Earned, итог снизу
- Для sub-score (`content`/`search`/`conversion`/`ads`) — таблица факторов из `breakdown[type].factors`:
  - колонки: Фактор (name + reason) | Вес | Балл | статус-иконка (pass/partial/fail по score: ≥80 / 50–79 / <50)
- Внизу: `missingData` — chips «Недостаточно данных: X»
- Esc + клик по overlay для закрытия, mobile bottom-sheet (как в site-check)

**Меняю** `MarketplaceScoreCards.tsx`:
- Каждая `ScoreCard` становится кликабельной (`role="button"`, hover-эффект, cursor-pointer)
- Локальный state `const [openType, setOpenType] = useState<...|null>(null)`
- При клике открываем `<MarketplaceScoreModal type={openType} score={...} breakdown={scores.breakdown} onClose={() => setOpenType(null)} />`
- Добавляю tooltip-подсказку "Нажми, чтобы увидеть как рассчитано" под заголовком "Оценка карточки"

### Часть 3 — Что НЕ трогаю
- Backend (всё уже отдаёт `breakdown` в `scores_json`)
- Парсеры, scoring engine, routes, worker, миграцию
- Site Check / GEO Rating / Site Formula
- `Header.tsx`, mobile drawer
- Существующие `generatePdfReport.ts` / `generateWordReport.ts` (только читаем как референс)
- `reportHelpers.ts` — только импорты

### Файлы — итог

**Создать (4):**
- `src/lib/generateMarketplaceReport.ts`
- `src/components/marketplace/MarketplaceDownloadButtons.tsx`
- `src/components/marketplace/MarketplaceScoreModal.tsx`
- (обновить) `src/components/marketplace/index.ts` — barrel

**Править (3):**
- `src/components/marketplace/MarketplacePaywallCTA.tsx`
- `src/components/marketplace/MarketplaceScoreCards.tsx`
- `src/pages/MarketplaceAuditResult.tsx`

### Edge cases / null-safe
- Если `result.scores.breakdown` пустой → modal показывает «Детальная разбивка недоступна»
- Если `recommendations.newTitle` пустой → секция Rewrite в отчёте скрывается
- Если `competitors.gap` отсутствует → секция Competitor Gap в отчёте скрывается
- Все массивы через `?? []`, все строки через `?? ''`
- В download-кнопках: try/catch + error toast

### Без рефакторинга
Никаких изменений в типах, API контрактах, БД. Используем существующий `ResultResponse` как есть.

