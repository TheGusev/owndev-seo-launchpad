

## План: довести GEO Audit / GEO Rating до рабочего состояния

### Что уже работает (НЕ ТРОГАЕМ)
- `siteCheck.ts` result contract — JSON.parse для competitors/keywords/minus_words/seo_data уже починен
- `SiteCheckPipeline.ts` — полный пайплайн, OpenAI API, gpt-4o-mini, всё корректно
- `migrate-geo-rating-from-supabase.ts` — скрипт миграции уже написан и корректен
- `package.json` — `migrate:geo-rating` скрипт уже есть
- `GeoRating.tsx` — уже работает с snake_case через `mapDbRowToEntry`

### Что нужно сделать (2 изменения)

#### 1. Авто-upsert в geo_rating после completed scan

**Файл**: `owndev-backend/src/workers/SiteCheckWorker.ts`

После строки `logger.info('SITE_CHECK_WORKER', ...)` (строка 72), добавить upsert в `geo_rating`:

```typescript
// Auto-upsert into geo_rating
try {
  const hostname = new URL(url).hostname;
  await sql`
    CREATE TABLE IF NOT EXISTS geo_rating (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      domain TEXT NOT NULL,
      display_name TEXT NOT NULL,
      category TEXT NOT NULL DEFAULT 'Сервисы',
      llm_score INTEGER NOT NULL DEFAULT 0,
      seo_score INTEGER NOT NULL DEFAULT 0,
      schema_score INTEGER NOT NULL DEFAULT 0,
      direct_score INTEGER NOT NULL DEFAULT 0,
      has_llms_txt BOOLEAN NOT NULL DEFAULT false,
      has_faqpage BOOLEAN NOT NULL DEFAULT false,
      has_schema BOOLEAN NOT NULL DEFAULT false,
      errors_count INTEGER NOT NULL DEFAULT 0,
      top_errors JSONB DEFAULT '[]'::jsonb,
      last_checked_at TIMESTAMPTZ DEFAULT NOW(),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `;
  await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_rating_domain ON geo_rating(domain)`;

  const scores = result.scores;
  const hasLlmsTxt = result.issues.some(i => /llms\.txt/i.test(i.title));
  const hasSchema = !result.issues.some(i => i.module === 'schema' && /JSON-LD не найден/i.test(i.title));
  const hasFaq = result.issues.some(i => /faqpage/i.test(i.found || '')) === false;
  const topErrors = result.issues
    .filter(i => i.severity === 'critical' || i.severity === 'high')
    .slice(0, 5)
    .map(i => i.title);

  await sql`
    INSERT INTO geo_rating (domain, display_name, category, llm_score, seo_score, schema_score, direct_score, has_llms_txt, has_faqpage, has_schema, errors_count, top_errors, last_checked_at)
    VALUES (${hostname}, ${hostname}, 'Сервисы', ${scores.ai ?? 0}, ${scores.seo ?? 0}, ${scores.schema ?? 0}, ${scores.direct ?? 0}, ${!hasLlmsTxt}, ${hasFaq}, ${hasSchema}, ${result.issues.length}, ${JSON.stringify(topErrors)}, NOW())
    ON CONFLICT (domain) DO UPDATE SET
      llm_score = EXCLUDED.llm_score,
      seo_score = EXCLUDED.seo_score,
      schema_score = EXCLUDED.schema_score,
      direct_score = EXCLUDED.direct_score,
      has_llms_txt = EXCLUDED.has_llms_txt,
      has_faqpage = EXCLUDED.has_faqpage,
      has_schema = EXCLUDED.has_schema,
      errors_count = EXCLUDED.errors_count,
      top_errors = EXCLUDED.top_errors,
      last_checked_at = NOW()
  `;
  logger.info('SITE_CHECK_WORKER', `Upserted ${hostname} into geo_rating`);
} catch (e: any) {
  logger.error('SITE_CHECK_WORKER', `geo_rating upsert failed: ${e.message}`);
}
```

Ключевые моменты:
- `llm_score` = `scores.ai` (AI-readiness score)
- `seo_score` = `scores.seo`
- `schema_score` = `scores.schema`
- `direct_score` = `scores.direct`
- `has_llms_txt` / `has_schema` / `has_faqpage` — определяются из issues
- Idempotent по domain через `ON CONFLICT`
- Не блокирует основной flow (try/catch)

#### 2. Добавить CREATE TABLE geo_rating в siteCheck.ts route init

**Файл**: `owndev-backend/src/api/routes/siteCheck.ts`

В начале `siteCheckRoutes` (после CREATE TABLE site_check_scans), добавить:

```sql
CREATE TABLE IF NOT EXISTS geo_rating (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL,
  display_name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Сервисы',
  llm_score INTEGER NOT NULL DEFAULT 0,
  seo_score INTEGER NOT NULL DEFAULT 0,
  schema_score INTEGER NOT NULL DEFAULT 0,
  direct_score INTEGER NOT NULL DEFAULT 0,
  has_llms_txt BOOLEAN NOT NULL DEFAULT false,
  has_faqpage BOOLEAN NOT NULL DEFAULT false,
  has_schema BOOLEAN NOT NULL DEFAULT false,
  errors_count INTEGER NOT NULL DEFAULT 0,
  top_errors JSONB DEFAULT '[]'::jsonb,
  last_checked_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_rating_domain ON geo_rating(domain);
```

Это гарантирует что таблица существует при старте, и GET /geo-rating не падает в catch/fallback.

---

### Что НЕ трогаем
- `SiteCheckPipeline.ts` — не меняем
- `siteCheck.ts` result route — не меняем
- `GeoRating.tsx` — не меняем (уже корректно работает с snake_case)
- `geo-rating-types.ts` — не меняем
- Migration script — не меняем

### Как проверить на сервере

1. `git pull && cd owndev-backend && npm run build && pm2 restart owndev-backend`
2. `npm run migrate:geo-rating` → должно upsert-нуть 80 строк
3. `curl -s http://localhost:3001/api/v1/site-check/geo-rating | python3 -c "import sys,json; d=json.load(sys.stdin); print('rows:', len(d))"` → 80+
4. Запустить проверку любого сайта → после status=done домен должен появиться/обновиться в geo_rating

