

# ПОЛНЫЙ END-TO-END АУДИТ OWNDEV

---

## Блок 1. Общая оценка проекта

**Уровень:** Зрелый MVP, готовый к soft-launch. Архитектурно грамотный: React 18 + Vite + Edge Functions + AI-ядро, чистая темная дизайн-система, pSEO на 85+ городов.

**Сильные стороны:**
- Единая дизайн-система (glass-карточки, gradient-кнопки, анимации framer-motion)
- SEO-мета на всех страницах (title, description, canonical, OG, JSON-LD)
- pSEO разделение: geo-allowed vs geo-blocked с noindex
- Яндекс.Метрика интегрирована (ymGoal, ymHit)
- URL persistence между инструментами (saveLastUrl / SiteCheckBanner)
- Scan history в localStorage
- EmptyState компонент для пустых результатов
- Мертвый код вычищен (sparkles.tsx, three, tsparticles)

**Слабые стороны:** См. ниже

---

## Блок 2. Критические баги (P0/P1)

### P0: Флагманская карточка на /tools не рендерится

**Файл:** `src/pages/Tools.tsx`, строка 25
**Проблема:** `FLAGSHIP_SLUG = "site-check"`, но `getToolBySlug("site-check")` возвращает `undefined`, потому что site-check НЕ зарегистрирован в `tools-registry.ts`. Условие `{flagship && (...)}` — false, секция полностью пропадает.
**Влияние:** Главный продукт проекта невидим на странице каталога инструментов.
**Решение:** Добавить запись site-check в `tools-registry.ts` или хардкодить данные флагмана напрямую в `Tools.tsx` без поиска по registry.

### P0: ToolsShowcase на главной не включает site-check

**Файл:** `src/components/ToolsShowcase.tsx`
**Проблема:** Локальный массив `tools` из 12 элементов не содержит site-check. На главной странице флагманский продукт не виден среди инструментов.
**Решение:** Добавить site-check первым элементом в массив или вывести его отдельно вверху showcase.

### P1: Hero stats line устарел

**Файл:** `src/components/Hero.tsx`, строка 104
**Проблема:** Написано "7 инструментов", реально 12 инструментов + site-check = 13.
**Решение:** Обновить на "12+ инструментов" или динамически считать из registry.

### P1: Polling без cleanup в SiteCheck.tsx

**Файл:** `src/pages/SiteCheck.tsx`, строки 59-77
**Проблема:** `pollStatus` использует рекурсивный `setTimeout` внутри `useCallback`, но нет cleanup при unmount компонента. Если пользователь уйдет со страницы во время скана, polling продолжится и вызовет `navigate()` на размонтированном компоненте.
**Решение:** Добавить `useRef<boolean>` для отслеживания mount-статуса, или использовать AbortController.

### P1: dangerouslySetInnerHTML в BlogPost.tsx без санитизации

**Файл:** `src/pages/BlogPost.tsx`
**Проблема:** `formatInline()` обрабатывает markdown-разметку и вставляет через `dangerouslySetInnerHTML`. Контент статический (из data-файлов), поэтому XSS-риск низкий, но архитектурно это антипаттерн.
**Решение:** Низкий приоритет — контент контролируемый. Можно заменить на React-компоненты позже.

---

## Блок 3. Таблица по всем инструментам

| Инструмент | Работает | UX | Ценность | Статус | Баги | Быстрые улучшения |
|---|---|---|---|---|---|---|
| **Site Check** | Да | Хороший | Высокая | Оставить как флагман | Отсутствует в registry; polling leak | Добавить в registry; cleanup polling |
| **SEO Auditor** | Да | Хороший | Высокая | Оставить | EmptyState есть | -- |
| **Competitor Analysis** | Да | Хороший | Высокая | Оставить | EmptyState есть | -- |
| **Indexation Checker** | Да | Хороший | Средняя | Оставить | EmptyState есть | -- |
| **Internal Links** | Да | Хороший | Средняя | Оставить | EmptyState есть | -- |
| **Semantic Core** | Да | Хороший | Высокая | Оставить | EmptyState есть | -- |
| **Schema Generator** | Да (offline) | Хороший | Средняя | Оставить | Нет saveLastUrl | Добавить saveLastUrl |
| **AI Text Generator** | Да | Хороший | Средняя | Оставить | EmptyState есть | -- |
| **pSEO Generator** | Да (offline) | Средний | Средняя | Оставить как утилита | Нет saveLastUrl | -- |
| **LLM Prompt Helper** | Да (offline) | Хороший | Средняя | Оставить | -- | -- |
| **Anti-Duplicate** | Да (offline) | Средний | Низкая | Оставить как утилита | Нет ToolCTA в конце... имеет | -- |
| **Position Monitor** | Да (localStorage) | Средний | Низкая | Оставить скрытым | Данные только вручную | -- |
| **Webmaster Files** | Да (offline) | Хороший | Средняя | Оставить | -- | -- |

