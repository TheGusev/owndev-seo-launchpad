

## Полноценные CrawlerService и AuditService

### Подход

Переписать оба сервиса с нуля. CrawlerService возвращает расширенный `CrawlData` (links, scripts, llms.txt, robots-директивы). AuditService — чистая функция `analyze(crawlData)` без DB-зависимостей, плюс оркестрирующий `run()` для worker.

### Файлы

| Файл | Действие |
|------|----------|
| `owndev-backend/src/types/audit.ts` | Добавить `CrawlData`, `AuditBlock`, расширить `AuditResult` полем `blocks` |
| `owndev-backend/src/services/CrawlerService.ts` | Полная переработка — расширенный crawl с links, scripts, llms.txt, robots-парсинг |
| `owndev-backend/src/services/AuditService.ts` | Полная переработка — 6 блоков проверок, `analyze(crawlData)` + `run()` для оркестрации |

### 1. types/audit.ts — новые типы

```typescript
export interface CrawlData {
  url: string;
  finalUrl: string;
  statusCode: number;
  headers: Record<string, string>;
  html: string;
  renderedHtml: string;
  title: string;
  metaTags: Record<string, string>;
  links: Array<{ href: string; rel?: string; text?: string }>;
  scripts: string[];
  schemas: object[];
  robots: { index: boolean; follow: boolean; rawContent?: string };
  llmsTxt: { found: boolean; content?: string; url?: string };
  duration_ms: number;
  error?: string;
}

export interface AuditBlock {
  name: string;
  score: number;
  weight: number;
  issues: AuditIssue[];
}
```

`AuditResult.meta` заменяется на `blocks: AuditBlock[]` + сохраняется `meta` для произвольных данных.

### 2. CrawlerService — расширенный краулер

Метод `crawl(url): Promise<CrawlData>`:
- Puppeteer `--no-sandbox`, User-Agent `OWNDEV-Crawler/1.0 (+https://owndev.ru)`
- Замер `duration_ms` от старта до закрытия
- Извлечение из DOM: title, meta-теги (name + property), все `<a>` (href, rel, text), src всех `<script>`, JSON-LD schemas
- Fetch `/robots.txt` → парсинг `noindex`/`nofollow` для User-agent: *
- Fetch `/llms.txt` → `{ found, content, url }`
- Headers из response → плоский Record
- `finalUrl` = `page.url()` после навигации (учёт редиректов)
- Каждый внешний fetch обёрнут в try/catch — падение одного не ломает весь crawl

### 3. AuditService — 6 блоков проверок

Метод `analyze(data: CrawlData): AuditResult` (чистая функция, без DB):

**Блок 1 — Indexability (вес 15)**
- noindex в meta robots → P1, confidence 92, source: html
- X-Robots-Tag: noindex → P1, confidence 95, source: headers
- Блокировка в robots.txt → P1, confidence 90, source: external
- canonical ≠ текущий URL → P2, confidence 85, source: html

**Блок 2 — Content Structure (вес 20)**
- Нет H1 или несколько H1 → P1/P2, confidence 90, source: dom
- Нет H2/H3 → P2, confidence 85, source: dom
- Контент < 300 слов → P2, confidence 80, source: dom

**Блок 3 — AI Readiness (вес 20)**
- Нет llms.txt → P2, confidence 90, source: external
- Нет FAQ-секций (вопросительные H2/H3, details/summary) → P2, confidence 60, source: heuristic
- Нет списков/таблиц → P3, confidence 55, source: heuristic

**Блок 4 — Schema (вес 15)**
- Нет JSON-LD → P1, confidence 95, source: html
- Отсутствуют рекомендуемые типы → P2, confidence 85, source: heuristic
- Schema без name/@type → P2, confidence 80, source: html

**Блок 5 — E-E-A-T (вес 15)**
- Нет ссылки на контакты → P3, confidence 55, source: heuristic
- Нет соцсетей → P3, confidence 50, source: heuristic
- Нет Author → P3, confidence 60, source: heuristic

**Блок 6 — Technical (вес 15)**
- statusCode !== 200 → P1/P2, confidence 98, source: headers
- crawl > 3000ms → P2, confidence 88, source: dom
- HTML > 200KB → P3, confidence 85, source: dom

Каждый блок обёрнут в try/catch — если падает, блок получает score 50 и warning-issue. Итоговый score — средневзвешенное по блокам. Confidence — среднее по всем issues.

Метод `run(auditId, domainId, url)` сохраняет оркестрацию: crawl → analyze → saveAuditResult → updateAuditStatus. SchemaService и LlmsService больше не нужны отдельно — логика поглощена блоками 3 и 4.

### Что НЕ трогаем
- Фронтенд — 0 изменений
- AuditWorker — вызывает `service.run()`, сигнатура не меняется
- DB queries — сигнатуры сохраняются
- SchemaService.ts, LlmsService.ts — оставляем как есть (не удаляем), но AuditService больше не импортирует их

### Объём
~180 строк CrawlerService, ~250 строк AuditService, ~30 строк types.

