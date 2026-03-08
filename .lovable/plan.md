

## Fix Blog Overlapping & Layout Issues

The overlapping text on both `/blog` and `/blog/[slug]` is caused by the `ParallaxLayer` component wrapping the content. It applies a Y-transform based on scroll position, which shifts content up/down and causes it to overlap with elements above — especially on repeat visits when scroll position isn't at top.

### Changes

| File | Change |
|------|--------|
| `src/pages/Blog.tsx` | 1. Remove `ParallaxLayer` wrapper around posts grid (fixes overlap). 2. Widen container `max-w-4xl` → `max-w-6xl`. 3. Switch posts to 2-column grid on desktop: `grid md:grid-cols-2 gap-6`. 4. Center title/subtitle with `text-center`. 5. Center search with `max-w-2xl mx-auto`. 6. Center tags with `justify-center`. 7. Add `h-full` to cards for uniform height. |
| `src/pages/BlogPost.tsx` | 1. Remove `ParallaxLayer` wrapper around article content (fixes overlap). 2. Remove `FloatingParticles` (visual noise on article page). |

Both pages keep `AnimatedGrid`, `MouseGradient`, `ClickRipple` — only the parallax transform causing the overlap is removed.

