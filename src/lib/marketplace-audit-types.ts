// Mirror of backend types from owndev-backend/src/types/marketplaceAudit.ts
// Keep in sync.

export type MarketplacePlatform = 'wb' | 'ozon';
export type MarketplaceInputType = 'url' | 'sku' | 'manual';
export type MarketplaceAuditStatus =
  | 'pending'
  | 'parsing'
  | 'scoring'
  | 'llm'
  | 'done'
  | 'error';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IssueModule =
  | 'content'
  | 'search'
  | 'conversion'
  | 'ads'
  | 'technical'
  | 'competitive';

export interface ScoreFactor {
  name: string;
  score: number;
  weight: number;
  reason: string;
  dataPresent: boolean;
}

export interface SubScore {
  score: number;
  weight: number;
  factors: ScoreFactor[];
  missingData: string[];
}

export interface BreakdownJson {
  content: SubScore;
  search: SubScore;
  conversion: SubScore;
  ads: SubScore;
}

export interface ScoresJson {
  total: number;
  content: number;
  search: number;
  conversion: number;
  ads: number;
  breakdown: BreakdownJson;
}

export interface MarketplaceIssue {
  id: string;
  module: IssueModule;
  severity: IssueSeverity;
  title: string;
  found: string;
  why_it_matters: string;
  how_to_fix: string;
  example_fix?: string;
  impact_score: number;
  visible_in_preview: boolean;
  source: 'rule' | 'llm';
}

export interface KeywordsBlock {
  covered: string[];
  missing: string[];
  coveragePct: number;
}

export interface CompetitorBlock {
  url: string;
  title: string;
  score: number;
  gap: string[];
}

export interface RecommendationsBlock {
  newTitle: string;
  newDescription: string;
  bullets: string[];
  addKeywords: string[];
  removeWords: string[];
}

export interface ManualInput {
  title: string;
  description: string;
  specs: Record<string, string>;
  category: string;
  competitorUrls?: string[];
}

export interface PreviewResponse {
  id: string;
  status: MarketplaceAuditStatus;
  progress_pct: number;
  product_title: string | null;
  category: string | null;
  image: string | null;
  preview_scores: {
    total: number;
    content: number;
    search: number;
    conversion: number;
    ads: number;
  } | null;
  error: string | null;
}

export interface ResultResponse {
  id: string;
  status: MarketplaceAuditStatus;
  platform: MarketplacePlatform;
  inputType: MarketplaceInputType;
  product: {
    title: string;
    description: string;
    category: string;
    images: string[];
    attributes: Record<string, string>;
  };
  scores: ScoresJson | Record<string, never>;
  issues: MarketplaceIssue[];
  keywords: KeywordsBlock;
  competitors: CompetitorBlock[];
  recommendations: RecommendationsBlock | Record<string, never>;
  ai_summary: string;
  meta: { created_at: string; updated_at: string; rules_version: string };
  error: string | null;
}

export interface StartRequest {
  platform: MarketplacePlatform;
  inputType: MarketplaceInputType;
  value: string;
  manual?: ManualInput;
}

export interface StartResponse {
  id: string;
  status: MarketplaceAuditStatus;
}
