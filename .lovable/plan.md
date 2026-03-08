

## Plan: Restore & Optimize Tool Suite (11 tools)

### Changes Overview

**Remove:** ROI Calculator
**Combine:** Sitemap + Robots.txt → "Генератор файлов вебмастера" (tabs)
**Keep as-is:** SEO Auditor, Schema Generator, pSEO Generator, LLM Prompt Helper, Anti-Duplicate Checker
**Create new (6 tools):** Competitor Analysis, Indexation Checker, Semantic Core Generator, AI Text Generator, Position Monitor, Internal Links Checker

### Final Tool Catalog (11 tools)

| # | Tool | Category | Backend | How it works |
|---|------|----------|---------|--------------|
| 1 | SEO Auditor | analysis | edge fn (exists) | As-is |
| 2 | Анализ конкурентов | analysis | edge fn (new) | Fetch 2 URLs, compare SEO metrics side-by-side |
| 3 | Проверка индексации | analysis | edge fn (new) | Fetch URL, check noindex/nofollow/canonical/robots meta — report indexability issues |
| 4 | Мониторинг позиций | analysis | frontend-only | Manual tracker: user inputs keyword+position+date, stores in localStorage, shows chart over time |
| 5 | pSEO Generator | generation | frontend | As-is |
| 6 | Schema.org генератор | generation | frontend | As-is |
| 7 | Генератор семантического ядра | generation | edge fn (new, AI) | Lovable AI (gemini-3-flash-preview) generates keyword clusters by intent |
| 8 | AI Генератор текстов | content | edge fn (new, AI) | Lovable AI generates SEO text by type (intro, FAQ, meta, service description) |
| 9 | LLM Prompt Helper | content | frontend | As-is |
| 10 | Anti-Duplicate Checker | content | frontend | As-is |
| 11 | Генератор файлов вебмастера | webmaster | frontend | Tabs: sitemap.xml + robots.txt generation |
| 12 | Проверка внутренних ссылок | webmaster | edge fn (new) | Fetch page, extract all internal links, check for broken ones, report structure |

Actually that's 12. Let me recount — user asked for 7 restored + existing minus ROI + combine sitemap/robots. That gives us 12 distinct tools.

### Smart Combinations

**Sitemap + Robots.txt** merged into one tool with 2 tabs:
- Tab 1: Sitemap.xml (existing logic)
- Tab 2: Robots.txt (new: user selects options → generates robots.txt)

### Edge Functions Needed (4 new)

1. `check-indexation` — fetch URL, check meta robots, X-Robots-Tag, canonical, return indexability report
2. `competitor-analysis` — fetch 2 URLs, extract SEO metrics (title, desc, h1, h2 count, word count, schema, images), compare side-by-side
3. `generate-semantic-core` — Lovable AI call, returns keyword clusters (informational/commercial/transactional)
4. `generate-text` — Lovable AI call, generates SEO text by type
5. `check-internal-links` — fetch page, extract all `<a>` with same-domain href, HEAD-check each for status, return link map

That's 5 new edge functions.

### Position Monitor — No API, Honest Approach

Since we can't check real Google positions without a paid API, this becomes a **manual position tracker**:
- User adds: keyword, URL, current position, date
- Data saved in localStorage
- Shows position history as a mini line chart (recharts already installed)
- Useful for manual tracking after checking positions in Google Search Console

### Implementation Plan

| Action | File |
|--------|------|
| CREATE | `supabase/functions/check-indexation/index.ts` |
| CREATE | `supabase/functions/competitor-analysis/index.ts` |
| CREATE | `supabase/functions/generate-semantic-core/index.ts` |
| CREATE | `supabase/functions/generate-text/index.ts` |
| CREATE | `supabase/functions/check-internal-links/index.ts` |
| CREATE | `src/components/tools/CompetitorAnalysis.tsx` |
| CREATE | `src/components/tools/IndexationChecker.tsx` |
| CREATE | `src/components/tools/SemanticCoreGenerator.tsx` |
| CREATE | `src/components/tools/AITextGenerator.tsx` |
| CREATE | `src/components/tools/PositionMonitor.tsx` |
| CREATE | `src/components/tools/InternalLinksChecker.tsx` |
| REWRITE | `src/components/tools/SitemapGenerator.tsx` → add Robots.txt tab |
| DELETE | `src/components/tools/ROICalculatorTool.tsx` |
| REWRITE | `src/data/tools-registry.ts` — 12 tools, 4 categories |
| MODIFY | `src/components/ToolsShowcase.tsx` — update showcase grid |
| MODIFY | `src/pages/Tools.tsx` — update count text |
| MODIFY | `supabase/config.toml` — add new functions |

### Implementation Order

1. Edge functions (5 new)
2. New tool components (6)
3. Rewrite SitemapGenerator (add robots.txt tab)
4. Delete ROI Calculator
5. Update registry, showcase, config

