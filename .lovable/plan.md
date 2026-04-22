

## Цель

Применить 16 правок из аудита в строгой последовательности 3 приоритетов, не сломав текущий пайплайн. Никаких архитектурных изменений — только точечные фиксы багов, метрик и 6 новых проверок. После каждого приоритета — `tsc --noEmit` и smoke-тест сканом.

## Файлы, которые меняются

- `owndev-backend/src/services/SiteCheckPipeline.ts` — 15 из 16 правок
- `owndev-backend/src/api/routes/siteCheck.ts` — 1 правка (rate limit /start)
- `owndev-backend/CHANGELOG.md` — запись Unreleased
- Фронт: проверить `LlmJudgeSection`, `ScoreCards`, `IssueCard`, `KeywordsSection` — изменений данных нет, но если у issue поменялось `title` (LCP→TTFB) и появились новые модули `low/medium` — убедиться что фронт их рендерит. Скорее всего правок не нужно (новые issue идут общим списком).

---

## Приоритет 1 — критичные баги (5 шагов)

### Шаг 1. БАГ 1 — `issueCounter` race condition

В `SiteCheckPipeline.ts`:
- Удалить строку `let issueCounter = 0;` на уровне модуля (строка 191).
- Сделать `makeIssue` фабрикой, создаваемой внутри `runPipeline`:
  ```ts
  function createIssueFactory() {
    let counter = 0;
    return (partial) => ({ id: `issue_${++counter}`, ... });
  }
  ```
- В `runPipeline` первой строкой: `const makeIssue = createIssueFactory();` и удалить старый `issueCounter = 0;`.
- Все вспомогательные функции (`technicalAudit`, `contentAudit`, `directAudit`, `schemaAudit`, `aiAudit`, `competitorAnalysis`) — принимают `makeIssue` параметром и используют его. Тип параметра — `MakeIssueFn`.

### Шаг 2. БАГ 2 — noMixedContent ложные срабатывания

В `detectSeoFailuresFromHtml` (строка 343):
```ts
const hasMixedRes = /(?:src|action|data|poster)=["']http:\/\//i.test(html)
  || /<link[^>]*rel=["']stylesheet["'][^>]*href=["']http:\/\//i.test(html)
  || /<script[^>]*src=["']http:\/\//i.test(html);
```

### Шаг 3. БАГ 3 — двойной /llms.txt

- Сигнатура: `aiAudit(html, origin, pageUrl, isSpa, spaRenderFailed, hasLlmsTxt: boolean, makeIssue)`.
- Внутри `aiAudit` блок `try { fetchWithTimeout(/llms.txt) }` заменить на:
  ```ts
  if (!hasLlmsTxt) { issues.push(makeIssue({ ... тот же issue ... })); }
  ```
- В `runPipeline` вызов: `await aiAudit(html, origin, parsedUrl.toString(), isSpa, spaRenderFailed, hasLlmsTxt, makeIssue)`.

### Шаг 4. БАГ 4 — robots.txt User-agent группировка

В `SiteCheckPipeline.ts` добавить функцию `parseRobotsDisallowForAll(robotsTxt: string): string[]` (только блок `User-agent: *`).

В `technicalAudit` (строки 622-626) заменить ручную фильтрацию:
```ts
const blockedPaths = parseRobotsDisallowForAll(robotsTxt);
const currentPath = parsedUrl.pathname;
if (blockedPaths.some(p => p && currentPath.startsWith(p))) { /* prev critical issue */ }
```

### Шаг 5. БАГ 5 — HEAD → GET fallback

Заменить функцию `checkUrl` (строки 34-39):
```ts
async function checkUrl(url) {
  try {
    const resp = await fetchWithTimeout(url, 5000, { method: 'HEAD', redirect: 'follow' });
    if (resp.status === 405) {
      const getResp = await fetchWithTimeout(url, 5000, { method: 'GET', redirect: 'follow' });
      return { ok: getResp.ok, status: getResp.status };
    }
    return { ok: resp.ok, status: resp.status };
  } catch { return { ok: false, status: 0 }; }
}
```

**Проверка после Шагов 1–5:** `cd owndev-backend && npx tsc --noEmit` → 0 ошибок.

