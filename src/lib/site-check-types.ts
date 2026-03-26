export type ScanMode = "page" | "site";
export type ScanStatus = "pending" | "running" | "done" | "error";
export type PaymentStatus = "pending" | "paid" | "failed";
export type IssueSeverity = "critical" | "high" | "medium" | "low";
export type IssueModule = "technical" | "content" | "direct" | "competitors" | "semantics" | "schema" | "ai";

export interface IssueCard {
  id: string;
  module: IssueModule;
  severity: IssueSeverity;
  title: string;
  found: string;
  location: string;
  why_it_matters: string;
  how_to_fix: string;
  example_fix: string;
  visible_in_preview: boolean;
}

export interface ScanScores {
  total: number;
  seo: number;
  direct: number;
  schema: number;
  ai: number;
}

export interface Scan {
  scan_id: string;
  url: string;
  mode: ScanMode;
  status: ScanStatus;
  created_at: string;
  scores: ScanScores;
  issues: IssueCard[];
  theme: string;
  competitors: { url: string; scores: ScanScores }[];
  keywords: { keyword: string; volume: number; cluster: string }[];
  minus_words: string[];
  expires_at: string;
}

export interface Report {
  report_id: string;
  scan_id: string;
  email: string;
  payment_status: PaymentStatus;
  payment_id: string;
  download_token: string;
  created_at: string;
}
