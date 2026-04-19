export type MarketplacePlatform = 'wb' | 'ozon';
export type MarketplaceInputType = 'url' | 'sku' | 'manual';
export type MarketplaceAuditStatus = 'pending' | 'parsing' | 'scoring' | 'llm' | 'done' | 'error';

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low';
export type IssueModule = 'content' | 'search' | 'conversion' | 'ads' | 'technical' | 'competitive';
export type IssueSource = 'rule' | 'llm';

export interface ScoreFactor {
  name: string;
  score: number;        // 0..100
  weight: number;       // 0..1
  reason: string;
  dataPresent: boolean;
}

export interface SubScore {
  score: number;        // 0..100
  weight: number;       // weight in total
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
  impact_score: number; // 1..20
  visible_in_preview: boolean;
  source: IssueSource;
}

export interface RuleDef {
  id: string;
  module: IssueModule;
  severity: IssueSeverity;
  impact_score: number;
  title: string;
  why_it_matters: string;
  how_to_fix: string;
  example_fix?: string;
  visible_in_preview: boolean;
  check: string;
  threshold?: number;
}

export interface ParsedProduct {
  platform: MarketplacePlatform;
  title: string;
  description: string;
  category: string;
  attributes: Record<string, string>;
  images: string[];
  bullets?: string[];
  videoCount?: number;
  reviewsCount?: number;
  rating?: number;
  url?: string;
  sourceData?: Record<string, any>;
}

export interface KeywordsBlock {
  covered: string[];
  missing: string[];
  coveragePct: number;
  source?: 'llm' | 'naive';
}

export interface CompetitorBlock {
  url: string;
  title: string;
  score: number;
  gap: string[];
}

export interface GapItem {
  aspect: string;
  evidence: string;
}

export interface CompetitorGapBlock {
  weakerThan: GapItem[];
  strongerThan: GapItem[];
  priorityAdds: string[];
  source: 'llm' | 'fallback';
}

/** Stored shape inside competitors_json — supports legacy + new structured form. */
export type CompetitorsField =
  | CompetitorBlock[]
  | { list: CompetitorBlock[]; gap: CompetitorGapBlock | null };

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

export interface MarketplaceAuditRow {
  id: string;
  source_platform: MarketplacePlatform;
  input_type: MarketplaceInputType;
  input_value: string;
  status: MarketplaceAuditStatus;
  progress_pct: number;
  product_title: string | null;
  product_description: string | null;
  attributes_json: Record<string, string>;
  category: string | null;
  images_json: string[];
  scores_json: ScoresJson | Record<string, never>;
  issues_json: MarketplaceIssue[];
  keywords_json: KeywordsBlock | Record<string, never>;
  competitors_json: CompetitorsField;
  recommendations_json: RecommendationsBlock | Record<string, never>;
  ai_summary: string | null;
  error_msg: string | null;
  rules_version: string;
  created_at: string;
  updated_at: string;
}
