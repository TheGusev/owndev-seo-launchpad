/**
 * Unified API client for OWNDEV.
 * 
 * - request: fetch with sub-path routing (e.g. site-check-scan/start)
 */

import { apiUrl, apiHeaders } from "./config";

/**
 * Raw fetch to a path-based endpoint.
 * Used for endpoints with sub-routing (e.g. site-check-scan/start, site-check-report/create).
 */
export async function request<T = any>(
  functionName: string,
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = apiUrl(`/${functionName}${path}`);

  const resp = await fetch(url, {
    ...options,
    headers: {
      ...apiHeaders(),
      ...(options?.headers || {}),
    },
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));

    if (resp.status === 401 || resp.status === 403) {
      console.error(`[OWNDEV API] ${functionName}${path}: unauthorized (${resp.status})`);
      throw new Error('Требуется авторизация');
    }

    if (resp.status === 429) {
      const err = new Error(body.error || 'Слишком много запросов. Подождите.') as any;
      err.code = body.code;
      err.lastScanId = body.last_scan_id;
      throw err;
    }

    const msg = body.error || `Ошибка ${resp.status}`;
    console.error(`[OWNDEV API] ${functionName}${path}:`, msg);
    throw new Error(msg);
  }

  return resp.json() as Promise<T>;
}
