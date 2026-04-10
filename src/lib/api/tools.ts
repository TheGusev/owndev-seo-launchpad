/**
 * High-level API functions for all OWNDEV tools.
 * All tools go through Supabase Edge Functions via invokeFunction().
 */

import { invokeFunction } from "./client";

// ── Helpers ──

export function ensureProtocol(url: string): string {
  const trimmed = url.trim();
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

// ── Audit (Edge Function) ──

export async function auditSite(url: string, options?: { toolId?: string }) {
  return invokeFunction("seo-audit", { url });
}

// ── Edge Function tools ──

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
