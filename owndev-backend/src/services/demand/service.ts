/**
 * services/demand — main orchestrator.
 *
 * Public API: runDemandIntelligence(sessionId, seedKeywords, opts)
 *
 * Pipeline:
 *   1. For each seed: topRequests → buildClusters
 *   2. For seed[0]: getRegionsDistribution → deriveGeoTargets
 *   3. (Optional) getDynamics for top cluster — trend metadata
 *   4. Persist clusters + geo distribution
 *   5. Return DemandIntelligenceResult
 */

import { logger } from '../../utils/logger.js';
import { topRequests, getRegionsDistribution, getDynamics } from './wordstatClient.js';
import { buildClusters } from './clusterBuilder.js';
import { deriveGeoTargets, topRecommendedRegions } from './geoTargeter.js';
import { saveClusters, saveGeoDistribution, loadResultBySession } from './repository.js';
import { getQuotaSnapshot } from './quotaTracker.js';
import type { DemandIntelligenceResult, DemandClusterV3 } from './types.js';

export interface RunDemandOptions {
  region_code?: string;          // default '225' (Russia)
  brand_tokens?: string[];
  with_dynamics?: boolean;       // default false (saves units)
  with_geo_distribution?: boolean; // default true
}

export async function runDemandIntelligence(
  sessionId: string,
  seedKeywords: string[],
  opts: RunDemandOptions = {},
): Promise<DemandIntelligenceResult> {
  const region = opts.region_code ?? '225';
  const startedAt = new Date();
  const startQuota = await getQuotaSnapshot();

  let allClusters: DemandClusterV3[] = [];

  // Step 1: clusters per seed
  for (const seed of seedKeywords) {
    try {
      const top = await topRequests({ phrase: seed, geoIds: [region] });
      const clusters = buildClusters({
        session_id: sessionId,
        seed_keyword: seed,
        region_code: region,
        topResponse: top,
        brandTokens: opts.brand_tokens,
      });
      allClusters.push(...clusters);
    } catch (err: any) {
      logger.warn('DEMAND', `topRequests failed for "${seed}": ${err.message}`);
    }
  }

  // Step 2: geo distribution for the primary seed
  let geoTargets: ReturnType<typeof deriveGeoTargets> = [];
  if (opts.with_geo_distribution !== false && seedKeywords.length > 0) {
    try {
      const dist = await getRegionsDistribution({ phrase: seedKeywords[0] });
      geoTargets = deriveGeoTargets(dist);
    } catch (err: any) {
      logger.warn('DEMAND', `getRegionsDistribution failed: ${err.message}`);
    }
  }

  // Step 3: dynamics on the largest cluster's seed (optional)
  if (opts.with_dynamics && allClusters.length > 0) {
    try {
      const headSeed = allClusters[0].keywords[0]?.phrase ?? seedKeywords[0];
      const dyn = await getDynamics({
        phrase: headSeed,
        geoIds: [region],
        granularity: 'MONTH',
      });
      // Attach trend hint to the cluster
      const last3 = dyn.dynamics.slice(-3).reduce((s, p) => s + p.count, 0);
      const prev3 = dyn.dynamics.slice(-6, -3).reduce((s, p) => s + p.count, 0);
      const trend = last3 > prev3 * 1.1 ? 'rising'
                  : last3 < prev3 * 0.9 ? 'declining' : 'stable';
      if (allClusters[0].keywords[0]) {
        allClusters[0].keywords[0].trend = trend;
      }
    } catch (err: any) {
      logger.warn('DEMAND', `getDynamics failed: ${err.message}`);
    }
  }

  // Step 4: persist
  const savedClusters = await saveClusters(sessionId, allClusters);
  if (geoTargets.length > 0) {
    await saveGeoDistribution(sessionId, null, geoTargets);
  }

  const endQuota = await getQuotaSnapshot();
  const quotaUsed = endQuota.total_used - startQuota.total_used;

  const result: DemandIntelligenceResult = {
    session_id: sessionId,
    seed_keywords: seedKeywords,
    clusters: savedClusters,
    geo_distribution: geoTargets,
    recommended_geos: topRecommendedRegions(geoTargets),
    total_volume: savedClusters.reduce((s, c) => s + c.total_frequency, 0),
    quota_used: quotaUsed,
    generated_at: startedAt.toISOString(),
  };

  logger.info(
    'DEMAND',
    `Session ${sessionId}: ${savedClusters.length} clusters, ${geoTargets.length} geos, ${quotaUsed}u used`,
  );
  return result;
}

export { loadResultBySession };
