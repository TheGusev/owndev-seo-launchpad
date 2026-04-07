

## Создание 4 страниц GEO-сценариев

### Подход

Создать 4 статичные страницы-лендинга в стиле существующей `GeoAudit.tsx` (Header + Hero + блоки + Footer). Обновить ссылки в `GeoScenarios.tsx` и добавить маршруты в `App.tsx`.

### Файлы

| Файл | Действие |
|------|----------|
| `src/pages/scenarios/AiVisibility.tsx` | Новый — страница сценария AI Visibility Audit |
| `src/pages/scenarios/AiReadyContent.tsx` | Новый — страница сценария AI-Ready Content |
| `src/pages/scenarios/BrandPresence.tsx` | Новый — страница сценария Brand Presence |
| `src/pages/scenarios/Monitoring.tsx` | Новый — страница сценария Monitoring |
| `src/App.tsx` | 4 новых Route для `/scenario/*` |
| `src/components/landing/GeoScenarios.tsx` | Обновить ссылки карточек на `/scenario/...` |

### Структура каждой страницы

```text
┌────────────────────────────────────────┐
│ Header (без изменений)                 │
├────────────────────────────────────────┤
│ Hero: badge + h1 + описание + CTA     │
├────────────────────────────────────────┤
│ "Как работает" — 3-4 шага             │
├────────────────────────────────────────┤
│ "Инструменты" — карточки с ссылками   │
├────────────────────────────────────────┤
│ "Результат" — что получит пользователь│
├────────────────────────────────────────┤
│ Footer (без изменений)                 │
└────────────────────────────────────────┘
```

### Контент по сценариям

**1. AI Visibility Audit** (`/scenario/ai-visibility`)
- Hero: "Узнайте, видит ли ваш сайт AI-поиск"
- CTA → `/tools/site-check`
- Шаги: Запустите аудит → Получите SEO + LLM Score → Изучите проблемы → Исправьте по приоритетам
- Инструменты: Проверка сайта, SEO Auditor, GEO-аудит, GEO-рейтинг
- Результат: Двойной скор, список P1-проблем, план действий

**2. AI-Ready Content** (`/scenario/ai-ready-content`)
- Hero: "Создайте контент, который цитируют нейросети"
- CTA → `/tools/content-brief`
- Шаги: Соберите семантику → Сгенерируйте бриф → Создайте структуру → Добавьте Schema
- Инструменты: Content Brief, Semantic Core, Schema Generator, AI Text Generator
- Результат: Готовый контент-план с E-E-A-T, FAQ, JSON-LD

**3. Brand Presence** (`/scenario/brand-presence`)
- Hero: "Узнайте, упоминают ли AI-ассистенты ваш бренд"
- CTA → `/tools/brand-tracker`
- Шаги: Введите бренд → Проверьте упоминания → Оцените контекст → Улучшите присутствие
- Инструменты: Brand Tracker, Competitor Analysis
- Пометка: частично "в разработке" — описать видение (мониторинг цитируемости)
- Результат: Карта присутствия бренда в AI-ответах

**4. Monitoring** (`/scenario/monitoring`)
- Hero: "Отслеживайте AI-видимость еженедельно"
- CTA → `/geo-rating`
- Шаги: Добавьте сайт → Получите базовый скор → Отслеживайте динамику → Реагируйте на изменения
- Инструменты: GEO-рейтинг, Position Monitor
- Пометка: история и автоматизация "в разработке"
- Результат: Динамика SEO + LLM Score, уведомления об изменениях

### GeoScenarios.tsx — обновление ссылок

```typescript
// Было:
link: "/tools/site-check"
link: "/tools/content-brief"
link: "/tools/brand-tracker"
link: "/geo-rating"

// Стало:
link: "/scenario/ai-visibility"
link: "/scenario/ai-ready-content"
link: "/scenario/brand-presence"
link: "/scenario/monitoring"
```

### App.tsx — новые маршруты

Добавить 4 Route перед catch-all `*`:
```tsx
<Route path="/scenario/ai-visibility" element={<AiVisibility />} />
<Route path="/scenario/ai-ready-content" element={<AiReadyContent />} />
<Route path="/scenario/brand-presence" element={<BrandPresence />} />
<Route path="/scenario/monitoring" element={<Monitoring />} />
```

### Визуальный стиль

Повторяет паттерн GeoAudit.tsx: тёмный фон, glass-карточки, бейджи с цветными акцентами (cyan/violet/emerald/amber — по цветам из GeoScenarios), JSON-LD BreadcrumbList для SEO. Helmet с уникальными title/description.

### Что НЕ трогаем

- Header, Footer, мобильное меню — 0 изменений
- Существующие страницы инструментов — 0 изменений
- Блок "Последние проверки" — 0 изменений

### Объём

~200 строк на страницу (статичный контент + layout), ~10 строк правок в App.tsx + GeoScenarios.tsx.

