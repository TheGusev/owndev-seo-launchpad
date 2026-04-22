

## Цель

Перенести «программистский» вайб (печатающийся код, Matrix-дождь, плавающие сниппеты, бинарные ленты, scan-line) **в мобильную версию**. Сейчас почти все декоративные эффекты отключены на ≤768px → мобилка выглядит пусто. На ПК всё ок — туда ничего не добавляем, только адаптируем существующее под мобилку.

## Принцип

1. Снять mobile-блокировки с уже существующих компонентов (`TypingCodeBlock`, `NeuralNetworkBg`, `GeometricRays`).
2. Создать **lite-режим** для каждого эффекта — меньше плотность, меньше элементов, меньше CPU.
3. Добавить 4 новых эффекта (`MatrixRain`, `FloatingCodeSnippets`, `BinaryStream`, `ScanLine`) сразу с mobile-first вариантами.
4. Сохранить производительность: mobile = canvas off, только CSS-анимации; reduced-motion работает.

## Что меняем в существующих компонентах

### `TypingCodeBlock` (`src/components/ui/typing-code-block.tsx`)
- **Убрать** `if (isMobile) return null;` — компонент рендерится на мобилке.
- На mobile: уменьшить шрифт до 11px, padding 12px, скрыть нумерацию строк, ширина 100%.
- Ограничить высоту `max-h-[180px] overflow-hidden` чтобы не растягивал страницу.
- На mobile: ускорить анимацию (`speed=18`, `lineDelay=120`) — короче ждать.
- Добавить prop `mobileVariant?: "compact" | "hidden"` — где код не критичен, передаём `"hidden"`.

### `NeuralNetworkBg` (`src/components/ui/neural-network-bg.tsx`)
- На mobile: `density="low"` принудительно, узлов 8 вместо 18, линий меньше.
- Не отключать полностью — должен дышать на фоне.

### `GeometricRays` (`src/components/ui/geometric-rays.tsx`)
- На mobile: оставить только 2 угла (top-left + bottom-right) вместо 4, opacity 0.3 → 0.2.

### `AuroraBackground` — уже работает на mobile (1 слой). Не трогаем.

## 4 новых эффекта (mobile-first)

### 1. `MatrixRain` — `src/components/ui/matrix-rain.tsx`
- **Mobile (≤768px):** CSS-only версия — 8 вертикальных колонок с `<span>` символами, анимация `translateY -100% → 100%` через CSS keyframes (12s loop). Никакого canvas, минимум CPU.
- **Desktop:** canvas версия (как в плане) — 35 колонок.
- Цвет cyan, opacity 0.12 mobile / 0.18 desktop.

### 2. `FloatingCodeSnippets` — `src/components/ui/floating-code-snippets.tsx`
- **Mobile:** 2 сниппета вместо 5, шрифт 10px, opacity 0.15.
- **Desktop:** 5 сниппетов, шрифт 12px, opacity 0.2.
- Чистый CSS (translateY + opacity loop, 15-25s).

### 3. `BinaryStream` — `src/components/ui/binary-stream.tsx`
- Работает одинаково везде — лента 0/1 с `translateX -50% → 0` infinite.
- **Mobile:** скорость 40s (медленнее), opacity 0.1, шрифт 9px.
- **Desktop:** 30s, opacity 0.12, шрифт 10px.

### 4. `ScanLine` — `src/components/ui/scan-line.tsx`
- Чистый CSS, работает одинаково. Mobile: opacity 0.25 вместо 0.4 (меньше отвлекает на маленьком экране).

## CSS (`src/index.css`)

Новые keyframes под `@layer utilities`:
- `binary-scroll`, `code-float-1/2/3`, `scan-line-sweep`, `matrix-fall-1..8` (8 колонок с разной скоростью/delay для CSS-варианта Matrix).
- Глобальный `@media (prefers-reduced-motion: reduce)` отключает всё.

## Куда подключаем (с фокусом на мобилку)

| Страница / Секция | Что добавить | Mobile поведение |
|---|---|---|
| `Hero` (Index) | `MatrixRain` (CSS на mobile) | Виден на мобилке, opacity 0.12 |
| `HowItWorks` (Index) | `ScanLine` + inline `TypingCodeBlock` | Typing block compact 11px |
| `FlagshipTools` (Index) | `ScanLine` + `FloatingCodeSnippets` mobile=2 шт | |
| `ToolsShowcase` (Index) | `BinaryStream` сверху + снизу | Видно на mobile, тонкая лента |
| `ServicesTeaser` (Index) | `FloatingCodeSnippets` mobile=2 | |
| `ComparisonSection` (Index) | `ScanLine` сверху | |
| `ReportValue` (Index) | `TypingCodeBlock variant="ide"` mobile=compact (под карточками, не справа) | На mobile — снизу, не сбоку |
| `BlogPreview` (Index) | `BinaryStream` сверху | |
| `Tools` (`/tools`) | `MatrixRain` + `FloatingCodeSnippets` за hero | Mobile видит фон |
| `MarketplaceAudit` hero | `FloatingCodeSnippets` + `BinaryStream` снизу hero | Mobile=2 сниппета |
| `SiteFormula` hero | `TypingCodeBlock variant="ide"` под заголовком на mobile (а не справа) + `FloatingCodeSnippets` | |
| `SiteCheck` | `MatrixRain` + типинг-блок (на mobile под формой, compact) | Сейчас скрыт — раскрываем |
| `Academy` hero | `TypingCodeBlock variant="minimal"` под заголовком на mobile | |
| `GeoRating` hero | `BinaryStream` + `FloatingCodeSnippets` mobile=2 | |
| `scenarios/*` (4 шт) | `MatrixRain` + `TypingCodeBlock` (compact на mobile, под текстом) | Сейчас typing скрыт — раскрываем |
| `Contacts` | `FloatingCodeSnippets` mobile=2 | |
| `Privacy/Terms/Refund/Offer` | НЕ трогаем | Юр. документы без декора |

