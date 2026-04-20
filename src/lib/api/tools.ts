/**
 * Tools API — все вызовы идут на наш Node.js бэкенд.
 * Supabase больше не используется.
 */
import { apiUrl, apiHeaders } from './config';

async function callTool<T = any>(endpoint: string, body: object): Promise<T> {
  const resp = await fetch(apiUrl(`/tools/${endpoint}`), {
    method: 'POST',
    headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error((err as any).error || `Ошибка ${resp.status}`);
  }
  return resp.json();
}

export function ensureProtocol(url: string): string {
  const trimmed = url.trim().replace(/\s+/g, '');
  if (!trimmed) return '';
  const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    return new URL(withProto).toString().replace(/\/$/, '');
  } catch {
    return withProto;
  }
}

export const auditSite = (url: string, _options?: { toolId?: string }) =>
  callTool('seo-audit', { url });

export const checkIndexation = (url: string) =>
  callTool('check-indexation', { url });

export const generateSemanticCore = (topic: string) =>
  callTool('generate-semantic-core', { topic });

export const generateText = (type: string, topic: string, keywords: string) =>
  callTool('generate-text', { type, topic, keywords });

export const generateContentBrief = (query: string, url?: string, contentType?: string) =>
  callTool('generate-content-brief', { query, url, contentType });

export const checkInternalLinks = (url: string) =>
  callTool('check-internal-links', { url });

export const analyzeCompetitors = (url1: string, url2: string) =>
  callTool('competitor-analysis', { url1, url2 });

export const trackBrand = (brand: string, prompts: string[], aiSystems: string[]) =>
  callTool('brand-tracker', { brand, prompts, aiSystems });

export const generateAutofix = (
  issueType: string,
  url: string,
  title?: string,
  description?: string,
) => callTool('generate-autofix', { issueType, url, title, description });

export const generateGeoContent = (
  pages: Array<{ city: string; service: string; slug: string }>,
  niche: string,
  region: string,
  tone?: string,
  urlFormat?: string,
  customInstructions?: string,
) =>
  callTool('generate-geo-content', {
    pages,
    niche,
    region,
    tone,
    urlFormat,
    customInstructions,
  });

export const sendTelegram = (body: object) =>
  callTool('send-telegram', body);

// ── Site-check специфичные (уже на Node бэкенде) ──

export async function judgeLlm(scanId: string, url: string, theme?: string) {
  const resp = await fetch(apiUrl('/site-check/llm-judge'), {
    method: 'POST',
    headers: { ...apiHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ scan_id: scanId, url, theme }),
  });
  if (!resp.ok) return null;
  return resp.json();
}

export async function getTechPassport(url: string) {
  const params = new URLSearchParams({ url });
  const resp = await fetch(apiUrl(`/site-check/tech-passport?${params}`), {
    headers: apiHeaders(),
  });
  if (!resp.ok) return null;
  return resp.json();
}
