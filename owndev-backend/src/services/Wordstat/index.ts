/**
 * Wordstat — public barrel.
 *
 * Consumers (routes, blueprint-builder, future intent-engine) MUST import here.
 */
export {
  getTop,
  getDynamics,
  getRegions,
  getTopBulk,
} from './cache.js';

export { wordstatMode } from './client.js';

export {
  buildClusters,
  type BuildClustersOptions,
} from './clusterBuilder.js';

export type {
  WordstatPhrase,
  WordstatTopResponse,
  WordstatDynamicsResponse,
  WordstatRegionsResponse,
  WordstatRegionEntry,
  WordstatDynamicsPoint,
  IntentType,
  IntentSubtype,
  ClusterPhrase,
  DemandCluster,
} from './types.js';
