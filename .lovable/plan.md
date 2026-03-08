

## Audit Result: ParallaxLayer Overlap Risk on Tools Pages

### Already Fixed (no issues)
- `Blog.tsx` — no ParallaxLayer, 2-column grid, centered layout. Clean.
- `BlogPost.tsx` — no ParallaxLayer, no FloatingParticles. Clean.
- `GeoToolPage.tsx` — no ParallaxLayer. Clean.
- `GeoNicheToolPage.tsx` — no ParallaxLayer. Clean.

### Remaining Problem
Two pages still use `ParallaxLayer`, which causes the same content-overlapping bug on tablet and desktop:

| File | Usage | Risk |
|------|-------|------|
| `src/pages/Tools.tsx` | Each tool category section wrapped in `ParallaxLayer speed={0.15}` (line 73-115) | Category cards overlap on scroll/reload |
| `src/pages/ToolPage.tsx` | Tool widget (lines 114-125) and use-cases section (lines 128-152) wrapped in `ParallaxLayer` | Widget and text overlap with header/other sections |

### Proposed Fix

Remove `ParallaxLayer` wrappers from both files, keeping the inner `motion.div` animations intact. Same approach used successfully on Blog and Geo pages.

| File | Change |
|------|--------|
| `src/pages/Tools.tsx` | Remove `ParallaxLayer` import and wrapper around category sections (lines 73, 115) |
| `src/pages/ToolPage.tsx` | Remove `ParallaxLayer` import and wrappers around tool widget (lines 114, 125) and use-cases (lines 128, 152) |