---

## Блок 4. SEO/pSEO выводы

### SEO-матрица индексации

| URL Pattern | Индекс | Canonical | robots | Решение |
|---|---|---|---|---|
| `/` | Да | self | index | OK |
| `/tools` | Да | self | index | OK |
| `/tools/site-check` | Да | -- (нет canonical!) | index | **Добавить canonical** |
| `/tools/:toolSlug` | Да | self | index | OK |
| `/tools/:toolSlug/:region` (geo-allowed) | Да | self | index | OK |
| `/tools/:toolSlug/:region` (geo-blocked) | Нет | /tools/:toolSlug | noindex | OK |
| `/:city/:niche/:tool` (geo-allowed) | Да | self | index | OK |
| `/:city/:niche/:tool` (geo-blocked) | Нет | /tools/:toolSlug | noindex | OK |
| `/blog` | Да | self | index | OK |
| `/blog/:slug` | Да | self | index | OK |
| `/contacts` | Да | self | index | OK |
| `/privacy`, `/terms` | Да | self | index | Можно noindex |
| `/offer`, `/refund` | Да | self | index | Можно noindex |
| `/tools/site-check/result/:id` | Да | -- (нет canonical!) | **index** | **Нужен noindex!** |
| `/tools/site-check/report/:id` | Да | -- (нет canonical!) | **index** | **Нужен noindex!** |
| `*` (404) | Нет | -- | noindex | OK |

**Критичные SEO-проблемы:**
1. **SiteCheck.tsx** — нет `<link rel="canonical">` 
2. **SiteCheckResult.tsx** — нет `<meta name="robots" content="noindex">`, поисковики могут индексировать тысячи URL `/result/:scanId`
3. **SiteCheckReport.tsx** — аналогично, нет noindex
4. **Sitemap** — содержит `/tools/site-check` корректно, result/report не попадают — OK
5. **Offer, Refund, Privacy, Terms** — имеют canonical, но не имеют noindex. Рекомендуется добавить noindex.

### pSEO — чисто

- `nicheEnabledTools = []` — нишевые гео-страницы не генерируются в sitemap. Правильно.
- `geoEnabledTools` = seo-auditor, competitor-analysis, semantic-core, site-check, internal-links — только коммерческие.
- Утилиты (anti-duplicate, pseo-generator и др.) отмечены noindex с canonical на основной tool page.

---

## Блок 5. UX / Конверсия

### Тупики и потерянные пользователи

1. **Flagship card на /tools отсутствует** — пользователь не видит главный продукт (P0 баг выше)
2. **ToolsShowcase на главной** — site-check не виден среди 12 карточек
3. **Paywall "Перейти к оплате"** → показывает dialog "Платежи скоро появятся" — это OK как временное решение, но текст кнопки "Перейти к оплате" вводит в заблуждение. Лучше "Получить полный отчёт" или изменить CTA.
4. **DownloadButtons** — все кнопки disabled с toast "В разработке". Визуально понятно, но занимают место. Можно скрыть до готовности.
5. **Header CTA "Открыть инструменты"** → `/tools` — OK, но не ведёт на site-check напрямую
6. **Footer toolLinks** — содержит SEO Auditor, Schema, pSEO, LLM Prompt Helper — но НЕ содержит Site Check
7. **ServicesTeaser "Обсудить проект"** → `#contact` через `<a>` тег, а не `<Link>`. На внутренних страницах сломается (не перейдёт на главную).

---

## Блок 6. Архитектурные проблемы

