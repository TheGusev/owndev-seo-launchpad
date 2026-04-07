

## Обогащение результатов аудита мета-данными (priority, confidence, source)

### Что делаем

Добавляем в каждый issue три поля — `priority`, `confidence`, `source` — и общий `confidence` в результат. Бизнес-логику проверок не трогаем.

### Файлы

| Файл | Изменение |
|------|-----------|
| `supabase/functions/seo-audit/index.ts` | Добавить `priority`, `confidence`, `source` к каждому issue; добавить общий `confidence` в ответ |
| `supabase/functions/check-indexation/index.ts` | Добавить `priority`, `confidence`, `source` к каждому issue |
| `supabase/functions/site-check-scan/index.ts` | Добавить `priority`, `confidence`, `source` к issues (точечно, ~20 мест) |
| `src/components/tools/SEOAuditor.tsx` | Упростить `normalizeResult` — использовать `priority`/`confidence` из backend если есть |

### Маппинг priority

Каждый issue.push в `seo-audit/index.ts` получает `priority` по правилу:
- **P1**: noindex, нет title, нет H1, нет HTTPS, нет robots.txt, нет JSON-LD, HTTP ≠ 200 — блокирует видимость
- **P2**: короткий title/description, мало H2, нет FAQ, нет viewport, битые ссылки, CWV проблемы
- **P3**: нет canonical, нет OG, нет lang, нет таблиц, info-уровень

### Маппинг confidence

- **85-95**: прямые проверки HTML-тегов (title, h1, meta robots, canonical) и HTTP-заголовков (status, x-robots-tag, HTTPS)
- **70-80**: проверки структуры (JSON-LD парсинг, FAQ-детекция, H2-вопросы)
- **50-65**: эвристики (CWV оценки, content length как сигнал, blocking resources)

### Маппинг source

- `"html"`: title, description, h1, images alt, canonical, OG, JSON-LD, H2, lists, tables, lang, FAQ block, viewport
- `"headers"`: HTTPS, x-robots-tag, meta robots (headers-based)
- `"external"`: robots.txt, sitemap.xml, broken links (отдельные HTTP-запросы)
- `"heuristic"`: CWV scores, page size, load time, content length, blocking resources

### Реализация в seo-audit/index.ts

1. Расширить интерфейс `AuditIssue`:
```typescript
interface AuditIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  recommendation: string;
  category: 'seo' | 'llm';
  details?: string[];
  context?: string;
  priority: 'P1' | 'P2' | 'P3';
  confidence: number;
  source: 'html' | 'headers' | 'dom' | 'heuristic' | 'external';
}
```

2. Каждый `issues.push(...)` — добавить 3 поля. Примеры:
   - HTTPS: `priority: 'P1', confidence: 95, source: 'headers'`
   - Title отсутствует: `priority: 'P1', confidence: 95, source: 'html'`
   - Title короткий: `priority: 'P2', confidence: 90, source: 'html'`
   - CWV LCP preload: `priority: 'P2', confidence: 55, source: 'heuristic'`
   - Нет OG: `priority: 'P3', confidence: 90, source: 'html'`
   - robots.txt: `priority: 'P1', confidence: 90, source: 'external'`

3. Добавить общий `confidence` в JSON-ответ (средневзвешенный по issues или фиксированный 75 для эвристического аудита).

### check-indexation/index.ts

Аналогично: каждый issue получает `priority`, `confidence`, `source`:
- status ≠ 200: `P1, 95, headers`
- x-robots-tag noindex: `P1, 95, headers`  
- meta robots noindex: `P1, 90, html`
- canonical отличается: `P2, 85, html`
- title/description отсутствует: `P1/P2, 90, html`

### SEOAuditor.tsx — упрощение normalizeResult

Использовать `priority` из backend напрямую, fallback на текущую severity-логику:
```typescript
priority: i.priority || severityToPriority(i.severity)
```

Аналогично для `confidence` — брать из issue если есть.

### Что НЕ трогаем
- Header, Footer, роутинг — 0 изменений
- Бизнес-логику проверок (какие правила, какие штрафы) — 0 изменений
- AuditResultView UI — уже поддерживает эти поля
- site-check-scan — отложить (2600 строк, отдельная итерация)

### Объём
~60 точечных добавлений по 3 поля в seo-audit, ~8 в check-indexation, ~5 строк в SEOAuditor.tsx.

