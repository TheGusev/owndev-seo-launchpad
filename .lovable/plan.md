

## Plan: Global Cleanup, ROI Calculator Rebuild, and Tool UX Unification

### Current State Summary

Previous phases already completed:
- 11 orphan components deleted (confirmed: none remain in `src/components/`)
- Footer links fixed (`#web-studio`, `#cases`)
- Telegram token moved to edge function
- ScrollStacksSection refactored (~300 lines, data extracted)
- SEO Auditor: fully functional with edge function backend
- Schema Generator: fully functional (7 types, copy, validation)
- Sitemap Generator: fully functional (normalize, copy, download)
- pSEO Generator: fully functional (transliteration, CSV export)

### What Still Needs Doing

#### 1. Clean Up Unused Imports and Dead Code

Scan all tool components for unused imports (e.g., icons imported but never used). Quick pass across all files.

#### 2. Rebuild ROI Calculator

Current `ROICalculatorTool.tsx` is a simplistic slider (cities x pages) that doesn't match the user's spec. Replace with a proper business ROI calculator:

**Fields:** Average check, Margin %, Traffic/visits, Conversion to lead %, Lead-to-sale %, Monthly project cost.

**Outputs:** Leads count, Sales count, Revenue, Profit, Payback period (months), ROI %.

**Logic:** All frontend, no external deps. Validation for numeric fields, division-by-zero protection. Results shown in a table + summary text.

#### 3. Mark Mockup Tools as "In Development"

10 tools are still UI-only mockups with no logic:
- CompetitorAnalysis
- IndexationChecker
- SemanticCoreGenerator
- AITextGenerator
- AntiDuplicateChecker
- PositionMonitor
- ChangeAlerts
- InternalLinksChecker
- CSVExport
- TelegramBotSetup

For each: disable the main action button and add a "Скоро" badge. This prevents users from clicking buttons that do nothing.

#### 4. Unify Tool Page UX

Update `ToolPage.tsx` to add a disclaimer footer below each tool: "Быстрый чек — не заменяет полноценный аудит".

Update `tools-registry.ts` descriptions to be consistent 1-2 line format.

#### 5. Clean Up GEOCoverageMap and AICitationChecker

These two are semi-functional (have interactive UI with checkboxes/lists) but their buttons do nothing. Add disabled state with "Скоро" label.

### Files Summary

| Action | File | Change |
|--------|------|--------|
| REWRITE | `src/components/tools/ROICalculatorTool.tsx` | Full business ROI calculator |
| MODIFY | `src/components/tools/CompetitorAnalysis.tsx` | Disable button + "Скоро" badge |
| MODIFY | `src/components/tools/IndexationChecker.tsx` | Disable button + "Скоро" badge |
| MODIFY | `src/components/tools/SemanticCoreGenerator.tsx` | Disable button + "Скоро" badge |
| MODIFY | `src/components/tools/AITextGenerator.tsx` | Disable button + "Скоро" badge |
| MODIFY | `src/components/tools/AntiDuplicateChecker.tsx` | Disable button + "Скоро" badge |
| MODIFY | `src/components/tools/PositionMonitor.tsx` | Disable button + "Скоро" badge |
| MODIFY | `src/components/tools/ChangeAlerts.tsx` | Disable button + "Скоро" badge |
| MODIFY | `src/components/tools/InternalLinksChecker.tsx` | Disable button + "Скоро" badge |
| MODIFY | `src/components/tools/CSVExport.tsx` | Disable button + "Скоро" badge |
| MODIFY | `src/components/tools/TelegramBotSetup.tsx` | Disable button + "Скоро" badge |
| MODIFY | `src/components/tools/AICitationChecker.tsx` | Disable button + "Скоро" badge |
| MODIFY | `src/components/tools/GEOCoverageMap.tsx` | Minor — it's semi-interactive already, keep as-is |
| MODIFY | `src/pages/ToolPage.tsx` | Add disclaimer text below tool widget |
| MODIFY | `src/data/tools-registry.ts` | Tighten descriptions, add `status: 'active' | 'coming_soon'` field |

### Fully Functional Tools (after this plan)

1. SEO Auditor (backend)
2. Schema Generator (frontend)
3. Sitemap Generator (frontend)
4. pSEO Generator (frontend)
5. ROI Calculator (frontend, rebuilt)
6. Robots.txt Generator (frontend, already semi-functional)
7. GEO Coverage Map (frontend, interactive checklist)

### "Coming Soon" Tools

8-18: CompetitorAnalysis, IndexationChecker, SemanticCoreGenerator, AITextGenerator, AntiDuplicateChecker, PositionMonitor, ChangeAlerts, InternalLinksChecker, AICitationChecker, CSVExport, TelegramBotSetup

