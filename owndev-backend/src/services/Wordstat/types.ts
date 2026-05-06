/**
 * Wordstat — public types.
 */

export interface WordstatPhrase {
  phrase: string;
  volume: number;
  region_code: string;
}

export interface WordstatTopResponse {
  phrase: string;
  region_code: string;
  total: number;                // monthly volume of the seed phrase
  also_search: WordstatPhrase[]; // related queries
  including: WordstatPhrase[];   // queries that include the seed
  source: 'yandex_search_api' | 'mock';
  fetched_at: string;
}

export interface WordstatDynamicsPoint {
  period: string;        // 'YYYY-MM'
  volume: number;
}

export interface WordstatDynamicsResponse {
  phrase: string;
  region_code: string;
  series: WordstatDynamicsPoint[];
  trend: 'rising' | 'declining' | 'stable';
  source: string;
  fetched_at: string;
}

export interface WordstatRegionEntry {
  region_code: string;
  region_name: string;
  share: number;        // 0..1
  volume: number;
}

export interface WordstatRegionsResponse {
  phrase: string;
  regions: WordstatRegionEntry[];
  source: string;
  fetched_at: string;
}

export type IntentType = 'informational' | 'commercial' | 'navigational' | 'transactional';
export type IntentSubtype = 'how-to' | 'comparison' | 'price' | 'review' | 'near-me' | 'general';

export interface ClusterPhrase {
  phrase: string;
  volume: number;
  intent_subtype: IntentSubtype;
  has_local_modifier: boolean;
  position: number;
}

export interface DemandCluster {
  cluster_name: string;
  intent_type: IntentType;
  total_volume: number;
  region_code: string;
  phrases: ClusterPhrase[];
  recommended_h1: string;
  recommended_title: string;
  recommended_faq: Array<{ q: string; a: string }>;
}
