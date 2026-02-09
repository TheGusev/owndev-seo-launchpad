

## Plan: Fix Card Stacking Order + Add Scroll-Driven Animation

### Root Cause
Line 213: `zIndex = totalCards - index` gives card #0 the highest z-index. Card #1 slides under card #0 instead of on top. This is backwards.

### Changes

**File: `src/components/ScrollStacksSection.tsx`**

1. **Fix z-index** (line 213): Change `zIndex = totalCards - index` to `zIndex = 10 + index` so each subsequent card layers ON TOP of the previous one.

2. **Fix scale direction** (line 212): Currently `scale = 1 - index * step` makes later (top) cards smaller. Flip: earlier cards should be slightly smaller since they go underneath. Remove per-card scale from inline styles -- all cards render at scale(1) initially; the "underneath" dimming effect handles visual depth.

3. **Add opaque background to cards**: The `glass` class likely uses transparent/translucent backgrounds. Add `relative isolate` and a solid `bg-background` or `bg-card` to ProblemCard, SolutionCard, and ServiceCard containers so text on lower cards doesn't bleed through.

4. **Add scroll-driven entrance animation**: Add a single passive scroll listener (with requestAnimationFrame) on the section that computes a `--p` CSS variable (0 to 1) per card based on how close it is to its sticky position. This drives:
   - `transform: translateY(calc((1 - var(--p)) * 24px)) scale(calc(0.985 + var(--p) * 0.015))`
   - `opacity: calc(0.15 + var(--p) * 0.85)`
   - `box-shadow` intensifying with `--p`
   
   The listener uses refs only (no setState per frame). Cleanup on unmount.

5. **Dim "underneath" cards**: When a new card arrives on top, previous cards get a subtle class `.is-under` (opacity 0.85, scale 0.985) computed by the same scroll handler.

**File: `src/index.css`**

6. Update `.stack-card` styles:
   - Add `position: relative; isolation: isolate;` (ensure stacking context)
   - Update transition to include the CSS variable-driven transforms
   - Add `.stack-card.is-under` rule: `opacity: 0.85; transform: scale(0.985);`
   - Keep `.is-visible` reveal and `prefers-reduced-motion` as-is

### Technical Details

- z-index fix: `10 + index` (card 0 = z:10, card 1 = z:11, card 2 = z:12...) -- later cards always on top
- One passive scroll listener per section, throttled via `requestAnimationFrame`, using refs to update CSS custom properties directly on DOM nodes (no React re-renders)
- Cards get `bg-background` (opaque) so stacked cards don't show through
- Sticky `top` offset logic stays the same: `stickyTop + index * stackOffsetY`
- No new dependencies added
