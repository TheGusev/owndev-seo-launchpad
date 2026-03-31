

## Добавить seo_data в Edge Function и БД

### Проблема
Фронтенд передаёт `data.seo_data` в PDF/Word генераторы, но поле `seo_data` не существует в таблице `scans` и не заполняется бэкендом. Технический паспорт в отчётах всегда пустой.

### Изменения

#### 1. Миграция: добавить колонку `seo_data` (JSONB) в таблицу `scans`
```sql
ALTER TABLE public.scans ADD COLUMN IF NOT EXISTS seo_data jsonb DEFAULT NULL;
```

#### 2. `supabase/functions/site-check-scan/index.ts` — собрать и сохранить `seo_data`

В `runPipeline()`, после парсинга HTML и до `updateScan` на шаге progress 35%, извлечь все SEO-метрики из HTML в объект:

```typescript
const seoData = extractSeoData(html, parsedUrl, robotsResult, sitemapResult);
```

Новая функция `extractSeoData()` собирает из уже распарсенного HTML:
- `title`, `titleLength`
- `description`, `descriptionLength`
- `h1`, `h1Count`, `h2Count`, `h3Count`
- `wordCount`
- `canonical`
- `ogTitle`, `ogDescription`, `ogImage`, `ogUrl`
- `lang` (из `<html lang="...">`)
- `imagesTotal`, `imagesWithoutAlt`, `imagesWithoutDimensions`
- `hasSchema`, `schemaTypes` (массив типов из JSON-LD)
- `hasFaq` (FAQPage в schema или текстовые маркеры)
- `hasLlmsTxt` (проверка `{origin}/llms.txt` — уже делается в aiAudit)
- `robotsMeta` (содержимое `<meta name="robots">`)
- `hasViewport`
- `loadTimeMs`
- `httpStatus`

Сохранить `seo_data` в финальном `updateScan()` (строка ~1974):
```typescript
await updateScan(scanId, {
  status: 'done', ...,
  seo_data: seoData,
});
```

Также в промежуточный `updateScan` на строке ~1949 для раннего доступа.

### Файлы

| Файл | Действие |
|------|----------|
| Миграция SQL | Новая колонка `seo_data jsonb` |
| `supabase/functions/site-check-scan/index.ts` | Новая функция `extractSeoData` + сохранение |
