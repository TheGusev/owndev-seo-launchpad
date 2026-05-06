/**
 * Crawl Engine — public types.
 */
export interface CrawlOptions {
  rootUrl: string;
  maxPages?: number;            // default 50
  respectRobots?: boolean;      // default true
  userAgent?: string;
  concurrency?: number;         // default 3
  timeoutMs?: number;           // default 12_000
  sessionId?: string | null;    // blueprint_sessions.id
  /** Если статический HTML выглядит как SPA — добор через r.jina.ai. Default: true */
  enableJinaFallback?: boolean;
}

export interface CrawlPageRecord {
  url: string;
  http_status: number | null;
  content_type: string | null;
  title: string | null;
  h1: string | null;
  meta_description: string | null;
  canonical: string | null;
  robots_meta: string | null;
  word_count: number | null;
  schemas_found: string[];     // ['Organization', 'BreadcrumbList', ...]
  blocks_detected: string[];   // ['hero', 'faq', 'reviews', ...]
  page_type_guess: string | null;
  raw_html_size: number | null;
  fetch_ms: number | null;
  outbound_links: number;
  notes: Record<string, any>;
}

export interface CrawlSessionResult {
  id: string;
  root_url: string;
  pages_crawled: number;
  errors_count: number;
  status: 'done' | 'failed';
  pages: CrawlPageRecord[];
  started_at: string;
  finished_at: string;
}
