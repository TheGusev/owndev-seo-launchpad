/**
 * API client for OwnDev Marketplace Audit (WB / Ozon).
 */
import { apiUrl, apiHeaders } from './config';
import type {
  StartRequest,
  StartResponse,
  PreviewResponse,
  ResultResponse,
} from '../marketplace-audit-types';

const BASE = '/marketplace-audit';

async function maRequest<T = any>(path: string, options?: RequestInit): Promise<T> {
  const url = apiUrl(`${BASE}${path}`);
  const hasBody = options?.body !== undefined && options?.body !== null;
  const headers: Record<string, string> = {
    ...apiHeaders(),
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (hasBody && !headers['Content-Type'] && !headers['content-type']) {
    headers['Content-Type'] = 'application/json';
  }
  const resp = await fetch(url, { ...options, headers });
  if (!resp.ok) {
    const body = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    if (resp.status === 429) {
      const err = new Error(body.error || 'Слишком много запросов. Подождите.') as any;
      err.code = 'RATE_LIMIT';
      throw err;
    }
    throw new Error(body.error || `Ошибка ${resp.status}`);
  }
  return resp.json() as Promise<T>;
}

export async function startAudit(payload: StartRequest): Promise<StartResponse> {
  return maRequest('/start', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function getAuditPreview(id: string): Promise<PreviewResponse> {
  return maRequest(`/preview/${id}`);
}

export async function getAuditResult(id: string): Promise<ResultResponse> {
  return maRequest(`/result/${id}`);
}
