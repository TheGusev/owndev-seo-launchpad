

## Plan: Project Cleanup and Tool Activation (7 phases)

This is a large plan covering all 7 prompts you listed. I recommend executing them in order across multiple messages.

---

### Phase 1: Delete 11 Orphan Components

Delete these files (confirmed zero imports):
- `src/components/Capabilities.tsx`
- `src/components/Portfolio.tsx`
- `src/components/Pricing.tsx`
- `src/components/Process.tsx`
- `src/components/Results.tsx`
- `src/components/ProblemsAndSolutions.tsx`
- `src/components/ROICalculator.tsx`
- `src/components/WhatIsPSEO.tsx`
- `src/components/ToolNavigation.tsx`
- `src/components/NavLink.tsx`
- `src/components/ToolScreen.tsx`

### Phase 2: Fix Footer Broken Links

In `Footer.tsx`, the "company" array has:
- `"О нас" -> #process` -- section doesn't exist
- `"Результаты" -> #results` -- section doesn't exist

Replace with:
- `"О нас" -> #web-studio`
- `"Результаты" -> #cases`

### Phase 3: Secure Telegram Bot Token

The bot token `8065981666:AAG_...` and chat ID are hardcoded in `ContactForm.tsx` (line 69-70). This is a critical security issue.

**Fix:**
1. Create edge function `supabase/functions/send-telegram/index.ts` that receives form data, constructs the message, and sends to Telegram API
2. Store `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` as secrets
3. Update `ContactForm.tsx` to call the edge function instead of the Telegram API directly

### Phase 4: Refactor ScrollStacksSection (587 lines → ~200)

1. Extract data arrays into `src/data/scrollStacksData.ts` (~150 lines of problems/solutions/services data)
2. Create `src/components/ScrollStacks/ProblemCard.tsx`
3. Create `src/components/ScrollStacks/SolutionCard.tsx`
4. Create `src/components/ScrollStacks/ServiceCard.tsx`
5. Create `src/components/ScrollStacks/ColumnStack.tsx` (shared sticky+animation logic)
6. Slim down `ScrollStacksSection.tsx` to orchestration only (~200 lines)

Preserve: sticky behavior, RAF progress tracker, `--p` CSS variable animations, `cubic-bezier` transitions, `.is-stacked` state.

### Phase 5: Activate SEO Auditor (real backend)

1. Create edge function `supabase/functions/seo-audit/index.ts`:
   - Accepts `{ url: string }`
   - Fetches the HTML via `fetch()`
   - Parses: title (exists/length), meta description (exists/length), h1 (exists), images without alt, HTML size
   - Calculates score 0-100
   - Returns `{ score, issues[], summary }`
2. Update `src/components/tools/SEOAuditor.tsx`:
   - Add loading/success/error states
   - Show score as progress bar
   - Render issues with severity color coding
   - Show summary text

### Phase 6: Activate Schema Generator (frontend-only)

Update `src/components/tools/SchemaGenerator.tsx`:
1. Add type-dependent form fields (Organization, LocalBusiness, Article, Product)
2. Generate valid JSON-LD on button click
3. Working "Copy" button with `navigator.clipboard.writeText`
4. Add brief instruction text on how to embed JSON-LD
5. Form validation for required fields

### Phase 7: Activate Sitemap Generator + pSEO Generator (frontend-only)

**SitemapGenerator.tsx:**
- Normalize URLs (trim, dedup, remove blanks)
- Generate valid XML
- Working "Copy" and "Download sitemap.xml" (Blob + download link) buttons

**PSEOGenerator.tsx:**
- Add transliteration/slugify function for Russian text
- Generate table data: slug, title, h1, metaDescription, templateText
- Display in a table
- "Download CSV" button

---

### Execution Order

| Step | Phase | Complexity | Backend needed |
|------|-------|-----------|----------------|
| 1 | Delete orphans | Trivial | No |
| 2 | Fix footer links | Trivial | No |
| 3 | Secure Telegram token | Medium | Yes (edge function + secrets) |
| 4 | Refactor ScrollStacks | Medium | No |
| 5 | SEO Auditor | Medium | Yes (edge function) |
| 6 | Schema Generator | Low | No |
| 7 | Sitemap + pSEO Generator | Low | No |

### Files Created/Modified Summary

| Action | File |
|--------|------|
| DELETE | 11 orphan component files |
| MODIFY | `src/components/Footer.tsx` |
| CREATE | `supabase/functions/send-telegram/index.ts` |
| MODIFY | `src/components/ContactForm.tsx` |
| CREATE | `src/data/scrollStacksData.ts` |
| CREATE | `src/components/ScrollStacks/ProblemCard.tsx` |
| CREATE | `src/components/ScrollStacks/SolutionCard.tsx` |
| CREATE | `src/components/ScrollStacks/ServiceCard.tsx` |
| CREATE | `src/components/ScrollStacks/ColumnStack.tsx` |
| MODIFY | `src/components/ScrollStacksSection.tsx` |
| CREATE | `supabase/functions/seo-audit/index.ts` |
| MODIFY | `src/components/tools/SEOAuditor.tsx` |
| MODIFY | `src/components/tools/SchemaGenerator.tsx` |
| MODIFY | `src/components/tools/SitemapGenerator.tsx` |
| MODIFY | `src/components/tools/PSEOGenerator.tsx` |

