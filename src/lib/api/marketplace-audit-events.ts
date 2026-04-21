/**
 * SSE-клиент для прогресса marketplace-аудита.
 * При недоступности SSE вызывает onFatal — потребитель переключается на polling.
 */
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
  try {
    es = new EventSource(url, { withCredentials: false });
  } catch {
    onFatal();
    return () => {};
  }

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
      onEvent({
        type: 'progress',
        preview: { id: auditId, ...data } as PreviewResponse,
      });
    } catch {}
  });

  es.addEventListener('done', (ev) => {
    gotAnything = true;
    try {
      const data = JSON.parse((ev as MessageEvent).data);
      onEvent({ type: 'done', id: data.id ?? auditId });
    } catch {
      onEvent({ type: 'done', id: auditId });
    }
    closedByCaller = true;
    try { es.close(); } catch {}
  });

  // Custom 'error' event from server (not the EventSource error).
  es.addEventListener('error' as any, (ev: any) => {
    // Distinguish: server-side custom event has .data, transport error doesn't.
    if (ev && typeof ev.data === 'string') {
      gotAnything = true;
      try {
        const data = JSON.parse(ev.data);
        onEvent({ type: 'error', error: data.error ?? 'audit_failed' });
      } catch {
        onEvent({ type: 'error', error: 'audit_failed' });
      }
      closedByCaller = true;
      try { es.close(); } catch {}
      return;
    }
    if (es.readyState === EventSource.CLOSED && !closedByCaller) {
      fireFatal();
    }
  });

  // Watchdog: если за 8 сек ни одного валидного события — SSE недоступен.
  const watchdog = setTimeout(() => {
    if (!gotAnything && !closedByCaller) fireFatal();
  }, 8000);

  return () => {
    closedByCaller = true;
    clearTimeout(watchdog);
    try { es.close(); } catch {}
  };
}