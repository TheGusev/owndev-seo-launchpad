

## Gamification & Retention: Было/Стало + To-Do чеклист

### Задача 1: Трекинг динамики «Было / Стало»

**`src/components/site-check/ScoreCards.tsx`** — добавить prop `previousScores?: ScanScores`:
- Для каждого ключа считать `diff = scores[key] - previousScores[key]`
- diff > 0: бейдж `▲ +N` зелёным (`text-emerald-500 bg-emerald-500/10`)
- diff < 0: бейдж `▼ N` красным (`text-red-500 bg-red-500/10`)
- diff === 0: серый `~ без изменений`
- Нет previousScores — ничего не показывать

**`src/pages/SiteCheckResult.tsx`** — найти предыдущий скан:
- После загрузки data: `getHistory().filter(h => h.url === data.url && h.scanId !== scanId)`, взять `[0]?.scores`
- Передать в `<ScoreCards scores={data.scores} previousScores={prevScores} />`

**`src/pages/SiteCheckReport.tsx`** — аналогично, передать previousScores в ScoreCards

### Задача 2: Интерактивный To-Do лист ошибок

**Новый файл `src/hooks/useIssueTracker.ts`:**
- Ключ localStorage: `owndev_fixes_{hostname}` (извлекать hostname из URL)
- Возвращает: `{ resolvedIds: string[], toggleIssue(id: string): void, resetFixes(): void, resolvedCount: number }`
- При toggle — добавлять/убирать id из Set, сохранять в localStorage

**`src/components/site-check/IssueCard.tsx`** — добавить props `resolved?: boolean`, `onToggle?: () => void`:
- Если onToggle определён (не locked): показать `<Checkbox />` слева от emoji
- Если resolved: карточка получает `opacity-50`, заголовок `line-through text-muted-foreground`, emoji заменяется на `<CheckCircle2 className="text-green-500" />`
- Анимация: `transition-all duration-300`

**`src/components/site-check/FullReportView.tsx`** — добавить прогресс-бар:
- Принимает `url: string` для привязки useIssueTracker к домену
- Над аккордеоном: заголовок "План исправления сайта" + "Исправлено: X из Y"
- `<Progress value={percent} />` под заголовком
- Передать `resolved` и `onToggle` в каждый `IssueCardComponent`
- При 100% — toast "Отличная работа! Запустите проверку заново."

### Задача 3: Кнопка пересканирования

**`src/components/site-check/FullReportView.tsx`** — если resolvedCount > 0:
- Показать кнопку "Обновить результаты (Пересканировать)" внизу блока
- onClick: `navigate(`/tools/site-check?url=${encodeURIComponent(url)}&rescan=true`)`

**`src/pages/SiteCheck.tsx`** — обработка `?rescan=true`:
- Из searchParams достать `url` и `rescan`
- Если оба присутствуют — автоматически вызвать `handleSubmit(url, "page")` при mount

### Файлы

| Файл | Действие |
|------|----------|
| `src/hooks/useIssueTracker.ts` | Новый — хук localStorage чеклиста |
| `src/components/site-check/ScoreCards.tsx` | previousScores + diff бейджи |
| `src/components/site-check/IssueCard.tsx` | Checkbox + resolved стиль |
| `src/components/site-check/FullReportView.tsx` | Progress bar + rescan кнопка |
| `src/pages/SiteCheckResult.tsx` | Поиск prev scan + передача previousScores |
| `src/pages/SiteCheckReport.tsx` | Передача previousScores + url в FullReportView |
| `src/pages/SiteCheck.tsx` | Auto-rescan из query params |

