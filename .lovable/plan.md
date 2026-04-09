

## Добавить JSON-LD BreadcrumbList на страницу методологии

Добавить структурированную разметку `BreadcrumbList` внутрь `<Helmet>` на странице `GeoRatingMethodology.tsx`.

### Изменение

В `src/pages/GeoRatingMethodology.tsx` — добавить `<script type="application/ld+json">` в блок `<Helmet>` (после существующего `<meta name="description">`):

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    { "@type": "ListItem", "position": 1, "name": "Главная", "item": "https://owndev.ru/" },
    { "@type": "ListItem", "position": 2, "name": "GEO Рейтинг", "item": "https://owndev.ru/geo-rating" },
    { "@type": "ListItem", "position": 3, "name": "Методология" }
  ]
}
```

Один файл, ~10 строк добавления. Ничего больше не трогаем.

