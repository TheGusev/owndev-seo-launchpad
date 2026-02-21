

## Plan: Reposition OWNDEV from Web Studio to pSEO Platform

### Overview
Transform the landing page from a web development studio ("we build websites") into a programmatic SEO platform product page. Preserve the existing dark cosmic aesthetic, fonts, logo, and visual effects. Replace content and structure with full-screen tool sections using a card-stacking scroll effect.

---

### Scope of Changes

**Files to modify:**
1. `src/pages/Index.tsx` -- new page structure with all sections
2. `src/components/Header.tsx` -- new navigation links
3. `src/components/Hero.tsx` -- new text, buttons, stats
4. `src/components/ScrollStacksSection.tsx` -- **remove entirely** (replaced by new full-screen sections)
5. `src/components/Footer.tsx` -- update links and description
6. `src/components/ContactForm.tsx` -- minor text updates
7. `src/components/FAQ.tsx` -- update questions for pSEO context
8. `src/components/Portfolio.tsx` -- **remove** (replaced by Cases section)
9. `src/index.css` -- add full-screen stacking styles

**New files to create:**
1. `src/components/WhatIsPSEO.tsx` -- explanatory section (3 columns)
2. `src/components/ToolNavigation.tsx` -- horizontal chip navigation
3. `src/components/ToolScreen.tsx` -- reusable full-screen tool wrapper
4. `src/components/tools/PSEOGenerator.tsx` -- tool 1 widget
5. `src/components/tools/AntiDuplicateChecker.tsx` -- tool 2 widget
6. `src/components/tools/AICitationChecker.tsx` -- tool 3 widget
7. `src/components/tools/ROICalculatorTool.tsx` -- tool 4 (adapt existing ROICalculator)
8. `src/components/tools/GEOCoverageMap.tsx` -- tool 5 widget
9. `src/components/CasesResults.tsx` -- cases and results section

---

### Detailed Changes

#### A. Header (`Header.tsx`)
- Change nav links to:
  - "Инструменты pSEO" -> `#tool-generator`
  - "Что такое Programmatic SEO?" -> `#what-is-pseo`
  - "Кейсы" -> `#cases`
  - "Контакты" -> `#contact`
- CTA button text: "Открыть платформу" -> scrolls to `#tool-generator`

#### B. Hero (`Hero.tsx`)
- Badge: "Бесплатная pSEO-платформа для России"
- H1 with typing effect:
  - Line 1: "Programmatic SEO"
  - Line 2: "для сайтов, которые продают"
- Subtitle: "Платформа OWNDDEV помогает создавать сотни GEO-страниц, проверять уникальность, готовить сайт к AI-поиску и считать ROI -- в одном интерфейсе."
- Stats line: "30+ проектов . 5M+ руб дополнительной выручки . 50+ городов охвата"
- Left button: "Открыть pSEO-платформу" with Sparkles icon -> scroll to `#tool-generator`
- Right button: "Что такое programmatic SEO?" with ArrowDown icon -> scroll to `#what-is-pseo`
- Keep all visual effects (sparkles, grid, parallax, glow, corner decorations)

#### C. Index Page Structure (`Index.tsx`)
New order of sections:
1. Hero (full viewport)
2. WhatIsPSEO (`#what-is-pseo`) -- 1 screen
3. ToolNavigation (sticky horizontal chips)
4. Tool 1: pSEO Generator (`#tool-generator`) -- full screen
5. Tool 2: Anti-Duplicate (`#tool-anti-duplicate`) -- full screen
6. Tool 3: AI Citation (`#tool-ai-check`) -- full screen
7. Tool 4: ROI Calculator (`#tool-roi`) -- full screen
8. Tool 5: GEO Map (`#tool-geo`) -- full screen
9. Cases & Results (`#cases`) -- 1 screen
10. ContactForm (`#contact`)
11. Footer

**Remove**: ScrollStacksSection, Portfolio, FAQ (or repurpose FAQ into a subsection)

#### D. Full-Screen Stacking Effect
Each tool section will use:
- `position: sticky; top: 0; min-height: 100vh;`
- Incremental `z-index` (each section z+1)
- When the next section overlaps, the previous gets class `is-behind`:
  - `transform: scale(0.97) translateY(-8px)`
  - `filter: brightness(0.85)`
  - `transition: transform 0.4s ease, filter 0.4s ease`
