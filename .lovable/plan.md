

## 5 исправлений — план реализации

### Шаг 1: Фикс страницы оплаты (stub → toast + автопропуск)

**Проблема:** При нажатии «Получить полный отчёт» создаётся report со статусом `paid` и происходит redirect на `/tools/site-check/report/:id` — но если edge function медленная, пользователь видит зависание.

**Решение:**
- В `PaywallCTA.tsx`: после успешного `createReport` показывать toast "Отчёт готов! Перенаправляем..." перед redirect
- В `SiteCheckResult.tsx` (`handlePay`): обернуть в try/catch с понятным сообщением об ошибке вместо зависания
- Stub-режим остаётся (payment_status='paid' сразу) — это и есть "автопропуск" для тестирования

### Шаг 2: При лимите — ссылка на последнюю проверку

**Проблема:** При 429 (DOMAIN_LIMIT) пользователь видит красный toast без возможности посмотреть прошлые результаты.

**Backend (`site-check-scan/index.ts`):**
- В блоке `DOMAIN_LIMIT` (строка ~1754): перед возвратом 429 найти последний успешный scan для этого домена и вернуть его `scan_id` в JSON ответе

**Frontend (`SiteCheck.tsx`):**
- В `handleSubmit` catch: если ответ содержит `scan_id`, вместо красного toast показать информационный блок с кнопкой "Смотреть результаты последней проверки" → navigate к `/tools/site-check/result/:scanId`

### Шаг 3: Сквозная передача URL между инструментами

**`SiteCheckBanner.tsx`:**
- Вместо статичного `href="/tools/site-check"` — передавать `?url=...` из localStorage ключа `owndev_last_url`

**Инструменты (SEOAuditor, InternalLinksChecker и др.):**
- При запуске проверки сохранять URL в `localStorage.setItem('owndev_last_url', url)`

**`ScanForm.tsx`:**
- Добавить `useEffect` при монтировании: читать `URLSearchParams.get('url')` или `localStorage.getItem('owndev_last_url')` и подставлять в поле

### Шаг 4: Canonical для pSEO страниц + чистка sitemap

**Проблема:** pSEO страницы утилит (pseo-generator, anti-duplicate) попадают в индекс Яндекса как малоценные.

**`GeoToolPage.tsx` (строка 53):**
- Canonical уже ведёт на `/tools/:toolSlug/:regionId` — изменить на `/tools/:toolSlug` (основная страница инструмента), чтобы Яндекс консолидировал вес

**`GeoNicheToolPage.tsx` (строка 38):**
- Canonical уже ведёт на `/:city/:niche/:tool` — изменить на `/tools/:toolSlug`

**`vite-plugin-sitemap.ts`:**
- В массиве `geoEnabledTools` оставить только услуговые инструменты (`seo-auditor`), убрать `pseo-generator` и `schema-generator`
- В `nicheEnabledTools` — убрать все (утилиты не нужны в гео-привязке)
- Либо: добавить `<priority>0.3</priority>` для гео-страниц утилит

**`tools-registry.ts`:**
- Установить `geoEnabled: false` для `pseo-generator` и `schema-generator` (страницы останутся, но не будут генерироваться в sitemap и не будут ссылаться друг на друга)

### Шаг 5: Заглушка скачивания отчётов

**`DownloadButtons.tsx`:**
- Изменить текст toast с "Скоро будет доступно" на "Генерация PDF-отчетов находится на этапе бета-тестирования"

---

### Файлы для изменения

| Файл | Изменение |
|------|-----------|
| `supabase/functions/site-check-scan/index.ts` | Вернуть `scan_id` при DOMAIN_LIMIT |
| `src/pages/SiteCheck.tsx` | Обработать `scan_id` в ошибке лимита |
| `src/pages/SiteCheckResult.tsx` | Улучшить error handling в handlePay |
| `src/components/site-check/ScanForm.tsx` | useEffect для авто-подстановки URL |
| `src/components/SiteCheckBanner.tsx` | Передавать ?url= из localStorage |
| `src/components/tools/SEOAuditor.tsx` | Сохранять URL в localStorage |
| `src/components/tools/InternalLinksChecker.tsx` | Сохранять URL в localStorage |
| `src/pages/GeoToolPage.tsx` | Canonical → /tools/:toolSlug |
| `src/pages/GeoNicheToolPage.tsx` | Canonical → /tools/:toolSlug |
| `vite-plugin-sitemap.ts` | Убрать утилиты из geoEnabledTools |
| `src/data/tools-registry.ts` | geoEnabled: false для pseo/schema |
| `src/components/site-check/DownloadButtons.tsx` | Обновить текст toast |
| `src/components/site-check/PaywallCTA.tsx` | Toast при успехе |

