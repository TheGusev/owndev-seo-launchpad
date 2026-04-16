

## Обернуть "GEO Рейтинг" в ссылку на `/geo-rating`

**Файл:** `src/pages/GeoAudit.tsx`, строка 183

Заменить `<span className="text-primary font-medium">GEO Рейтинг</span>` на `<Link to="/geo-rating" className="text-primary font-medium underline underline-offset-2 hover:text-primary/80">GEO Рейтинг</Link>`.

`Link` из `react-router-dom` уже импортирован в файле — дополнительных импортов не нужно.

