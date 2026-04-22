

## Цель

Оживить фронтенд в стиле картинки: тёмный фон + неоновая бирюза/циан, анимированная «нейросеть» из узлов и линий, печатающийся код, геометрические лучи из углов, северное сияние на фоне. Применить точечно по тематике страниц — без перебора, гармонично. Все изменения чисто визуальные, бизнес-логику и контент не трогаем.

## Принцип

3 переиспользуемых фоновых компонента + 1 «typing code» компонент → подключаем их по 1–2 на страницу там, где тематически уместно. Никаких новых зависимостей (используем уже стоящие framer-motion + SVG + CSS keyframes). Все эффекты обязательно отключаются на mobile / `prefers-reduced-motion`.

## Что создаём (4 новых компонента)

### 1. `src/components/ui/aurora-background.tsx`
SVG/CSS «северное сияние» — медленно плывущие радиальные пятна циана, фиолетового и синего с blur(80px), opacity 0.15–0.25. 3 layer'а с разной скоростью (60s / 90s / 120s). Полностью на CSS keyframes, GPU-accelerated (transform: translate3d). Mobile: 1 слой вместо 3.

### 2. `src/components/ui/neural-network-bg.tsx`
SVG-сцена 1440×800: 18–25 узлов (circle r=3, fill cyan glow), соединённых линиями (stroke 0.5px cyan/30%). Линии «дышат» — opacity 0.2 → 0.6 по очереди (staggered animation 4s). Узлы пульсируют. Один узел в 3 секунды «вспыхивает» и пускает световой импульс по соединённой линии (используем `<animate>` SVG или framer-motion на pathLength). Точка-сетка фон между узлами (opacity 0.05). Параметры: `density="low"|"medium"|"high"`, `className`.

### 3. `src/components/ui/geometric-rays.tsx`
Тонкие угловые SVG-линии, как на скриншоте справа: от углов viewport идут ломаные линии cyan/40% толщиной 1px, с лёгким glow (filter: drop-shadow). Анимация — `stroke-dashoffset` от 1000 → 0 при появлении в viewport (intersection observer), потом подсветка бежит вдоль линии раз в 8с. 4 угла, по 2–3 ломаных в каждом. Рендерится как абсолютный inset-0 декор.

### 4. `src/components/ui/typing-code-block.tsx`
Имитация VS Code блока (как на скрине слева): тёмная подложка `bg-card/40 backdrop-blur` + рамка cyan/20%, фейковая строка вкладки, нумерация строк, посимвольная печать кода (CSS @keyframes steps() или setInterval). Принимает `lines: string[]`, `language`, `speed`. Подсветка синтаксиса — простейшая через regex (keywords, strings, comments → разные цвета через span). После завершения — мигающий курсор. Зацикленность опциональна (`loop`).

## Куда подключаем (тематически)

| Страница / Секция | Компонент | Обоснование |
|---|---|---|
| `Hero` (Index) | `AuroraBackground` поверх существующего starfield (z-[1.5], opacity 0.4) + `GeometricRays` в углах | Главный экран — максимум магии, без перебивки контента |
| `HowItWorks` (Index) | `NeuralNetworkBg density="low"` за карточками шагов — линии «соединяются» между шагами 01→02→03 | Тематика: «как работает» = нейросеть процессов |
| `FlagshipTools` / `ToolsShowcase` | `GeometricRays` слабые в углах секции | Деликатный акцент без шума |
| `SiteCheck` (страница ввода URL) | `TypingCodeBlock` справа от формы на desktop с фейковым результатом скана (`> Scanning HTML… ✓ Schema.org found ✓ FAQPage detected …`) | Прямая привязка к тематике «сканер» |
| `SiteCheckResult` (loading state в `ScanProgress`) | `NeuralNetworkBg density="medium"` + `TypingCodeBlock` с реальными этапами пайплайна | Усиливает «работу под капотом» |
| `MarketplaceAudit` hero | `NeuralNetworkBg density="medium"` за hero-блоком | Аналитика конкурентов = граф связей |
| `SiteFormula` / `SiteFormulaWizard` | `AuroraBackground` слабая | Креативный/конструкторский раздел |
| `Tools` (главная инструментов) | `GeometricRays` + `AuroraBackground` слабая | Витрина — нужен «глоу» |
| `Academy` | `NeuralNetworkBg density="low"` за hero | Обучение = знания/связи |
| `GeoRating` hero | `NeuralNetworkBg` (тематика рейтинга = граф) | |
| `scenarios/AiVisibility`, `AiReadyContent`, `BrandPresence`, `Monitoring` | По одному `TypingCodeBlock` с релевантной командой/JSON в hero | Каждый сценарий = свой кодовый сниппет |

