

## Что не так и что чиним

Проблемы, которые видно на скринах и в коде:

1. **Поля ввода ужимаются на мобильных** — `ScenarioDemoForm` использует горизонтальный `flex gap-3 items-center`, из-за чего Input сжимается до «Назв», «Тема или», «https:,». Видно на всех 4 сценарных страницах (`/scenario/ai-visibility`, `/scenario/ai-ready-content`, `/scenario/brand-presence`, `/scenario/monitoring`).
2. **Дубликат кнопки** на тех же страницах: вверху большая `<Button>Запустить аудит</Button>` (просто ссылка на `/tools/site-check`), сразу под ней — форма с полем + такой же кнопкой. Один CTA должен быть.
3. **Аудит карточек WB/Ozon** (`/marketplace-audit`):
   - Кнопки «Wildberries / Ozon» разной ширины (по контенту) — нужно одинаковые, центрировать.
   - `TabsList grid-cols-3` на мобильном ломается — «Артикул Заполнить вручную» слипается в один текст (видно на скрине).
4. **Порядок секций главной** + путаница «куда нажимать»:
   - Сейчас: Hero → ServicesTeaser (4 направления) → GeoScenarios (4 AI-сценария) → HowItWorks → Testimonials → ReportValue → **ToolsShowcase** → Comparison → Blog → FAQ → Contact.
   - Пользователь видит сначала 4 «направления» (Schema, SEO, GEO, Семантика), которые выглядят как инструменты, но ведут на разрозненные страницы → путаница.
   - Флагманы (Site Check, Site Formula, Marketplace) спрятаны глубоко внизу.
   - Нужно: **GEO-сценарии вверх** (как просили на скринах — «4 сценария» в первых блоках), **флагманские инструменты сразу после Hero**, утомительный `ServicesTeaser` (дублирует ToolsShowcase) — убрать с главной.

## Решение

### 1. Новый порядок секций на главной (`src/pages/Index.tsx`)

```text
Hero
└─ FlagshipTools (новый компактный блок: 3 карточки — Site Check, Site Formula, Marketplace Audit)
GeoScenarios (4 сценария AI-видимости — то что просили вверх)
HowItWorks
ToolsShowcase (полная сетка из 13 инструментов — переезжает выше)
ReportValue
Testimonials
ComparisonSection
BlogPreview / FAQ / ContactForm
```

`ServicesTeaser` **удаляем с главной** — он дублирует ToolsShowcase и сбивает с толку (4 «направления» которые на самом деле ссылки на 4 разных тула). Сам файл оставляем — вдруг используется ещё где-то (проверю при имплементации, если только Index.tsx — удалим).

### 2. Новый компонент `FlagshipTools` (`src/components/landing/FlagshipTools.tsx`)

3 крупные карточки в ряд (на мобильном — стек), сразу после Hero. Это даст пользователю мгновенный ответ «куда нажимать»:

- **Site Check** (cyan, иконка Search) — «GEO + AI-ready аудит за 2 минуты» → `/tools/site-check`
- **Site Formula** (violet, LayoutTemplate) — «Архитектурный blueprint сайта» → `/site-formula`
- **Marketplace Audit** (emerald, ShoppingBag) — «Аудит карточек WB и Ozon» → `/marketplace-audit`

Каждая карточка — крупный CTA «Запустить →», бейдж «Флагман», glow по hover. Это визуально снимает «куда жать после Hero».

### 3. Чиним `ScenarioDemoForm.tsx`

- Layout: `flex flex-col sm:flex-row gap-3` (вертикально на мобильном, горизонтально с sm).
- Иконка убирается внутрь Input (абсолютное позиционирование) или переезжает в Label сверху — чтобы не «съедала» ширину поля.
- Кнопка `w-full sm:w-auto` + одинаковая высота `h-12` с Input.
- Input и Button получают `min-h-[48px]`, чтобы тач-таргеты были корректными.

