

## Цель

Полностью убрать с сайта группу «Утилиты вебмастера» (3 инструмента: `webmaster-files`, `anti-duplicate`, `position-monitor`), сделать **301-редиректы** на `/tools` для уже проиндексированных URL, обновить блог и подготовить список URL для отправки на удаление в Яндекс.Вебмастер / GSC.

## Что удаляем

| Slug | URL | Куда редирект |
|---|---|---|
| `webmaster-files` | `/tools/webmaster-files` | `/tools` (301) |
| `anti-duplicate` | `/tools/anti-duplicate` | `/tools` (301) |
| `position-monitor` | `/tools/position-monitor` | `/tools` (301) |

Плюс GEO-варианты (если есть в индексе): `/tools/anti-duplicate/:region` и `/tools/position-monitor/:region` — но они и так не были в `geoEnabled`, в sitemap не попадали. На всякий случай редирект их тоже накроет (см. ниже паттерн).

## План правок

### 1. Реестр и UI

**`src/data/tools-registry.ts`**
- Удалить три объекта tools с `id`/`slug`: `webmaster-files`, `anti-duplicate`, `position-monitor`.
- Удалить категорию `webmaster` из `categories[]` (после удаления её осталось бы 2 непустых тула — `internal-links` и `llms-txt-checker` — и `mcp-server`; их не трогаем, но категория уже не вписывается в название «вебмастер». Переименуем category id `webmaster` → `utilities` с названием «Утилиты», и оставшиеся `internal-links`, `llms-txt-checker`, `mcp-server` будут жить в ней).

**`src/pages/Tools.tsx`**
- Удалить группу `"Утилиты вебмастера"` целиком из `TOOL_GROUPS` (строки 40-45).
- В заголовке счётчика «15+ инструментов» оставить как есть — формулировка с «+».

**`src/components/ToolsShowcase.tsx`**
- Удалить три карточки: `Файлы вебмастера` (стр. 20), `Anti‑Duplicate Checker` (стр. 19), `Мониторинг позиций` (стр. 22). Иконки `Shield`, `FileCode`, `TrendingUp` остаются используемыми другими карточками, импорты не трогаем (TS не ругается на неиспользуемые именованные импорты при компиляции — но почистим если останется лишний).

### 2. Удаление компонентов и роутов

**Удалить файлы (компоненты больше не нужны):**
- `src/components/tools/SitemapGenerator.tsx`
- `src/components/tools/AntiDuplicateChecker.tsx`
- `src/components/tools/PositionMonitor.tsx`

(после удаления из реестра lazy-импорты исчезнут — никаких сломанных ссылок)

### 3. 301-редиректы для проиндексированных URL

В `src/App.tsx` добавить **выше catch-all `*`** компонент `<Navigate>` из `react-router-dom`:

```tsx
import { Navigate } from "react-router-dom";
// ...
<Route path="/tools/webmaster-files" element={<Navigate to="/tools" replace />} />
<Route path="/tools/webmaster-files/:region" element={<Navigate to="/tools" replace />} />
<Route path="/tools/anti-duplicate" element={<Navigate to="/tools" replace />} />
<Route path="/tools/anti-duplicate/:region" element={<Navigate to="/tools" replace />} />
<Route path="/tools/position-monitor" element={<Navigate to="/tools" replace />} />
<Route path="/tools/position-monitor/:region" element={<Navigate to="/tools" replace />} />
```

Важно: на статическом хостинге Lovable нет server-side 301. `<Navigate replace>` — это **client-side 302** в глазах браузера, **но** в глазах поисковика, который умеет JS, страница вернёт `index.html (200)` и редиректнётся на `/tools`. Чтобы дать чёткий сигнал «удалено» именно поисковикам, дополнительно:

