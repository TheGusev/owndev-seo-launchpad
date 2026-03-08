

## Plan: Distribute Animations Across All Pages

The homepage animations (AnimatedGrid, FloatingParticles, CornerDecorations, ParallaxLayer, motion entrance animations, sparkles) are intact. The issue is that secondary pages lack these decorative and motion elements entirely. The fix: add appropriate animation layers to every page, varying themes/density per page context.

### Changes by Page/Component

**1. `src/pages/Tools.tsx`** — Add AnimatedGrid (accent theme, lighter density), FloatingParticles, CornerDecorations. Wrap heading in motion with staggered children. Add radial gradient overlays matching homepage style.

**2. `src/pages/ToolPage.tsx`** — Add AnimatedGrid (primary theme), FloatingParticles behind the tool widget. Motion entrance for header elements (badge, title, description staggered). CornerDecorations on the tool widget container.

**3. `src/pages/Blog.tsx`** — Add AnimatedGrid (secondary theme), motion entrance for heading and search area. Staggered card animations using `whileInView`.

**4. `src/pages/BlogPost.tsx`** — Add subtle AnimatedGrid (accent theme, low density), motion fade-in for article content. FloatingParticles.

**5. `src/pages/Privacy.tsx` & `src/pages/Terms.tsx`** — Add AnimatedGrid (primary theme, minimal lines), motion fade-in for content sections.

**6. `src/pages/NotFound.tsx`** — Add AnimatedGrid, FloatingParticles, SparklesCore background (like Hero but lighter). Motion spring animation on the 404 number.

**7. `src/pages/GeoToolPage.tsx` & `src/pages/GeoNicheToolPage.tsx`** — Same treatment as ToolPage: AnimatedGrid, FloatingParticles, motion entrance for headers.

**8. `src/components/BlogPreview.tsx`** — Add motion `whileInView` entrance for heading and staggered card animations (currently static).

### Animation Variation Strategy

Each page uses a different AnimatedGrid theme and density to avoid monotony:
- Tools catalog: `theme="accent"`, `lineCount={{ h: 6, v: 8 }}`
- Tool pages: `theme="primary"`, `lineCount={{ h: 5, v: 7 }}`
- Blog: `theme="secondary"`, `lineCount={{ h: 4, v: 6 }}`
- Legal pages: `theme="primary"`, `lineCount={{ h: 3, v: 4 }}`
- 404: `theme="accent"`, `lineCount={{ h: 6, v: 8 }}` + SparklesCore

All pages get `overflow-hidden` on the main wrapper and gradient overlays (top/bottom fade) to blend the grid edges.

### Files to Modify

| File | Additions |
|------|-----------|
| `src/pages/Tools.tsx` | AnimatedGrid, FloatingParticles, CornerDecorations, motion stagger |
| `src/pages/ToolPage.tsx` | AnimatedGrid, FloatingParticles, motion entrance |
| `src/pages/Blog.tsx` | AnimatedGrid, motion whileInView for cards |
| `src/pages/BlogPost.tsx` | AnimatedGrid, motion fade-in |
| `src/pages/Privacy.tsx` | AnimatedGrid, motion fade-in |
| `src/pages/Terms.tsx` | AnimatedGrid, motion fade-in |
| `src/pages/NotFound.tsx` | AnimatedGrid, FloatingParticles, SparklesCore, motion spring |
| `src/pages/GeoToolPage.tsx` | AnimatedGrid, FloatingParticles, motion entrance |
| `src/pages/GeoNicheToolPage.tsx` | AnimatedGrid, FloatingParticles, motion entrance |
| `src/components/BlogPreview.tsx` | motion whileInView for heading + staggered cards |

No new files or dependencies. Uses existing components: `AnimatedGrid`, `FloatingParticles`, `CornerDecorations`, `ParallaxLayer`, `SparklesCore`, and `framer-motion`.

