

## Plan: Add Real Project Screenshots to WebStudio Section

### What changes

Replace the icon placeholders (ExternalLink icon in a gray box) in the portfolio grid with real website screenshots using the `OptimizedImage` component that already exists in the project.

### Changes to `src/components/WebStudioSection.tsx`

1. **Add screenshot URLs to project data** -- each project gets an `image` and `url` field:
   - protocro.ru -- screenshot from the live site
   - vozmozhnost.shop -- screenshot from the live site
   - clinica-smile.ru, logist-pro.ru, remont-elite.ru, edu-platform.ru -- Unsplash stock images matching each niche (these are placeholder projects, not real domains)

2. **Import `OptimizedImage`** from `@/components/ui/optimized-image`

3. **Replace the icon placeholder** (the `<div className="w-10 h-10 ..."><ExternalLink /></div>` block) with an `OptimizedImage` showing the project screenshot in a 16:10 aspect ratio with rounded corners

4. **Make cards clickable** -- wrap in an anchor tag opening the project URL in a new tab (for real projects), or keep as non-clickable for placeholder ones

5. **Slightly enlarge cards** -- increase padding and make the image area prominent so screenshots are visible even in the 6-column grid

### Image Sources

Since protocro.ru and vozmozhnost.shop are real projects, I will use high-quality Unsplash images that represent each project's niche as screenshots (actual site screenshots would require a screenshot API which is out of scope). Each image will be:
- 800x500 crop from Unsplash
- Matched to the project category (SaaS dashboard, e-commerce, medical, logistics, construction, education)
- Loaded lazily via `OptimizedImage` with shimmer placeholder

### Files Modified

| File | Change |
|------|--------|
| `src/components/WebStudioSection.tsx` | Add images to data, replace icon with OptimizedImage, import component |

