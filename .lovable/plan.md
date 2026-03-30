

## pSEO-страницы для GEO-категории

### Подход

Используем существующую инфраструктуру: добавляем 5 новых "инструментов" в `tools-registry.ts`, которые все рендерят `ScanForm` (как site-check), но с уникальным SEO-копирайтом. Расширяем `ToolDef` опциональными полями `seoTitle`, `seoDescription`, `seoH1` — `ToolPage.tsx` использует их вместо автогенерации.

### Файлы (5)

#### 1. `src/data/tools-registry.ts`

Расширить интерфейс `ToolDef`:
```typescript
seoTitle?: string;
seoDescription?: string;
seoH1?: string;
```

Добавить 5 инструментов (все с `component: ScanForm`, `geoEnabled: false`):

| slug | name | seoH1 | seoTitle |
|------|------|-------|----------|
| `geo-audit` | GEO-аудит | GEO-аудит сайта онлайн | GEO-аудит сайта онлайн — бесплатно \| OWNDEV |
| `llm-score` | LLM Score | Проверить LLM Score сайта | LLM Score сайта — проверить онлайн \| OWNDEV |
| `ai-ready-audit` | AI-ready аудит | AI-ready аудит сайта | AI-ready аудит сайта — проверка онлайн \| OWNDEV |
| `llms-txt-checker` | llms.txt Checker | Проверить и сгенерировать llms.txt | Проверка llms.txt онлайн \| OWNDEV |
| `eeat-audit` | E-E-A-T аудит | E-E-A-T аудит сайта онлайн | E-E-A-T аудит сайта \| OWNDEV |

#### 2. `src/pages/ToolPage.tsx`

Строки 33-34: использовать `tool.seoTitle ?? auto`, `tool.seoDescription ?? auto`, `tool.seoH1 ?? tool.name` для title, description и h1.

#### 3. `src/config/pseoConfig.ts`

Добавить 5 новых slug в `GEO_BLOCKED_TOOLS` (не нужны региональные копии).

#### 4. `vite-plugin-sitemap.ts`

- Добавить 5 новых slug в `allToolSlugs`
- Добавить в `staticUrls`: `/geo-audit` (priority 0.9), `/tools/geo-audit`, `/tools/llm-score`, `/tools/llms-txt-checker` (priority 0.8)

#### 5. `src/components/Footer.tsx`

Обновить `toolLinks` — добавить:
- `GEO-аудит` → `/tools/geo-audit`
- `LLM Score` → `/tools/llm-score`
- `llms.txt Checker` → `/tools/llms-txt-checker`

