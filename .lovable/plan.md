

## BreadcrumbList JSON-LD + SoftwareApplication schema

### 1. BreadcrumbList JSON-LD — 4 страницы

Добавить `BreadcrumbList` JSON-LD в `<Helmet>` на каждой странице:

**`src/pages/Blog.tsx`** — Главная → Блог
```json
{ "@type": "BreadcrumbList", "itemListElement": [
  { "position": 1, "name": "Главная", "item": "https://owndev.ru/" },
  { "position": 2, "name": "Блог", "item": "https://owndev.ru/blog" }
]}
```

**`src/pages/BlogPost.tsx`** — Главная → Блог → {post.title}
```json
{ "position": 3, "name": post.title, "item": "https://owndev.ru/blog/{slug}" }
```
Добавить в существующий `jsonLd` блок рядом — отдельный `<script>`.

**`src/pages/Tools.tsx`** — Главная → Инструменты

**`src/pages/Contacts.tsx`** — Главная → Контакты

### 2. SoftwareApplication schema — `src/pages/Index.tsx`

Добавить третий JSON-LD блок после `websiteLd`:

```json
{
  "@type": "SoftwareApplication",
  "name": "OWNDEV",
  "applicationCategory": "SEOApplication",
  "operatingSystem": "Web",
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "RUB" },
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.8", "ratingCount": "120" }
}
```

### Файлы (5)

| Файл | Изменение |
|------|-----------|
| `Index.tsx` | SoftwareApplication JSON-LD |
| `Blog.tsx` | BreadcrumbList JSON-LD |
| `BlogPost.tsx` | BreadcrumbList JSON-LD |
| `Tools.tsx` | BreadcrumbList JSON-LD |
| `Contacts.tsx` | BreadcrumbList JSON-LD |

