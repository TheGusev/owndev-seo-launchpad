

## 3 точечных исправления по аудиту

### FIX 1 (P0) — `owndev-backend/src/api/routes/siteCheck.ts`, строка 181

Заменить:
```typescript
const issues = result?.issues ?? [];
```
на:
```typescript
const issues = result?.issues ?? (typeof row.issues === 'string' ? JSON.parse(row.issues) : (row.issues ?? []));
```

### FIX 2 (P0) — тот же файл, response object (строки 187–221)

Добавить `is_spa: row.is_spa ?? false,` в объект ответа (после `error_message`, перед `created_at`).

### FIX 3 (P1) — `src/components/site-check/GeoRatingNomination.tsx`

Переместить все `useState` хуки ПЕРЕД ранним return на строке 32. Guard-проверки (`if (!url ...)` и `if (totalScore < 70 || sent)`) идут после всех хуков. В `brandName` initializer используем `(url || '')` для null-safety.

### Затронутые файлы
1. `owndev-backend/src/api/routes/siteCheck.ts` — 2 правки
2. `src/components/site-check/GeoRatingNomination.tsx` — 1 правка (переупорядочение)

Больше ничего не трогаем.

