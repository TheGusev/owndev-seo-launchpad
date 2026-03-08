

## Plan: Transform OWNDEV into a Free LLM+SEO Toolkit

### My Take

The vision is solid. Right now the site tries to be three things at once (web studio, AI shop, SEO toolkit) and ends up being none of them convincingly. Stripping it down to "free, honest LLM+SEO tools + light services mention" is the right call. The tools you already have working (SEO Auditor, Schema, Sitemap, PSEO, Semantic Core, AI Text Generator) are genuinely useful -- the packaging around them just needs to match.

One suggestion: keep the ROI Calculator. It's lightweight, works, and is a natural lead-gen bridge between "free tools" and "hire us." I'd also keep the Anti-Duplicate Checker -- it's fully client-side and useful for pSEO users.

### What Changes

#### 1. Landing Page Restructure

**Remove entirely:**
- `TechShopSection` -- delete from Index.tsx, remove component file
- `WebStudioSection` portfolio grid (6 fake projects) -- replace entire section with a compact "We build sites & pSEO" block (3-4 bullet points, one CTA)
- `ScrollStacksSection` services column (pricing cards) -- keep only problems + solutions (4+4), drop the "Что мы можем разработать" column
- `CasesResults` -- remove as standalone section (stats are unverifiable)

**Rewrite:**
- `Hero.tsx`: Change messaging to "Бесплатные LLM + SEO инструменты". Remove "Магазин технологий" CTA button. Two CTAs: "Инструменты" + "О нас"
- `ToolsShowcase.tsx`: Update to show the 6-7 core tools, fix "Все 20 инструментов" link text
- `ScrollStacksSection`: 2-column layout (problems + solutions only), remove services data
- New mini-section replacing WebStudioSection: "Нужен не инструмент, а команда?" -- 3-4 terse points + Telegram CTA

**New page flow:**
```
Hero → ToolsShowcase (core tools) → "Нужна команда?" (1 section) → FAQ (trimmed) → Contact
```

#### 2. Header & Footer Cleanup

**Header nav:** Главная, Инструменты (/tools), О нас (#about), Контакты (#contact)  
**Footer:** Remove "Технологии" link, update description, update tool links to match core set

#### 3. Tool Catalog Trim

Keep as **core active** (7 tools):
1. SEO Auditor (will be enhanced with LLM score)
2. Schema Generator
3. Sitemap Generator
4. pSEO Generator
5. LLM Prompt Helper (NEW)
6. ROI Calculator
7. Anti-Duplicate Checker

**Remove from catalog** (not hide, remove): CompetitorAnalysis, IndexationChecker, SemanticCoreGenerator, AITextGenerator, PositionMonitor, ChangeAlerts, InternalLinksChecker, AICitationChecker, CSVExport, TelegramBotSetup, GEOCoverageMap, RobotsTxtGenerator

That's 11 tools removed, 7 remain. Clean and focused.

#### 4. Enhance SEO Auditor with LLM Score

Update `seo-audit` edge function to also check:
- Presence of JSON-LD structured data
- FAQ blocks / lists (useful for LLM citation)
- Content readability (subheadings, text length)
- Compute separate `llmScore` (0-100) alongside existing `seoScore`

Update frontend to show two scores side by side.

#### 5. New Tool: LLM Prompt Helper

Create `LLMPromptHelper.tsx` -- fully frontend, no API:
- Inputs: language (ru/en), goal (write text / improve page / AI overview tips), keyword, niche description, URL (optional)
- Output: 2-3 ready-to-copy prompts in code blocks
- Template-based generation with smart placeholders

#### 6. FAQ Trim

Remove web-studio-specific questions (pricing, hosting, timelines). Replace with tool-focused FAQs:
- "Что такое LLM-оптимизация?"
- "Как попасть в AI Overviews?"
- "Инструменты бесплатные?"
- "Можно ли заказать SEO/разработку?"

### Files Summary

| Action | File | Change |
|--------|------|--------|
| REWRITE | `src/pages/Index.tsx` | New section order, remove TechShop/Cases |
| REWRITE | `src/components/Hero.tsx` | LLM+SEO messaging, 2 CTAs |
| REWRITE | `src/components/ToolsShowcase.tsx` | 7 core tools |
| DELETE | `src/components/TechShopSection.tsx` | Remove entirely |
| REWRITE | `src/components/WebStudioSection.tsx` → rename to `AboutSection.tsx` | Compact "we do sites" block |
| MODIFY | `src/components/ScrollStacksSection.tsx` | Remove services column, 2-col only |
| DELETE | `src/components/CasesResults.tsx` | Remove entirely |
| MODIFY | `src/components/Header.tsx` | Simplified nav |
| MODIFY | `src/components/Footer.tsx` | Updated links and description |
| MODIFY | `src/components/FAQ.tsx` | New tool-focused questions |
| REWRITE | `src/data/tools-registry.ts` | 7 tools only |
| MODIFY | `src/data/scrollStacksData.ts` | Remove servicesData |
| CREATE | `src/components/tools/LLMPromptHelper.tsx` | New tool |
| MODIFY | `supabase/functions/seo-audit/index.ts` | Add LLM score checks |
| MODIFY | `src/components/tools/SEOAuditor.tsx` | Show dual scores |
| MODIFY | `src/pages/Tools.tsx` | Updated header text |
| MODIFY | `src/pages/ToolPage.tsx` | Keep disclaimer |
| DELETE | 11 tool component files | Removed from catalog |

### Implementation Order

1. Landing page restructure (Hero, Index, sections)
2. Tool catalog trim (registry, delete unused tools)
3. LLM Prompt Helper (new tool)
4. SEO Auditor LLM enhancement (edge function + frontend)
5. Header/Footer/FAQ cleanup