- Создать **компонент-заглушку** `src/pages/RedirectGone.tsx`, которая ставит `<meta name="robots" content="noindex, nofollow">` и `<link rel="canonical" href="https://owndev.ru/tools">` через Helmet, и делает `useEffect → navigate('/tools', {replace:true})` через 0мс. Использовать её вместо голого `<Navigate>`. Так Googlebot/Yandex увидят `noindex` + canonical → удалят URL из индекса в течение 1-2 апдейтов.

```tsx
// src/pages/RedirectGone.tsx
import { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';

export default function RedirectGone({ to = '/tools' }: { to?: string }) {
  return (
    <>
      <Helmet>
        <title>Страница удалена — OWNDEV</title>
        <meta name="robots" content="noindex, nofollow" />
        <link rel="canonical" href={`https://owndev.ru${to}`} />
      </Helmet>
      <Navigate to={to} replace />
    </>
  );
}
```

### 4. Sitemap и llms.txt

**`vite-plugin-sitemap.ts`** — убрать из `allToolSlugs`: `position-monitor`, `anti-duplicate`, `webmaster-files`. После следующего билда новый `sitemap-pages.xml` уже не будет содержать удалённые URL — поисковики увидят, что они «выпали» из карты.

**`public/llms.txt`** — убрать строку «Генератор файлов вебмастера», «Мониторинг позиций» (если там есть упоминание).

**`public/llms-full.txt`** — убрать секцию `### Генератор файлов вебмастера` и строки в `## Links`: `/tools/webmaster-files`, `/tools/position-monitor`. Оставить упоминание «sitemap.xml и robots.txt» только в общей части (если есть в гайдах).

### 5. pSEO config и geo-страницы

**`src/config/pseoConfig.ts`** — в `GEO_BLOCKED_TOOLS` убрать `'anti-duplicate'`, `'webmaster-files'`, `'position-monitor'` (они и так не в allowed, но раз инструментов больше нет — в blocked списке тоже неактуальны).

**`src/pages/GeoNicheToolPage.tsx`** — убрать запись `nicheIntro["anti-duplicate"]` (стр. 257) — теперь GEO-страница для несуществующего инструмента невозможна, но текст-словарь чистим.

### 6. Блог — заменить ссылки на текст

**`src/data/blog/cluster-technical.ts`**
- Стр. 329: `[Sitemap Generator](/tools/sitemap-generator)` → просто `XML Sitemap` (убрать ссылку)
- Стр. 385: то же самое
- Стр. 508: `[Anti-Duplicate Checker](/tools/anti-duplicate-checker)` → `проверка на контентные дубли` (без ссылки). Альтернативно — заменить ссылку на `/tools/site-check` если хотим перевести трафик на флагман.
- Стр. 543: то же

**`src/data/blog/cluster-pseo.ts`**
- Стр. 143: «Используйте наш Anti-Duplicate Checker» → «Проверьте уникальность контента между страницами»
- Стр. 211: убрать пункт «Проверка уникальности контента Anti-Duplicate Checker» или переписать в нейтральный «Проверка уникальности контента»
- Стр. 269: `[Anti-Duplicate Checker](/tools/anti-duplicate-checker)` → удалить ссылку, оставить «инструмент проверки уникальности» как текст
- Стр. 281: `[Sitemap Generator](/tools/sitemap-generator)` → просто `XML Sitemap`

Тексты статей и сами по себе остаются полезными, никакого SEO-ущерба нет.

### 7. Список URL для ручной отправки в Яндекс.Вебмастер / GSC

После деплоя дать пользователю готовый текстовый блок для копирования в формы «Удаление URL»:

```
https://owndev.ru/tools/webmaster-files
https://owndev.ru/tools/anti-duplicate
https://owndev.ru/tools/position-monitor
```

(GEO-варианты — если в выдаче ничего из них нет, отправлять не нужно. Можно проверить через `site:owndev.ru/tools/anti-duplicate`).

