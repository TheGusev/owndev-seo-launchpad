

## БЛОК 2 — Индекс и pSEO зачистка

### Текущее состояние

- **GeoToolPage**: canonical уже указывает на `/tools/${tool.slug}` (без города) — корректно для утилит, но для geo-allowed инструментов canonical должен быть на саму гео-страницу.
- **GeoNicheToolPage**: canonical → `/tools/${tool.slug}`, `NICHE_ENABLED_SLUGS` = `["pseo-generator", "anti-duplicate"]` — оба утилиты, которые НЕ должны иметь гео-нишевые страницы.
- **Sitemap**: `geoEnabledTools` = `["seo-auditor", "competitor-analysis", "semantic-core"]`, `nicheEnabledTools` = `[]` — sitemap уже чист.
- **tools-registry**: `geoEnabled: true` только у seo-auditor, competitor-analysis, semantic-core — корректно.
- **regions.ts**: ~85 городов с полными данными, поле `nameCase` (предложный падеж) уже есть.
- **niches.ts**: ~20 ниш, но старые (saas, ecommerce и т.д.), промт требует 5 новых (crypto, startups, lawyers, online-schools, production) — по памяти они уже были добавлены ранее.

### Что нужно сделать

**1. Создать `src/config/pseoConfig.ts`** — единый источник правды:
```typescript
export const GEO_ALLOWED_TOOLS = [
  'seo-auditor', 'competitor-analysis', 'semantic-core',
  'site-check', 'internal-links'
];
export const GEO_BLOCKED_TOOLS = [
  'anti-duplicate', 'schema-generator', 'llm-prompt-helper',
  'ai-text-generator', 'webmaster-files', 'position-monitor',
  'pseo-generator', 'indexation-checker'
];
```

**2. GeoToolPage.tsx** — условный noindex для заблокированных инструментов:
- Импорт `GEO_BLOCKED_TOOLS` из pseoConfig
- Если `toolSlug` в `GEO_BLOCKED_TOOLS`:
  - canonical → `/tools/${tool.slug}`
  - добавить `<meta name="robots" content="noindex, follow" />`
- Если в `GEO_ALLOWED_TOOLS`:
  - canonical → `/tools/${tool.slug}/${region.id}` (на саму гео-страницу)
  - без noindex

**3. GeoNicheToolPage.tsx** — noindex для всех нишевых страниц с утилитами:
- Заменить `NICHE_ENABLED_SLUGS` на импорт из pseoConfig
- Для `GEO_BLOCKED_TOOLS` — noindex + canonical на `/tools/${tool.slug}`
- Для `GEO_ALLOWED_TOOLS` — canonical на саму страницу

**4. vite-plugin-sitemap.ts** — добавить `site-check` и `internal-links` в geoEnabledTools:
- `geoEnabledTools` = `["seo-auditor", "competitor-analysis", "semantic-core", "site-check", "internal-links"]`
- `nicheEnabledTools` остаётся `[]`

**5. tools-registry.ts** — обновить geoEnabled:
- `site-check` — если существует, `geoEnabled: true` (проверить наличие)
- `internal-links` — `geoEnabled: true`

**6. Мета-теги GeoToolPage** — обновить title/description с предложным падежом:
- Title уже использует `region.nameCase` — OK
- Canonical для geo-allowed: изменить на полный URL гео-страницы

### Файлы

| Файл | Действие |
|------|----------|
| `src/config/pseoConfig.ts` | Новый — GEO_ALLOWED_TOOLS / GEO_BLOCKED_TOOLS |
| `src/pages/GeoToolPage.tsx` | Условный canonical + noindex |
| `src/pages/GeoNicheToolPage.tsx` | Импорт из pseoConfig, noindex для утилит |
| `vite-plugin-sitemap.ts` | Добавить site-check, internal-links в geoEnabledTools |
| `src/data/tools-registry.ts` | geoEnabled: true для internal-links |

### Что НЕ делаем
- Города уже расширены (~85 штук в regions.ts с nameCase) — достаточно
- Ниши не трогаем — nicheEnabledTools остаётся пустым, нишевые гео-страницы не генерируются в sitemap