---

## Приоритет 2 — точность метрик (6 шагов)

### Шаг 6. ТОЧНОСТЬ 1 — TTFB вместо LCP

В `technicalAudit` (строки 658-662):
- 4с блок: `title: 'Медленный ответ сервера (TTFB ${...}с)'`, `why_it_matters: 'Высокий TTFB (время до первого байта) замедляет загрузку для всех пользователей и снижает LCP'`.
- 2.5с блок: `title: 'Медленный TTFB (${...}с)'`, аналогичный текст.

### Шаг 7. ТОЧНОСТЬ 2 — OG-теги с непустым content

Заменить три проверки `hasOgTitle/hasOgDesc/hasOgImage` в **двух** местах:
- `detectSeoFailuresFromHtml` (строки 306-309)
- `contentAudit` (строки 732-734)

На вариант, требующий `content=["'][^"']+["']` с поддержкой обратного порядка атрибутов (как в промпте).

### Шаг 8. ТОЧНОСТЬ 3 — wordCount Unicode

Найти все вхождения `.filter(w => w.length > 1).length` и заменить на `.filter(w => /[\p{L}\p{N}]/u.test(w)).length`. Точки замены:
- `isSpaPage` (строка 51)
- `detectSeoFailuresFromHtml` (строка 320)
- `detectLlmFailuresFromHtml` — там используется `bodyText.split` без filter, не трогаем
- `contentAudit` (строка 694)
- `directAudit` (строка 769)
- Проверить также `parseCompetitorHtml` и `competitorAnalysis` — там `length > 2`, оставляем как есть (это другая логика отбора фраз).

### Шаг 9. ТОЧНОСТЬ 4 — SPA detection SSR false positives

В `isSpaPage` (строка 54):
```ts
const hasServerRendered = /data-server-rendered=["']true["']/i.test(html)
  || /<script[^>]*id=["']__NEXT_DATA__["']/i.test(html)
  || /data-reactroot/i.test(html)
  || /window\.__NUXT__/i.test(html);
return wordCount < 150 && (hasAppRoot || hasFrameworkBundle) && !hasServerRendered;
```

### Шаг 10. ТОЧНОСТЬ 5 — Schema required fields

В `schemaAudit` после блока с `schemaTypes` (после строки 966) добавить парсинг `jsonLdMatches` с проверкой `Organization`/`LocalBusiness` на наличие `name` + `url`. Эмитить medium issue если не хватает. Существующую логику не удалять.

### Шаг 11. ТОЧНОСТЬ 6 — CTA pattern расширение

В `directAudit` (строка 807) заменить `ctaPattern` на расширенный (как в промпте — `узнать цену|рассчитать|скачать|попробовать|подобрать|оформить|начать|отправить|связаться|обратиться|демо|trial|download|order|buy|request`).

**Проверка после Шагов 6–11:** `tsc --noEmit` → 0 ошибок. Тестовый скан → новые тексты TTFB видны в UI без правок фронта.

---

## Приоритет 3 — новые проверки (5 шагов, НОВОЕ 5 уже сделано ранее)

### Шаг 12. НОВОЕ 1 — Twitter Card

В `contentAudit` перед `return issues;` добавить проверку `twitter:card` (с непустым content). Severity `low`.

### Шаг 13. НОВОЕ 2+3 — Security + Cache-Control headers

- В `runPipeline` после `fetchWithTimeout` собрать `responseHeaders: Record<string,string>`.
- Сигнатура: `technicalAudit(..., loadTimeMs, responseHeaders)`.
- В конце `technicalAudit` — проверка `x-content-type-options`, `x-frame-options` (severity low) + Cache-Control (low).
- **ОСТОРОЖНО:** в `responseHeaders` уже хранится lowercased, и парсинг `forEach((v,k) => ...)` корректен для Node fetch.

### Шаг 14. НОВОЕ 4 — Rate limit /start (5/час на IP)

