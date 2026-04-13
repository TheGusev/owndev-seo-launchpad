

## Обновление display_name из seo_data.title в geo_rating upsert

### Что меняется

**1 файл**: `owndev-backend/src/workers/SiteCheckWorker.ts`

Перед upsert-запросом (строка ~107) извлекаем `title` из `result.seo_data`:

```typescript
const displayName = result.seo_data?.title?.trim() || hostname;
```

Затем в INSERT заменяем второй `${hostname}` (display_name) на `${displayName}`, и в `ON CONFLICT DO UPDATE` добавляем:

```sql
display_name = EXCLUDED.display_name,
```

Это гарантирует, что при наличии `<title>` на сайте в рейтинге будет человекочитаемое имя вместо hostname. Если title пустой — fallback на hostname.

