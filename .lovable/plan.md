

## Plan: Mobile-First Design Polish Across All Pages

This is a large but systematic task. The codebase is already well-structured -- the main issue is inconsistent spacing, some mobile-unfriendly layouts, and a few pages missing the shared Header/glass-card visual language.

### Phase 1: Tools Catalog (`Tools.tsx`) and Tool Pages (`ToolPage.tsx`)

**Tools.tsx:**
- Reduce `mb-16` between sections to `mb-10` for tighter mobile feel
- Make heading responsive: `text-3xl md:text-4xl lg:text-5xl` (currently jumps too large)
- Tool cards: ensure `p-5` on mobile (not `p-6`), add `min-h-[44px]` touch target for the card link
- Category heading: `text-xl md:text-2xl` instead of always `text-2xl`

**ToolPage.tsx:**
- Reduce `mb-10` → `mb-8` on tool header, `mb-12` → `mb-10` on widget area
- Use cases chips: add `gap-2` on mobile, ensure no horizontal scroll
- Add `px-4` safe area padding consistently

### Phase 2: All 12 Tool Components -- Unified Pattern

Apply a consistent internal layout to all tool components. Currently they're close but vary in spacing and button placement. Changes per tool:

**Common pattern to enforce across all tools:**
- Container: `glass rounded-2xl p-5 md:p-8` (currently some use `p-6 md:p-8`, standardize to `p-5 md:p-8` for tighter mobile)
- Input rows: `flex flex-col sm:flex-row gap-3` for URL+button combos (some already do this, ensure consistency)
- Action buttons (GradientButton): always centered on mobile with `text-center` wrapper, `size="lg"` for primary actions
- Result sections: consistent `space-y-4` spacing
- Copy/download buttons: unified pattern -- `text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5` with `min-h-[36px]` touch target
- Filter pills (tab buttons): `min-h-[36px] px-3 py-2` for finger-friendly tapping
- Grid stats: `grid grid-cols-2 gap-3` on mobile, `sm:grid-cols-4` on desktop

**Specific fixes:**
- `PositionMonitor.tsx`: Input grid `sm:grid-cols-4` breaks on mobile -- change to stack vertically: `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3`
- `CompetitorAnalysis.tsx`: Table overflows on mobile -- wrap in proper `overflow-x-auto` with `min-w-[600px]` on table
- `SitemapGenerator.tsx`: Raw `<input>` elements in robots tab -- replace with `<Input>` component for consistency
- `AntiDuplicateChecker.tsx`: Progress bar in header -- make icon + bar stack better on narrow screens; use `flex-wrap` on the header row

### Phase 3: Blog Pages

**Blog.tsx:**
- Tag filter pills: ensure `min-h-[36px]` touch targets
- Search input: already good
- Cards: add `p-4 sm:p-6` for tighter mobile padding

**BlogPost.tsx:**
- Add Header component (currently missing -- no, it has Header)
- Article max-width: already `max-w-3xl`, good
- Back link: ensure touch-friendly size with `py-2`

### Phase 4: Legal Pages (`Privacy.tsx`, `Terms.tsx`)

Both pages are missing the `<Header />` component and use raw `prose prose-invert` which doesn't match the glass-card dark theme well.

- Add `<Header />` to both pages
- Add `<Footer />` to both pages
- Change top padding to `pt-24 pb-16` to account for fixed header
- Remove `prose prose-invert` class, keep existing manual styling (which already matches the design system)
- Wrap content in consistent `max-w-3xl` container

### Phase 5: 404 Page (`NotFound.tsx`)

- Add Russian text instead of English
- Match visual style: dark background, centered content, glass card
- Add Header/Footer for consistency
- Link back to home with proper button

### Phase 6: Header Mobile Menu

- Add `min-h-[44px]` to mobile nav links for touch targets
- Ensure menu items have proper padding

### Phase 7: Footer

- Fix "ROI Calculator" link that likely 404s (check if tool exists)
- Ensure grid doesn't break awkwardly on tablet -- `grid-cols-2 lg:grid-cols-4`

### Phase 8: Cookie Banner

- On very small screens, the inline layout can break -- add `flex-wrap` safety

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Tools.tsx` | Responsive heading sizes, tighter spacing |
| `src/pages/ToolPage.tsx` | Consistent spacing, mobile padding |
| `src/pages/Blog.tsx` | Touch-friendly filter pills |
| `src/pages/BlogPost.tsx` | Minor spacing tweaks |
| `src/pages/Privacy.tsx` | Add Header/Footer, fix top padding |
| `src/pages/Terms.tsx` | Add Header/Footer, fix top padding |
| `src/pages/NotFound.tsx` | Russian text, add Header, match style |
| `src/components/Header.tsx` | Mobile touch targets |
| `src/components/Footer.tsx` | Fix dead link, tablet grid |
| `src/components/tools/PositionMonitor.tsx` | Fix mobile grid layout |
| `src/components/tools/CompetitorAnalysis.tsx` | Fix table mobile overflow |
| `src/components/tools/SitemapGenerator.tsx` | Replace raw inputs with Input component |
| `src/components/tools/AntiDuplicateChecker.tsx` | Fix header layout on narrow screens |
| `src/components/tools/SEOAuditor.tsx` | Score cards stack on mobile |
| `src/components/tools/IndexationChecker.tsx` | Minor spacing |
| `src/components/tools/InternalLinksChecker.tsx` | Minor spacing |
| `src/components/tools/SchemaGenerator.tsx` | Minor spacing |
| `src/components/tools/SemanticCoreGenerator.tsx` | Minor spacing |
| `src/components/tools/PSEOGenerator.tsx` | Minor spacing |
| `src/components/tools/LLMPromptHelper.tsx` | Minor spacing |
| `src/components/tools/AITextGenerator.tsx` | Minor spacing |
| `src/components/CookieBanner.tsx` | flex-wrap for small screens |

No new files, no new libraries. All changes use existing shadcn/ui components and Tailwind classes.

