/**
 * High-level API functions for all OWNDEV tools.
 * Each wraps invokeFunction with the correct Edge Function name and payload.
 */

import { invokeFunction } from "./client";

// ── Audit ──

export async function auditSite(url: string) {
  return invokeFunction("seo-audit", { url });
}

// ── Indexation ──

export async function checkIndexation(url: string) {
  return invokeFunction("check-indexation", { url });
}

// ── Semantic Core ──

export async function generateSemanticCore(topic: string) {
  return invokeFunction("generate-semantic-core", { topic });
}

// ── AI Text Generator ──

export async function generateText(type: string, topic: string, keywords: string) {
  return invokeFunction("generate-text", { type, topic, keywords });
}

// ── Content Brief ──

export async function generateContentBrief(
  query: string,
  url?: string,
  contentType?: string
) {
  return invokeFunction("generate-content-brief", {
    query,
    url: url || undefined,
    contentType,
  });
}

// ── Internal Links ──

export async function checkInternalLinks(url: string) {
  return invokeFunction("check-internal-links", { url });
}

// ── Competitor Analysis ──

export async function analyzeCompetitors(url1: string, url2: string) {
  return invokeFunction("competitor-analysis", { url1, url2 });
}

// ── Brand Tracker ──

export async function trackBrand(
  brand: string,
  prompts: string[],
  aiSystems: string[]
) {
  return invokeFunction("brand-tracker", { brand, prompts, aiSystems });
}

// ── AutoFix Generator ──

export async function generateAutofix(
  issueType: string,
  url: string,
  title?: string,
  description?: string
) {
  return invokeFunction("generate-autofix", {
    issueType,
    url,
    title,
    description,
  });
}

// ── pSEO / GEO Content ──

export async function generateGeoContent(
  pages: Array<{ city: string; service: string; slug: string }>,
  niche: string,
  region: string,
  tone?: string,
  urlFormat?: string,
  customInstructions?: string
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

// ── Contact / Telegram ──

export async function sendTelegram(body: object) {
  return invokeFunction("send-telegram", body);
}
