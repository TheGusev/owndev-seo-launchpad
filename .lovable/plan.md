

## Plan: Add MouseGradient + ClickRipple + ParallaxLayer to All Secondary Pages

### 1. MouseGradient & ClickRipple on all pages

Add `<MouseGradient />` and `<ClickRipple />` imports and render them inside the root `<div>` of every secondary page, same as Index.tsx does.

**Files:** `Tools.tsx`, `ToolPage.tsx`, `Blog.tsx`, `BlogPost.tsx`, `Privacy.tsx`, `Terms.tsx`, `NotFound.tsx`, `GeoToolPage.tsx`, `GeoNicheToolPage.tsx`

### 2. ParallaxLayer wrapping content sections

Wrap key content blocks in `<ParallaxLayer>` with varying `speed` values for depth:

- **Tools.tsx**: Wrap each category `<motion.section>` in `<ParallaxLayer speed={0.15}>` for subtle depth as user scrolls through categories
- **ToolPage.tsx**: Wrap the tool widget area in `<ParallaxLayer speed={0.2}>`, use-cases section in `<ParallaxLayer speed={0.1}>`
- **Blog.tsx**: Wrap the posts grid in `<ParallaxLayer speed={0.15}>`
- **BlogPost.tsx**: Wrap the article content in `<ParallaxLayer speed={0.1}>` for gentle scroll depth
- **GeoToolPage.tsx**: Wrap stats bar in `<ParallaxLayer speed={0.15}>`, tool widget in `<ParallaxLayer speed={0.2}>`
- **GeoNicheToolPage.tsx**: Same pattern as GeoToolPage

ParallaxLayer already handles mobile detection internally (disables on mobile/touch devices), so no extra logic needed.

### Files to modify (9 files)

| File | MouseGradient + ClickRipple | ParallaxLayer |
|------|-----------------------------|---------------|
| `src/pages/Tools.tsx` | ✓ | Category sections |
| `src/pages/ToolPage.tsx` | ✓ | Widget + use-cases |
| `src/pages/Blog.tsx` | ✓ | Posts grid |
| `src/pages/BlogPost.tsx` | ✓ | Article content |
| `src/pages/Privacy.tsx` | ✓ | — |
| `src/pages/Terms.tsx` | ✓ | — |
| `src/pages/NotFound.tsx` | ✓ | — |
| `src/pages/GeoToolPage.tsx` | ✓ | Stats + widget |
| `src/pages/GeoNicheToolPage.tsx` | ✓ | Stats + widget |

