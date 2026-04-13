

## FullReportView — улучшение читаемости на мобиле

### Изменения — 1 файл: `src/components/site-check/FullReportView.tsx`

IssueCard.tsx **не трогаем** — он используется в других местах. Вся логика уже внутри FullReportView в компоненте `IssueRow`.

### 1. Статистика в одну строку (новый блок сверху)

Добавить компактную строку над фильтрами:
```
🔴 Критично (3) · 🟠 Важно (5) · 🟡 Средне (8) · ⚪ Мелко (2)
```
Данные из уже существующего `severityCounts`. Каждый элемент кликабельный — устанавливает `severityFilter`.

### 2. Фильтры — горизонтальный скролл на мобиле

Оба ряда чипсов (severity + category) обернуть в:
```
overflow-x-auto whitespace-nowrap flex-nowrap scrollbar-hide
```
Убрать `flex-wrap`. Добавить CSS-класс `scrollbar-hide` через inline style (`msOverflowStyle: 'none', scrollbarWidth: 'none'`).

Активный чип — заливка цветом (`font-semibold ring-1 ring-current`), неактивный — `bg-muted/20 text-muted-foreground`.

### 3. Карточки с цветной левой полоской по severity

Заменить текущий `border-b border-border/10` на карточки с:
- `border-l-[3px]` + severity-цвет (`border-l-red-500`, `border-l-orange-500`, `border-l-yellow-500`, `border-l-border`)
- Лёгкий фон: `bg-red-500/5`, `bg-orange-500/5`, `bg-yellow-500/5`, `bg-muted/5`
- `rounded-lg mb-2 p-0` — визуальное разделение между карточками
- Убрать severity-бейдж из строки (полоска уже показывает severity) — оставить только category-бейдж, название, impact score, стрелку

### 4. Accordion-поведение

Уже реализовано через `expandedId` state — только одна карточка открыта. Не трогаем.

### 5. Прогресс-бар с цветом

Обернуть `<Progress>` в div с динамическим CSS-классом:
- `>= 50%` — зелёный (`[&>div]:bg-green-500`)
- `< 50%` — оранжевый (`[&>div]:bg-orange-500`)

Добавить процент в текст: `"Исправлено: X из Y (Z%)"`.

### Не меняем
- Типы `IssueCard`, `IssueSeverity`, `IssueModule`
- Логику фильтрации (`filteredIssues`, `severityCounts`, `categoryCounts`)
- Логику чекбоксов (`useIssueTracker`, `isResolved`, `toggleIssue`)
- `IssueCard.tsx` (отдельный компонент)
- Expanded content (why_it_matters, how_to_fix, example_fix, AutoFixGenerator, docs_url)

