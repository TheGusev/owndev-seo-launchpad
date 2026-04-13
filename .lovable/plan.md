

# Frontend Runtime Audit — Post-Backend Fixes

## A. Bugs Found

### P0-1 — Checkbox double-toggle in FullReportView (issues never stay checked)

**File**: `src/components/site-check/FullReportView.tsx`, lines 70–74

The `<Checkbox>` has both `onClick` (calls `onToggle()`) and `onCheckedChange` (calls `onToggle()` when truthy). When user clicks to **check** a resolved issue:
1. `onClick` fires → `onToggle()` → adds ID to set
2. `onCheckedChange(true)` fires → `true && onToggle()` → removes ID from set

Net effect: nothing happens. The checkbox appears broken — user can never mark issues as resolved. Unchecking works by accident because `onCheckedChange(false)` skips the second toggle.

**Fix**: Separate concerns — `onClick` only stops propagation, `onCheckedChange` does the toggle:
```tsx
<Checkbox
  checked={resolved}
  onCheckedChange={() => onToggle()}
  onClick={(e) => e.stopPropagation()}
  className="shrink-0"
/>
```

---

### P1-1 — GeoRatingNomination never hides after submit

**File**: `src/components/site-check/GeoRatingNomination.tsx`, line 67

After successful nomination, `setOpen(false)` closes the dialog but `setSent(true)` is never called. The guard on line 41 (`if (totalScore < 70 || sent) return null`) never triggers, so the banner keeps showing and the user can submit duplicate nominations.

**Fix**: Add `setSent(true)` before `setOpen(false)`:
```typescript
setSent(true);
setOpen(false);
```

---

## B. Priority Summary

| ID | Severity | Description | Status |
|---|---|---|---|
| P0-1 | **DEFINITELY BROKEN** | Checkbox can't be checked (double-toggle) | Fix: 1 line |
| P1-1 | **DEFINITELY BROKEN** | Nomination banner never hides after submit | Fix: 1 line |

## C. No issues found in

- ScoreCards — renders correctly with fallbacks
- KeywordsSection — proper guards, filters work
- CompetitorsTable — proper `_type` filtering, null-safe
- MinusWordsSection — proper string/object normalization
- LlmJudgeSection — all fields accessed safely, loading state exists
- TechPassport — null guards, array checks present
- GeoRating page — `mapDbRowToEntry` matches snake_case DB columns, `top_errors` JSON parsing is guarded
- ResultAccordion — animation logic correct
- ScoreDetailsModal — escape handler, breakdown fallback text
- DirectAdPreview — edit/copy/export all wired correctly
- API layer (`scan.ts`, `tools.ts`, `config.ts`) — all clean, no legacy refs

## D. Patch List

1. `src/components/site-check/FullReportView.tsx` — fix Checkbox handlers (lines 70–74)
2. `src/components/site-check/GeoRatingNomination.tsx` — add `setSent(true)` (line 67)

## E. Code Diffs

### Diff 1: FullReportView.tsx
```typescript
// Lines 70-74 — BEFORE:
<Checkbox
  checked={resolved}
  onCheckedChange={(e) => { e && onToggle(); }}
  onClick={(e) => { e.stopPropagation(); onToggle(); }}
  className="shrink-0"
/>

// AFTER:
<Checkbox
  checked={resolved}
  onCheckedChange={() => onToggle()}
  onClick={(e) => e.stopPropagation()}
  className="shrink-0"
/>
```

### Diff 2: GeoRatingNomination.tsx
```typescript
// Line 67 — BEFORE:
      setOpen(false);

// AFTER:
      setSent(true);
      setOpen(false);
```

## F. Regression Checklist

1. Open any scan result → expand "План исправления" → click checkbox on an issue → verify it stays checked (green checkmark, opacity change, strikethrough text)
2. Click same checkbox again → verify it unchecks
3. Refresh page → verify checked state persists from localStorage
4. On result with score ≥ 70, click "Добавить в рейтинг" → submit → verify banner disappears
5. Verify all other sections (keywords, competitors, scores, LLM judge, tech passport) render unchanged

