/**
 * services/strategy — V3 Strategy Layer types.
 *
 * The strategy layer turns demand intelligence + project type into a
 * concrete site-map of pages, with priorities, ordering and CTA flows.
 */
import type { ProjectTypeCodeV3 } from '../../types/formulaV3.js';
import type { DemandClusterV3 } from '../demand/types.js';
import type { GeneratedPageContract } from '../pageContracts/types.js';

export type CtaPrimary =
  | 'phone_call'
  | 'lead_form'
  | 'demo_request'
  | 'free_trial'
  | 'buy_now'
  | 'subscribe'
  | 'install_app'
  | 'donate'
  | 'register'
  | 'consultation_book';

export interface SitePage {
  page_type: string;
  url_pattern: string;
  priority: number;            // 0..1 (XML sitemap)
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  primary_cta: CtaPrimary;
  cluster_id?: string;
  contract: GeneratedPageContract;
  reasoning: string;            // why this page exists
}

export interface SiteStrategy {
  project_code: ProjectTypeCodeV3;
  brand_name: string;
  positioning: string;
  primary_audience: string;
  primary_cta: CtaPrimary;
  funnel_stages: Array<{
    stage: 'awareness' | 'consideration' | 'decision' | 'retention';
    page_types: string[];
    primary_cta: CtaPrimary;
  }>;
  pages: SitePage[];
  recommended_geos: string[];
  total_clusters: number;
  generated_at: string;
}

export interface StrategyBuildInput {
  project_code: ProjectTypeCodeV3;
  brand_name: string;
  brand_positioning?: string;
  city?: string;
  service_main?: string;
  phone?: string;
  clusters: DemandClusterV3[];
  recommended_geos?: string[];
}
