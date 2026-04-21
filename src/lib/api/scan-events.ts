/**
 * SSE-клиент для прогресса site-check сканирования.
 * При недоступности SSE (CORS / прокси / старый браузер) вызывает onFatal,
 * чтобы потребитель переключился на polling.
 */
import { API_BASE_URL, API_VERSION } from './config';

export type ScanEvent =
  | { type: 'progress'; status: string; progress_pct: number }
  | { type: 'done'; scan_id: string }
  | { type: 'error'; error: string };

export function subscribeScanEvents(
  scanId: string,
  onEvent: (e: ScanEvent) => void,
  onFatal: () => void,
): () => void {
  if (typeof window === 'undefined' || typeof EventSource === 'undefined') {
    onFatal();
    return () => {};
  }

  const url = `${API_BASE_URL}/${API_VERSION}/site-check/events/${scanId}`;
  let es: EventSource;
  try {
    es = new EventSource(url, { withCredentials: false });
  } catch {
    onFatal();
    return () => {};
  }

  let closedByCaller = false;
  let firedFatal = false;

  const fireFatal = () => {
    if (firedFatal) return;
    firedFatal = true;
    try { es.close(); } catch {}
    onFatal();
  };

  es.addEventListener('progress', (ev) => {
    try {
      const data = JSON.parse((ev as MessageEvent).data);
      onEvent({ type: 'progress', status: data.status, progress_pct: data.progress_pct });
    } catch {}
  });

  es.addEventListener('done', (ev) => {
    try {
      const data = JSON.parse((ev as MessageEvent).data);
      onEvent({ type: 'done', scan_id: data.scan_id ?? scanId });
    } catch {
      onEvent({ type: 'done', scan_id: scanId });
    }
    closedByCaller = true;
    try { es.close(); } catch {}
  });

  es.addEventListener('error', () => {
    // EventSource сам ретраит. Если соединение окончательно закрыто —
    // браузер не смог переподключиться → переключаемся на polling.
    if (es.readyState === EventSource.CLOSED && !closedByCaller) {
      fireFatal();
    }
  });

  // Сторожевой таймер: если за 8 сек не пришло ни одного валидного
  // server-событий вообще (например, соединение зависло на проксированной
  // буферизации), считаем SSE недоступным.
  let gotAnything = false;
  const origAdd = es.addEventListener.bind(es);
  ['progress', 'done'].forEach((name) => {
    origAdd(name, () => { gotAnything = true; });
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