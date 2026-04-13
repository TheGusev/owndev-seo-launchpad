/**
 * High-level API functions for all OWNDEV tools.
 * All tools go through the own backend via fetch + apiUrl/apiHeaders.
 */

import { apiUrl, apiHeaders } from "./config";

// ── Helpers ──

export function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function post<T = any>(path: string, body: object): Promise<T> {
  const resp = await fetch(apiUrl(path), {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({ error: `HTTP ${resp.status}` }));
    throw new Error(data.error || `Ошибка ${resp.status}`);
  }
  return resp.json();
}

// ── Audit ──

export async function auditSite(url: string, options?: { toolId?: string }) {
  return post("/site-check/audit", { url });
}

// ── Tools ──

export async function checkIndexation(url: string) {
  return post("/tools/check-indexation", { url });
}

export async function generateSemanticCore(topic: string) {
  return post("/tools/semantic-core", { topic });
}

export async function generateText(type: string, topic: string, keywords: string) {
  return post("/tools/generate-text", { type, topic, keywords });
}

export async function generateContentBrief(
  query: string,
  url?: string,
  contentType?: string,
) {
  return post("/tools/content-brief", {
    query,
    url: url || undefined,
    contentType,
  });
}

export async function checkInternalLinks(url: string) {
  return post("/tools/internal-links", { url });
}

export async function analyzeCompetitors(url1: string, url2: string) {
  return post("/tools/competitors", { url1, url2 });
}

export async function trackBrand(
  brand: string,
  prompts: string[],
  aiSystems: string[],
) {
  return post("/tools/brand-tracker", { brand, prompts, aiSystems });
}

export async function generateAutofix(
  issueType: string,
  url: string,
  title?: string,
  description?: string,
) {
  return post("/tools/autofix", {
    issueType,
    url,
    title,
    description,
  });
}

export async function generateGeoContent(
  pages: Array<{ city: string; service: string; slug: string }>,
  niche: string,
  region: string,
  tone?: string,
  urlFormat?: string,
  customInstructions?: string,
) {
  return post("/tools/geo-content", {
    pages,
    niche,
    region,
    tone,
    urlFormat,
    customInstructions,
  });
}

export async function sendTelegram(body: object) {
  return post("/tools/send-telegram", body);
}

export async function judgeLlm(scanId: string, url: string, theme?: string) {
  const resp = await fetch(apiUrl(`/site-check/llm-judge`), {
    method: 'POST',
    headers: apiHeaders(),
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
