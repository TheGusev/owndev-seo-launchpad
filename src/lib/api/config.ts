/**
 * API Configuration
 */

/**
 * Auto-detect API base:
 * - На *.lovable.app (preview / published) → боевой backend на owndev.ru
 * - На owndev.ru и localhost → relative /api (через nginx / vite proxy)
 * - VITE_API_BASE_URL имеет приоритет, если задан явно
 */
function detectApiBase(): string {
  if (typeof window === 'undefined') return '/api';
  const host = window.location.hostname;
  // Lovable preview / sandbox / published — backend живёт на owndev.ru
  if (
    host.endsWith('.lovable.app') ||
    host.endsWith('.lovableproject.com') ||
    host.endsWith('.lovable.dev')
  ) {
    return 'https://owndev.ru/api';
  }
  return '/api';
}

const DEFAULT_API_BASE = detectApiBase();

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE;
export const API_VERSION = 'v1';

/**
 * Build a versioned REST API path.
 * Example: apiUrl('/audit') → '/api/v1/audit'
 */
export function apiUrl(path: string) {
  return `${API_BASE_URL}/${API_VERSION}${path}`;
}

/**
 * Standard headers for own backend requests.
 * NOTE: Content-Type is intentionally NOT set here — it must be added only by
 * callers that actually send a JSON body. Fastify rejects requests with
 * `Content-Type: application/json` and an empty body.
 */
export function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  const token = localStorage.getItem('owndev_token');
  if (token) headers['x-api-key'] = token;
  return headers;
}
