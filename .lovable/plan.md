

## GEO Рейтинг — Product Truth Redesign

### Принцип: "Сначала trust, потом wow"

---

### 1. Типизированная data-модель snapshot

Создать `src/data/geo-rating-types.ts` с типами:

```typescript
type GeoRatingSnapshot = {
  version: string;            // "2026-Q2-W15"
  updatedAt: string;          // ISO date
  methodology: string;        // краткое описание
  source: string;             // "OWNDEV audit engine"
  entriesCount: number;
}

type GeoRatingEntry = {
  rank: number;
  brandName: string;
  domain: string;
  category: string;
  llmScore: number;
  seoScore: number;
  hasLlmsTxt: boolean;
  hasSchema: boolean;
  hasFaq: boolean;
  issuesCount: number;
  topErrors: string[];
  verifiedAt: string;
}
```

Данные по-прежнему загружаются из БД (таблица `geo_rating`), но маппятся в эти типы. Snapshot-метаданные (version, methodology) — из констант, пока нет отдельной таблицы.

### 2. Удаление недостоверных метрик

- **Убрать `direct_score`** из таблицы и expanded view — нет прозрачного source-of-truth
- **Убрать `schema_score`** из expanded view — дублирует `has_schema` boolean, числовое значение не обосновано
- В expanded view оставить только: LLM Score, SEO Score, top errors, verifiedAt, CTA

### 3. Компонент SiteBadge

Создать `src/components/ui/site-badge.tsx`:
- Принимает `domain` и `brandName`
- Пытается загрузить favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
- Fallback: monogram (первая буква brandName) в стилизованном круге
- Единый размер 28x28, border-radius, тёмный фон, subtle border
- Без glow, без градиентов, минималистично

### 4. Hero-блок — продуктовый, не лендинговый

Убрать декоративность, добавить trust-блок:

```text
┌─────────────────────────────────────────┐
│  GEO Рейтинг Рунета 2026              │
│  AI-готовность популярных сайтов России │
│                                         │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐  │
│  │ N    │ │ Avg  │ │ %txt │ │ %faq │  │
│  │сайтов│ │ LLM  │ │llms  │ │ FAQ  │  │
│  └──────┘ └──────┘ └──────┘ └──────┘  │
│                                         │
│  Обновлено: 07.04.2026                 │
│  Методология: 50+ GEO/SEO/AI сигналов │
│  Источник: OWNDEV audit snapshot       │
│                                         │
│  [Проверить свой сайт]  [Поделиться]   │
└─────────────────────────────────────────┘
```

### 5. Таблица — analytics UI

- Добавить `SiteBadge` перед именем бренда
- Sticky header на десктопе
- Убрать zebra striping через opacity hack → чистые `border-b border-border/10`
- Boolean значения (llms.txt, Schema, FAQ): `CheckCircle2` (green) / `XCircle` (muted) вместо ✓/✗ текста
- Hover: `hover:bg-white/[0.03]` — мягкий, не кислотный
- Колонки: `#` | `SiteBadge + Бренд (домен)` | `Категория` | `LLM` | `SEO` | `llms.txt` | `Schema` | `FAQ` | `Ошибки`
- Убрать Trophy emoji для top-10 → subtle gold left-border для строк 1-3

### 6. Expanded row — полезный, не декоративный

Вместо 4-х score-карточек:
- Два score: LLM Score и SEO Score (крупно, цветом)
- Top issues (до 3 штук, как сейчас)
- `Проверено: {verifiedAt}` — мелким текстом
- `Источник: OWNDEV audit snapshot` — мелким текстом
- CTA "Полный аудит" — остаётся
- Badge code — остаётся для top-10

### 7. Файлы и объём

| Файл | Действие | Строк |
|------|----------|-------|
| `src/data/geo-rating-types.ts` | Создать — типы snapshot + entry | ~30 |
| `src/components/ui/site-badge.tsx` | Создать — favicon/monogram badge | ~50 |
| `src/pages/GeoRating.tsx` | Переработать — hero, таблица, expanded | ~250 |

### Что НЕ трогаем

- Backend, API, workers, queue — 0 изменений
- Таблица `geo_rating` в БД — без изменений
- `tools.ts`, polling, auth — 0 изменений
- Другие страницы и компоненты — 0 изменений
- Edge function `geo-rating-cron` — без изменений

