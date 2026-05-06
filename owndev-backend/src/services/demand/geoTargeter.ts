/**
 * Geo targeter — turns getRegionsDistribution into actionable GEO target list.
 *
 * Recommendation rules:
 *   • Recommend regions whose affinity ≥ 5% (configurable) — these are
 *     where the seed phrase has meaningful volume.
 *   • Always include Russia ('225') as a baseline if not present.
 *   • Cap recommendations at 10 regions.
 */

import type {
  GetRegionsDistributionResponse,
  DemandGeoDistributionV3,
} from './types.js';

export interface GeoTargetingOptions {
  min_affinity_pct?: number;     // default 5
  max_recommended?: number;      // default 10
  always_include_russia?: boolean;
}

export function deriveGeoTargets(
  distribution: GetRegionsDistributionResponse,
  opts: GeoTargetingOptions = {},
): DemandGeoDistributionV3[] {
  const minAffinity = opts.min_affinity_pct ?? 5;
  const maxRecommended = opts.max_recommended ?? 10;

  const sorted = [...distribution.regions].sort((a, b) => b.affinityIndex - a.affinityIndex);
  const recommendedSet = new Set<string>();

  for (const r of sorted) {
    if (r.affinityIndex >= minAffinity && recommendedSet.size < maxRecommended) {
      recommendedSet.add(r.geoId);
    }
  }

  if (opts.always_include_russia !== false && !recommendedSet.has('225')) {
    recommendedSet.add('225');
  }

  const out: DemandGeoDistributionV3[] = sorted.map((r) => ({
    region_code: r.geoId,
    region_name_ru: r.geoName,
    affinity_index: r.affinityIndex,
    absolute_frequency: r.count,
    is_recommended_geo: recommendedSet.has(r.geoId),
  }));

  // Ensure Russia row exists even if it wasn't in the response
  if (opts.always_include_russia !== false && !out.some((r) => r.region_code === '225')) {
    out.unshift({
      region_code: '225',
      region_name_ru: 'Россия',
      affinity_index: 100,
      absolute_frequency: distribution.regions.reduce((s, r) => s + r.count, 0),
      is_recommended_geo: true,
    });
  }

  return out;
}

export function topRecommendedRegions(
  rows: DemandGeoDistributionV3[],
  limit = 5,
): string[] {
  return rows
    .filter((r) => r.is_recommended_geo)
    .sort((a, b) => b.affinity_index - a.affinity_index)
    .slice(0, limit)
    .map((r) => r.region_code);
}
