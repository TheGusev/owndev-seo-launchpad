

## Цель

Завершить аудит-чистку: убрать лишние зависимости, синхронизировать веса фронт/бэк, удалить мёртвый код, добавить мониторинг и защитные механизмы. 8 шагов в строгом порядке.

## Шаги

### Шаг 1. `owndev-backend/package.json` — убрать `puppeteer`

Удалить из `dependencies` строку `"puppeteer": "^23.0.0"`. Запустить `npm install` для регенерации lockfile (chromium ~280 МБ уйдёт). Проверка: `npx tsc --noEmit` → 0 ошибок.

### Шаг 2. `owndev-backend/package.json` — убрать `node-cron`

Подтверждено grep'ом: `node-cron` не импортируется ни в одном из 70 TS-файлов. Удалить:
- `"node-cron": "^3.0.3"` из `dependencies`
- `"@types/node-cron": "^3.0.11"` из `devDependencies`

Проверка: `npx tsc --noEmit` → 0 ошибок.

### Шаг 3. Удалить `owndev-backend/src/services/SchemaService.ts`

Класс не импортируется нигде; в `SiteCheckPipeline.ts` валидация схем сделана inline. Удалить файл целиком. Проверка: `grep -rn "SchemaService" owndev-backend/src` → пусто; `npx tsc --noEmit` → 0 ошибок.

### Шаг 4. `src/utils/scoreCalculation.ts` — синхронизировать веса с бэком

Заменить:
```ts
export const OVERALL_WEIGHTS = {
  seo: 0.35,
  direct: 0.20,
  schema: 0.15,  // было 0.20 — теперь совпадает с backend calcScoresWeighted
  ai: 0.30,      // было 0.25 — теперь совпадает с backend calcScoresWeighted
};
```

Это убирает рассинхрон: пользователь видел в UI 20%/25%, реально считалось 15%/30%.

### Шаг 5. `owndev-backend/src/api/routes/health.ts` + `queue/queues.ts` — добавить `site_check` очередь

В `queues.ts` добавить экспорт `siteCheckQueue` (или подтвердить, что он уже есть; если нет — создать с теми же `defaultJobOptions`, что и `monitorQueue`).

В `health.ts`:
```ts
import { monitorQueue, siteCheckQueue } from '../../queue/queues.js';

const [mq, sq] = await Promise.all([
  monitorQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
  siteCheckQueue.getJobCounts('waiting', 'active', 'completed', 'failed'),
]);

// в payload:
queues: { monitor: mq, site_check: sq }
```

Структура `services` / `queues` сохраняется.

### Шаг 6. `owndev-backend/src/services/SiteCheckPipeline.ts` — верификация URL конкурентов через `checkUrl()`

В `competitorAnalysis()` перед `fetchPromises` добавить фильтр:
```ts
const verifiedUrls: string[] = [];
await Promise.allSettled(
  [...competitorUrls].map(async (cu) => {
    const check = await checkUrl(cu);
    if (check.ok) verifiedUrls.push(cu);
  })
);
const fetchPromises = verifiedUrls.map(async (compUrl) => { /* ... */ });
```

`checkUrl()` уже есть в файле — не дублировать. Это убирает 404-галлюцинации LLM.

### Шаг 7. `owndev-backend/src/workers/SiteCheckWorker.ts` — `normalizeCategoryFromTheme()`

Добавить функцию:
```ts
function normalizeCategoryFromTheme(theme: string): string {
  const t = theme.toLowerCase();
  if (/магазин|shop|интернет-магазин|маркет|товар/i.test(t)) return 'Магазин';
  if (/медиа|блог|новост|журнал|сми|издани/i.test(t)) return 'Медиа';
  if (/обучен|образован|курс|школа|академия|edtech/i.test(t)) return 'Образование';
  if (/агентств|студия|seo|маркетинг|реклам/i.test(t)) return 'Маркетинг';
  if (/b2b|бизнес|корпоратив|enterprise|crm|erp/i.test(t)) return 'B2B';
  if (/финанс|банк|инвест|крипт|страхов/i.test(t)) return 'Финансы';
  return 'Сервисы';
}
```

Заменить вычисление `category` на использование этой функции. Удалить TODO-комментарий о маппинге.

### Шаг 8. `owndev-backend/src/api/routes/siteCheck.ts` — SSE heartbeat

В `GET /events/:scanId` после открытия SSE добавить:
```ts
const heartbeat = setInterval(() => {
  try { reply.raw.write('event: ping\ndata: {}\n\n'); } catch {}
}, 15000);
```

В существующем cleanup (по `onAborted` / рядом с `clearInterval(pollInterval)`) добавить `clearInterval(heartbeat);`. Защита от nginx silent disconnect (`proxy_read_timeout` ~30–60с). Фронт игнорирует `event: ping`.

### CHANGELOG

В `owndev-backend/CHANGELOG.md` под `## [Unreleased]` дописать:
- **Removed**: `puppeteer`, `node-cron`, `@types/node-cron`, `SchemaService.ts` (мёртвый код).
- **Fixed**: рассинхрон весов фронт/бэк в `OVERALL_WEIGHTS` (schema 0.15, ai 0.30).
- **Added**: `site_check` queue counts в `/health`; верификация URL конкурентов через `checkUrl()`; нормализация категорий `geo_rating`; SSE heartbeat (15s).

## Что НЕ трогаем

- `calcScoresWeighted` на бэке (веса уже откалиброваны).
- Структуру таблицы `geo_rating` и существующие 111 записей.
- LLM-модель в `llm-judge` (помечено `simulated: true`).
- Миграции БД, фронтенд (кроме одного файла `scoreCalculation.ts`).

## Проверка

1. `cd owndev-backend && npx tsc --noEmit` после каждого из шагов 1–3, 5–8 → 0 ошибок.
2. `grep -rn "puppeteer\|node-cron\|SchemaService" owndev-backend/src owndev-backend/package.json` → пусто.
3. `du -sh owndev-backend/node_modules` до/после шага 1 — ожидаемое падение ~280 МБ.
4. `curl $API/api/v1/health` → `data.queues` содержит `monitor` и `site_check`.
5. UI site-check report: общая оценка пересчитывается с новыми весами; визуально breakdown показывает schema 15% / ai 30%.
6. Скан с заведомо несуществующими конкурентами от LLM → в финальном отчёте только реально доступные домены.
7. Скан сайта c темой "интернет-магазин кондиционеров" → в `geo_rating.category = 'Магазин'`.
8. SSE-стрим >60 сек через nginx → не обрывается, в DevTools Network видны `event: ping` каждые 15 с.

