/**
 * Unified API client for OWNDEV.
 * 
 * - invokeFunction: wrapper over supabase.functions.invoke (most tools)
 * - request: raw fetch for path-based Edge Function endpoints (site-check-scan, site-check-report)
 */

import { supabase } from "@/integrations/supabase/client";
import { edgeFunctionUrl, edgeFunctionHeaders } from "./config";

/**
 * Invoke a Supabase Edge Function by name.
 * Handles both supabase SDK errors and application-level { error } responses.
 */
export async function invokeFunction<T = any>(
  functionName: string,
  body?: object
): Promise<T> {
  const { data, error } = await supabase.functions.invoke(functionName, {
    body: body ?? {},
  });

  if (error) {
    if (/unauthorized|forbidden/i.test(error.message)) {
      console.error(`[OWNDEV API] ${functionName}: unauthorized`);
      throw new Error('Требуется авторизация');
    }
    console.error(`[OWNDEV API] ${functionName}:`, error.message);
    throw error;
  }

  if (data?.error) {
    const msg = typeof data.error === 'string' ? data.error : JSON.stringify(data.error);
    console.error(`[OWNDEV API] ${functionName}:`, msg);
    throw new Error(msg);
  }

  return data as T;
}

/**
 * Raw fetch to a path-based Edge Function endpoint.
 * Used for endpoints with sub-routing (e.g. site-check-scan/start, site-check-report/create).
 */
export async function request<T = any>(
  functionName: string,
  path: string,
  options?: RequestInit
): Promise<T> {
  const url = edgeFunctionUrl(functionName, path);

  const resp = await fetch(url, {
    ...options,
    headers: {
      ...edgeFunctionHeaders(),
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
