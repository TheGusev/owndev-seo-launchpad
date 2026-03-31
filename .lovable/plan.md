

## Mobile polish, Robot fix, Tool improvements

This is a large task spanning 3 directions. I'll focus on the highest-impact changes.

### Part 1: Mobile fixes (8 files)

#### `src/components/Hero.tsx`
- H1: `text-3xl md:text-5xl lg:text-6xl` (smaller on 375px)
- Trust bar: `grid grid-cols-2 sm:flex` instead of flex-wrap
- Input + button: already `flex-col sm:flex-row` -- verify input has `min-h-[48px]`, button `min-h-[44px]`

#### `src/components/Header.tsx`
- Already has mobile hamburger menu -- just ensure CTA button text shortens on mobile: "Проверить" instead of "Проверить сайт"
- Mobile menu items: add `min-h-[44px]` (already has it)

#### `src/components/landing/ComparisonSection.tsx`
- Add `min-w-[600px]` on the table for horizontal scroll
- Add hint text below on mobile: "← Прокрутите таблицу →"

#### `src/components/site-check/ScoreCards.tsx`
- Change grid to `grid-cols-5` with smaller sizing: `gap-2` on mobile, circle `w-12 h-12` on mobile vs `w-16 h-16` on md+

#### `src/components/site-check/IssueCard.tsx`
- Pre block: add `max-w-full` and ensure `overflow-x-auto` + `break-all` for long URLs
- Expand button: `min-h-[44px]` for touch
- Copy button: always visible (not just hover)

#### `src/components/site-check/CompetitorsTable.tsx`
- Already has overflow-x-auto -- verify `min-w-[700px]` on table
- Add mobile scroll hint

#### `src/components/site-check/DownloadButtons.tsx`
- Already `grid-cols-2 sm:grid-cols-4` -- add `min-h-[44px]` to buttons

#### `src/components/ServicesTeaser.tsx`
- Cards grid: ensure `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`
- CTA button: `min-h-[44px]`

### Part 2: Robot fix (1 file)

#### `src/components/mascot/BorderBot.tsx` -- rewrite visibility

**Root cause**: `initial={{ x: getPos("bottom", 0, false).x, y: getPos("bottom", 0, false).y }}` uses `false` for mobile even on mobile devices. Also `controls.set()` in useEffect may race with initial render.

**Fix**:
- Set `initial` to use actual screen position: `bottom: 20px, right: 16px` via CSS, not framer motion x/y initially
- Simplify: on mount, place bot at fixed bottom-right position, THEN start walking loop after delay
- Add speech bubble with periodic idle phrases (simple div, no drag complexity)
- Reduce SVG size on mobile: `w-[28px] h-[44px]` on mobile, `w-[36px] h-[56px]` on desktop
- Ensure `pointer-events-none` on wrapper, `pointer-events-auto` on robot itself
- Keep triple-click hide and localStorage logic

### Part 3: Tool polish (3 files)

#### `src/components/tools/SchemaGenerator.tsx`
- Form fields: `grid-cols-1 sm:grid-cols-2` layout
- Copy button: always visible, not hover-only
- Generated JSON pre block: `overflow-x-auto max-w-full`
- All buttons: `min-h-[44px]`

#### `src/components/tools/SemanticCoreGenerator.tsx`
- Results table: wrap in `overflow-x-auto` with `min-w-[500px]`
- Export button: `w-full sm:w-auto`

#### `src/components/tools/IndexationChecker.tsx`
- Status cards: `grid-cols-2` on mobile
- All interactive elements: `min-h-[44px]`

### Files summary

| File | Change |
|------|--------|
| `src/components/Hero.tsx` | Smaller H1 on mobile, trust bar grid, input sizing |
| `src/components/Header.tsx` | Shorter CTA text on mobile |
| `src/components/landing/ComparisonSection.tsx` | Table min-width + scroll hint |
| `src/components/site-check/ScoreCards.tsx` | 5-col grid with smaller circles on mobile |
| `src/components/site-check/IssueCard.tsx` | Code overflow fix, touch targets |
| `src/components/site-check/CompetitorsTable.tsx` | Scroll hint on mobile |
| `src/components/site-check/DownloadButtons.tsx` | Button min-height |
| `src/components/ServicesTeaser.tsx` | Touch targets |
| `src/components/mascot/BorderBot.tsx` | Fix initial position, add speech bubble, responsive size |
| `src/components/tools/SchemaGenerator.tsx` | Form layout, copy button visibility |
| `src/components/tools/SemanticCoreGenerator.tsx` | Table scroll wrapper |
| `src/components/tools/IndexationChecker.tsx` | Grid + touch targets |

