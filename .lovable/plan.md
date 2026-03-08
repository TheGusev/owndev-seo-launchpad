

## Full Site Audit: Markup, SEO, Routing, Sitemap, Robots, Interlinking, Semantics

### 1. ROBOTS.TXT -- Issues Found

**Problem:** No `Sitemap:` directive. Search engines rely on this to discover sitemaps.

**Fix:** Add `Sitemap: https://owndev.ru/sitemap.xml` at the bottom of `public/robots.txt`.

---

### 2. SITEMAP -- Issues Found

**Problem A:** Two conflicting sitemap systems:
- `public/sitemap.xml` -- a hand-written static file with 79 URLs (including tools like `csv-export`, `telegram-bot`, `change-alerts`, `robots-generator`, `ai-citation`, `geo-map` that **don't exist in `tools-registry.ts`** -- they will 404)
- `vite-plugin-sitemap.ts` -- a build-time generator that creates `sitemap.xml` (index), `sitemap-pages.xml`, and `sitemap-geo-*.xml` files. This overwrites `public/sitemap.xml` at build time.

The static `public/sitemap.xml` is served in dev but the plugin output replaces it in production. However the static file references **non-existent tool slugs**: `roi-calculator`, `change-alerts`, `sitemap-generator`, `robots-generator`, `ai-citation`, `csv-export`, `telegram-bot`, `geo-map`. These are NOT in `tools-registry.ts` and will produce 404s.

**Problem B:** The vite plugin generates geo URLs for `nicheTools` (`pseo-generator`, `anti-duplicate`, `ai-citation`, `roi-calculator`, `geo-map`) but these tools either don't exist in `tools-registry.ts` or aren't `geoEnabled`. Only `pseo-generator` and `schema-generator` and `seo-auditor` have `geoEnabled: true` in the registry. The sitemap generates thousands of URLs that return 404.

**Problem C:** Blog posts are missing from both sitemaps entirely.

**Problem D:** The `/tools` page header says "12 инструментов" but `tools-registry.ts` contains only 12 entries. Meanwhile the static sitemap references 18 tool slugs including many that don't exist.

**Fix:**
1. Delete `public/sitemap.xml` (let the plugin generate it).
2. Update `vite-plugin-sitemap.ts`:
   - Add blog post URLs (import blog slugs or hardcode them)
   - Fix `nicheTools` to only reference tools that actually exist AND are niche-enabled in `GeoNicheToolPage` (`NICHE_ENABLED_SLUGS`)
   - Add `/blog` page to static URLs
   - Add individual tool page URLs for ALL tools in the registry
3. Ensure tool geo URLs match actual routes: `/:citySlug/:nicheSlug/:toolSlug` and `/tools/:toolSlug/:regionSlug`

---

### 3. ROUTING -- Issues Found

**Problem A:** Header logo uses `<a href="/">` instead of `<Link to="/">` -- causes full page reload instead of SPA navigation.

**Problem B:** Footer logo also uses `<a href="/">` -- same issue.

**Problem C:** Header anchor-links (`#about`, `#contact`) only work on the homepage. If user is on `/blog` and clicks "О нас", nothing happens because those sections don't exist on that page. Should navigate to `/#about`.

**Fix:**
- Replace `<a href="/">` with `<Link to="/">` in Header and Footer logos
- Update Header `scrollTo` logic: if not on `/`, navigate to `/#about` or `/#contact` first

---

### 4. SEO / META -- Issues Found

**Problem A:** Missing `<Helmet>` on these pages:
- `Index.tsx` (homepage) -- no Helmet at all; relies on `index.html` hardcoded meta. This means React Helmet won't manage the homepage title/description, and canonical stays hardcoded.
- `Tools.tsx` -- no Helmet, no title, no description, no canonical
- `ToolPage.tsx` -- no Helmet, no title, no description, no canonical
- `Privacy.tsx` -- no Helmet
- `Terms.tsx` -- no Helmet
- `NotFound.tsx` -- no Helmet (should have `<meta name="robots" content="noindex">`)

**Problem B:** `BlogPost.tsx` has no canonical URL in its Helmet.

**Problem C:** `Blog.tsx` has no canonical URL in its Helmet.

**Problem D:** `index.html` has a hardcoded canonical `href="https://owndev.ru"` without trailing slash, while the sitemap uses `https://owndev.ru/` with trailing slash -- inconsistency.

**Problem E:** OG image points to `lovable.dev/opengraph-image-p98pqg.png` -- should be your own branded image.

**Fix:** Add `<Helmet>` with `<title>`, `<meta name="description">`, `<link rel="canonical">` to every page. Add `noindex` to NotFound. Fix canonical consistency.

---

### 5. SCHEMA.ORG / JSON-LD -- Issues Found

**Problem A:** Homepage has no JSON-LD at all (no Organization, WebSite, or SiteNavigationElement schema).

**Problem B:** Blog listing page (`/blog`) has no JSON-LD.

**Problem C:** `BlogPost.tsx` has Article schema but missing `mainEntityOfPage`, `image`, `dateModified`, `publisher` fields.

**Problem D:** FAQ component has no FAQPage JSON-LD schema despite having FAQ content.

**Problem E:** Tools page has no JSON-LD.

**Fix:** Add WebSite + Organization JSON-LD to homepage, FAQPage schema to FAQ section, improve Article schema on blog posts, add BreadcrumbList schema to tool/geo pages.

---

### 6. SEMANTIC HTML -- Issues Found

**Problem A:** Blog page `<main>` wraps correctly but sections on Index page don't use semantic landmarks -- no `<section>` with `aria-label`.

**Problem B:** FAQ section doesn't use `<section>` with proper heading hierarchy.

**Problem C:** Breadcrumbs use `<motion.nav>` which is good, but missing `aria-label="Breadcrumb"` attribute.

**Fix:** Add `aria-label` to breadcrumb navs, ensure heading hierarchy (h1 > h2 > h3) is consistent.

---

### 7. INTERLINKING -- Issues Found

**Problem A:** Blog posts have no "related posts" or "next/previous" links at the bottom.

**Problem B:** Tool pages have no cross-links to other tools.

**Problem C:** Homepage has no link to `/blog` in the hero or main content (only in footer and header nav).

**Fix:** Add related posts to BlogPost, add "other tools" section to ToolPage.

---

### 8. ACCESSIBILITY / MINOR -- Issues Found

- Header mobile menu button has no `aria-label`
- Footer social links correctly have `aria-label` -- good
- All touch targets appear to meet 44px minimum -- good
- `lang="ru"` is set -- good

---

### Implementation Plan (prioritized)

| # | File(s) | Change | Priority |
|---|---------|--------|----------|
| 1 | `public/robots.txt` | Add `Sitemap:` directive | High |
| 2 | `public/sitemap.xml` | Delete (let plugin generate) | High |
| 3 | `vite-plugin-sitemap.ts` | Fix tool slugs, add blog URLs, add `/blog` to static pages, fix `nicheTools` to match `NICHE_ENABLED_SLUGS` | High |
| 4 | `src/pages/Index.tsx` | Add `<Helmet>` with title, description, canonical, Organization+WebSite JSON-LD | High |
| 5 | `src/pages/Tools.tsx` | Add `<Helmet>` with title, description, canonical | High |
| 6 | `src/pages/ToolPage.tsx` | Add `<Helmet>` with title, description, canonical | High |
| 7 | `src/pages/Blog.tsx` | Add canonical to Helmet | Medium |
| 8 | `src/pages/BlogPost.tsx` | Add canonical, improve Article JSON-LD (publisher, dateModified, mainEntityOfPage) | Medium |
| 9 | `src/pages/NotFound.tsx` | Add `<Helmet>` with noindex | Medium |
| 10 | `src/pages/Privacy.tsx` | Add `<Helmet>` | Medium |
| 11 | `src/pages/Terms.tsx` | Add `<Helmet>` | Medium |
| 12 | `src/components/Header.tsx` | Replace logo `<a>` with `<Link>`, fix anchor navigation from non-homepage, add `aria-label` to mobile menu button | Medium |
| 13 | `src/components/Footer.tsx` | Replace logo `<a>` with `<Link>` | Low |
| 14 | `src/components/FAQ.tsx` | Add FAQPage JSON-LD schema | Medium |
| 15 | `src/pages/GeoToolPage.tsx`, `GeoNicheToolPage.tsx` | Add `aria-label="Breadcrumb"` to nav, add BreadcrumbList JSON-LD | Low |
| 16 | `index.html` | Fix canonical trailing slash, update OG image to branded one | Medium |

Total: ~16 files to modify/delete. The most critical fixes are the sitemap (thousands of 404 URLs being submitted to search engines), missing Helmet on major pages, and robots.txt missing sitemap reference.

