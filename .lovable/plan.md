

## Plan: Mobile Optimization for ScrollStacksSection

### Current State
The component already has:
- Mobile layout with sequential stacks (line 477, `md:hidden`)
- IntersectionObserver for reveal (line 198)
- CSS for `.stack-card` reveal animation (line 691 in index.css)

### Issues Found
1. `stickyTopMobile` is 100px -- too high, cards may overlap header area inconsistently
2. `revealThreshold` is 0.25 -- user wants 0.35
3. Section has `overflow-hidden` (line 403) which **breaks sticky positioning** on mobile -- this is the main bug
4. The reveal animation in CSS uses `translateY(30px)` -- user wants `translateY(24px)`
5. Mobile stack offset could be tighter for better visual stacking

### Changes

**File 1: `src/components/ScrollStacksSection.tsx`**

| Line | Change |
|------|--------|
| 27 | `stickyTopMobile: 100` -> `stickyTopMobile: 88` |
| 30 | `revealThreshold: 0.25` -> `revealThreshold: 0.35` |
| 403 | Remove `overflow-hidden` from section className (breaks sticky on mobile) |

**File 2: `src/index.css`**

| Line | Change |
|------|--------|
| 693 | `translateY(30px)` -> `translateY(24px)` |

### Technical Details

- `overflow-hidden` on the parent section prevents `position: sticky` from working in some mobile browsers. Removing it fixes the stacking effect on mobile.
- `stickyTopMobile: 88` gives proper clearance below the header without excessive gaps.
- `revealThreshold: 0.35` means cards appear when 35% visible, matching the spec.
- `translateY(24px)` gives a subtler, snappier reveal animation.
- No new scroll listeners or heavy libraries added -- only config tweaks and a CSS fix.

