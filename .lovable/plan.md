

## Plan: Add Niches to GEO System -- 5000 Landing Pages

### What we have now
- 85 regions in `src/data/regions.ts`
- Routes: `/tools/:toolSlug/:regionSlug` for GEO pages (city-only)
- 18 tools in registry, 8 with `geoEnabled: true`
- GeoToolPage renders localized content per region

### What changes

We add a **niches** dimension. New URL pattern:

```
/:citySlug/:nicheSlug/:toolSlug
```

Examples:
- `/moskva/saas/pseo-generator`
- `/peterburg/nedvizhimost/roi-calculator`
- `/ekaterinburg/ecommerce/anti-duplicate`

Only the 5 main tools get niche pages (not all 18):
- pseo-generator, anti-duplicate, ai-citation, roi-calculator, geo-map

5 tools x 50 cities x 20 niches = **5,000 pages**

### Implementation Steps

#### 1. Create niches data (`src/data/niches.ts`)

20 niches with metadata:

```typescript
export interface Niche {
  id: string;           // URL slug: "saas", "ecommerce"
  name: string;         // "SaaS-продукты"
  nameCase: string;     // "SaaS" (for use in sentences)
  description: string;  // 1-2 sentences about the niche
  keywords: string[];   // Related search terms
}
```

List: saas, lokalnye-uslugi, ecommerce, b2b, nedvizhimost, avto, medicina, obrazovanie, finansy, stroitelstvo, it-razrabotka, marketing, hr, logistika, turizm, restorany, sport, krasota, deti, zhivotnye

#### 2. Create GeoNicheToolPage (`src/pages/GeoNicheToolPage.tsx`)

New page component for `/:citySlug/:nicheSlug/:toolSlug`:
- Loads city from regions, niche from niches, tool from registry
- Generates unique Title/H1/Description combining all three: "pSEO Generator для SaaS в Москве"
- Schema.org: SoftwareApplication + areaServed
- Unique content block combining `region.localText` with niche-specific text
- Tool widget (same component, no changes)
- CTA: "Получить аудит для SaaS в Москве"
- Interlinking:
  - Same city, same niche, other tools (horizontal)
  - Same city, other niches, same tool (vertical)
  - Other cities, same niche, same tool (geographic)

#### 3. Update routing (`src/App.tsx`)

Add new route BEFORE the catch-all:
```
/:citySlug/:nicheSlug/:toolSlug  ->  GeoNicheToolPage
```

Keep existing routes:
- `/tools` -- catalog
- `/tools/:toolSlug` -- tool page
- `/tools/:toolSlug/:regionSlug` -- old GEO pages (keep for backwards compatibility, or redirect)

#### 4. Trim regions to 50 cities

Currently 85 regions. For the niche pages, use the top 50 by population. The existing 85 remain available for the old `/tools/:tool/:region` routes.

#### 5. Update sitemap (`public/sitemap.xml`)

Replace current GEO URLs with new structure. With 5000 URLs, split into sitemap index:
- `public/sitemap.xml` -- sitemap index pointing to:
  - `public/sitemap-pages.xml` -- static pages
  - `public/sitemap-geo-1.xml` through `sitemap-geo-5.xml` -- 1000 URLs each (one per tool)

#### 6. Add niche-specific content generation

Each page needs unique text. Strategy:
- Combine `region.localText` (city-specific) with niche description
- Template: "{tool.name} помогает компаниям в сфере {niche.name} в {region.nameCase} создавать/проверять/анализировать..."
- Each niche has 2-3 template sentences that get combined with city data
- This ensures sufficient uniqueness across 5000 pages

### Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/data/niches.ts` | 20 niches with metadata |
| Create | `src/pages/GeoNicheToolPage.tsx` | Landing page for /:city/:niche/:tool |
| Modify | `src/App.tsx` | Add new route |
| Modify | `public/sitemap.xml` | Sitemap index with 5000 URLs |
| Modify | `src/data/tools-registry.ts` | Add `nicheEnabled` flag to 5 tools |

### Technical Notes

- URL structure uses Cyrillic-free slugs for all segments (moskva, saas, pseo-generator)
- Old `/tools/:tool/:region` routes remain functional (no breaking changes)
- No backend needed -- all data is static in TypeScript files
- react-helmet-async handles dynamic meta tags per page
- Interlinking creates a dense internal link graph (each page links to ~30 other pages)

### Scope

This is Step 1 (GEO + niches). The 3-business restructuring (web studio, pSEO tools, tech shop) will be a separate task after this is live and indexing.

