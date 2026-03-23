

## Fix: Stale Data on Re-visit + Detailed Error Reporting

### Problem 1: Old Results Persist

When user navigates back to a tool, previous results remain visible. Root cause: React state isn't cleared on re-entry because the same component instance stays mounted (same route pattern `/tools/:toolSlug`).

**Fix:**
- `ToolPage.tsx`: Add `key={toolSlug}` to `<ToolComponent />` — forces full remount on navigation
- All server-side tools (SEO Auditor, Indexation Checker, Internal Links Checker, Competitor Analysis, Semantic Core): add timestamp display showing when results were generated
- Add "Проверить заново" button that clears old results and re-runs with same URL

### Problem 2: Reports Don't Show WHERE Errors Are

Current reports say "5 images without alt" but don't show WHICH images. User can't act on this.

**Changes to edge functions (backend):**

| Function | Enhancement |
|----------|-------------|
| `seo-audit` | Return specific elements: actual title text, img src without alt (up to 5), actual H1 text, canonical URL found, OG values found. Add `details` field to each issue with concrete examples |
| `check-indexation` | Already decent — minor: add the actual meta robots content and header values to issue details |
| `check-internal-links` | Already shows URLs — add anchor text context and HTTP status explanation |

**Changes to frontend components:**

| Component | Enhancement |
|-----------|-------------|
| `SEOAuditor.tsx` | Show analyzed URL prominently, add timestamp, show code snippets in issues (e.g. actual `<img>` tag), add "Проверить заново" button, expand recommendation with "Почему это важно" |
| `IndexationChecker.tsx` | Add timestamp, "Проверить заново" button, show the analyzed URL in header |
| `InternalLinksChecker.tsx` | Add timestamp, "Проверить заново" button, show source page URL, add context for broken links (HTTP status meaning) |
| `CompetitorAnalysis.tsx` | Add timestamp, "Сравнить заново" button |
| `SemanticCoreGenerator.tsx` | Add timestamp to results |

### Detailed Issue Format (SEO Auditor)

Current:
```
[Warning] 5 из 12 изображений без alt
→ Добавьте описательные alt-атрибуты
```

New:
```
[Warning] 5 из 12 изображений без alt
Страница: https://example.com/about
Примеры:
  • <img src="/hero.jpg"> — нет alt
  • <img src="/team.png"> — нет alt
  • ещё 3 изображения
→ Добавьте описательные alt-атрибуты к каждому изображению.
   Почему: alt помогает поисковикам и AI-системам понять содержимое изображений.
```

### Enhanced `seo-audit` Edge Function

Update `AuditIssue` interface to include:
```typescript
interface AuditIssue {
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  recommendation: string;
  category: "seo" | "llm";
  details?: string[];    // Concrete examples (img srcs, element texts)
  context?: string;      // Why this matters
}
```

Extract and return specific elements:
- Images without alt: return up to 5 `src` values
- Title issues: show actual title text
- H1 issues: show actual H1 text(s)
- JSON-LD: show types found
- Content length: show word count breakdown

### Files to Change

| File | Type |
|------|------|
| `src/pages/ToolPage.tsx` | Add `key={toolSlug}` to ToolComponent |
| `supabase/functions/seo-audit/index.ts` | Add `details` and `context` to issues, extract specific elements |
| `src/components/tools/SEOAuditor.tsx` | Show URL, timestamp, details, "Проверить заново", enhanced issue cards |
| `src/components/tools/IndexationChecker.tsx` | Add URL header, timestamp, "Проверить заново" |
| `src/components/tools/InternalLinksChecker.tsx` | Add URL header, timestamp, "Проверить заново", status explanations |
| `src/components/tools/CompetitorAnalysis.tsx` | Add timestamp, "Сравнить заново" |
| `src/components/tools/SemanticCoreGenerator.tsx` | Add timestamp |

