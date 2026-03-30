

## Fix: Competitors data structure mismatch

### 4 файла

#### 1. `src/pages/SiteCheckResult.tsx`

Строка 89 — разделить `competitors` на 3 группы:

```typescript
const rawCompetitors = Array.isArray(data.competitors) ? data.competitors : [];
const competitors = rawCompetitors.filter((c: any) => c._type === 'competitor' || (c.url && !c._type && !c._direct_meta));
const comparisonTable = rawCompetitors.find((c: any) => c._type === 'comparison_table');
const directMeta = rawCompetitors.find((c: any) => c._direct_meta);
```

Строки 154-160 — заменить блок на:
```tsx
{competitors.length > 0 && <CompetitorsTable competitors={competitors} userUrl={data.url} />}
{comparisonTable && <ComparisonTable data={comparisonTable} />}
{directMeta && <DirectMeta data={directMeta} />}
```

Добавить импорты `ComparisonTable` и `DirectMeta`.

#### 2. `src/components/site-check/CompetitorsTable.tsx` — переписать

Убрать интерфейс `CompetitorScores` и props `userScores`. Адаптировать под реальную структуру:

```typescript
interface Competitor {
  url: string;
  title?: string;
  h1?: string;
  content_length_words?: number;
  has_faq?: boolean;
  has_price_block?: boolean;
  has_reviews?: boolean;
  has_schema?: boolean;
  has_cta_button?: boolean;
  load_speed_sec?: number;
  h2_count?: number;
  images_count?: number;
  top_phrases?: string[];
}
```

Desktop таблица — колонки: Сайт | Слов | FAQ | Цены | Отзывы | Schema | CTA | Скорость (с).

Бинарные `has_*` → ✓ (зелёный) / ✗ (красный). Числовые — как есть. Mobile карточки аналогично.

#### 3. `src/components/site-check/ComparisonTable.tsx` — новый

Принимает объект `comparison_table`. Ключи объекта — названия параметров (например, "Title (длина)", "Объём контента"). Каждое значение — объект `{ you, average, leader }`.

Рендерит таблицу с 3 колонками: Параметр | Вы | Среднее | Лидер. Цвет значения "Вы": зелёный если >= leader, жёлтый если >= average, красный если < average.

#### 4. `src/components/site-check/DirectMeta.tsx` — новый

Принимает `{ ad_headline, autotargeting_categories }`. Карточка с заголовком "Рекомендации для Яндекс.Директ", показывает готовый заголовок объявления и список рекомендуемых категорий автотаргетинга как бейджи.

### Файлы

| Файл | Действие |
|------|----------|
| `SiteCheckResult.tsx` | Разделить competitors на 3 группы |
| `CompetitorsTable.tsx` | Переписать — реальные поля вместо scores |
| `ComparisonTable.tsx` | Новый — Вы vs Среднее vs Лидер |
| `DirectMeta.tsx` | Новый — заголовок + категории Директа |

