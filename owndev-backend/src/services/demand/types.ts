/**
 * services/demand — V3 Demand Intelligence types.
 *
 * Backed by migration 032: demand_quota_log, demand_clusters,
 * demand_geo_distribution, yandex_regions_tree.
 */

export type WordstatEndpointV3 =
  | 'topRequests'
  | 'getDynamics'
  | 'getRegionsDistribution'
  | 'getRegionsTree';

export const WORDSTAT_ENDPOINT_COSTS: Record<WordstatEndpointV3, number> = {
  topRequests: 1,
  getDynamics: 2,
  getRegionsDistribution: 2,
  getRegionsTree: 0,
};

export const WORDSTAT_DAILY_QUOTA = 100_000;

// ─── Provider request/response shapes (Yandex Search API v2) ─

export interface TopRequestsRequest {
  phrase: string;
  geoIds?: string[];      // ['225'] for Russia, ['213'] for Moscow
  devices?: Array<'all' | 'desktop' | 'mobile' | 'tablet' | 'phone'>;
}

export interface TopRequestsItem {
  phrase: string;
  count: number;          // monthly impressions
}

export interface TopRequestsResponse {
  topRequests: TopRequestsItem[];   // most popular phrases including the seed
  associations: TopRequestsItem[];  // associated/related phrases
  totalCount: number;
}

export interface GetDynamicsRequest {
  phrase: string;
  geoIds?: string[];
  devices?: Array<'all' | 'desktop' | 'mobile' | 'tablet' | 'phone'>;
  granularity?: 'WEEK' | 'MONTH';
}

export interface DynamicsPoint {
  period: string;          // 'YYYY-MM-DD' (week start) or 'YYYY-MM' (month)
  count: number;
}

export interface GetDynamicsResponse {
  dynamics: DynamicsPoint[];
}

export interface GetRegionsDistributionRequest {
  phrase: string;
  devices?: Array<'all' | 'desktop' | 'mobile' | 'tablet' | 'phone'>;
}

export interface RegionDistributionItem {
  geoId: string;
  geoName: string;
  count: number;
  affinityIndex: number;   // % share
}

export interface GetRegionsDistributionResponse {
  regions: RegionDistributionItem[];
}

export interface GetRegionsTreeResponse {
  regions: Array<{
    geoId: string;
    name: string;
    parentGeoId?: string;
    type?: 'country' | 'district' | 'region' | 'city' | string;
  }>;
}

// ─── Internal cluster types ──────────────────────────────────

export type DemandIntentV3 =
  | 'informational'
  | 'commercial'
  | 'transactional'
  | 'navigational'
  | 'local';

export interface DemandKeyword {
  phrase: string;
  frequency: number;
  trend?: 'rising' | 'declining' | 'stable';
  intent_subtype?: string;
}

export interface DemandClusterV3 {
  id?: string;
  session_id: string;
  cluster_label: string;
  intent: DemandIntentV3;
  seed_keyword: string;
  region_code: string;
  keywords: DemandKeyword[];
  total_frequency: number;
  recommended_page_type: string;
  recommended_url_pattern: string;
  recommended_h1_template?: string;
  recommended_title_template?: string;
  recommended_faq_questions?: string[];
}

export interface DemandGeoDistributionV3 {
  region_code: string;
  region_name_ru: string;
  affinity_index: number;        // 0..100 (%)
  absolute_frequency: number;
  is_recommended_geo: boolean;
}

export interface DemandIntelligenceResult {
  session_id: string;
  seed_keywords: string[];
  clusters: DemandClusterV3[];
  geo_distribution: DemandGeoDistributionV3[];
  recommended_geos: string[];
  total_volume: number;
  quota_used: number;
  generated_at: string;
}
