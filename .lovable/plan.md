

## Цель

1. **Exponential backoff на сетевые ошибки** при поллинге `getScanStatus` — 3с → 5с → 10с → 10с... (cap 10с), сброс счётчика на любом успешном ответе.
2. **SSE для real-time прогресса** — добавить `GET /api/v1/site-check/events/:scanId` на бэке, который шлёт `progress`/`done`/`error` события без опроса. Поллинг оставляем как **fallback** на случай когда SSE не работает (старый прокси / firewall / нет EventSource).

## Часть 1. Exponential backoff (фронт)

Файл: `src/pages/SiteCheck.tsx`, функция `pollStatus`.

- Завести локальный счётчик `errorCount` внутри `poll`.
- На каждом успешном `getScanStatus` → сбросить `errorCount = 0`.
- В `catch` → `errorCount++`, рассчитать `backoff = [3000, 5000, 10000][Math.min(errorCount-1, 2)]` и `setTimeout(poll, backoff)`.
- Если `errorCount >= 10` (≈100 сек подряд недоступен бэк) — показать toast «Связь с сервером потеряна, переподключаемся…» один раз и продолжить, не падая.

```ts
const BACKOFF_STEPS = [3000, 5000, 10000];
let errorCount = 0;
let warnedDisconnected = false;

const poll = async () => {
  if (!mountedRef.current) return;
  try {
    const status = await getScanStatus(id);
    errorCount = 0; // reset on success
    if (warnedDisconnected) {
      warnedDisconnected = false;
      toast({ title: 'Связь восстановлена' });
    }
    // ... existing done/error/setTimeout logic
  } catch {
    if (!mountedRef.current) return;
    errorCount++;
    if (errorCount === 10 && !warnedDisconnected) {
      warnedDisconnected = true;
      toast({ title: 'Связь с сервером потеряна', description: 'Переподключаемся…' });
    }
    const backoff = BACKOFF_STEPS[Math.min(errorCount - 1, BACKOFF_STEPS.length - 1)];
    setTimeout(poll, backoff);
  }
};
```

## Часть 2. SSE — real-time прогресс

### Бэкенд: новый endpoint

Файл: `owndev-backend/src/api/routes/siteCheck.ts`. Добавить **рядом с `/status/:scanId`**:

```ts
// GET /api/v1/site-check/events/:scanId — Server-Sent Events
app.get<{ Params: { scanId: string } }>('/events/:scanId', async (req, reply) => {
  const { scanId } = req.params;
  
  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // отключить буферизацию nginx
  });
  
  let lastPct = -1;
  let lastStatus = '';
  let closed = false;
  
  req.raw.on('close', () => { closed = true; });
  
  // Heartbeat каждые 15с — держит соединение живым через прокси/firewall
  const heartbeat = setInterval(() => {
    if (closed) return;
    reply.raw.write(`: ping\n\n`);
  }, 15_000);
  
  // Опрос БД каждую 1с (это внутрисерверный SQL, дёшево; клиент не опрашивает)
  const poll = async () => {
    while (!closed) {
      const rows = await sql<Array<{ status: string; progress_pct: number; error_message: string | null }>>`
        SELECT status, progress_pct, error_message FROM site_check_scans WHERE id = ${scanId}
      `;
      if (!rows.length) {
        reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: 'not_found' })}\n\n`);
        break;
      }
      const { status, progress_pct, error_message } = rows[0];
      if (progress_pct !== lastPct || status !== lastStatus) {
        lastPct = progress_pct;
        lastStatus = status;
        reply.raw.write(`event: progress\ndata: ${JSON.stringify({ status, progress_pct })}\n\n`);
      }
      if (status === 'done') {
        reply.raw.write(`event: done\ndata: ${JSON.stringify({ scan_id: scanId })}\n\n`);
        break;
      }
      if (status === 'error') {
        reply.raw.write(`event: error\ndata: ${JSON.stringify({ error: error_message ?? 'scan_failed' })}\n\n`);
        break;
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    clearInterval(heartbeat);
    if (!closed) reply.raw.end();
  };
  
  poll().catch(() => {
    clearInterval(heartbeat);
    try { reply.raw.end(); } catch {}
  });
});
```

Замечания:
- БД-поллинг внутри сервера (1с) — дешевле, чем десятки клиентов опрашивающих API через сеть.
- `X-Accel-Buffering: no` — критично, иначе nginx буферизует SSE и клиент ничего не видит.
- Auth-middleware применяется глобально (`onRequest`) — анонимные запросы проходят как `ANON_USER`, эндпоинт публичный (как `/status`).

### Фронт: гибридный клиент

Новый файл `src/lib/api/scan-events.ts`:

```ts
import { API_BASE_URL, API_VERSION } from './config';

export type ScanEvent =
  | { type: 'progress'; status: string; progress_pct: number }
  | { type: 'done'; scan_id: string }
  | { type: 'error'; error: string };

