

## Цель
Исправить горизонтальный «плавающий» сдвиг на мобильной версии при скролле — страница должна жёстко фиксироваться по ширине viewport.

## Причина
На мобиле какой-то элемент выходит за пределы `100vw` (типичные виновники в этом проекте — `MouseGradient`, `ClickRipple`, `floating-particles`, `starfield-background`, `animated-grid`, декоративные absolute-блоки в Hero/секциях с отрицательными `translate`/`-left-…`/`-right-…`, или широкий контент в таблицах). Браузер позволяет скроллить вбок к этому элементу — отсюда «плавание».

## Решение (минимальное и безопасное)

### 1. Жёсткая блокировка горизонтального скролла глобально
В `src/index.css` добавить в базовый слой:

```css
@layer base {
  html, body {
    overflow-x: hidden;
    overscroll-behavior-x: none;
    max-width: 100vw;
  }
  #root {
    overflow-x: clip;        /* clip лучше hidden — не создаёт scroll-context */
    max-width: 100vw;
  }
  /* Защита от переполнения общими элементами на мобиле */
  @media (max-width: 768px) {
    img, video, svg, canvas, iframe { max-width: 100%; height: auto; }
  }
}
```

`overflow-x: clip` на `#root` + `hidden` на `html/body` — двойная страховка: даже если декоративный absolute-элемент выйдет за край, он будет обрезан без появления скролл-области.

### 2. Изоляция фиксированных декоративных слоёв
Проверить и при необходимости поправить компоненты, которые рендерятся на каждой странице через `Index.tsx`:
- `MouseGradient` (`src/components/ui/mouse-gradient.tsx`)
- `ClickRipple` (`src/components/ui/click-ripple.tsx`)

Убедиться что у их корневых элементов есть `pointer-events-none` + `fixed inset-0` + **`overflow-hidden`** на контейнере, чтобы внутренние radial-градиенты/частицы не выходили наружу.

### 3. Hero и секции с декоративными absolute-блоками
В `src/components/Hero.tsx` и `src/components/landing/*.tsx` у внешней `<section>` добавить класс `relative overflow-hidden` (если его ещё нет) — это локально обрежет декоративные `-translate-x-…`/`blur-3xl` пятна на мобиле.

## Файлы

| Файл | Действие |
|---|---|
| `src/index.css` | **Edit** — добавить глобальные правила overflow-x clipping |
| `src/components/Hero.tsx` | **Edit (если нужно)** — `overflow-hidden` на корневой секции |
| `src/components/landing/GeoScenarios.tsx`, `HowItWorks.tsx`, `ReportValue.tsx`, `ComparisonSection.tsx`, `Testimonials.tsx` | **Edit (точечно, только где есть decorative absolute)** — `overflow-hidden` на корневой секции |
| `src/components/ui/mouse-gradient.tsx`, `click-ripple.tsx` | **Edit (если нужно)** — добавить `overflow-hidden` на контейнер |

## Что НЕ трогаем
- Логику компонентов, props, состояние.
- Header/мобильное меню (защищённые правилом памяти).
- Десктопную ширину/центрирование контейнеров.

## Проверка
1. Открыть превью на мобильном viewport (375×812).
2. Проскроллить главную страницу сверху вниз — горизонтального люфта быть не должно, страница «прибита» по ширине.
3. Проверить остальные ключевые страницы: `/tools/site-check`, `/tools/conversion-audit`, `/tools/full-audit`, `/geo-rating`, `/blog`.
4. На десктопе ничего не должно измениться визуально.

