import type { ParsedProduct, ManualInput, MarketplacePlatform } from '../../../types/marketplaceAudit.js';

export function normalizeManual(platform: MarketplacePlatform, input: ManualInput): ParsedProduct {
  const attributes: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.specs ?? {})) {
    if (k && v) attributes[String(k).trim()] = String(v).trim();
  }
  return {
    platform,
    title: String(input.title ?? '').trim(),
    description: String(input.description ?? '').trim(),
    category: String(input.category ?? '').trim() || 'Не определена',
    attributes,
    images: [],
    sourceData: { manual: true, competitorUrls: input.competitorUrls ?? [] },
  };
}
