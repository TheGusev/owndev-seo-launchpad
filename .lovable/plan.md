

## Добавить /geo-audit в Header, Footer и sitemap

### Текущее состояние
- **Sitemap**: `/geo-audit` уже есть (строка 90, priority 0.9) ✅
- **Footer toolLinks**: есть `/tools/geo-audit`, но нет `/geo-audit` (лендинг) в quickLinks
- **Header**: нет ссылки на `/geo-audit`

### Изменения (2 файла)

#### 1. `src/components/Header.tsx` — строка 12
Добавить `GEO‑аудит` в навигацию между "Инструменты" и "Блог":
```typescript
{ href: "/geo-audit", label: "GEO‑аудит", isRoute: true },
```

#### 2. `src/components/Footer.tsx` — строка 14
Добавить `GEO‑аудит` в `quickLinks`:
```typescript
{ label: "GEO‑аудит", href: "/geo-audit", isRoute: true },
```

Sitemap уже содержит `/geo-audit` — изменения не нужны.

