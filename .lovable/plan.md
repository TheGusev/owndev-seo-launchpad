

## Plan: Activate CompetitorAnalysis, IndexationChecker, and RobotsTxtGenerator

### 1. CompetitorAnalysis -- frontend-only scrape via edge function

Since we already have a `seo-audit` edge function that fetches HTML, we create a new `competitor-analysis` edge function that:
- Accepts `{ query: string, region: string }`
- Constructs a Google search URL and fetches it (or simulates with direct URL analysis)
- Since scraping Google SERP reliably is not feasible without paid APIs, the realistic approach: **user enters up to 5 competitor URLs manually**, and the function fetches each, extracts title, description, h1, word count, image count, internal/external link counts
- Returns a comparison table of all competitors

**Edge function:** `supabase/functions/competitor-analysis/index.ts`
- Accepts `{ urls: string[] }` (max 5)
- For each URL: fetch HTML, extract title, description, h1, word count, link counts, image count
- Return array of competitor data objects

**Frontend:** Rewrite `CompetitorAnalysis.tsx`
- Replace single "query + region" inputs with a textarea for competitor URLs (up to 5)
- Add loading/error states
- Show results in a comparison table (columns: URL, Title, Description, H1, Words, Images, Links)
- Remove "Скоро" badge, enable button

### 2. IndexationChecker -- edge function checking via HTTP HEAD

Create `supabase/functions/check-indexation/index.ts`:
- Accepts `{ urls: string[] }` (max 50)
- For each URL: send HTTP HEAD request, check status code (200, 301, 404, etc.)
- Also check for `X-Robots-Tag: noindex` header
- Return array: `{ url, status, statusCode, noindex, redirectTo? }`

**Frontend:** Rewrite `IndexationChecker.tsx`
- Keep textarea for URLs
- Add loading state with progress
- Show results table: URL, Status Code, Indexed/NoIndex, Redirect target
- Color-code rows: green (200), yellow (301), red (404/noindex)
- Remove "Скоро" badge, enable button

### 3. RobotsTxtGenerator -- enhance existing frontend-only tool

Already semi-functional. Enhance:
- Wire domain input to dynamically update the Sitemap URL in output
- Add ability to add custom Disallow rules (input + add button)
- Add User-agent selector (*, Googlebot, Yandex, etc.)
- Add Allow directive support
- Working "Copy" button with clipboard API + toast
- Working "Download" button
- Add Crawl-delay field

No backend needed -- pure frontend.

### 4. Update tools-registry.ts

Change status from `coming_soon` to `active` for all three tools.

### Files

| Action | File |
|--------|------|
| CREATE | `supabase/functions/competitor-analysis/index.ts` |
| CREATE | `supabase/functions/check-indexation/index.ts` |
| REWRITE | `src/components/tools/CompetitorAnalysis.tsx` |
| REWRITE | `src/components/tools/IndexationChecker.tsx` |
| REWRITE | `src/components/tools/RobotsTxtGenerator.tsx` |
| MODIFY | `src/data/tools-registry.ts` (status changes) |

