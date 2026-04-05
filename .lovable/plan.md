

## МЕГАФИКС: Полное восстановление и рефакторинг фронтенда

### Текущее состояние

Большая часть работы **уже выполнена** в предыдущей итерации:
- ✅ Аккордеоны (`ResultAccordion`) — работают, правильный порядок секций
- ✅ Модалка `ScoreDetailsModal` — реализована, bottom-sheet на мобильном
- ✅ Горизонтальный скролл скоров на мобильном — CSS готов
- ✅ `TechPassport` — компактная таблица, бейджи в заголовке
- ✅ `KeywordsSection` — фильтры кластеров/интентов, sub-аккордеоны
- ✅ `MinusWordsSection` — теги flex-wrap, кнопка копирования
- ✅ `CompetitorsTable` — EXCLUDE_DOMAINS фильтр, чипы
- ✅ `FullReportView` — компактные строки 44px, фильтры, прогресс
- ✅ Playfair Display подключён в `index.html` и `index.css`
- ✅ `.heading-highlight` и `.heading-highlight-gradient` CSS классы в `index.css`
- ✅ Нет `font-family` переопределений в компонентах результатов
- ✅ Нет эмодзи в заголовках секций (SiteCheckResult, LlmJudge, TechPassport, ScoreCards)

### Что нужно доработать

| # | Задача | Файл |
|---|--------|------|
| 1 | **Heading-highlight на ToolPage** — H1 рендерит `{h1}` как plain text. Нужно парсить и оборачивать ключевое слово (niche/city) в `<span className="heading-highlight-gradient">` | `src/pages/ToolPage.tsx` |
| 2 | **Heading-highlight на GeoToolPage и GeoNicheToolPage** — аналогично, выделять город/нишу | `src/pages/GeoToolPage.tsx`, `src/pages/GeoNicheToolPage.tsx` |
| 3 | **IssueCard.tsx — эмодзи severity** — файл `IssueCard.tsx` использует `emoji: "🔴"/"🟠"/"🟡"/"⚪"`. Заменить на Lucide иконки (Circle с цветом) | `src/components/site-check/IssueCard.tsx` |
| 4 | **Мобильные стили результатов** — добавить responsive классы для таблиц и секций (`.section-title`, мобильные font-size) | `src/index.css` |
| 5 | **Подзаголовок ToolPage** — ограничить `max-w-[480px]` вместо `max-w-2xl`, уменьшить шрифт через clamp | `src/pages/ToolPage.tsx` |

### Детали реализации

**1–2. Heading highlight на страницах инструментов**

В `ToolPage.tsx` строка 96-103: вместо `{h1}` plain text, создать функцию-хелпер:

```typescript
function renderHighlightedH1(h1: string, tool: Tool) {
  // Для geo-страниц выделяем город/нишу
  // Для обычных — берём последнее слово или niche из seoH1
  // Оборачиваем в <span className="heading-highlight-gradient">
}
```

Логика: если `seoH1` содержит город или нишу (из params), оборачиваем этот фрагмент. Fallback — без выделения.

Аналогично для `GeoToolPage` (строка ~85) и `GeoNicheToolPage`.

**3. IssueCard.tsx — убрать эмодзи**

Заменить `emoji` поле в `severityConfig` на Lucide-компонент:
- critical → `<Circle className="w-3 h-3 fill-red-500 text-red-500" />`
- high → `<Circle className="w-3 h-3 fill-orange-500 text-orange-500" />`
- medium → `<Circle className="w-3 h-3 fill-yellow-500 text-yellow-500" />`
- low → `<Circle className="w-3 h-3 fill-muted text-muted-foreground" />`

**4. Мобильные стили**

В `src/index.css` добавить блок:
```css
@media (max-width: 768px) {
  .site-check-result table td,
  .site-check-result table th { font-size: 12px; padding: 6px 4px; }
}
```

**5. Подзаголовок ToolPage**

Строка 104-111: изменить `max-w-2xl` → `max-w-lg`, добавить `text-[clamp(0.9rem,2.5vw,1.1rem)]`.

### Файлы (5)

| Файл | Изменение |
|------|-----------|
| `src/pages/ToolPage.tsx` | H1 highlight + подзаголовок стили |
| `src/pages/GeoToolPage.tsx` | H1 highlight города |
| `src/pages/GeoNicheToolPage.tsx` | H1 highlight ниши/города |
| `src/components/site-check/IssueCard.tsx` | Эмодзи → Lucide иконки |
| `src/index.css` | Мобильные стили для результатов |

