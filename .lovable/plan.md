## Что не так в тёмной теме

На скриншотах видно две группы поломок:

1. **Тайлы стадий пайплайна** (`Preflight 4-осей`, `Спрос Wordstat`, `Crawl Sitemap`, `Аудит страниц`, `Developer Pack` и т.п.) — фон `bg-green-50 / bg-red-50 / bg-amber-50/40`, текст «Готово / Ошибка» — `text-green-700 / text-red-700`. В тёмной теме сам тайл остаётся бледно-зелёным/красным, а основная подпись наследует светлый foreground → **белое на белом, читается только статус мелким шрифтом**.

2. **Карточки PRO-отчёта** (`ProReportPanel.tsx`) — большие блоки с фонами `bg-emerald-50/50` (ROI-оценка) и `bg-amber-50/40` (Рынок и реклама) + хардкод-тексты `text-emerald-700`, `text-amber-700`. Внутри них дочерние строки используют `text-muted-foreground` (светло-серый, рассчитан на тёмный фон) → **серый текст «Стоимость привлечения лидов», «CPC горячих», «Бюджет Я.Директа» сливается со светлым фоном** (точно то, что видно на IMG_6559).

   Плюс badges `CLASS_COLORS` (`bg-blue-100 text-blue-800`), `COMPETITION_COLORS` (`bg-rose-100 text-rose-800`) и рамка карточки `border-purple-200` — в dark выглядят как пастельные кляксы и плохо контрастят.

Проблемы 100% воспроизводимы в `light` и `dark` — их источник один: используются tailwind-палитры без `dark:`-вариантов, вместо семантических токенов из `index.css` (`--background`, `--foreground`, `--muted`, `--primary`, `--destructive` и пр.).

## Что меняю

### 1. `src/components/site-formula-v3/ProReportPanel.tsx`

Перевожу карточки на токен-стиль с лёгким цветным акцентом через `*/10..15` opacity (работает и в light, и в dark, текст всегда контрастен):

- Карточка PRO: `border-2 border-purple-200` → `border-2 border-primary/30`.
- Иконка `BarChart3 text-purple-600` → `text-primary`.
- `CLASS_COLORS`:
  - `start` → `bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30`
  - `growth` → `bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30`
  - `scale` → `bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30`
- `COMPETITION_COLORS`: аналогично через `*/15` + `dark:text-*-300`.
- ROI-блок: `bg-emerald-50/50` → `bg-emerald-500/5 border-emerald-500/20`. `text-emerald-700` → `text-emerald-600 dark:text-emerald-400`. `TrendingUp text-emerald-600` оставляю как есть (читается на обоих фонах).
- «Рынок и реклама»: `bg-amber-50/40` → `bg-amber-500/5 border-amber-500/20`. `text-amber-700` → `text-amber-600 dark:text-amber-400`. `Megaphone text-amber-600` ок.
- Внутренние «мини-карточки» `bg-background` оставляю — они уже на токене, просто проверяю что `text-muted-foreground` контрастен (он работает в обоих режимах, проблема была именно из-за родительского светлого фона).

### 2. `src/pages/SiteFormulaV3.tsx` — тайлы стадий пайплайна (строки 1090–1125)

Светлые фоны на состояниях done/failed/skipped → акцентные с opacity:

- `border-green-500 bg-green-50` → `border-emerald-500/40 bg-emerald-500/10`
- `border-red-500 bg-red-50` → `border-destructive/40 bg-destructive/10`
- `border-amber-300 bg-amber-50/40` → `border-amber-500/40 bg-amber-500/10`
- Цвета иконок (`text-green-600 / text-red-600 / text-amber-600`) → `text-emerald-500 / text-destructive / text-amber-500` (одинаково контрастны в обеих темах).
- Подписи статусов `text-green-700 / text-red-700 / text-amber-700` → `text-emerald-600 dark:text-emerald-400 / text-destructive / text-amber-600 dark:text-amber-400`.
- Главное: основной `text-xs font-medium` для названия стадии (сейчас наследует foreground) — оборачиваю в явный `text-foreground`, чтобы при любой теме была чёткая надпись (это убирает «белое на белом» с IMG_6557).

### 3. Не трогаю

- `PreviewCard.tsx` — там уже корректные `bg-*-500/20 text-*-400` (dark-friendly).
- `PROUpsellBlock.tsx` — тоже на `*/15` opacity, видимость в порядке.
- Никаких изменений в backend / роутах / логике.

### Проверка

После правок открыть `SiteFormulaV3` в тёмной и светлой теме → убедиться, что:
- Тайлы Preflight Rollup читаются (название стадии + «Готово/Ошибка»).
- В блоке «ROI-оценка месяц» видны все цифры и подписи `Стоимость привлечения лидов`, `Доход / мес`.
- В блоке «Рынок и реклама» видны `CPC горячих`, `Горячий спрос`, `Бюджет Я.Директа`, `Окупаемость SEO`, бэдж конкуренции.
- Бэйдж класса проекта (Стартап/Рост/Масштаб) контрастен.
