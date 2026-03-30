

## Создание лендинга /geo-audit

### 1. `src/pages/GeoAudit.tsx` — новый файл

Полноценная SEO-лендинг страница с секциями:

- **Helmet**: title, description, canonical, og-теги, BreadcrumbList JSON-LD, SoftwareApplication JSON-LD
- **Hero**: бейдж, H1, subheadline, CTA → `/tools/site-check`
- **"Что такое GEO"**: 2 абзаца текста
- **"Что включает GEO-аудит"**: 6 карточек (FileCheck, Star, Code2, Brain, BookOpen, Sparkles)
- **"GEO vs SEO"**: таблица сравнения (5 строк)
- **"Как работает аудит"**: 3 шага
- **FAQ**: 4 вопроса с Accordion
- **Bottom CTA**: заголовок + кнопка → `/tools/site-check`

Используем существующие компоненты: Header, Footer, GlowingEffect, GradientButton, Accordion, Badge. Стили — glass-карточки, как на остальных страницах.

### 2. `src/App.tsx` — строка 54

Добавить import и route `/geo-audit` перед `/tools`:

```tsx
import GeoAudit from "./pages/GeoAudit";
// ...
<Route path="/geo-audit" element={<GeoAudit />} />
```

### Файлы

| Файл | Действие |
|------|----------|
| `src/pages/GeoAudit.tsx` | Новый — лендинг GEO-аудита |
| `src/App.tsx` | Добавить import + route |

