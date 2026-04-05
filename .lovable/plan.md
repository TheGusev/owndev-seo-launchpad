

## GEO Рейтинг Рунета — `/geo-rating`

### Обзор

Публичная страница-рейтинг AI-готовности популярных сайтов Рунета. Данные хранятся в новой таблице `geo_rating` в базе. Страница полностью клиентская — читает данные через Supabase SDK.

### Файлы

| Файл | Действие |
|------|----------|
| `src/pages/GeoRating.tsx` | Новая страница — hero, фильтры, таблица, мини-карточки |
| `src/App.tsx` | Добавить маршрут `/geo-rating` |
| **Migration** | Создать таблицу `geo_rating` + RLS (public read) |
| **Insert** | Заполнить 30 сайтов начальными данными (включая owndev.ru и goruslugimsk.ru) |

### 1. Таблица `geo_rating` (миграция)

```sql
CREATE TABLE public.geo_rating (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  domain text NOT NULL UNIQUE,
  display_name text NOT NULL,
  category text NOT NULL DEFAULT 'Сервисы',
  llm_score integer NOT NULL DEFAULT 0,
  seo_score integer NOT NULL DEFAULT 0,
  schema_score integer NOT NULL DEFAULT 0,
  direct_score integer NOT NULL DEFAULT 0,
  has_llms_txt boolean NOT NULL DEFAULT false,
  has_faqpage boolean NOT NULL DEFAULT false,
  has_schema boolean NOT NULL DEFAULT false,
  errors_count integer NOT NULL DEFAULT 0,
  top_errors jsonb DEFAULT '[]',
  last_checked_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.geo_rating ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read geo_rating" ON public.geo_rating FOR SELECT TO public USING (true);
```

### 2. Начальные данные (insert)

~30 сайтов: ozon.ru, wildberries.ru, sber.ru, yandex.ru, vk.com, mail.ru, avito.ru, tinkoff.ru, gosuslugi.ru, ria.ru, lenta.ru, habr.com, vc.ru, kinopoisk.ru, dns-shop.ru, mts.ru, megafon.ru, rt.ru, hh.ru, drom.ru, lamoda.ru, citilink.ru, mvideo.ru, pikabu.ru, sports.ru, **owndev.ru**, **goruslugimsk.ru** и др. Реалистичные placeholder-скоры. Категории: E-commerce, Медиа, Банки, Сервисы, Образование, Госорганы, Телеком.

### 3. GeoRating.tsx (~450 строк)

**Hero**: Заголовок "GEO Рейтинг Рунета 2026", подзаголовок, 4 stat-карточки (считаются из данных: кол-во сайтов, средний LLM Score, % с llms.txt, % с FAQPage).

**Фильтры**: Pill-кнопки по категории (Все / E-commerce / Медиа / Банки / Сервисы / Образование / Госорганы / Телеком) + по уровню LLM Score (Все / 80+ / 60-79 / 40-59 / <40) + сортировка (LLM Score ↓ / SEO Score ↓ / Алфавит).

**Таблица**: Зебра-строки, колонки: #, Сайт, Категория, LLM Score (цветной бейдж), SEO Score, llms.txt (✓/✗), Schema (✓/✗), FAQPage (✓/✗), Статус. Клик по строке раскрывает inline-панель с деталями:
- 4 скора (seo, llm, schema, direct) с цветовой индикацией
- Топ-3 ошибки из `top_errors`
- Кнопка "Полный аудит →" → `/tools/site-check` с query `?url=domain`

**Виральные элементы**:
- CTA "Проверить свой сайт и попасть в рейтинг" → `/tools/site-check`
- "Поделиться рейтингом" — копирует ссылку с UTM
- Топ-10 получают бейдж "🏆 Топ-10" + блок "Скопировать код бейджа" (HTML snippet)

**Подпись**: "Данные обновлены: {last_checked_at}. Методология: 50+ параметров."

**SEO**: Helmet с title, description, canonical, JSON-LD Dataset schema.

### 4. Роутинг (App.tsx)

Добавить `import GeoRating` и `<Route path="/geo-rating" element={<GeoRating />} />` перед catch-all.

### Дизайн

- Dark glassmorphism фон карточек (`bg-white/5 backdrop-blur-sm border border-white/10`)
- Скоры: зелёный (71+), жёлтый (41-70), красный (0-40)
- Pill-фильтры: `bg-white/5 hover:bg-white/10`, активный — `bg-cyan-500/20 text-cyan-400 border-cyan-500/30`
- Таблица: зебра через `even:bg-white/[0.02]`
- Расширяемая карточка деталей: glass-панель с анимацией

