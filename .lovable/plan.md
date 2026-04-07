

## Единый API-слой для OWNDEV

### Текущее состояние

Запросы идут двумя путями:
1. **`supabase.functions.invoke()`** — 11 компонентов (SEOAuditor, BrandTracker, IndexationChecker, SemanticCoreGenerator, AITextGenerator, ContentBriefGenerator, InternalLinksChecker, CompetitorAnalysis, PSEOGenerator, ContactForm, AutoFixGenerator)
2. **`fetch(fnUrl(...))`** — `src/lib/site-check-api.ts` (5 функций: startScan, getScanStatus, getScanPreview, createReport, getReport)
3. **`supabase.from('scans').select()`** — прямой запрос к таблице в site-check-api.ts

### Файлы

| Файл | Действие |
|------|----------|
| `src/lib/api/config.ts` | Новый — API_BASE_URL + Supabase URL constants |
| `src/lib/api/client.ts` | Новый — `invokeFunction<T>()` wrapper над supabase.functions.invoke + `request<T>()` для raw fetch |
| `src/lib/api/types.ts` | Новый — AuditResult, AuditIssue, ToolId и др. |
| `src/lib/api/tools.ts` | Новый — функции для каждого инструмента |
| `src/lib/api/scan.ts` | Новый — перенос логики из site-check-api.ts |
| `src/lib/api/index.ts` | Новый — barrel export |
| `src/lib/site-check-api.ts` | Рефакторинг — делегирует в api/scan.ts |
| 11 компонентов | Заменить прямые вызовы supabase.functions.invoke на api/tools.ts |

### Архитектура

```text
src/lib/api/
├── config.ts      — API_BASE_URL, SUPABASE_URL, headers
├── client.ts      — invokeFunction<T>(name, body), request<T>(url, opts)
├── types.ts       — AuditResult, AuditIssue, ToolId, ConfidenceMeta, etc.
├── tools.ts       — auditSite, checkLlms, generateSchema, etc.
├── scan.ts        — startScan, getScanStatus, getScanPreview, createReport, getReport, getFullScan
└── index.ts       — re-exports
```

### Детали

**1. `config.ts`**
```typescript
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';
// Future: backend endpoints will use API_BASE_URL
// Current: all calls go through Supabase Edge Functions
```

**2. `client.ts`**
- `invokeFunction<T>(functionName: string, body?: object): Promise<T>` — обёртка над `supabase.functions.invoke`, обрабатывает `error` и `data.error`, логирует `[OWNDEV API]`
- `request<T>(path: string, options?: RequestInit): Promise<T>` — raw fetch для site-check-scan/report endpoints (которые используют custom routing через path)
- Единая обработка ошибок с `[OWNDEV API]` префиксом

**3. `types.ts`**
```typescript
export type ToolId = 'seo-audit' | 'site-check' | 'brand-tracker' | 'indexation' | ...;
export type IssuePriority = 'P1' | 'P2' | 'P3';
export interface AuditIssue { type: string; severity: string; message: string; detail: string; ... }
export interface AuditResult { score: number; confidence: number; summary: string; issues: AuditIssue[]; meta: Record<string, any>; }
export interface ConfidenceMeta { model: string; timestamp: number; }
export interface SourceMeta { tool: ToolId; version: string; }
```

**4. `tools.ts`** — каждая функция вызывает `invokeFunction`:
- `auditSite(url)` → `invokeFunction('seo-audit', { url })`
- `checkIndexation(url)` → `invokeFunction('check-indexation', { url })`
- `generateSemanticCore(topic)` → `invokeFunction('generate-semantic-core', { topic })`
- `generateText(type, topic, keywords)` → `invokeFunction('generate-text', ...)`
- `generateContentBrief(query, url?, contentType?)` → `invokeFunction('generate-content-brief', ...)`
- `checkInternalLinks(url)` → `invokeFunction('check-internal-links', { url })`
- `analyzeCompetitors(url1, url2)` → `invokeFunction('competitor-analysis', ...)`
- `trackBrand(brand, prompts, aiSystems)` → `invokeFunction('brand-tracker', ...)`
- `generateAutofix(issueType, url, title?, description?)` → `invokeFunction('generate-autofix', ...)`
- `generateGeoContent(pages, niche, region)` → `invokeFunction('generate-geo-content', ...)`
- `sendTelegram(body)` → `invokeFunction('send-telegram', body)`

**5. `scan.ts`** — перенос из `site-check-api.ts` с использованием `request<T>()` для path-based endpoints и `supabase.from()` для getFullScan.

**6. Рефакторинг компонентов** — замена `supabase.functions.invoke("X", { body })` на `import { funcName } from '@/lib/api'`:
- Сохраняется вся существующая логика отображения, state management, error handling в toast
- Только строка вызова меняется с `supabase.functions.invoke` на `api.funcName()`

**7. `site-check-api.ts`** — становится тонкой re-export обёрткой из `api/scan.ts` для обратной совместимости.

### Ограничения
- Header.tsx, мобильное меню, "Последние проверки" — 0 изменений
- Внешнее поведение всех инструментов идентично
- Supabase client.ts и types.ts — не трогаем