В `siteCheck.ts` POST `/start` после валидации URL, перед cache check (строка ~127):
```ts
const scanKey = `scan_limit:${req.ip}`;
const scanCount = await redis.incr(scanKey);
if (scanCount === 1) await redis.expire(scanKey, 3600);
if (scanCount > 5) {
  return reply.status(429).send({ success: false, error: 'Превышен лимит: максимум 5 сканов в час.', code: 'SCAN_LIMIT' });
}
```
`redis` уже импортирован. Это ad-hoc лимитер поверх Redis — пользователь явно просит, делаем.

### Шаг 15. НОВОЕ 6 — Sitemap lastmod актуальность

В `technicalAudit` в блоке `else if (sitemapBody)` (после строки 638) добавить проверку `<lastmod>YYYY-MM-DD>` → если > 6 мес назад → medium issue.

### Шаг 16. НОВОЕ 7 — Viewport content check

В `technicalAudit` (строки 664-667) уже есть `vpMatch` с захватом content. Добавить `else { if (!/width=device-width/i.test(vpMatch[1])) issues.push(...) }`.

**НОВОЕ 5** (`site_check` queue в `/health`) — уже выполнено в предыдущей итерации, пропускаем.

---

## CHANGELOG

В `owndev-backend/CHANGELOG.md` под `## [Unreleased]`:

**Fixed (критичные баги):**
- Race condition `issueCounter` при параллельных сканах (фабрика на скан).
- Mixed Content false positives на внешних `<a href="http://">`.
- Двойной fetch `/llms.txt` в `runPipeline` + `aiAudit` — теперь один HEAD.
- robots.txt Disallow теперь учитывает группировку по `User-agent: *`.
- HEAD 405 → fallback на GET в `checkUrl`.

**Fixed (точность метрик):**
- TTFB больше не называется LCP в issue title/description.
- OG-теги проверяются по непустому `content`, а не наличию атрибута.
- `wordCount` фильтрует пунктуацию через `/[\p{L}\p{N}]/u`.
- SPA detection: исключены false positives на Next.js SSR / Nuxt / Vue SSR.
- `schemaAudit` проверяет `name`+`url` у Organization/LocalBusiness.
- CTA pattern расширен (узнать цену, рассчитать, demo, trial, скачать и др.).

**Added:**
- Twitter Card проверка (low) в `contentAudit`.
- Security headers `X-Content-Type-Options`, `X-Frame-Options` (low).
- `Cache-Control` проверка (отсутствие/no-store/no-cache).
- Rate limit `/start`: 5 сканов/час на IP.
- Sitemap.xml `<lastmod>` старше 6 месяцев → medium issue.
- Viewport без `width=device-width` → medium issue.

---

## Что НЕ трогаем

- `OVERALL_WEIGHTS` — синхронизированы.
- `geo_rating` — структура и записи.
- LLM-judge (`simulated: true`).
- Фронтенд-компоненты — все правки на бэке возвращают новые issue в существующем формате `IssueCard`. Фронт уже умеет рендерить любой `severity`/`module`. Новые issue появятся автоматически.
- Header, навигация, мобильный drawer.

---

## Порядок и проверка

1. Шаги 1–5 → `tsc --noEmit` → запустить локальный скан `owndev.ru` → убедиться, что:
   - `issue_*` ID идут по порядку, без коллизий;
   - сайт с внешним http-линком не теряет noMixedContent;
   - `/llms.txt` фетчится один раз (логи);
   - robots.txt с `User-agent: Googlebot` не блокирует страницу;
   - HEAD 405 → GET fallback срабатывает.
2. Шаги 6–11 → `tsc --noEmit` → скан → в UI:
   - issue говорит «TTFB», не «LCP»;
   - сайт с пустым `og:title content=""` теперь fail;
   - SPA на Next.js SSR не уходит в Jina;
   - Organization без name → новый medium issue;
   - сайт с CTA «узнать цену» проходит commercialSignals.
3. Шаги 12–16 → `tsc --noEmit` → скан → в UI появляются low/medium issues для twitter:card, security headers, cache-control, viewport, lastmod. 6-й scan с того же IP → 429 SCAN_LIMIT.
4. Финал: `grep -rn "issueCounter" owndev-backend/src` → пусто (только в фабрике); `grep -rn "fetchWithTimeout(.*llms.txt" owndev-backend/src` → одно вхождение.

