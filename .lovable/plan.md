

## Plan: Mobile-only fixes for ScrollStacksSection

### Problem
On mobile, new cards slide UNDER previous ones (z-index is inverted) and the semi-transparent `glass` background lets text bleed through. Desktop/tablet must remain unchanged.

### Changes

**File: `src/components/ScrollStacksSection.tsx`**

The `StackCard` component currently uses the same z-index logic for both desktop and mobile. We need to split behavior:

1. **Add `isMobile` prop to `StackCard`** (passed from the parent which already has `useIsMobile()`).

2. **z-index fix (mobile only)**: Change from `zIndex = totalCards - index` to `zIndex = 10 + index` so later cards stack ON TOP. Desktop keeps the current `totalCards - index` logic.

3. **scale fix (mobile only)**: Remove the shrinking scale on mobile (set `scale = 1`) so cards stay full-size. Desktop keeps `1 - index * stackScaleStep`.

4. **The desktop section (line 420, `hidden md:grid`)** stays completely untouched -- no props change, no logic change.

5. **The mobile section (line 477, `md:hidden`)** passes `isMobile={true}` to StackCard.

**File: `src/index.css`**

6. **Opaque card background on mobile**: Add a media query that overrides the `glass` background to be fully opaque on small screens, so stacked cards don't show text from underneath:

```css
@media (max-width: 767px) {
  .stack-card .glass {
    background: hsl(222 47% 8% / 1);
    backdrop-filter: none;
  }
}
```

### Summary of changes

| File | What changes | Desktop affected? |
|------|-------------|-------------------|
| `ScrollStacksSection.tsx` | StackCard gets `isMobile` prop; mobile z-index = `10 + index`, scale = 1 | No -- desktop block unchanged |
| `index.css` | Add mobile media query for opaque card background | No -- media query scoped to max-width 767px |

### Technical details

- `z-index: 10 + index` means card 0 = z-10, card 1 = z-11, card 2 = z-12, card 3 = z-13 -- each new card overlays the previous
- `position: sticky` is already set, so z-index will work
- Opaque background (`/ 1` instead of `/ 0.6`) prevents text bleed-through on stacked cards
- No new libraries, no scroll listeners, no performance impact
