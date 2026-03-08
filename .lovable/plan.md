

## Plan: Add Subtle OWNDEV Services Promotion

### 1. Create reusable `ToolCTA` component

**NEW** `src/components/tools/ToolCTA.tsx` — small banner shown at the bottom of tool results. Compact glass card with one line of text + a text-link to `#contact`. Reused across 3 tools.

### 2. Create `ServicesTeaser` section

**NEW** `src/components/ServicesTeaser.tsx` — compact section placed between Hero and ToolsShowcase in Index.tsx. Contains:
- Heading: "Когда бесплатных инструментов мало"
- One paragraph explaining turnkey services
- 3 short bullet points (sites, pSEO, LLM optimization) — reuse icons from AboutSection
- One `GradientButton variant="variant"` (secondary style) "Обсудить проект" scrolling to `#contact`

### 3. Integrate `ToolCTA` into 3 tools

**MODIFY** `SEOAuditor.tsx` — add `<ToolCTA />` after the results block (after issues list, before the closing `</div>`)

**MODIFY** `PSEOGenerator.tsx` — add `<ToolCTA />` after the generated table

**MODIFY** `LLMPromptHelper.tsx` — add `<ToolCTA />` after the prompts list

The CTA only renders when results are present (conditionally shown alongside results).

### 4. Update Index.tsx

**MODIFY** `src/pages/Index.tsx` — import and place `<ServicesTeaser />` between `<Hero />` and `<ToolsShowcase />`.

### Files Summary

| Action | File |
|--------|------|
| CREATE | `src/components/tools/ToolCTA.tsx` |
| CREATE | `src/components/ServicesTeaser.tsx` |
| MODIFY | `src/components/tools/SEOAuditor.tsx` |
| MODIFY | `src/components/tools/PSEOGenerator.tsx` |
| MODIFY | `src/components/tools/LLMPromptHelper.tsx` |
| MODIFY | `src/pages/Index.tsx` |

