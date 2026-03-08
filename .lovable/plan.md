

## Plan: Fix Mobile Spacing & Blog Preview Layout

### Problems (from screenshots)
1. **Blog section header** — "Блог" title and "Все статьи" button overlap on mobile, button is too large relative to the header
2. **Huge vertical gaps** between sections on mobile — sections use desktop-scale padding (`py-24`, `py-24`, `py-16`) that creates excessive whitespace on small screens
3. **Blog cards take too much vertical space** on mobile with large padding

### Changes

**1. `src/components/BlogPreview.tsx`** — Fix mobile layout:
- Change header from `flex items-center justify-between` to stack vertically on mobile: `flex flex-col items-start gap-4 md:flex-row md:items-center md:justify-between`
- Reduce `mb-10` to `mb-6 md:mb-10`
- Reduce section padding: `py-10 md:py-24` (was `py-16 md:py-24`)
- Reduce card gap on mobile: `gap-4 md:gap-6`

**2. `src/components/ToolsShowcase.tsx`** — Reduce mobile padding:
- `py-16 md:py-32` (was `py-24 md:py-32`)
- Remove `min-h-screen` on mobile or make it `min-h-0 md:min-h-screen`
- Reduce `mb-16` heading margin to `mb-8 md:mb-16`

**3. `src/components/FAQ.tsx`** — Reduce mobile padding:
- `py-12 md:py-24` (was `py-24`)

**4. `src/components/ContactForm.tsx`** — Reduce mobile padding:
- `py-12 md:py-24` (was `py-24`)
- Reduce `mb-16` heading margin to `mb-8 md:mb-16`

**5. `src/components/ServicesTeaser.tsx`** — Reduce mobile padding:
- `py-8 md:py-16` (was `py-12 md:py-16`)

**6. `src/pages/Blog.tsx`** — Reduce top padding on mobile:
- `pt-20 pb-12 md:pt-24 md:pb-16` (was `pt-24 pb-16`)

### Files to modify (6 files)

| File | Change |
|------|--------|
| `BlogPreview.tsx` | Stack header on mobile, reduce padding/gaps |
| `ToolsShowcase.tsx` | Reduce mobile padding, remove min-h-screen on mobile |
| `FAQ.tsx` | Reduce mobile padding |
| `ContactForm.tsx` | Reduce mobile padding + heading margin |
| `ServicesTeaser.tsx` | Reduce mobile padding |
| `Blog.tsx` | Reduce mobile top padding |