Везде — `aria-hidden`, `pointer-events-none`, `z-[0..2]`, основной контент `relative z-10`. Не ломаем layout.

## Технические детали

- **Mobile guard:** `useEffect` + `window.matchMedia('(max-width: 768px)')` → отдаём упрощённую версию (меньше узлов, без typing) или null.
- **Prefers-reduced-motion:** `@media (prefers-reduced-motion: reduce)` глобально отключает CSS-анимации в новых компонентах через wrapper class `motion-safe-only`.
- **Производительность:** SVG, не canvas. `will-change: transform, opacity` только на анимирующихся слоях. `contain: layout paint` на контейнерах.
- **CSS:** новые keyframes (`aurora-drift`, `neural-pulse`, `ray-draw`, `code-cursor`) добавляем в `src/index.css` под `@layer utilities`. Всё токенизировано через `hsl(var(--primary))` — переключается с темой автоматически.
- **Цветовая привязка:** только существующие токены `--primary`, `--accent`, `--secondary`. Никаких хардкод-hex.
- **Z-index дисциплина:** фоновые декоры `z-[0..3]`, контент `z-10`, header `z-50` — не трогаем.

## Что НЕ трогаем

- Header, мобильный drawer, Footer (правило памяти).
- Контент, тексты, h1/h2, CTA-кнопки.
- Brand hero typography, существующие FloatingParticles/Starfield/MouseGradient (дополняем, не удаляем).
- PDF/Word экспорт (там свои стили).
- Маркетплейс / SiteFormula логика, формы, состояние.

## Порядок выполнения

1. **Шаг 1 — фундамент:** добавить keyframes в `src/index.css` + создать 4 компонента в `src/components/ui/`.
2. **Шаг 2 — Index:** Hero (aurora + rays), HowItWorks (neural), FlagshipTools (rays).
3. **Шаг 3 — SiteCheck flow:** SiteCheck (typing code), SiteCheckResult/ScanProgress (neural + typing).
4. **Шаг 4 — остальные витрины:** Tools, MarketplaceAudit, SiteFormula, Academy, GeoRating, 4 scenarios.
5. **Шаг 5 — QA:** локальный preview всех страниц на 1336×906 и mobile (375×667) → убеждаемся, что: текст читаемый, FPS ≥ 50 на десктопе, на mobile анимации редуцированы, prefers-reduced-motion отключает всё.

## Проверка

1. `/` — фон с северным сиянием за hero, угловые лучи рисуются при загрузке, в HowItWorks карточки 01→02→03 связаны живыми линиями нейросети.
2. `/tools/site-check` — справа от формы (desktop ≥ 1024px) появляется блок «псевдо-VS-Code» с печатающимся кодом сканирования.
3. `/tools/site-check/result/:scanId` (loading) — на фоне ScanProgress «дышит» нейросеть, под прогрессом печатаются логи пайплайна.
4. `/marketplace-audit`, `/site-formula`, `/tools`, `/academy`, `/geo-rating`, `/scenario/*` — у каждой свой подходящий декор (aurora или neural или rays + typing для сценариев).
5. Mobile (chrome devtools 375px) — фоны редуцированы, typing-блоки скрыты, layout не сломан.
6. DevTools Performance — никаких long tasks > 50ms от анимаций; CPU idle между кадрами.

