

## Plan: Redesign Main Page -- 3 Business Verticals with Parallax Room Tour

### Overview

Transform the Index page from a single-purpose pSEO tool platform into a **3-in-1 business showcase**:
1. **Web Studio** (main focus) -- "We build sites that sell"
2. **pSEO Tools** (instruments section) -- existing 5 tools, condensed
3. **Smart Tech Shop** (future-facing) -- AI containers, robots, platforms

The design uses a **room tour** approach with full-screen scroll-snap sections, deep parallax layers, and glassmorphism. **Mobile-first** with simplified animations on phones.

---

### Current Structure (what changes)

```
CURRENT:                          NEW:
Hero (pSEO focus)                 Hero (3-in-1 OWNDEV intro)
WhatIsPSEO                       WebStudio section (projects showcase)
ToolNavigation (sticky)           ToolsShowcase section (5 tools, condensed)
5x ToolScreen (full-screen each)  TechShop section (AI containers)
CTA to /tools                    CasesResults (keep, update text)
CasesResults                     FAQ (keep)
ContactForm                      ContactForm (keep)
Footer                           Footer (update links)
```

Key decisions:
- **Remove** from Index: `WhatIsPSEO`, `ToolNavigation` (sticky bar), 5x individual `ToolScreen` sections
- **Keep**: `CasesResults`, `ContactForm`, `Footer`, `FAQ`
- **Add**: `WebStudioSection`, `ToolsShowcase`, `TechShopSection`
- **Rewrite**: `Hero` component to reflect 3 businesses
- The removed tool screens are still accessible at `/tools` and `/tools/:toolSlug`

---

### Part 1: New Hero Component

Rewrite `src/components/Hero.tsx`:

- TypeAnimation cycles through 3 business lines:
  - "Сайты под ключ" (2s)
  - "SEO-инструменты" (2s) 
  - "Технологии будущего" (2s)
- Subtitle: "Веб-студия, pSEO-платформа и магазин умных технологий"
- 3 CTA buttons scrolling to each section:
  - "Смотреть проекты" -> #web-studio
  - "Инструменты pSEO" -> #tools-showcase
  - "Магазин технологий" -> #tech-shop
- Keep existing parallax layers (SparklesCore, FloatingParticles, AnimatedGrid)
- Stats line updated: "30+ проектов | 6 готовых платформ | 5000+ GEO-страниц"

---

### Part 2: WebStudioSection (new component)

**File**: `src/components/WebStudioSection.tsx`

Full-screen section showcasing web studio services:

- H2: "Делаем сайты, которые **продают**"
- Subtitle: "Под ключ, натягиваем ваш фронт, или аренда готовых решений"
- **3 service cards** (glass cards, horizontal on desktop):
  1. "Под ключ" -- дизайн + разработка + SEO
  2. "Натянем ваш фронт" -- ваш дизайн, наш backend
  3. "Аренда готовых решений" -- 6+ готовых проектов
- **Portfolio carousel** (reuse existing `Portfolio` component data but inline it)
  - Shows 6 projects: protocro.ru, vozmozhnost.shop, and 4 others
  - Each card: screenshot, name, category, key metric
  - Horizontal scroll on mobile, carousel on desktop
- CTA: "Заказать сайт" -> scrolls to #contact
- Parallax: subtle background layer shift on scroll

---

### Part 3: ToolsShowcase (new component)

**File**: `src/components/ToolsShowcase.tsx`

Condensed pSEO tools section (replaces 5 full-screen ToolScreens):

- H2: "Бесплатные **SEO-инструменты**"
- 5 tool cards in a grid (3 cols desktop, 2 tablet, 1 mobile)
- Each card: icon, name, 1-line description, "Открыть" button linking to `/tools/:slug`
- Reuse data from existing `ToolNavigation` (Sparkles, Shield, Bot, Calculator, MapPin)
- "Все 20 инструментов" link to `/tools`
- Uses `useInView` for staggered fade-in animation
- No tool widgets rendered on Index page (saves bundle size via lazy loading)

