

## Root Cause Analysis — GEO Rating Blank Screen

### A. Root cause

`top_errors` in the database contains **objects** `{severity, title}` — not strings — for 78 out of 80 domains. When the expanded detail panel renders:

```tsx
{(entry.topErrors ?? []).slice(0, 3).map((e: string, i: number) => (
  <li key={i}>…{e}</li>
))}
```

React throws **"Objects are not valid as a React child"** because `e` is `{severity: "critical", title: "..."}`, not a string. Since `GeoRating` is NOT wrapped in `ErrorBoundary` (line 68 of App.tsx), the entire React tree unmounts → blank screen.

### B. Where it crashes

`src/pages/GeoRating.tsx`, line 271: `{e}` where `e` is an object from `entry.topErrors`.

### C. Why it worked with 2 domains

The original 2 domains (e.g. habr.com) were seeded manually with plain string arrays: `["Неполный llms.txt", "Нет HowTo", ...]`. The 78 new domains were auto-upserted by `SiteCheckWorker`, which stores `top_errors` as `JSON.stringify(topErrors)` where `topErrors` is mapped from `i.title` — but the worker version that ran apparently stored full issue objects `{severity, title}` instead of just title strings.

### D. Three fixes needed

**FIX 1** — `src/data/geo-rating-types.ts`: Normalize `topErrors` in `mapDbRowToEntry` to always produce `string[]`:
```typescript
topErrors: (() => {
  try {
    let arr: any = row.top_errors;
    if (typeof arr === "string") arr = JSON.parse(arr);
    if (!Array.isArray(arr)) return [];
    return arr.map((e: any) =>
      typeof e === 'string' ? e : (e?.title ?? String(e))
    );
  } catch { return []; }
})(),
```

**FIX 2** — `src/pages/GeoRating.tsx`: Same normalization in the `useMemo` preprocessing (lines 64-71), and a defensive render in the JSX (line 271):
```tsx
{typeof e === 'string' ? e : (e as any)?.title ?? String(e)}
```

**FIX 3** — `src/App.tsx`: Wrap GeoRating route in `ErrorBoundary` so future crashes don't blank the entire app:
```tsx
<Route path="/geo-rating" element={<ErrorBoundary><GeoRating /></ErrorBoundary>} />
```

### E. Files changed

1. `src/data/geo-rating-types.ts` — normalize objects to strings in mapper
2. `src/pages/GeoRating.tsx` — normalize in useMemo + defensive render
3. `src/App.tsx` — add ErrorBoundary wrapper

### F. Regression checklist

1. Open /geo-rating — table loads with 80 domains
2. Click any domain row — expanded details show scores + top errors as text
3. Click habr.com (string format) — same behavior
4. Click tinkoff.ru (object format) — same behavior, no crash
5. Filter by category, score range — verify filtering still works
6. Click "Алфавит" sort — verify sorting works
7. Verify no console errors