| Файл | Проблема | Тип | Критичность | Как исправить |
|---|---|---|---|---|
| `Tools.tsx` | site-check не в registry → flagship=undefined | Data | P0 | Добавить в registry или хардкодить |
| `ToolsShowcase.tsx` | Дублирует данные из tools-registry локально | Дублирование | P2 | Импортировать из registry |
| `SiteCheck.tsx` | Polling без cleanup | Memory leak | P1 | useRef / AbortController |
| `SiteCheckResult.tsx` | Нет noindex | SEO | P1 | Добавить meta robots |
| `SiteCheckReport.tsx` | Нет noindex | SEO | P1 | Добавить meta robots |
| `SiteCheck.tsx` | Нет canonical | SEO | P2 | Добавить canonical |
| `Hero.tsx` | Хардкод "7 инструментов" | UX | P2 | Обновить число |
| `Footer.tsx` | toolLinks не содержит site-check | UX | P2 | Добавить |
| `ServicesTeaser.tsx` | `<a href="#contact">` вместо `<Link>` | Navigation | P3 | Заменить |
| `BlogPost.tsx` | dangerouslySetInnerHTML | Security | P3 | Контент статический, низкий риск |

---

## Блок 7. Roadmap исправлений

### Сделать сегодня (30 мин)

1. **P0: Добавить site-check в tools-registry.ts** — с icon=Search, slug="site-check", geoEnabled=true. Компонент может быть lazy(() => import("@/components/site-check/ScanForm")) или заглушкой, т.к. site-check имеет отдельную страницу.
2. **P0: Обновить ToolsShowcase.tsx** — добавить site-check первым элементом или вывести отдельной секцией
3. **P1: Добавить noindex в SiteCheckResult.tsx и SiteCheckReport.tsx** — `<meta name="robots" content="noindex, nofollow" />`
4. **P1: Добавить canonical в SiteCheck.tsx** — `<link rel="canonical" href="https://owndev.ru/tools/site-check" />`
5. **P2: Обновить Hero stats** — "12+ инструментов"
6. **P2: Добавить site-check в Footer toolLinks**

### Сделать за 3 дня

7. **P1: Cleanup polling в SiteCheck.tsx** — добавить mounted ref
8. **P2: ToolsShowcase импорт из registry** — убрать дублирование данных
9. **P2: ServicesTeaser** — `<a href="#contact">` → навигация через useNavigate
10. **P2: Noindex на Offer, Refund, Privacy, Terms** — юридические страницы

### Сделать за 7 дней

11. PaywallCTA — изменить текст кнопки на более честный
12. DownloadButtons — скрыть до готовности или оставить с подписью
13. Рассмотреть объединение Position Monitor с Site Check историей

### Позже

14. Замена dangerouslySetInnerHTML в BlogPost на React-компоненты
15. Полноценная платежная интеграция (ЮKassa)
16. PDF/DOCX генерация отчётов

---

## Блок 8. Конкретные фиксы для немедленного применения

### Fix 1: site-check в tools-registry.ts
Добавить запись с `slug: "site-check"`, `name: "Проверка сайта"`, `icon: Search`, `geoEnabled: true`, `component: lazy(() => import("@/components/site-check/ScanForm"))`.

### Fix 2: SiteCheckResult.tsx — добавить noindex
В `<Helmet>` добавить `<meta name="robots" content="noindex, nofollow" />`.

### Fix 3: SiteCheckReport.tsx — добавить noindex
В `<Helmet>` добавить `<meta name="robots" content="noindex, nofollow" />`.

### Fix 4: SiteCheck.tsx — добавить canonical
В `<Helmet>` добавить `<link rel="canonical" href="https://owndev.ru/tools/site-check" />`.

### Fix 5: Hero.tsx — обновить stats
Строка 104: заменить "7 инструментов" на "12+ инструментов".

### Fix 6: Footer.tsx — добавить site-check в toolLinks
Добавить `{ label: "Проверка сайта", href: "/tools/site-check", isRoute: true }` первым элементом.

### Fix 7: SiteCheck.tsx — cleanup polling
Добавить `useRef` для mounted, проверять перед `setTimeout` и `navigate`.

### Fix 8: ToolsShowcase.tsx — добавить site-check
Добавить `{ icon: Search, name: "Проверка сайта", description: "SEO, Директ, конкуренты — полный отчёт", slug: "site-check" }` первым элементом. Или лучше: заменить на `import { tools } from "@/data/tools-registry"`.

---

## Вердикт

**Проект готов к мягкому запуску** при условии исправления 6 быстрых фиксов (30 минут работы). Критический баг — отсутствие site-check в registry, из-за чего флагманский продукт невидим на страницах /tools и главной. SEO-мусор (индексация result/report страниц) может навредить при активном использовании. Всё остальное — косметика и оптимизации, которые можно делать итеративно.

Рекомендация: **один цикл стабилизации (фиксы 1-8), затем можно активно продвигать.**