---

### Part 4: TechShopSection (new component)

**File**: `src/components/TechShopSection.tsx`

Smart tech / AI containers showcase:

- H2: "Магазин **технологий будущего**"
- Subtitle: "Умные контейнеры с AI, роботы и платформы с пожизненными обновлениями"
- 3 product cards (glass cards):
  1. "AI-контейнер Starter" -- базовый набор промтов и моделей
  2. "AI-контейнер Pro" -- полная платформа + обновления
  3. "Робот-ассистент" -- coming soon / предзаказ
- Each card: gradient border, price/status badge, feature list
- CTA: "Узнать подробнее" -> Telegram link or #contact
- Visual: floating 3D-like element (CSS perspective transform on a glass card), no Three.js to keep mobile fast

---

### Part 5: Updated Index Page

**File**: `src/pages/Index.tsx`

New structure:
```tsx
<Header />
<Hero />                    // rewritten
<WebStudioSection />        // new -- projects & services
<ToolsShowcase />           // new -- condensed 5 tools
<TechShopSection />         // new -- AI shop
<ScrollStacksSection />     // keep -- problems/solutions/services
<CasesResults />            // keep
<FAQ />                     // keep
<ContactForm />             // keep
<Footer />                  // keep
```

Remove:
- `WhatIsPSEO` import and usage
- `ToolNavigation` import and usage  
- All 5 `ToolScreen` blocks and the `toolsContainerRef` + IntersectionObserver logic
- The "Смотреть все 20 инструментов" CTA (moved into ToolsShowcase)

---

### Part 6: Header Navigation Update

**File**: `src/components/Header.tsx`

Update nav links to reflect 3 sections:
```
[Веб-студия] [Инструменты] [Технологии] [Кейсы] [Контакты]
```
- "Веб-студия" -> `#web-studio`
- "Инструменты" -> `/tools` (route)
- "Технологии" -> `#tech-shop`
- "Кейсы" -> `#cases`
- "Контакты" -> `#contact`

---

### Part 7: Scroll Snap (optional enhancement)

Add CSS scroll-snap to `src/index.css` for desktop:
```css
@media (min-width: 768px) {
  .snap-container {
    scroll-snap-type: y proximity;
  }
  .snap-section {
    scroll-snap-align: start;
  }
}
```

Each major section gets `snap-section` class. Using `proximity` (not `mandatory`) so it doesn't fight with natural scrolling.

---

### Part 8: Footer Update

**File**: `src/components/Footer.tsx`

Update columns:
- Column 1: Logo + description ("Веб-студия, pSEO-платформа, магазин технологий")
- Column 2: Quick links (3 sections + contacts)
- Column 3: Инструменты (link to /tools)
- Column 4: Company (keep as-is)

---

### Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Create | `src/components/WebStudioSection.tsx` | Web studio services + project cards |
| Create | `src/components/ToolsShowcase.tsx` | Condensed 5-tool grid with links |
| Create | `src/components/TechShopSection.tsx` | AI containers / tech shop cards |
| Modify | `src/components/Hero.tsx` | 3-business hero with cycling text |
| Modify | `src/pages/Index.tsx` | New section order, remove old tool screens |
| Modify | `src/components/Header.tsx` | Updated nav links for 3 verticals |
| Modify | `src/components/Footer.tsx` | Updated description and links |
| Modify | `src/index.css` | Add scroll-snap utilities |

### Mobile-First Notes

- All new sections use single-column layout on mobile
- Parallax disabled on mobile (existing ParallaxLayer already handles this)
- Tool cards use horizontal scroll on mobile
- Buttons: min-height 48px for touch targets
- No heavy animations on mobile: only fade-in + scale

### Implementation Order

1. Create 3 new section components (WebStudioSection, ToolsShowcase, TechShopSection)
2. Rewrite Hero with 3-business messaging
3. Update Index.tsx with new structure
4. Update Header nav links
5. Update Footer
6. Add scroll-snap CSS

