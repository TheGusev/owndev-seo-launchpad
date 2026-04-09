export type GeoRatingSnapshot = {
  version: string;
  updatedAt: string;
  methodology: string;
  source: string;
  entriesCount: number;
};

export type GeoRatingEntry = {
  rank: number;
  brandName: string;
  domain: string;
  category: string;
  llmScore: number;
  seoScore: number;
  hasLlmsTxt: boolean;
  hasSchema: boolean;
  hasFaq: boolean;
  issuesCount: number;
  topErrors: string[];
  verifiedAt: string;
};

export const SNAPSHOT_META: Omit<GeoRatingSnapshot, "entriesCount" | "updatedAt"> = {
  version: "2026-Q2",
  methodology: "50+ GEO / SEO / Schema / AI-ready сигналов",
  source: "OWNDEV audit engine",
};

export function mapDbRowToEntry(
  row: {
    domain: string;
    display_name: string;
    category: string;
    llm_score: number;
    seo_score: number;
    has_llms_txt: boolean;
    has_schema: boolean;
    has_faqpage: boolean;
    errors_count: number;
    top_errors: unknown;
    last_checked_at: string;
  },
  rank: number
): GeoRatingEntry {
  return {
    rank,
    brandName: row.display_name,
    domain: row.domain,
    category: row.category,
    llmScore: row.llm_score,
    seoScore: row.seo_score,
    hasLlmsTxt: row.has_llms_txt,
    hasSchema: row.has_schema,
    hasFaq: row.has_faqpage,
    issuesCount: row.errors_count,
    topErrors: (() => {
      try {
        if (Array.isArray(row.top_errors)) return row.top_errors;
        if (typeof row.top_errors === "string") return JSON.parse(row.top_errors);
        return [];
      } catch { return []; }
    })(),
    verifiedAt: row.last_checked_at,
  };
}
