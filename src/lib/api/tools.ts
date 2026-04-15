/**
 * High-level API functions for all OWNDEV tools.
 * Tools call Supabase Edge Functions directly via supabase.functions.invoke().
 * Site-check endpoints go through the Node backend via apiUrl/apiHeaders.
 */

import { supabase } from "@/integrations/supabase/client";
import { apiUrl, apiHeaders } from "./config";

// ── Helpers ──

export function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

async function invokeFunction<T = any>(name: string, body: object): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message || `Ошибка вызова ${name}`);
  return data as T;
}

// ── Audit ──

export async function auditSite(url: string, options?: { toolId?: string }) {
  return invokeFunction("seo-audit", { url });
}

// ── Tools ──

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

// ── Site-check specific (Node backend) ──

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
