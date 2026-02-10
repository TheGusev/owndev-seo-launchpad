

## Plan: Scroll-driven card animation with progress tracking

### What exists now
- `StackCard` uses `IntersectionObserver` for a simple reveal (opacity 0->1, translateY 24->0)
- Mobile already has `isMobile` prop with z-index = `10 + index` and scale = 1
- Desktop has z-index = `totalCards - index` and scale shrink
- CSS has `.stack-card` / `.is-visible` classes and mobile opaque background override

### What needs to change

**File: `src/components/ScrollStacksSection.tsx`**

1. **Expand CONFIG** with animation parameters:
```typescript
const CONFIG = {
  stickyTopDesktop: 110,
  stickyTopMobile: 88,
  stackOffsetY: 28,
  stackScaleStep: 0.018,
  revealThreshold: 0.35,
  // New animation params
  revealDistance: 200,       // px below stickyTop where p=0
  scaleRange: [0.985, 1],   // min/max scale during animation
  stackedOpacity: 0.85,     // opacity for cards that are "under" the stack
  stackedScale: 0.985,      // scale for stacked cards
  stackTrigger: 0.8,        // progress threshold to mark previous card as stacked
};
```

2. **Replace IntersectionObserver + useState** in `StackCard` with a **scroll-driven RAF loop** that:
   - Computes `p` (0..1) per card via `getBoundingClientRect` relative to its sticky `top`
   - Sets `--p` CSS custom property via `style.setProperty` (no React state, no re-renders)
   - Sets `data-progress` attribute (rounded to 0.01)
   - Adds `.is-visible` class when p > 0 (replaces IntersectionObserver)
   - Adds `.is-stacked` class on previous card when current card reaches p > 0.8
   - Uses a single passive scroll listener per section (not per card) with RAF batching
   - Caches `stickyTop` value in a ref to avoid recalculation

3. **Move scroll listener to section level**: Add a `useEffect` in the main `ScrollStacksSection` component that:
   - Attaches ONE passive scroll listener
   - In RAF callback, queries all `.stack-card` elements within the section
   - For each card: compute progress, set `--p`, toggle classes
   - This replaces per-card IntersectionObservers

**File: `src/index.css`**

4. **Update `.stack-card` CSS** to use `--p` custom property for smooth scroll-driven animation:

```css
.stack-card {
  --p: 0;
  opacity: calc(0.3 + var(--p) * 0.7);
  transform: 
    translateY(calc((1 - var(--p)) * 24px)) 
    scale(calc(0.985 + var(--p) * 0.015)) 
    translateZ(0);
  box-shadow: 0 calc(2px + var(--p) * 18px) calc(4px + var(--p) * 36px) rgba(0,0,0,calc(0.1 + var(--p) * 0.15));
  transition: transform 0.18s cubic-bezier(0.34,1.56,0.64,1), 
              opacity 0.18s ease-out, 
              box-shadow 0.18s ease-out;
  will-change: transform, opacity;
  backface-visibility: hidden;
}

.stack-card.is-visible {
  /* No longer needed as override -- --p drives everything */
  /* Keep class for potential JS hooks */
}

.stack-card.is-stacked {
  transform: scale(0.985) translateZ(0);
  opacity: 0.85;
}
```

5. **Mobile box-shadow boost**: In the mobile media query, increase max blur:
```css
@media (max-width: 767px) {
  .stack-card {
    box-shadow: 0 calc(2px + var(--p) * 22px) calc(4px + var(--p) * 44px) rgba(0,0,0,calc(0.12 + var(--p) * 0.18));
  }
  .stack-card .glass {
    background: hsl(222 47% 8% / 1);
    backdrop-filter: none;
  }
}
```

### Summary of changes

| File | What changes |
|------|-------------|
| `ScrollStacksSection.tsx` | Replace per-card IntersectionObserver with single section-level passive scroll listener + RAF. Compute `--p` progress per card, set via `style.setProperty`. Add/remove `.is-visible` and `.is-stacked` classes. Expand CONFIG with animation params. |
| `index.css` | Rewrite `.stack-card` to use `--p` for opacity/transform/box-shadow. Add `.is-stacked` class. Use `cubic-bezier(0.34,1.56,0.64,1)` for springy feel. Boost mobile box-shadow. |

### Performance guarantees
- ONE passive scroll listener (not per card)
- RAF-batched -- no duplicate frames
- `style.setProperty('--p', ...)` -- zero React re-renders during scroll
- Cached stickyTop in ref
- Only `transform`, `opacity`, `box-shadow` animated (compositor-friendly)
- `prefers-reduced-motion` respected (existing rule kept)

