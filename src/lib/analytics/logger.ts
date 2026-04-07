type EventPayload = Record<string, unknown>;

/**
 * Централизованная точка логирования событий.
 * TODO: заменить на POST /api/events когда появится backend.
 */
export function logEvent(name: string, payload?: EventPayload): void {
  if (import.meta.env.DEV) {
    console.info(`[OWNDEV] ${name}`, payload);
  }
}
