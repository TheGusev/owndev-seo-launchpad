

## Center Tool Cards on Incomplete Rows

The problem: the `/tools` page uses `grid grid-cols-3` but categories have uneven counts (analysis=4, generation=3, content=3, webmaster=2). Orphan cards on the last row sit left-aligned, looking unbalanced on desktop and tablet.

### Fix

Change the tool cards layout from CSS Grid to Flexbox with `justify-center` and fixed card widths matching the current grid proportions. This centers incomplete rows naturally.

| File | Change |
|------|--------|
| `src/pages/Tools.tsx` | Replace `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4` with `flex flex-wrap justify-center gap-4` and add width classes to each card wrapper: `w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]` |

This ensures full rows fill the space evenly, while incomplete rows center their cards.