export function subscribeScanEvents(
  scanId: string,
  onEvent: (e: ScanEvent) => void,
  onFatal: () => void, // сигнал «SSE недоступно, переключайся на polling»
): () => void {
  const url = `${API_BASE_URL}/${API_VERSION}/site-check/events/${scanId}`;
  let es: EventSource;
  try {
    es = new EventSource(url, { withCredentials: false });
  } catch {
    onFatal();
    return () => {};
  }
  
  es.addEventListener('progress', (ev) => {
    try {
      const data = JSON.parse((ev as MessageEvent).data);
      onEvent({ type: 'progress', ...data });
    } catch {}
  });
  es.addEventListener('done', (ev) => {
    try {
      const data = JSON.parse((ev as MessageEvent).data);
      onEvent({ type: 'done', scan_id: data.scan_id });
    } catch {}
    es.close();
  });
  es.addEventListener('error', (ev) => {
    // EventSource сам ретраит, но если соединение упало >3 раз — fallback
    if (es.readyState === EventSource.CLOSED) {
      onFatal();
    }
  });
  
  return () => es.close();
}
```

### Интеграция в `src/pages/SiteCheck.tsx`

Заменяем вызов `pollStatus(scan_id)` на:

```ts
const startTracking = (id: string) => {
  let pollFallbackStarted = false;
  
  const cleanup = subscribeScanEvents(
    id,
    (ev) => {
      if (!mountedRef.current) return;
      if (ev.type === 'progress') setProgress(ev.progress_pct);
      else if (ev.type === 'done') navigate(`/tools/site-check/result/${id}`);
      else if (ev.type === 'error') {
        toast({ title: 'Ошибка проверки', variant: 'destructive' });
        setScanError('Не удалось проанализировать сайт. Попробуйте ещё раз.');
        setScanning(false);
      }
    },
    () => {
      // SSE недоступно (CORS/прокси/старый браузер) — fallback на polling
      if (pollFallbackStarted) return;
      pollFallbackStarted = true;
      logger?.warn?.('SSE failed, falling back to polling');
      pollStatus(id);
    },
  );
  
  // На размонтировании — закрыть SSE
  cleanupRef.current = cleanup;
};
```

Добавить `cleanupRef = useRef<() => void>()` и в существующий `useEffect` cleanup:
```ts
useEffect(() => {
  return () => {
    mountedRef.current = false;
    cleanupRef.current?.();
  };
}, []);
```

`pollStatus` остаётся в файле как fallback с уже встроенным adaptive interval + новым exponential backoff из Части 1.

## Файлы

| Файл | Действие |
|---|---|
| `owndev-backend/src/api/routes/siteCheck.ts` | **Edit** — добавить `GET /events/:scanId` (SSE-эндпоинт) рядом с `/status/:scanId` |
| `src/lib/api/scan-events.ts` | **New** — клиент `EventSource` с graceful fallback callback |
| `src/pages/SiteCheck.tsx` | **Edit** — добавить exponential backoff в `pollStatus` (Часть 1); заменить прямой вызов `pollStatus` на `startTracking` который сначала пробует SSE, при фейле падает на polling; закрытие EventSource в cleanup |

## Что НЕ трогаем

- `src/lib/site-check-api.ts` / `src/lib/api/scan.ts` — поллинг-функция остаётся (она используется как fallback и в других местах не вызывается, но интерфейс не меняем).
- `ScanProgress.tsx` — только потребляет `realProgress`, источник прозрачен.
- Логику `done/error/navigate` — поведение сохраняем 1:1.
- Header/Footer/маршруты/БД-схему/правила памяти.
- Другие эндпоинты `siteCheck.ts` (`/status` остаётся для fallback и внешних потребителей).

## Проверка

1. **SSE happy path**: открыть DevTools → Network → фильтр `events/`. После старта проверки — **1 запрос** с типом `eventsource`, в нём идут события `progress` каждый раз когда меняется `progress_pct`. Запросов к `/status/` **нет**.
2. **SSE → fallback**: в DevTools заблокировать `/events/` (Block request URL). Через ~3 сек начинают идти запросы к `/status/` с adaptive интервалами (1с/2с/3с) — старая логика работает.
3. **Exponential backoff**: в DevTools отключить сеть на 30 сек во время поллинга (когда SSE отвалился) — интервалы между retry-попытками 3с → 5с → 10с → 10с. После 10 фейлов — toast «Связь с сервером потеряна, переподключаемся…». При восстановлении — toast «Связь восстановлена», поллинг продолжается.
4. **Done**: при `status=done` — событие `done` приходит мгновенно, `EventSource` закрывается, навигация на `/result/:id`.
5. **Heartbeat**: оставить вкладку открытой 1 минуту на стадии 75% — соединение не рвётся (служебные `: ping` каждые 15с).
6. **Размонтирование**: уйти с страницы во время сканирования — соединение закрывается (нет утечки `EventSource` в Network).

