/**
 * HTTP headers builder — V3.
 *
 * Required and recommended response headers:
 *   • Cache-Control          (per content type)
 *   • X-Robots-Tag           (index/noindex by URL prefix)
 *   • Content-Security-Policy (recommendation, not enforced)
 *   • Content-Type-Options   (nosniff)
 *   • Strict-Transport-Security
 *   • Referrer-Policy
 *   • X-Frame-Options / frame-ancestors
 */

import type { PassportInputs } from './types.js';

export interface HeaderRules {
  global: Record<string, string>;
  by_path: Array<{ path_prefix: string; headers: Record<string, string> }>;
  csp_recommendation: string;
}

export function buildHeaders(inputs: PassportInputs): HeaderRules {
  const cspRecommendation = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://www.googletagmanager.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://mc.yandex.ru https://www.google-analytics.com",
    "frame-ancestors 'self'",
    "form-action 'self'",
  ].join('; ');

  return {
    global: {
      'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'X-Frame-Options': 'SAMEORIGIN',
      'Permissions-Policy': 'geolocation=(self), microphone=(), camera=()',
    },
    by_path: [
      {
        path_prefix: '/',
        headers: {
          'Cache-Control': 'public, max-age=300, must-revalidate',
          'X-Robots-Tag': 'index, follow',
        },
      },
      {
        path_prefix: '/api/',
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      },
      {
        path_prefix: '/admin',
        headers: {
          'Cache-Control': 'no-store',
          'X-Robots-Tag': 'noindex, nofollow',
        },
      },
      {
        path_prefix: '/static/',
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      },
      {
        path_prefix: '/_next/',
        headers: {
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      },
    ],
    csp_recommendation: cspRecommendation,
  };
}

export function flattenHeaders(rules: HeaderRules): Record<string, string> {
  // Global headers + first matching by_path = recommended canonical set.
  const flat: Record<string, string> = { ...rules.global };
  const root = rules.by_path.find((r) => r.path_prefix === '/');
  if (root) Object.assign(flat, root.headers);
  return flat;
}
