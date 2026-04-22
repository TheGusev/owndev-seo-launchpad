

## Цель

Прокачать страницу `/geo-rating` под реальные данные: показать `schema_score` и `direct_score` как числа, корректно обрабатывать «пустые/устаревшие» строки, фильтровать и сортировать по среднему из 4 скоров, показывать дату последней проверки.

## Правки

### 1. `src/data/geo-rating-types.ts`

Расширить тип входной row и `GeoRatingEntry`:

```ts
export type GeoRatingEntry = {
  rank: number;
  brandName: string;
  domain: string;
  category: string;
  llmScore: number;
  seoScore: number;
  schemaScore: number;   // NEW
  directScore: number;   // NEW
  hasLlmsTxt: boolean;
  hasSchema: boolean;
  hasFaq: boolean;
  issuesCount: number;
  topErrors: string[];
  verifiedAt: string;
};
```

В `mapDbRowToEntry` добавить:
```ts
schemaScore: row.schema_score,
directScore: row.direct_score,
```
+ расширить тип `row` полями `schema_score: number; direct_score: number;`.

### 2. `src/pages/GeoRating.tsx`

**a) Колонки таблицы (desktop)**

Шапка и строки — новая grid-template:
```text
[#  Сайт  Категория  LLM  SEO  Schema  Direct  llms.txt  Ошибки  Last]
```
- Убрать булевы колонки **Schema** (галочка) и **FAQ** — заменить на цифровые `Schema` и `Direct`.
- `llms.txt` колонку оставить (полезный бинарный сигнал).
- Добавить мини-колонку «Last» с относительной датой (`22.04` или «3д»).
- Цвета чисел через `scoreColor()` как у LLM/SEO.

Новый шаблон сетки: `grid-cols-[2.5rem_1fr_7rem_3.5rem_3.5rem_3.5rem_3.5rem_3.5rem_3.5rem_4rem]` (10 колонок).

**b) Логика «нет данных / устарело»**

Хелпер:
```ts
const isStale = (r: any) => {
  const days = (Date.now() - new Date(r.last_checked_at).getTime()) / 86400000;
  return days > 7;
};
const isEmpty = (r: any) =>
  r.llm_score === 0 && r.seo_score === 0 &&
  r.schema_score === 0 && r.direct_score === 0;
```

- Строка с `isEmpty` → класс `opacity-40`, числовые скоры заменяются на `—`.
- В сортировке `isEmpty` всегда уходят в конец (compare-функция: empty → +Infinity).
- В expanded-блоке для устаревших — `<AlertTriangle/> Данные устарели`.

**c) Фильтр по среднему скору**

Заменить текущий фильтр по `llm_score`:
```ts
const avgScore = (r: any) =>
  Math.round((r.llm_score + r.seo_score + r.schema_score + r.direct_score) / 4);

.filter(r => {
  const a = avgScore(r);
  return (cat === "Все" || r.category === cat) && a >= f.min && a <= f.max;
})
```

Также метку фильтра поменять с «LLM Score:» на «Средний скор:».

**d) Сортировка**

Добавить пресеты `Schema ↓`, `Direct ↓`, `Средний ↓`. Сделать `Средний ↓` дефолтным (вместо `LLM Score`):
```ts
{ label: "Средний ↓", key: "avgScore" },
{ label: "LLM ↓", key: "llmScore" },
{ label: "SEO ↓", key: "seoScore" },
{ label: "Schema ↓", key: "schemaScore" },
{ label: "Direct ↓", key: "directScore" },
{ label: "Алфавит", key: "brandName" },
```
В sort-функции — сначала пушим `isEmpty` в конец, затем сравниваем по выбранному ключу.

**e) Mobile-строка**

В свёрнутом виде (сейчас показывает только LLM-бейдж) — оставить тот же лейаут, но бейдж с числом — это **средний скор**, плюс маленький `<AlertTriangle/>` если устарело или пусто.

**f) Expanded-блок (раскрытая строка)**

Сетка скоров `grid-cols-2 gap-3 mb-4 max-w-md` теперь содержит 4 ячейки (2×2): LLM, SEO, Schema, Direct — с теми же цветами и подписями.

Под списком ошибок добавить блок:
```tsx
<div className="text-xs text-muted-foreground/60 mt-3 flex items-center gap-2">
  Последняя проверка: {new Date(entry.verifiedAt).toLocaleDateString("ru-RU")}
  {stale && <span className="inline-flex items-center gap-1 text-yellow-400">
    <AlertTriangle className="w-3 h-3" /> Данные устарели
  </span>}
</div>
```

**g) Топ-метрики хедера**

«Ср. LLM Score» оставить, но добавить рядом «Ср. Schema Score» и «Ср. Direct Score» (обе считаются игнорируя `isEmpty` строки, чтобы не занижать среднее нулями). Если выходит больше 4 плиток — на мобильном они уже flex-wrap, ок.

## Файлы

| Файл | Действие |
|---|---|
| `src/data/geo-rating-types.ts` | **Edit** — добавить `schemaScore`/`directScore` в тип и маппинг, расширить тип row |
| `src/pages/GeoRating.tsx` | **Edit** — новые колонки Schema/Direct/Last, удалить булевы Schema+FAQ, фильтр и сортировка по avgScore, обработка `isEmpty`/`isStale`, 4 скора в expanded, дата проверки + предупреждение об устаревших данных |

## Что НЕ трогаем

- Backend `/api/v1/site-check/geo-rating` — данные уже отдаются с нужными полями.
- Header / Footer / маршрутизация / другие страницы.
- Логика номинаций, методологии, шаринга.
- `SiteCheckWorker` upsert в `geo_rating` — он уже пишет `schema_score`/`direct_score`.
- Правила памяти.

## Проверка

1. `/geo-rating` desktop: видны числовые колонки **Schema** и **Direct** после **SEO**, цвета совпадают со схемой scoreColor. Булевых Schema и FAQ больше нет.
2. Колонка **Last** показывает дату последней проверки.
3. Сайты с нулевыми скорами — приглушены (opacity-40), показывают `—`, всегда в конце списка независимо от сортировки.
4. Фильтр «80+» отбирает по среднему из 4 скоров (а не только LLM).
5. Сортировка по «Schema ↓» / «Direct ↓» / «Средний ↓» работает корректно.
6. Раскрытие строки → 4 плитки скоров (2×2) + подпись «Последняя проверка: 22.04.2026», для записей старше 7 дней — иконка `AlertTriangle` + «Данные устарели».
7. Mobile: бейдж в правой части — средний скор; устаревшие/пустые — приглушены, иконка предупреждения.
8. После следующего ресканирования числа меняются автоматически без релоада (refetch staleTime 30s).