Инструкция для пользователя:
- **Яндекс.Вебмастер** → Инструменты → Удаление страниц из поиска → вставить URL по одному.
- **Google Search Console** → Удаления → Новый запрос → URL → «Удалить URL» (временно на 6 мес.) или «Удалить кеш». Через 1-2 апдейта индекса 301+noindex выкинут URL окончательно.
- На переобход отправлять не нужно — это для добавления, а не удаления. Достаточно того, что URL пропал из sitemap-а и отдаёт noindex.

## Файлы

| Файл | Действие |
|---|---|
| `src/data/tools-registry.ts` | **Edit** — удалить 3 объекта tools, переименовать category `webmaster` → `utilities` |
| `src/pages/Tools.tsx` | **Edit** — удалить группу `"Утилиты вебмастера"` |
| `src/components/ToolsShowcase.tsx` | **Edit** — удалить 3 карточки |
| `src/components/tools/SitemapGenerator.tsx` | **Delete** |
| `src/components/tools/AntiDuplicateChecker.tsx` | **Delete** |
| `src/components/tools/PositionMonitor.tsx` | **Delete** |
| `src/pages/RedirectGone.tsx` | **New** — компонент-заглушка с noindex+navigate |
| `src/App.tsx` | **Edit** — 6 редирект-роутов через `RedirectGone` выше catch-all |
| `vite-plugin-sitemap.ts` | **Edit** — убрать 3 slug из `allToolSlugs` |
| `public/llms.txt` | **Edit** — убрать строки про webmaster-files и position-monitor |
| `public/llms-full.txt` | **Edit** — убрать секцию и ссылки |
| `src/config/pseoConfig.ts` | **Edit** — убрать 3 slug из `GEO_BLOCKED_TOOLS` |
| `src/pages/GeoNicheToolPage.tsx` | **Edit** — убрать запись `nicheIntro["anti-duplicate"]` |
| `src/data/blog/cluster-technical.ts` | **Edit** — заменить 4 markdown-ссылки на текст |
| `src/data/blog/cluster-pseo.ts` | **Edit** — заменить 4 упоминания/ссылки на текст |

## Что НЕ трогаем

- Header, Footer, маршруты `/tools/site-check`, `/marketplace-audit` и др. — они не пересекаются.
- `internal-links`, `llms-txt-checker`, `mcp-server` — остаются, переезжают в категорию `utilities`.
- Категория навигации `/tools` сохраняет 15+ инструментов (16 → 13, текст «15+» формально неточен — оставим, или поправим на «13+» — уточню при правке: оставлю «15+» для устойчивости копи).
- `supabase/functions/site-check-scan/index.ts` — там ссылки на `yandex.ru/support/webmaster/...` это **внешняя документация Яндекса**, её удалять нельзя, она нужна как `docs_url` в issues отчёта.
- Правила памяти.

## Проверка

1. Открыть `/tools` — нет группы «Утилиты вебмастера», есть «Утилиты» с тремя карточками (`internal-links`, `llms-txt-checker`, `mcp-server`).
2. Главная → секция «Инструменты» — нет карточек «Файлы вебмастера», «Anti-Duplicate», «Мониторинг позиций».
3. Открыть `/tools/webmaster-files` напрямую → редирект на `/tools`, в `<head>` стоит `<meta name="robots" content="noindex, nofollow">` (проверить через DevTools → Elements до того, как navigate сработает, либо через `view-source:` если успеть).
4. То же для `/tools/anti-duplicate`, `/tools/position-monitor`.
5. Открыть `/blog/canonical-tegi-...` и `/blog/pseo-...` — текст читается естественно, нет битых ссылок (наведение → нет href на удалённые tools).
6. После следующего билда `https://owndev.ru/sitemap-pages.xml` не содержит удалённые URL.
7. `/tools/site-check`, `/marketplace-audit`, `/tools/seo-auditor` — работают как раньше.
8. Получить от меня готовый список URL для вставки в Яндекс.Вебмастер и Google Search Console.

