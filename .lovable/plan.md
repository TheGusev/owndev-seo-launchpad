

## Plan: Blog Section with LLM/pSEO Guides

### Approach

Store blog articles as static data (no database needed -- these are SEO landing pages, not user-generated content). This keeps things fast, indexable, and simple.

### Structure

**Data layer:** `src/data/blog-posts.ts`
- Array of blog post objects: `slug`, `title`, `description`, `date`, `tags`, `content` (markdown string), `readTime`
- 6 starter articles covering LLM optimization and pSEO topics

**Pages:**
- `src/pages/Blog.tsx` -- grid of article cards with tags, search/filter
- `src/pages/BlogPost.tsx` -- single article page with markdown rendering, SEO meta via Helmet

**Components:**
- `src/components/BlogPreview.tsx` -- compact "Latest from blog" section for the landing page (3 cards)

**Routing:** Add `/blog` and `/blog/:slug` routes in `App.tsx`

**Navigation:** Add "Блог" link to Header and Footer

### Starter Articles (6 posts)

1. "Что такое LLM-оптимизация и зачем она нужна" -- intro to optimizing for AI search
2. "Как попасть в AI Overviews Google" -- practical checklist
3. "pSEO: как масштабировать SEO на 1000+ страниц" -- programmatic SEO guide
4. "Schema.org разметка для AI-цитирования" -- JSON-LD best practices
5. "Промты для SEO: как использовать ChatGPT для контента" -- LLM prompt engineering for SEO
6. "Чек-лист SEO-аудита 2025: классика + LLM" -- comprehensive audit guide

### Files

| Action | File |
|--------|------|
| CREATE | `src/data/blog-posts.ts` |
| CREATE | `src/pages/Blog.tsx` |
| CREATE | `src/pages/BlogPost.tsx` |
| CREATE | `src/components/BlogPreview.tsx` |
| MODIFY | `src/App.tsx` (add routes) |
| MODIFY | `src/pages/Index.tsx` (add BlogPreview section) |
| MODIFY | `src/components/Header.tsx` (add Блог nav link) |
| MODIFY | `src/components/Footer.tsx` (add Блог link) |

### Markdown Rendering

Use a simple custom renderer (split by `##`, `###`, `**`, `` ` ``, `-` lists) to avoid adding a dependency. Keeps bundle small.

