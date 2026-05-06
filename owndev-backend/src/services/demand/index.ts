/**
 * services/demand — V3 Demand Intelligence module.
 *
 * Replaces the V2 services/Wordstat with:
 *   • correct Yandex Search API v2 endpoints
 *   • daily quota tracking (100k unit limit)
 *   • intent-based clustering with page recommendations
 *   • per-region GEO targeting with affinity index
 */

export * from './types.js';
export {
  runDemandIntelligence,
  loadResultBySession,
  type RunDemandOptions,
} from './service.js';
export {
  topRequests,
  getDynamics,
  getRegionsDistribution,
  getRegionsTree,
  wordstatV3Mode,
} from './wordstatClient.js';
export {
  reserveUnits,
  refundUnits,
  getQuotaSnapshot,
  getRemainingUnitsToday,
  QuotaExceededError,
} from './quotaTracker.js';
export { buildClusters } from './clusterBuilder.js';
export { classifyIntent, intentToPageType } from './intentClassifier.js';
export { deriveGeoTargets, topRecommendedRegions } from './geoTargeter.js';
