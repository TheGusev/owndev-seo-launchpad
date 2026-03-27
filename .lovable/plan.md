

## Аудит проекта OWNDEV — сводная таблица и план исправлений

### СВОДНАЯ ТАБЛИЦА

| Блок | Пункт | Статус | Проблема |
|------|-------|--------|----------|
| **1. Архитектура** | | | |
| 1 | Предсказуемые URL | ✅ | — |
| 1 | Уникальный title/description | ✅ | — |
| 1 | Нет страниц-заглушек | ✅ | — |
| 1 | Нет 404 в навигации | ✅ | — |
| 1 | 404 с навигацией | ✅ | Header + Footer + кнопка "На главную" |
| 1 | /tools/site-check существует | ✅ | — |
| 1 | Все инструменты на /tools | ✅ | 12 инструментов + site-check |
| **2. Инструменты** | | | |
| 2 | SiteCheckBanner во всех инструментах | ⚠️ | Только в 3 из 12 (SEOAuditor, PSEOGenerator, LLMPromptHelper). Отсутствует в 9: CompetitorAnalysis, IndexationChecker, PositionMonitor, SchemaGenerator, SemanticCoreGenerator, AITextGenerator, AntiDuplicateChecker, SitemapGenerator, InternalLinksChecker |
| **3. Блог** | | | |
| 3 | Блог существует | ✅ | — |
| 3 | SEO чек-лист статья | ✅ | slug: `chek-list-seo-audita-2025` |
| 3 | CTA на /tools/site-check в статье | ⚠️ | Ссылка ведёт на SEO Auditor, а не на site-check |
| 3 | Пагинация блога | ⚠️ | Нет пагинации при 28+ статьях |
| 3 | OpenGraph теги | ✅ | На /blog есть, на /blog/:slug через Helmet |
| **4. SEO** | | | |
| 4 | robots.txt | ⚠️ | Не закрывает /admin/* |
| 4 | sitemap.xml | ✅ | Динамический через vite-plugin |
| 4 | canonical теги | ✅ | На всех страницах |
| 4 | viewport | ✅ | В index.html |
| **5. Дизайн/UX** | | | |
| 5 | Единая система | ✅ | — |
| 5 | Мобильная версия | ✅ | — |
| 5 | Тёмная тема | ✅ | — |
| **6. Производительность** | | | |
| 6 | SparklesCore на 404 | ⚠️ | Тяжёлый tsparticles на 404 странице (убран с главной, но остался тут) |
| 6 | Неиспользуемые зависимости | ⚠️ | `three.js` (~182KB), `site-check-mock.ts` — dead code |
| **7. Качество кода** | | | |
| 7 | console.log в production | ✅ | Только в blog content (код-примеры, не исполняемый) |
| 7 | TODO без дат | ⚠️ | 2 TODO в site-check-report и DownloadButtons — ожидаемые (ЮKassa) |
| 7 | Hardcoded admin password | ⚠️ | `ADMIN_PASSWORD = "owndev2024"` в AdminRules.tsx |
| 7 | Dead code | ⚠️ | `src/lib/site-check-mock.ts` не импортируется |
| **8. Аналитика** | | | |
| 8 | Яндекс.Метрика | 🔴 | Полностью отсутствует |
| 8 | Цели (запуск инструмента, CTA) | 🔴 | Нет |
| 8 | Мониторинг ошибок | 🔴 | Нет Sentry |
| **9. Безопасность** | | | |
| 9 | /admin защита | ⚠️ | Только localStorage пароль, нет серверной защиты |
| 9 | robots.txt не закрывает /admin | ⚠️ | Индексируется поисковиками |
| **10. Функционал** | | | |
| 10 | Всё создано | ✅ | site-check, SiteCheckBanner, статья, /tools |

---

### ПЛАН ИСПРАВЛЕНИЙ (по приоритету)

#### Приоритет 1 — Безопасность + SEO

**1. robots.txt — закрыть /admin/**
```
Disallow: /admin/
```

**2. Удалить SparklesCore с 404** — убрать тяжёлый canvas-движок

#### Приоритет 2 — UX / Конверсия

**3. Добавить ToolCTA в 9 инструментов без него**
Файлы: `CompetitorAnalysis.tsx`, `IndexationChecker.tsx`, `PositionMonitor.tsx`, `SchemaGenerator.tsx`, `SemanticCoreGenerator.tsx`, `AITextGenerator.tsx`, `AntiDuplicateChecker.tsx`, `SitemapGenerator.tsx`, `InternalLinksChecker.tsx`

**4. Добавить CTA на /tools/site-check в статью чек-листа**
В `cluster-technical.ts` — заменить ссылку на SEO Auditor ссылкой на /tools/site-check

#### Приоритет 3 — Чистка

**5. Удалить dead code** — `src/lib/site-check-mock.ts`

**6. Пагинация блога** — показывать по 12 статей с кнопкой "Показать ещё"

#### Приоритет 4 — Аналитика (ручное внимание)

Яндекс.Метрика и Sentry требуют внешних аккаунтов и API-ключей — пометим как "требует ручного внимания".

---

### ИТОГ

| Категория | Кол-во |
|-----------|--------|
| ✅ OK | ~30 |
| Исправлено (будет в этой итерации) | 6 |
| Требует ручного внимания | 3 (Яндекс.Метрика, Sentry, admin серверная защита) |

### Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `public/robots.txt` | Добавить `Disallow: /admin/` |
| `src/pages/NotFound.tsx` | Убрать SparklesCore, AnimatedGrid, FloatingParticles |
| `src/components/tools/CompetitorAnalysis.tsx` | Добавить `<ToolCTA />` |
| `src/components/tools/IndexationChecker.tsx` | Добавить `<ToolCTA />` |
| `src/components/tools/PositionMonitor.tsx` | Добавить `<ToolCTA />` |
| `src/components/tools/SchemaGenerator.tsx` | Добавить `<ToolCTA />` |
| `src/components/tools/SemanticCoreGenerator.tsx` | Добавить `<ToolCTA />` |
| `src/components/tools/AITextGenerator.tsx` | Добавить `<ToolCTA />` |
| `src/components/tools/AntiDuplicateChecker.tsx` | Добавить `<ToolCTA />` |
| `src/components/tools/SitemapGenerator.tsx` | Добавить `<ToolCTA />` |
| `src/components/tools/InternalLinksChecker.tsx` | Добавить `<ToolCTA />` |
| `src/data/blog/cluster-technical.ts` | CTA → /tools/site-check |
| `src/lib/site-check-mock.ts` | Удалить файл |
| `src/pages/Blog.tsx` | Пагинация (12 статей + "Показать ещё") |

