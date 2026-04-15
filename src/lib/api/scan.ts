/**
 * Site Check scan & report API.
 * All endpoints use the Node backend via apiUrl().
 * Supabase dependency removed.
 */
import { apiUrl, apiHeaders } from './config';

async function apiFetch<T = any>(path: string, options?: RequestInit): Promise<T> {
  const resp = await fetch(apiUrl(path), {
    ...options,
    headers: {
      ...apiHeaders(),
      ...(options?.headers || {}),
    },
  });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    if (resp.status === 401 || resp.status === 403) {
      throw new Error('\u0422\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044f \u0430\u0432\u0442\u043e\u0440\u0438\u0437\u0430\u0446\u0438\u044f');
    }
    if (resp.status === 429) {
      const err = new Error(body.error || '\u0421\u043b\u0438\u0448\u043a\u043e\u043c \u043c\u043d\u043e\u0433\u043e \u0437\u0430\u043f\u0440\u043e\u0441\u043e\u0432. \u041f\u043e\u0434\u043e\u0436\u0434\u0438\u0442\u0435.') as any;
      err.code = body.code;
      err.lastScanId = body.last_scan_id;
      throw err;
    }
    const msg = body.error || `\u041e\u0448\u0438\u0431\u043a\u0430 ${resp.status}`;
    throw new Error(msg);
  }
  const ct = resp.headers.get('content-type') || '';
  if (!ct.includes('application/json') && !ct.includes('text/json')) {
    throw new Error('Сервер вернул не JSON, возможно он недоступен');
  }
  return resp.json() as Promise<T>;
}

export async function getFullScan(scanId: string) {
  return apiFetch(`/site-check/result/${scanId}`);
}

export async function startScan(url: string, mode: 'page' | 'site', options?: { force?: boolean }) {
  return apiFetch<{ scan_id: string; status: string; cached?: boolean }>(
    '/site-check/start',
    {
      method: 'POST',
      body: JSON.stringify({ url, mode, force: options?.force ?? false }),
    }
  );
}

export async function getScanStatus(scanId: string) {
  return apiFetch<{ status: string; progress_pct: number; scores_preview: any }>(
    `/site-check/status/${scanId}`
  );
}

export async function getScanPreview(scanId: string) {
  return apiFetch(`/site-check/preview/${scanId}`);
}

export async function createReport(scanId: string, email: string) {
  return apiFetch<{ report_id: string; download_token: string; payment_url: string | null }>(
    '/site-check/report/create',
    {
      method: 'POST',
      body: JSON.stringify({ scan_id: scanId, email }),
    }
  );
}

export async function getReport(reportId: string, token?: string) {
  const params = token ? `?token=${token}` : '';
  return apiFetch(`/site-check/report/${reportId}${params}`);
}
