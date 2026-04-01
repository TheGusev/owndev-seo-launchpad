

## Фиксы: дубль блога, активные карточки, анимированный текст

### 1. Дубль «Блог» в навигации
**Файл:** `src/components/Header.tsx` строка 15 — дублирующая запись `{ href: "/blog", label: "Блог" }`. Удалить строку 15.

### 2. Карточки 4 направлений — сделать кликабельными
**Файл:** `src/components/ServicesTeaser.tsx`

Каждая карточка получает поле `link` и оборачивается в `onClick → navigate(link)`:

| Карточка | Ссылка |
|----------|--------|
| SEO-аудит | `/tools/site-check` |
| Schema.org | `/tools/schema-generator` |
| GEO-готовность | `/tools/geo-audit` |
| Яндекс.Директ | `/tools/site-check` |

Добавить `cursor-pointer` и визуальный индикатор (стрелка или подсветка при hover).

### 3. Анимированный сменяющийся текст в Hero
**Файл:** `src/components/Hero.tsx`

Добавить блок с ротацией фраз (capabilities) между trust bar и инпутом. Фразы плавно появляются и сменяются каждые 3 секунды с fade+slide анимацией через framer-motion `AnimatePresence`:

Фразы:
- «SEO-аудит по 18 параметрам»
- «Schema.org разметка — 12 типов»
- «GEO-готовность к AI-выдаче»
- «Семантика 150+ ключей для Директа»
- «PDF и Word отчёт за 2 минуты»
- «Анализ конкурентов из ТОП-10»

Визуально: фиолетовый текст с иконкой слева, плавная смена (opacity + translateY), высота фиксирована чтобы не прыгал layout.

### 4. Текстовая инфо на страницах инструментов (скрины 3-4)
**Файл:** `src/pages/ToolPage.tsx`

Под описанием инструмента уже есть `useCases` в виде тегов «КОГДА ИСПОЛЬЗОВАТЬ». Добавить блок с анимированным появлением возможностей — аналогично Hero, но статичный список с staggered fade-in анимацией (framer-motion). Использовать `tool.useCases` для контента.

### Файлы

| Файл | Действие |
|------|----------|
| `src/components/Header.tsx` | Удалить дубль «Блог» (строка 15) |
| `src/components/ServicesTeaser.tsx` | Добавить `link` + `onClick` + `cursor-pointer` на карточки |
| `src/components/Hero.tsx` | Добавить ротацию фраз с AnimatePresence |
| `src/pages/ToolPage.tsx` | Staggered появление useCases |