Везде: декоры `z-[0..3]`, контент `z-10`, `pointer-events-none`, `aria-hidden`.

## Расширение `TypingCodeBlock` props

```ts
variant?: "ide" | "minimal" | "inline";  // "ide" default
mobileVariant?: "compact" | "hidden";     // "compact" default
```

- `compact` — уменьшенный IDE-блок без нумерации строк, max-height 180px.
- `hidden` — для случаев, где блок занимает слишком много на мобилке.

## Технические детали (производительность mobile)

- **Никаких canvas на mobile** — `MatrixRain` mobile использует CSS-only версию.
- **`will-change: transform`** только на анимирующихся элементах.
- **`contain: layout paint`** на всех декоративных обёртках.
- **Reduced-motion**: глобально отключает все keyframes, canvas (на ПК) не запускает RAF.
- **Intersection Observer**: `MatrixRain` (даже CSS) запускается только в viewport, чтобы не жрал CPU когда секция не видна.
- **Цвета**: только токены `--primary`, `--accent`, `--secondary`, `--muted-foreground`. Никаких хардкод-hex.

## Что НЕ трогаем

- ПК версию — она и так нормально выглядит. Все правки добавляют mobile-варианты, не меняют desktop.
- `Header`, мобильный drawer, `Footer` (правило памяти).
- `AuroraBackground`, `FloatingParticles`, `Starfield`, `MouseGradient`, `ClickRipple` — они уже корректно работают на mobile.
- Бизнес-логика, формы, состояние, API.
- Контент, тексты, h1/h2, CTA.
- `Privacy/Terms/Refund/Offer` страницы.
- `Tools.tsx` структура карточек (только проверим что новые фоны не пересекают карточки на mobile).

## Порядок выполнения

1. **Шаг 1 — фундамент:**
   - Добавить keyframes (`binary-scroll`, `code-float-*`, `scan-line-sweep`, `matrix-fall-1..8`) в `src/index.css` с reduced-motion guard.
   - Создать 4 новых компонента: `MatrixRain` (CSS-mobile + canvas-desktop), `FloatingCodeSnippets`, `BinaryStream`, `ScanLine`.
   - Обновить `TypingCodeBlock` — снять mobile guard, добавить props `variant` и `mobileVariant`, compact-стили.
   - Обновить `NeuralNetworkBg` и `GeometricRays` — mobile lite-режим.

2. **Шаг 2 — Index landing (mobile в первую очередь):**
   - Hero, HowItWorks, FlagshipTools, ToolsShowcase, ServicesTeaser, ComparisonSection, ReportValue, BlogPreview.

3. **Шаг 3 — флагманские страницы:**
   - SiteCheck, MarketplaceAudit, SiteFormula.

4. **Шаг 4 — остальные страницы:**
   - Tools, Academy, GeoRating, 4 scenarios, Contacts.

## Проверка после правок

1. **Mobile 375×812** (главное!):
   - `/` — за hero CSS-Matrix дождь виден; HowItWorks с inline typing-блоком; ToolsShowcase с бинарной лентой; ReportValue имеет typing-блок снизу карточек (не справа).
   - `/tools/site-check` — Matrix фон + typing-блок compact под формой (не скрыт).
   - `/marketplace-audit` — 2 плавающих сниппета `wb_id`/JSON в hero, бинарная лента снизу.
   - `/site-formula` — typing-блок под заголовком (не сбоку).
   - `/scenario/*` — Matrix + typing-блок compact под текстом.
   - `/academy`, `/geo-rating` — лёгкие декоры в hero.
2. **Desktop 1336×906**: всё что было — осталось, ничего не сломано, layout прежний.
3. **DevTools Performance mobile emulation**: CPU ≤ 30%, FPS ≥ 50, no long tasks.
4. **`prefers-reduced-motion: reduce`**: все анимации останавливаются на обоих устройствах.
5. **Layout**: typing-блоки не растягивают страницу, не вылезают за viewport, не пересекают CTA-кнопки.

