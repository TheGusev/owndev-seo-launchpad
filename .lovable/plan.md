

## Plan: Expand to 20+ SEO Tools + Hidden GEO Pages (85 regions)

### Overview

Two major additions:
1. **Expand tool set** from current 5 to ~20 tools organized in 6 categories
2. **Hidden GEO routing** -- 85 regional landing pages at `/tools/:toolSlug/:regionSlug` with unique localized content, no city selector UI

---

### Important Limitation: SSR/SSG

This project runs on Vite + React (client-side SPA). Search engines have improved at crawling SPAs, but for optimal SEO indexing of 85+ geo pages, the content must be rendered in HTML. Two options:

- **Option A (recommended)**: Use `react-snap` or `vite-plugin-prerender` to pre-render geo pages at build time into static HTML
- **Option B (simpler start)**: Ship as SPA with proper meta tags via `react-helmet-async`, add a sitemap.xml, and monitor indexation

We will implement Option B first (faster to ship) and can add pre-rendering later.

---

### Part 1: New Tool Categories and Components

#### 6 categories, ~20 tools total:

**Category 1: Analysis and Audit**
1. SEO Site Auditor (new) -- technical analysis form (URL input, mock results)
2. Competitor Analysis (new) -- compare TOP-10 snippets
3. Indexation Checker (new) -- batch URL check

**Category 2: Generation (pSEO)** -- existing tools stay
4. pSEO Generator (exists) -- keep as is
5. Schema.org Generator (new) -- JSON-LD builder for LocalBusiness/FAQ
6. ROI Calculator (exists) -- keep as is

**Category 3: Content**
7. Semantic Core Generator (new) -- keyword input, mock clusters
8. AI Text Generator (new) -- LLM-powered intro generator (uses Lovable AI)
9. Anti-Duplicate Checker (exists) -- keep as is

**Category 4: Monitoring**
10. Position Monitor (new) -- query list + mock positions
11. Change Alerts (new) -- competitor monitoring dashboard

**Category 5: Webmaster Tools**
12. Sitemap Generator (new) -- URL list to sitemap XML
13. Robots.txt Generator (new) -- directive builder
14. Internal Links Checker (new) -- link structure visualizer
15. AI Citation Checker (exists) -- keep as is

**Category 6: Integrations**
16. GEO Coverage Map (exists) -- keep as is
17. CSV/Excel Export (new) -- data export tool
18. Telegram Bot Setup (new) -- webhook configuration

#### New files to create:
```
src/data/tools-registry.ts          -- all tools metadata (id, slug, name, category, icon, component)
src/components/tools/SEOAuditor.tsx
src/components/tools/CompetitorAnalysis.tsx
src/components/tools/IndexationChecker.tsx
src/components/tools/SchemaGenerator.tsx
src/components/tools/SemanticCoreGenerator.tsx
src/components/tools/AITextGenerator.tsx
src/components/tools/PositionMonitor.tsx
src/components/tools/ChangeAlerts.tsx
src/components/tools/SitemapGenerator.tsx
src/components/tools/RobotsTxtGenerator.tsx
src/components/tools/InternalLinksChecker.tsx
src/components/tools/CSVExport.tsx
src/components/tools/TelegramBotSetup.tsx
```

Each new tool will be a static/presentational component with form inputs and placeholder results (same pattern as existing PSEOGenerator, AntiDuplicateChecker, etc).

---

### Part 2: Tools Catalog Page

#### New page: `/tools`

A grid/catalog page showing all 20 tools organized by category.

**File:** `src/pages/Tools.tsx`

- 6 category sections, each with cards linking to individual tool pages
- Each card: icon, title, short description, "Open" button
- Uses existing `glass` card styling
- Responsive: 3 cols desktop, 2 cols tablet, 1 col mobile

---

### Part 3: Individual Tool Pages

#### New page: `/tools/:toolSlug`

**File:** `src/pages/ToolPage.tsx`

- Dynamic route using `useParams()` to load the correct tool from registry
- Full-screen layout: Header + ToolScreen wrapper + tool component
- Same visual style as current Index tool sections but standalone

---

### Part 4: Hidden GEO System

#### Data layer

**File:** `src/data/regions.ts`