- Implemented via a single `IntersectionObserver` on each section

#### E. ToolScreen Wrapper (reusable)
Each tool screen has:
- Top: badge "Инструмент N/5" + icon, H2 title, subtitle
- Center: the tool widget (Card with form/results)
- Bottom: "Когда использовать" list + documentation link
- Unique background gradient per tool
- `id` attribute for scroll targeting

#### F. Tool Widgets (placeholder/static UI)
Each tool will be a presentational component with static forms and mock data -- no backend calls initially. They will show:
- Form inputs (selects, text fields, sliders)
- Empty/placeholder states
- Loading state UI
- Result cards with sample data

Specific tool details:

**C1. pSEO Generator**: Niche select, city select, page type config. Mini-steps (1-2-3). Blue-to-purple gradient.

**C2. Anti-Duplicate Checker**: Textarea for content, "content safety" scale (0-100) with shield icon. Red-purple gradient. Microcopy: "Мы не сохраняем контент на сервере."

**C3. AI Citation Checker**: URL input + results. Desktop: checklist on the right (Question H2s, TL;DR blocks, Schema.org, Local facts). Teal/cyan gradient.

**C4. ROI Calculator**: Adapt existing `ROICalculator.tsx` -- update labels for pSEO context (cities, pages, traffic). Green/lime gradient. Disclaimer at bottom.

**C5. GEO Coverage Map**: City list with checkboxes, stats bar (selected cities, population coverage). 2 columns on desktop. Deep blue/cosmic gradient.

#### G. WhatIsPSEO Section
- H2: "Что такое programmatic SEO?"
- 3 cards/columns:
  - "База данных" -- "Города, товары, услуги..."
  - "Шаблоны страниц" -- "Структура URL, H1, H2, FAQ"
  - "Автоматизация" -- "Генерация сотен страниц вместо ручной работы"
- Bottom text: "OWNDDEV -- это рабочий стол, где все эти части собираются вместе."

#### H. ToolNavigation (Chips)
- Horizontal scrolling list of 5 chips: "1. Generator", "2. Anti-Duplicate", "3. AI Check", "4. ROI", "5. GEO Map"
- Click scrolls to corresponding section
- Mobile: horizontal scroll with `overflow-x: auto`
- Sticky below header on desktop

#### I. CasesResults Section
- H2: "Кейсы и результаты"
- 3 stat cards:
  - "+180% органического трафика за 6 месяцев"
  - "50+ городов в одном проекте"
  - "ROI до 450%"
- Glass card styling consistent with existing design

#### J. ContactForm Updates
- Keep the existing form mostly as-is
- Update heading text: "Нужны кастомные доработки?"
- Add text: "Если нужны кастомные доработки или сопровождение -- напишите, платформа остаётся бесплатной."
- Update service dropdown options for pSEO context

#### K. Footer Updates
- Update description: "Бесплатная pSEO-платформа для российского бизнеса"
- Update quick links to match new nav
- Update services list to match 5 tools

#### L. CSS (`index.css`)
Add full-screen section stacking styles:
```css
.tool-section {
  position: sticky;
  top: 0;
  min-height: 100vh;
  transition: transform 0.4s ease, filter 0.4s ease;
}
.tool-section.is-behind {
  transform: scale(0.97) translateY(-8px);
  filter: brightness(0.85);
}
```

---

### Performance Considerations
- No GSAP or heavy animation libraries -- only CSS transitions and IntersectionObserver
- Single passive scroll listener for stacking effect
- Existing framer-motion used sparingly (only for initial reveal, not scroll-driven)
- Tool widgets are static/client-side only -- no API calls on load
- will-change only on actively animated elements
- Mobile: simpler transitions, no scaling effects on stacking

### Implementation Order
1. Create new component files (WhatIsPSEO, ToolNavigation, ToolScreen, 5 tool widgets, CasesResults)
2. Update Hero text and buttons
3. Update Header nav
4. Update Index.tsx page structure
5. Add CSS for full-screen stacking
6. Update ContactForm and Footer
7. Remove unused imports/components (ScrollStacksSection, Portfolio from Index)

