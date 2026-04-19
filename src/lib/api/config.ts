/**
 * API Configuration
 */

/**
 * Auto-detect API base:
 * - На *.lovable.app (preview / published) → боевой backend на owndev.ru
 * - На owndev.ru и localhost → relative /api (через nginx / vite proxy)
 * - VITE_API_BASE_URL имеет приоритет, если задан явно
 */
const DEFAULT_API_BASE =
  typeof window !== 'undefined' && window.location.hostname.endsWith('.lovable.app')
    ? 'https://owndev.ru/api'
    : '/api';

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
 */
export function apiHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = localStorage.getItem('owndev_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}
