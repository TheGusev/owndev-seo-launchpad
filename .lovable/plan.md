

## Fix: Pages Not Starting at Top on Navigation

### Problem
React Router doesn't reset scroll position when navigating between pages. Users land at the middle or bottom of new pages because the browser preserves the previous scroll position.

### Solution
Create a `ScrollToTop` component that listens to route changes via `useLocation()` and calls `window.scrollTo(0, 0)` on every pathname change. Place it inside `<BrowserRouter>` in `App.tsx`.

### Files

**1. Create `src/components/ScrollToTop.tsx`** (new file)
- `useEffect` that runs `window.scrollTo(0, 0)` whenever `location.pathname` changes
- Returns `null` — no UI

**2. Edit `src/App.tsx`**
- Import and add `<ScrollToTop />` inside `<BrowserRouter>`, before `<Routes>`

Two files, minimal change, fixes all pages.

