/**
 * Unified API client for OWNDEV.
 * 
 * - invokeFunction: POST to /api/v1/{functionName}
 * - request: fetch with sub-path routing (e.g. site-check-scan/start)
 */

import { apiUrl, apiHeaders } from "./config";

/**
 * Invoke a backend endpoint by name (POST).
 */
export async function invokeFunction<T = any>(
  functionName: string,
  body?: object
): Promise<T> {
  const resp = await fetch(apiUrl(`/${functionName}`), {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(body ?? {}),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));

    if (resp.status === 401 || resp.status === 403) {
      console.error(`[OWNDEV API] ${functionName}: unauthorized`);
      throw new Error('Требуется авторизация');
    }

    const msg = data.error || `Ошибка ${resp.status}`;
    console.error(`[OWNDEV API] ${functionName}:`, msg);
    throw new Error(msg);
  }

  const data = await resp.json();

  if (data?.error) {
    const msg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    console.error(`[OWNDEV API] ${functionName}:`, msg);
    throw new Error(msg);
  }

  return data as T;
}

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
