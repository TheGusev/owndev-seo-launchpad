/**
 * High-level API functions for all OWNDEV tools.
 *
 * auditSite() now uses the own backend POST+polling pattern.
 * Other tools still go through Supabase Edge Functions via invokeFunction().
 */

import { invokeFunction } from "./client";
import { apiUrl, apiHeaders } from "./config";

// ── Types ──

interface AuditPollOptions {
  pollingIntervalMs?: number;
  maxAttempts?: number;
}

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// ── Helpers ──

export function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// ── Own-backend helpers ──

async function backendPost<T = any>(path: string, body: object): Promise<ApiResponse<T>> {
  const resp = await fetch(apiUrl(path), {
    method: 'POST',
    headers: apiHeaders(),
    body: JSON.stringify(body),
  });
  const json = await resp.json().catch(() => ({ success: false, error: `HTTP ${resp.status}` }));
  if (!resp.ok) {
    throw new Error(json.error || `Ошибка ${resp.status}`);
  }
  return json as ApiResponse<T>;
}

async function backendGet<T = any>(path: string): Promise<ApiResponse<T>> {
  const resp = await fetch(apiUrl(path), {
    method: 'GET',
    headers: apiHeaders(),
  });
  const json = await resp.json().catch(() => ({ success: false, error: `HTTP ${resp.status}` }));
  if (!resp.ok) {
    throw new Error(json.error || `Ошибка ${resp.status}`);
  }
  return json as ApiResponse<T>;
}

// ── Audit (own backend — POST + polling) ──

export async function auditSite(
  url: string,
  options?: AuditPollOptions & { toolId?: string },
) {
  const { pollingIntervalMs = 2000, maxAttempts = 15, toolId } = options ?? {};

  // 1. Create audit
  const normalizedUrl = ensureProtocol(url);

  // 1. Create audit
  const create = await backendPost<{ auditId: string; status: string }>('/audit', {
    url: normalizedUrl,
    toolId,
  });

  const auditId = create.data?.auditId;
  if (!auditId) throw new Error('Не удалось создать аудит');

  // 2. Poll for result
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, pollingIntervalMs));

    const poll = await backendGet<{
      status: string;
      result?: any;
      error_message?: string;
    }>(`/audit/${auditId}`);

    const audit = poll.data;
    if (!audit) continue;

    if (audit.status === 'done') {
      return audit.result;
    }

    if (audit.status === 'error') {
      throw new Error(audit.error_message || 'Аудит завершился с ошибкой');
    }
    // pending / running — continue polling
  }

  throw new Error('Превышено время ожидания аудита (30 сек)');
}

// ── Edge Function tools (unchanged) ──

export async function checkIndexation(url: string) {
  return invokeFunction("check-indexation", { url });
}

export async function generateSemanticCore(topic: string) {
  return invokeFunction("generate-semantic-core", { topic });
}

export async function generateText(type: string, topic: string, keywords: string) {
  return invokeFunction("generate-text", { type, topic, keywords });
}

export async function generateContentBrief(
  query: string,
  url?: string,
  contentType?: string,
) {
  return invokeFunction("generate-content-brief", {
    query,
    url: url || undefined,
    contentType,
  });
}

export async function checkInternalLinks(url: string) {
  return invokeFunction("check-internal-links", { url });
}

export async function analyzeCompetitors(url1: string, url2: string) {
  return invokeFunction("competitor-analysis", { url1, url2 });
}

export async function trackBrand(
  brand: string,
  prompts: string[],
  aiSystems: string[],
) {
  return invokeFunction("brand-tracker", { brand, prompts, aiSystems });
}

export async function generateAutofix(
  issueType: string,
  url: string,
  title?: string,
  description?: string,
) {
  return invokeFunction("generate-autofix", {
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
  return invokeFunction("generate-geo-content", {
    pages,
    niche,
    region,
    tone,
    urlFormat,
    customInstructions,
  });
}

export async function sendTelegram(body: object) {
  return invokeFunction("send-telegram", body);
}

export async function judgeLlm(scanId: string, url: string, theme?: string) {
  return invokeFunction("llm-judge", { scan_id: scanId, url, theme });
}

export async function getTechPassport(url: string) {
  return invokeFunction("tech-passport", { url });
}
