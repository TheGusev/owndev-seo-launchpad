import { apiUrl, apiHeaders } from '@/lib/api/config';

type EventPayload = Record<string, unknown>;

/**
 * Централизованная точка логирования событий.
 * DEV: console.info
 * PROD: POST /api/v1/events (fire-and-forget)
 */
export function logEvent(name: string, payload?: EventPayload): void {
  if (import.meta.env.DEV) {
    console.info(`[OWNDEV] ${name}`, payload);
    return;
  }

  // Production: fire-and-forget to backend
  try {
    fetch(apiUrl('/events'), {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({ name, payload }),
    }).catch(() => {
      // silently ignore — analytics should never break UX
    });
  } catch {
    // noop
  }
}
