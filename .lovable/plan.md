

## Исправления по аудиту (без добавления телефона)

### 9 правок по приоритету

| # | Файл | Что делать |
|---|------|-----------|
| 1 | `src/components/Hero.tsx:92` | «7 инструментов» → «12+ инструментов» |
| 2 | `src/pages/Tools.tsx:20` | meta description: «12 бесплатных» → «13 бесплатных» |
| 3 | `src/pages/GeoNicheToolPage.tsx:17` | `NICHE_ENABLED_SLUGS` → пустой массив `[]` (убрать утилиты из гео-ниш) |
| 4 | `src/components/Footer.tsx:8-11` | Добавить Telegram (@one_help) в contactInfo. Телефон НЕ добавляем |
| 5 | `index.html` | Убрать дублирующие теги: canonical (строка 22), og:title/description (28-31), дубль Playfair Display (строка 6). Оставить только favicon, og:type, og:image, twitter:card, twitter:image — остальным управляет Helmet |
| 6 | `src/components/SiteCheckBanner.tsx` | `<a href>` → `<Link to>` из react-router-dom |
| 7 | `src/pages/NotFound.tsx:16` | `console.error` → `console.log` |
| 8 | `package.json` | Удалить `three`, `@types/three`, `@tsparticles/*` |

### Детали

**index.html** — итоговый вид `<head>`:
- Оставить: charset, viewport, title, description, author, keywords, og:type, og:image, twitter:card, twitter:image, favicon
- Убрать: canonical, og:title, og:description, twitter:title, twitter:description, Playfair Display link (загружается через CSS)

**Footer** — добавить только Telegram:
```typescript
{ icon: MessageCircle, text: "@one_help", href: "https://t.me/one_help" }
```

**SiteCheckBanner** — импортировать `Link` из react-router-dom, заменить `<a href={href}>` на `<Link to={href}>`

