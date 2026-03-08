

## Plan: Add Desktop Scroll-Snap Effect

### Verification Results

All header navigation links work correctly:
- "Веб-студия" -> scrolls to #web-studio section (confirmed)
- "Технологии" -> scrolls to #tech-shop section (confirmed)
- "Кейсы" -> scrolls to #cases section (confirmed)
- "Контакты" -> scrolls to #contact section (confirmed)

No changes needed for navigation -- it all works as expected.

### Scroll-Snap Implementation

Add CSS scroll-snap for desktop so the main sections (Hero, WebStudio, ToolsShowcase, TechShop) snap into place when scrolling between them. Uses `proximity` mode so it assists scrolling without fighting it.

#### 1. Add scroll-snap CSS to `src/index.css`

Add desktop-only scroll-snap utilities:
```css
@media (min-width: 768px) {
  .snap-container {
    scroll-snap-type: y proximity;
    overflow-y: scroll;
    height: 100vh;
  }
  .snap-section {
    scroll-snap-align: start;
  }
}
```

#### 2. Update `src/pages/Index.tsx`

- Add `snap-container` class to the root `<div>`
- Add `snap-section` class to the 4 main sections: Hero, WebStudioSection, ToolsShowcase, TechShopSection
- Wrap each section in a div with the snap class (since section components own their own root elements)

#### 3. Update section components

Add `min-h-screen` to the 4 snap-target sections so they fill the viewport:
- `src/components/Hero.tsx` -- already has `min-h-screen`
- `src/components/WebStudioSection.tsx` -- add `min-h-screen`
- `src/components/ToolsShowcase.tsx` -- add `min-h-screen`
- `src/components/TechShopSection.tsx` -- add `min-h-screen`

### Files Summary

| Action | File | Change |
|--------|------|--------|
| Modify | `src/index.css` | Add snap-container and snap-section CSS utilities |
| Modify | `src/pages/Index.tsx` | Add snap-container class to root div |
| Modify | `src/components/WebStudioSection.tsx` | Add snap-section and min-h-screen classes |
| Modify | `src/components/ToolsShowcase.tsx` | Add snap-section and min-h-screen classes |
| Modify | `src/components/TechShopSection.tsx` | Add snap-section and min-h-screen classes |
| Modify | `src/components/Hero.tsx` | Add snap-section class |

### Technical Notes

- `proximity` mode means snap only triggers when the user stops scrolling near a section boundary -- it does not force-lock the scroll
- Only enabled on desktop (768px+) to avoid interfering with mobile scrolling
- Sections below TechShop (ScrollStacks, Cases, FAQ, Contact, Footer) do NOT get snap-section -- they scroll freely
- The snap container needs `overflow-y: scroll` and `height: 100vh` to work properly

