

## Реальная причина "падения" Site Formula найдена

### Что произошло

Backend полностью рабочий (доказано прошлыми smoke-тестами). А фронт крашится в runtime прямо в момент рендера wizard:

```
Invariant Violation: Helmet expects a string as a child of <title>.
Did you forget to wrap your children in braces? (<title>{``}</title>)
```

Источник в `src/pages/SiteFormulaWizard.tsx:108`:
```tsx
<title>Site Formula — Шаг {currentStep} | OWNDEV</title>
```

JSX превращает это в массив children `["Site Formula — Шаг ", 1, " | OWNDEV"]`. `react-helmet-async` строго требует **одну строку** внутри `<title>`, иначе кидает `Invariant Violation`, и весь wizard падает (белый экран / ErrorBoundary).

Из-за этого пользователь видел "Site Formula не работает", хотя backend отдавал `preview_ready` корректно.

### Фикс — 1 строка

`src/pages/SiteFormulaWizard.tsx:108` — обернуть в template literal:

```tsx
<title>{`Site Formula — Шаг ${currentStep} | OWNDEV`}</title>
```

### Дополнительная проверка по проекту

Прогоню `code--search_files` по `<title>.*\{` во всех `src/pages/**` чтобы найти аналогичные опасные конкатенации (например в `SiteCheckResult`, `BlogPost`, `ToolPage`, `SiteFormulaPreview`). Любое место вида `<title>текст {переменная} текст</title>` починю тем же паттерном.

### Что НЕ трогаем

- Backend (работает)
- localStorage logic / resumeSession (отдельная гипотеза, оказалась неверной)
- Helmet в других местах, где внутри `<title>` уже одна строка

### Smoke-test после фикса

После применения:
1. Открыть `/site-formula/wizard` — wizard рендерится, не белый экран
2. Заполнить шаги 1-4, нажать "Собрать архитектуру"
3. Должен произойти редирект на `/site-formula/preview?session=...` с `PreviewCard`
4. В консоли — НЕТ `Invariant Violation`

