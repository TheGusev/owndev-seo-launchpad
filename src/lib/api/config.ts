/**
 * API Configuration
 * 
 * Currently all requests go through Supabase Edge Functions.
 * When a dedicated backend is added, update API_BASE_URL via VITE_API_BASE_URL
 * and migrate endpoints in tools.ts / scan.ts.
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
  return {
    'Content-Type': 'application/json',
  };
}

// Supabase project constants (used for raw fetch to Edge Functions with path-based routing)
export const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID;
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export function edgeFunctionUrl(name: string, path = '') {
  return `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/${name}${path}`;
}

export function edgeFunctionHeaders() {
  return {
    'Content-Type': 'application/json',
    'apikey': SUPABASE_ANON_KEY,
  };
}