### 4. Убираем дубликат CTA на 4 сценарных страницах

В `AiVisibility.tsx`, `AiReadyContent.tsx`, `BrandPresence.tsx`, `Monitoring.tsx`:

- Удалить большую `<Button asChild variant="hero">` в Hero-блоке (та что просто ссылка).
- Оставить только `ScenarioDemoForm` ниже подзаголовка — это и есть основной CTA с полем + кнопкой.

### 5. Чиним `MarketplaceAudit.tsx`

- **Кнопки WB / Ozon**: дать им `flex-1 min-w-[140px]` внутри `flex w-full max-w-sm mx-auto`, чтобы обе одинаковой ширины и центрированы.
- **TabsList**: на мобильном — стек или вертикальный список через `grid grid-cols-1 sm:grid-cols-3 gap-2 h-auto`. TabsTrigger — `py-3 whitespace-normal`, чтобы «Заполнить вручную» не слипалось с «Артикул».
- Текст «Заполнить вручную» сократить до «Вручную» — три коротких ровных таба читаются лучше.

### 6. Hero — оставляем как есть

Форма уже корректная (`flex-col sm:flex-row`). Не трогаем.

## Файлы

| Файл | Действие |
|---|---|
| `src/components/landing/FlagshipTools.tsx` | **New** — 3 крупные карточки флагманов сразу после Hero |
| `src/pages/Index.tsx` | **Edit** — убрать `ServicesTeaser`, добавить `FlagshipTools`, переставить порядок (GeoScenarios + ToolsShowcase выше) |
| `src/components/scenarios/ScenarioDemoForm.tsx` | **Edit** — `flex-col sm:flex-row`, иконка не съедает ширину, Input/Button одной высоты, кнопка под полем на мобильном |
| `src/pages/scenarios/AiVisibility.tsx` | **Edit** — убрать дубликат `<Button>Запустить аудит</Button>` в Hero |
| `src/pages/scenarios/AiReadyContent.tsx` | **Edit** — убрать дубликат CTA |
| `src/pages/scenarios/BrandPresence.tsx` | **Edit** — убрать дубликат CTA |
| `src/pages/scenarios/Monitoring.tsx` | **Edit** — убрать дубликат CTA |
| `src/pages/MarketplaceAudit.tsx` | **Edit** — кнопки WB/Ozon одинаковой ширины и по центру; TabsList адаптивный (стек на мобильном); сокращение «Заполнить вручную» → «Вручную» |

## Что НЕ трогаем

- Header / Footer / маршруты — не пересекаются.
- `Hero.tsx` — форма уже корректная.
- `ToolsShowcase.tsx` — сама сетка ок, только её **позиция** в Index меняется.
- `ServicesTeaser.tsx` — файл оставляю в репозитории (если используется в pSEO/GEO-страницах — не сломаем; уберу только импорт в Index).
- Бэкенд / SSE / правила памяти.
- Тексты статей блога.

## Проверка

1. **Главная**: после Hero сразу видно 3 крупные карточки флагманов (Site Check, Site Formula, Marketplace Audit) с понятными CTA «Запустить». Дальше — 4 GEO-сценария, потом полная сетка из 13 инструментов.
2. **Мобильный (375px)**: все формы на сценарных страницах — поле сверху на всю ширину, кнопка снизу на всю ширину, иконка читаема (не «Назв», а полное название).
3. **`/scenario/ai-visibility`**: один CTA вместо двух — только форма с полем + кнопкой.
4. **`/marketplace-audit` мобильный**: кнопки WB и Ozon одинаковой ширины, центрированы. Три таба «Ссылка / Артикул / Вручную» — каждый на своей строке (или в три ровные колонки), без слипания текста.
5. **Десктоп (1336px)**: визуально ничего не сломано, флагман-карточки в ряд по 3, табы в ряд по 3.
6. **Клик «Инструменты» в меню** по-прежнему ведёт на `/tools` — без изменений.

