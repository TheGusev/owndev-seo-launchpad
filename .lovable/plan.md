

## Цель

Перенести `/marketplace-audit` с polling-а `/preview/:id` на **SSE-стриминг** прогресса по образцу site-check. Polling оставить как fallback. Финальный `/result/:id` после `done` так и подгружается одним запросом — это правильно, тяжёлый payload через SSE гнать не нужно.

## Часть 1. Бэкенд — новый SSE endpoint

Файл: `owndev-backend/src/api/routes/marketplaceAudit.ts`. Добавить рядом с `/preview/:id`:

```ts
// GET /api/v1/marketplace-audit/events/:id — Server-Sent Events
app.get<{ Params: { id: string } }>('/events/:id', async (req, reply) => {
  const { id } = req.params;

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  let lastPct = -1;
  let lastStatus = '';
  let closed = false;
  req.raw.on('close', () => { closed = true; });

  const heartbeat = setInterval(() => {
    if (!closed) reply.raw.write(`: ping\n\n`);
  }, 15_000);

  const poll = async () => {
    while (!closed) {
      const rows = await sql<Array<{
        status: string; progress_pct: number;
        product_title: string | null; category: string | null;
        images_json: any; scores_json: any; error_msg: string | null;
      }>>`
        SELECT status, progress_pct, product_title, category,
               images_json, scores_json, error_msg
        FROM marketplace_audits WHERE id = ${id}
      `;
      if (!rows.length) {
        reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: 'not_found' })}\n\n`);
        break;
      }
      const r = rows[0];
      if (r.progress_pct !== lastPct || r.status !== lastStatus) {
        lastPct = r.progress_pct;
        lastStatus = r.status;
        const scores = r.scores_json && (r.scores_json as any).total !== undefined ? r.scores_json : null;
        reply.raw.write(`event: progress\ndata: ${JSON.stringify({
          status: r.status,
          progress_pct: r.progress_pct,
          product_title: r.product_title,
          category: r.category,
          image: Array.isArray(r.images_json) && r.images_json.length > 0 ? r.images_json[0] : null,
          preview_scores: scores ? {
            total: scores.total, content: scores.content, search: scores.search,
            conversion: scores.conversion, ads: scores.ads,
          } : null,
        })}\n\n`);
      }
      if (r.status === 'done') {
        reply.raw.write(`event: done\ndata: ${JSON.stringify({ id })}\n\n`);
        break;
      }
      if (r.status === 'error') {
        reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: r.error_msg ?? 'audit_failed' })}\n\n`);
        break;
      }
      await new Promise((res) => setTimeout(res, 1000));
    }
    clearInterval(heartbeat);
    if (!closed) try { reply.raw.end(); } catch {}
  };

  poll().catch(() => {
    clearInterval(heartbeat);
    try { reply.raw.end(); } catch {}
  });
});
```

Поведение `progress` payload — это **тот же объект что отдаёт `/preview/:id`** (минус `id` который уже в URL), чтобы фронт мог использовать его как полный `PreviewResponse`. `/preview/:id` остаётся как fallback.

## Часть 2. Фронт — SSE-клиент

Новый файл `src/lib/api/marketplace-audit-events.ts` (структурно идентичен `scan-events.ts`):

```ts
import { API_BASE_URL, API_VERSION } from './config';
import type { PreviewResponse } from '../marketplace-audit-types';

export type MarketplaceAuditEvent =
  | { type: 'progress'; preview: PreviewResponse }
  | { type: 'done'; id: string }
  | { type: 'error'; error: string };

export function subscribeMarketplaceAuditEvents(
  auditId: string,
  onEvent: (e: MarketplaceAuditEvent) => void,
  onFatal: () => void,
): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    onFatal();
    return () => {};
  }
  const url = `${API_BASE_URL}/${API_VERSION}/marketplace-audit/events/${auditId}`;
  let es: EventSource;
  try { es = new EventSource(url, { withCredentials: false }); }
  catch { onFatal(); return () => {}; }

  let closedByCaller = false;
  let firedFatal = false;
  let gotAnything = false;

  const fireFatal = () => {
    if (firedFatal) return;
    firedFatal = true;
    try { es.close(); } catch {}
    onFatal();
  };

  es.addEventListener('progress', (ev) => {
    gotAnything = true;
    try {
      const data = JSON.parse((ev as MessageEvent).data);
      onEvent({ type: 'progress', preview: { id: auditId, ...data } as PreviewResponse });
    } catch {}
  });
  es.addEventListener('done', (ev) => {
    gotAnything = true;
    try {
      const data = JSON.parse((ev as MessageEvent).data);
      onEvent({ type: 'done', id: data.id ?? auditId });
    } catch { onEvent({ type: 'done', id: auditId }); }
    closedByCaller = true;
    try { es.close(); } catch {}
  });
  es.addEventListener('error', () => {
    if (es.readyState === EventSource.CLOSED && !closedByCaller) fireFatal();
  });

  const watchdog = setTimeout(() => {
    if (!gotAnything && !closedByCaller) fireFatal();
  }, 8000);

  return () => {
    closedByCaller = true;
    clearTimeout(watchdog);
    try { es.close(); } catch {}
  };
}
```

