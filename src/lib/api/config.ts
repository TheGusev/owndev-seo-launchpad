/**
 * API Configuration
 */

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
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
