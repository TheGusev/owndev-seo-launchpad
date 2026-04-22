

## Что делаем

Две независимые задачи:
1. **Единые состояния Tabs на `/marketplace-audit`** — заметный hover/active/focus и контрастная активная вкладка на мобильных.
2. **SEO-разметка для блока «С чего начать»** — JSON-LD `ItemList` + ссылки в обычном `<a href>` (Link уже рендерит `<a>`, проверим что краулер видит).

## Часть 1. Контрастные Tabs на MarketplaceAudit

Не трогаем глобальный `src/components/ui/tabs.tsx` (его юзают другие места — Hero, scenario-формы и т.п. — глобальная замена сломает консистентность). Стилизуем **локально** через классы на `TabsList` / `TabsTrigger` в `src/pages/MarketplaceAudit.tsx`.

**`TabsList`** (заменить текущий `grid grid-cols-3 w-full h-auto gap-1`):
```tsx
<TabsList className="grid grid-cols-3 w-full h-auto gap-1.5 p-1.5 bg-muted/40 border border-border/60 rounded-xl">
```
Чуть прозрачный фон + явная граница даёт визуальный «контейнер таба» на мобильном.

**`TabsTrigger`** — единые состояния (заменить класс на каждом из трёх):
```tsx
className="
  py-3 px-3 whitespace-normal text-xs sm:text-sm font-medium rounded-lg
  text-muted-foreground border border-transparent
  transition-all duration-200
  hover:bg-card/60 hover:text-foreground
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background
  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground
  data-[state=active]:border-primary/40 data-[state=active]:shadow-[0_0_18px_hsl(var(--primary)/0.35)]
  data-[state=active]:font-semibold
"
```

Что это даёт:
- **active**: фон `--primary` (бренд-cyan), белый текст, мягкий glow — на мобильном видно за версту, в отличие от текущего `bg-background` (он почти сливается с карточкой).
- **hover**: подсветка `bg-card/60` + переход цвета.
- **focus-visible**: единое cyan-кольцо для клавиатурной навигации.
- Радиус `rounded-lg` синхронен с TabsList `rounded-xl`.

Аналогично применяем к кнопкам **Wildberries / Ozon** (строки 89-102) — они написаны вручную, не через Tabs, но визуально это тот же паттерн «сегментный контрол». Унифицируем:
- Обёртка: `bg-muted/40 border-border/60 rounded-xl p-1.5`.
- Кнопка: `flex-1 px-5 py-2.5 rounded-lg text-sm font-medium transition-all` + active state с тем же `bg-primary text-primary-foreground shadow-[0_0_18px_hsl(var(--primary)/0.35)]`, hover — `bg-card/60 text-foreground`, focus-visible с cyan-ring.

## Часть 2. SEO-разметка для «С чего начать»

В `src/components/landing/FlagshipTools.tsx`:

1. **Семантика**: добавить `id="flagship-tools"`, `aria-labelledby` на `<section>`, `id="flagship-heading"` на `<h2>`. Это уже улучшает доступность и краулинг.

2. **JSON-LD `ItemList`** через `react-helmet-async` — три SoftwareApplication item-ы с url, name, description, applicationCategory:

```tsx
import { Helmet } from "react-helmet-async";

const itemListLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Флагманские инструменты OWNDEV",
  itemListOrder: "https://schema.org/ItemListOrderAscending",
  numberOfItems: 3,
  itemListElement: flagships.map((t, i) => ({
    "@type": "ListItem",
    position: i + 1,
    url: `https://owndev.ru${t.href}`,
    item: {
      "@type": "SoftwareApplication",
      name: t.title,
      description: t.desc,
      url: `https://owndev.ru${t.href}`,
      applicationCategory: "SEOApplication",
      operatingSystem: "Web",
      offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
    },
  })),
};
```

Внутрь компонента:
```tsx
<Helmet>
  <script type="application/ld+json">{JSON.stringify(itemListLd)}</script>
</Helmet>
```

Это валидная микроразметка для Google `Carousel`/`ItemList` rich results и Яндексовых сниппетов.

3. **Индексация ссылок**:
   - `react-router-dom` `<Link to="/...">` рендерит `<a href="/...">` в DOM — Googlebot и YandexBot прекрасно его читают (после JS prerender + статика SSG из vite-plugin-sitemap уже генерирует `index.html` со ссылками).
   - Добавить `aria-label` на каждую ссылку для скрин-ридеров: `aria-label={`${tool.title} — ${tool.cta}`}`.
   - Добавить **видимый `<h3>` с обёрнутым в Link** заголовком — сейчас вся карточка ссылка, но для краулера полезно иметь явный текст ссылки. Оборачивание h3 в дополнительный link плодит дубли — оставим как есть (вся карточка — `<a>`, текст внутри: `Site Check ... Запустить аудит`).
   - Проверить что `/site-formula`, `/marketplace-audit`, `/tools/site-check` присутствуют в `vite-plugin-sitemap.ts` `staticPages` — они там уже есть (читал раньше).

4. **Доп. сигнал — `Organization` уже есть на главной (`src/pages/Index.tsx`)**. Дублировать не нужно. `ItemList` живёт прямо в компоненте, рендерится только когда `FlagshipTools` на странице.

## Файлы

| Файл | Действие |
|---|---|
| `src/pages/MarketplaceAudit.tsx` | **Edit** — единые контрастные классы на `TabsList`/`TabsTrigger` и кнопках WB/Ozon (active=primary с glow, hover, focus-visible) |
| `src/components/landing/FlagshipTools.tsx` | **Edit** — добавить `id`/`aria-labelledby`, `aria-label` на ссылках, JSON-LD `ItemList` через Helmet |

## Что НЕ трогаем

- `src/components/ui/tabs.tsx` — глобальный компонент, изменения локальные.
- Другие места с Tabs (Hero, scenario-формы и т.д.).
- `vite-plugin-sitemap.ts`, `Index.tsx` — Organization/Website LD уже на месте, sitemap содержит все три URL.
- Бэкенд / правила памяти.

## Проверка

1. **Mobile (375px)** `/marketplace-audit`: активный таб «Ссылка» — cyan фон, белый текст, заметный glow. Tap по «Артикул» — мгновенная смена активного состояния. Hover на десктопе — подсветка фона.
2. **Keyboard**: Tab → cyan ring вокруг таба, Enter переключает. То же для кнопок WB/Ozon.
3. **Кнопки WB/Ozon**: одинаковая ширина, активная — cyan с glow, неактивная — мягкий hover.
4. **Главная** → DevTools → `<head>`: новый `<script type="application/ld+json">` с `@type: "ItemList"` и тремя `SoftwareApplication`. Валидация на validator.schema.org / Яндекс.Вебмастер — без ошибок.
5. **View Source** главной: ссылки `<a href="/tools/site-check">`, `<a href="/site-formula">`, `<a href="/marketplace-audit">` присутствуют в HTML (vite-plugin-sitemap делает SSG).
6. **Google Rich Results Test** для `https://owndev.ru/` — детектит ItemList с тремя элементами.