## Часть 3. Хук `useMarketplaceAudit` — гибридная логика

Файл: `src/hooks/useMarketplaceAudit.ts`. Сейчас там polling каждые 1.5с с rate-limit backoff. Перерабатываем:

1. На старте → `subscribeMarketplaceAuditEvents`. На событиях `progress` обновляем `state.preview`. На `done` → загружаем `getAuditResult` → `state.result`, останавливаемся. На `error` — выставляем `state.error`.
2. На `onFatal` (SSE недоступно) → стартуем существующий polling-цикл. Cleanup закрывает оба.
3. Добавить **exponential backoff** на сетевые ошибки polling-fallback по образцу site-check: счётчик `errorCount`, шаги `[2000, 4000, 8000]` (cap 8с, для marketplace это нормально), сброс на успехе. Сохранить существующий rate-limit backoff.
4. Существующий лимит `MAX_POLLS = 120` оставить только для polling-режима. Для SSE — не нужен (heartbeat держит соединение).
5. Cleanup в `useEffect` должен закрывать и SSE-подписку, и pending polling timeout.

Поведение видимое пользователю не меняется: `MarketplaceAuditResult.tsx` продолжает читать `preview.status`, `preview.progress_pct`, `result.scores` — менять компонент не нужно.

## Файлы

| Файл | Действие |
|---|---|
| `owndev-backend/src/api/routes/marketplaceAudit.ts` | **Edit** — добавить `GET /events/:id` (SSE) рядом с `/preview/:id` |
| `src/lib/api/marketplace-audit-events.ts` | **New** — `EventSource` обёртка с watchdog и graceful fallback |
| `src/hooks/useMarketplaceAudit.ts` | **Edit** — гибрид: SSE primary + polling fallback с exponential backoff |

## Что НЕ трогаем

- `src/lib/api/marketplaceAudit.ts` — `getAuditPreview` / `getAuditResult` остаются (нужны для fallback и финальной загрузки результата).
- `MarketplaceAuditResult.tsx`, все компоненты `src/components/marketplace/*` — интерфейсы `preview`/`result` не меняются.
- Worker / queue / БД-схема / правила памяти.
- Site-check SSE и существующие маршруты.

## Проверка

1. **SSE happy path**: открыть `/marketplace-audit`, запустить аудит карточки WB → `MarketplaceAuditResult`. DevTools → Network, фильтр `events/` — **1 запрос** типа `eventsource`. Запросов к `/preview/` нет. Прогресс-бар плавно растёт по событиям.
2. **`done`**: после завершения аудита SSE присылает `done`, хук подгружает `/result/:id`, экран переключается на полный отчёт.
3. **SSE → fallback**: в DevTools Block request URL для `/marketplace-audit/events/`. Через ~8 сек начинают идти запросы к `/preview/` каждые 1.5с — fallback работает.
4. **Exponential backoff**: отключить сеть на 30 сек во время polling-режима — интервалы между retry 2с → 4с → 8с → 8с. При восстановлении — polling продолжается.
5. **Heartbeat**: оставить вкладку на стадии `parsing` 1 минуту — соединение не рвётся.
6. **Cleanup**: уйти со страницы во время аудита — соединение `eventsource` закрывается в Network, нет утечки.