```typescript
export interface Region {
  id: string;           // URL slug: "moskva", "novosibirsk"
  name: string;         // "Москва"
  nameCase: string;     // prepositional: "Москве"
  population: number;
  agencies: number;     // SEO agencies count
  priceRange: string;   // "50000-200000"
  localText: string;    // 2-3 unique paragraphs about SEO market
  localNiches: string[];// ["дезинфекция", "климат-контроль"]
  neighbors: string[];  // region IDs for interlinking
}
```

85 entries for all Russian federal subjects (cities with populations). Each entry has unique `localText` written for SEO uniqueness.

#### GEO Page Route

**File:** `src/pages/GeoToolPage.tsx`

Route: `/tools/:toolSlug/:regionSlug`

- Loads region data from `regions.ts` by slug
- Loads tool component from registry
- Renders a full landing page with:
  - Localized H1: "SEO-генератор в {region.nameCase}"
  - Localized meta title/description via `react-helmet-async` (new dependency)
  - 2-3 paragraphs of unique regional content from `region.localText`
  - The tool widget itself (same component, no changes)
  - Schema.org JSON-LD: `LocalBusiness + City`
  - Interlinking block: links to 5-7 neighboring regions
  - CTA: "Получить аудит для {region.name}"
  - NO city selector dropdown -- user is already on their page

#### Routing Updates

**File:** `src/App.tsx`

Add routes:
```
/tools                          -> Tools catalog
/tools/:toolSlug                -> Individual tool page
/tools/:toolSlug/:regionSlug    -> GEO-localized tool page
```

#### Sitemap Generation

**File:** `src/pages/Sitemap.tsx` (or generate at build time)

Generate sitemap.xml with all GEO URLs:
- 85 regions x relevant tools = URLs with priorities
- `changefreq: monthly`, priority by population

For now, create a static `public/sitemap.xml` generated from the regions data, or a build script.

---

### Part 5: Navigation Updates

#### Header (`src/components/Header.tsx`)
- Add "Все инструменты" link -> `/tools`

#### ToolNavigation (`src/components/ToolNavigation.tsx`)
- Expand to show categories or link to `/tools` catalog

#### Index page (`src/pages/Index.tsx`)
- Keep current 5 featured tools as hero showcases
- Add a "Смотреть все 20 инструментов" CTA linking to `/tools`

---

### Part 6: SEO Metadata

#### New dependency: `react-helmet-async`

Used on GEO pages to set:
- `<title>SEO-генератор в Москве -- цены от 5000₽</title>`
- `<meta name="description" content="...">`
- `<script type="application/ld+json">` for Schema.org
- `<link rel="canonical">`

---

### Implementation Order

1. Create `src/data/tools-registry.ts` with all 20 tools metadata
2. Create `src/data/regions.ts` with 85 region entries (start with 15 cities-millionniki with full localText, remaining 70 with shorter text)
3. Create 13 new tool components (static UI, same pattern as existing)
4. Create `/tools` catalog page
5. Create `/tools/:toolSlug` individual tool page
6. Create `/tools/:toolSlug/:regionSlug` GEO page with localized content
7. Update `App.tsx` with new routes
8. Install `react-helmet-async`, add meta tags to GEO pages
9. Generate `public/sitemap.xml`
10. Update Header/nav with new links

### Files Changed/Created Summary

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/data/tools-registry.ts` | Central tool definitions |
| Create | `src/data/regions.ts` | 85 region data entries |
| Create | `src/pages/Tools.tsx` | Tools catalog grid |
| Create | `src/pages/ToolPage.tsx` | Individual tool page |
| Create | `src/pages/GeoToolPage.tsx` | GEO-localized landing |
| Create | 13 new tool components | Static UI widgets |
| Modify | `src/App.tsx` | Add 3 new routes |
| Modify | `src/components/Header.tsx` | Add "Все инструменты" |
| Modify | `src/pages/Index.tsx` | Add CTA to full catalog |
| Create | `public/sitemap.xml` | SEO sitemap |

### Scope Note

This is a large implementation. To keep each step reviewable, I recommend splitting into 2-3 messages:
1. First: data layer (registry + regions) + new tool components
2. Second: pages (catalog, tool page, GEO page) + routing
3. Third: SEO (helmet, sitemap, schema.org, interlinking)
