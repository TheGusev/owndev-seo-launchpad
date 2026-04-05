

## МЕГА-ФИКС: Роутинг, единый SEO-движок, HTTPS, техпаспорт, заголовки, мобильные скоры

### Обзор

10 пунктов запроса сводятся к 6 блокам изменений: роутинг, HTTPS-логика в backend, расширение ScoreCards (breakdown для всех 5 скоров + мобильная сетка), BrandHeroTitle компонент, техпаспорт resilience и мобильная полировка.

### Текущее состояние

- **Роутинг**: `ServicesTeaser.tsx` строка 13 — карточка "SEO-аудит" ведёт на `/tools/site-check` вместо `/tools/seo-auditor`
- **Два движка**: `seo-audit/index.ts` (531 строк, отдельные правила, `seoScore -= N`) и `site-check-scan/index.ts` (2609 строк, issues → criterion mapping). Полностью разные системы оценки
- **HTTPS**: В `site-check-scan` строка 491 — проверяется `parsedUrl.protocol !== 'https:'`, но regex маппинг строка 302 ловит и "mixed content" и "ssl" в один критерий `https`. Если URL пришёл как `https://`, issue не создаётся, но mixed content issue мапится на тот же ключ `https` → обнуляет скор
- **ScoreCards**: `breakdown` типизирован как `{ seo?, ai? }` — только 2 из 5 скоров имеют "Как рассчитан?"
- **Мобилка**: строка 75 — `flex gap-2 overflow-x-auto` (горизонтальный скролл)
- **Заголовки**: `heading-highlight-gradient` уже есть в CSS, ToolPage уже использует его. Hero использует `text-gradient`. Нет единого компонента

### Файлы

| Файл | Изменение |
|------|-----------|
| `src/components/ServicesTeaser.tsx` | SEO-аудит → `/tools/seo-auditor` |
| `supabase/functions/site-check-scan/index.ts` | Разделить criterion mapping: `https` ≠ `noMixedContent`. HTTPS pass если `parsedUrl.protocol === 'https:'` |
| `supabase/functions/seo-audit/index.ts` | Выровнять HTTPS-проверку с site-check-scan |
| `src/utils/scoreCalculation.ts` | Добавить DIRECT_CRITERIA, SCHEMA_CRITERIA, OVERALL формулу |
| `src/components/site-check/ScoreCards.tsx` | Расширить breakdown на все 5 типов + мобильная сетка 3+2 |
| `src/components/site-check/ScoreDetailsModal.tsx` | Поддержка типов `total`, `direct`, `schema` |
| `src/components/ui/BrandHeroTitle.tsx` | Новый компонент |
| `src/pages/ToolPage.tsx` | Использовать BrandHeroTitle |
| `src/pages/GeoToolPage.tsx` | Использовать BrandHeroTitle |
| `src/pages/GeoNicheToolPage.tsx` | Использовать BrandHeroTitle |
| `src/components/Hero.tsx` | Использовать BrandHeroTitle |
| `src/index.css` | Добавить `.brand-highlight`, `heroReveal`, убрать `.scores-scroll` |
| `src/pages/SiteCheckResult.tsx` | Передавать полный breakdown (all 5) в ScoreCards |

### Детали по блокам

**1. Роутинг (ServicesTeaser.tsx)**
Строка 13: `link: "/tools/site-check"` → `link: "/tools/seo-auditor"` для карточки "SEO-аудит".

**2. HTTPS баг (site-check-scan/index.ts)**
Строка 302: regex `https|http.*mixed|ssl|сертификат` ловит всё в один ключ `https`. Исправить:
- `[/^https$|не использует https|сайт не.*https/i, 'https']` — только чистый HTTPS
- `[/mixed content|http.*ресурс.*https/i, 'noMixedContent']` — отдельно mixed content
- `[/ssl|сертификат/i, 'https']` — SSL относится к HTTPS

Также добавить позитивную логику: если `parsedUrl.protocol === 'https:'` и нет issue про HTTPS → автоматически ставить criterion `https` = pass при расчёте скора (сейчас если issue нет, criterion не попадает в fail, что корректно — нужно проверить что маппинг mixed content не затирает https).

**3. Breakdown для всех 5 скоров (scoreCalculation.ts + ScoreCards)**

Добавить в `scoreCalculation.ts`:
```typescript
export const DIRECT_CRITERIA: ScoreCriterion[] = [
  { key: 'h1Specificity', label: 'Конкретность H1', weight: 20, ... },
  { key: 'h1TitleMatch', label: 'H1 ↔ Title соответствие', weight: 20, ... },
  { key: 'textCoherence', label: 'Когерентность текста', weight: 15, ... },
  { key: 'noMixedTopics', label: 'Единая тематика', weight: 15, ... },
  { key: 'commercialSignals', label: 'Коммерческие сигналы', weight: 15, ... },
  { key: 'adHeadlineReady', label: 'Готовность заголовка', weight: 15, ... },
];

export const SCHEMA_CRITERIA: ScoreCriterion[] = [
  { key: 'hasJsonLd', label: 'JSON-LD разметка', weight: 25, ... },
  { key: 'orgSchema', label: 'Organization', weight: 20, ... },
  { key: 'breadcrumb', label: 'BreadcrumbList', weight: 15, ... },
  { key: 'faqSchema', label: 'FAQPage', weight: 20, ... },
  { key: 'productOrService', label: 'Product/Service', weight: 20, ... },
];

export const OVERALL_WEIGHTS = {
  seo: 0.35, direct: 0.20, schema: 0.20, ai: 0.25,
};
```

В `ScoreCards.tsx`:
- Расширить `ScoreBreakdownData` на `{ seo?, ai?, direct?, schema?, total? }`
- `activeModal` тип: `'seo' | 'ai' | 'direct' | 'schema' | 'total' | null`
- Показывать "Как рассчитан?" у всех 5 карточек
- Для `total` — показывать формулу взвешивания вместо таблицы критериев

Мобильная сетка:
```css
/* Заменить flex overflow-x-auto на: */
grid grid-cols-3 gap-2 md:grid-cols-5 md:gap-3
/* Вторая строка: последние 2 элемента центрированы */
```
Использовать `col-span` logic: на мобильном 5 items в grid-cols-3 → первые 3 в ряд, последние 2 со смещением через `col-start-1 col-span-3` wrapper с flex justify-center.

**4. BrandHeroTitle компонент**
```tsx
interface BrandHeroTitleProps {
  prefix?: string;
  highlight: string;
  suffix?: string;
}
```
- Шрифт: `font-serif` (Playfair Display уже подключён)
- Размер: `text-[clamp(2rem,7vw,4.5rem)]`
- Highlight: `.brand-highlight` с градиентом
- Анимация: CSS `heroReveal` (opacity + translateY + blur)
- Применить на: Hero, ToolPage, GeoToolPage, GeoNicheToolPage

**5. Техпаспорт resilience**
Уже реализовано по memories (`withRetry`, `CACHE_VERSION = 2`, fallback "—"). Проверить что `TechPassport.tsx` корректно обрабатывает partial data. Минимальные правки если нужны.

**6. Backend: site-check-scan criterion mapping fix**
Строка 302 — разделить regex паттерны для `https` и `noMixedContent`. Это ключевой фикс для бага HTTPS=0.

### Объём
~8 файлов фронтенда, 2 Edge Functions. Основной объём — ScoreCards расширение и BrandHeroTitle. Backend-правки точечные (regex fix).

