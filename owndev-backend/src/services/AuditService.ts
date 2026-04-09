import { CrawlerService } from './CrawlerService.js';
import { updateAuditStatus, saveAuditResult } from '../db/queries/audits.js';
import { logEvent } from '../db/queries/events.js';
import type { AuditResult, AuditIssue, AuditBlock, CrawlData, IssuePriority } from '../types/audit.js';
import { logger } from '../utils/logger.js';

export class AuditService {
  private crawler = new CrawlerService();

  /** Pure analysis — no DB, no side effects */
  analyze(data: CrawlData): AuditResult {
    const blocks: AuditBlock[] = [
      this.safeBlock(() => this.checkIndexability(data)),
      this.safeBlock(() => this.checkContentStructure(data)),
      this.safeBlock(() => this.checkAIReadiness(data)),
      this.safeBlock(() => this.checkSchema(data)),
      this.safeBlock(() => this.checkEEAT(data)),
      this.safeBlock(() => this.checkTechnical(data)),
      this.safeBlock(() => this.checkYandexAiReadiness(data)),
    ];

    const totalWeight = blocks.reduce((s, b) => s + b.weight, 0);
    const score = Math.round(blocks.reduce((s, b) => s + b.score * b.weight, 0) / totalWeight);
    const allIssues = blocks.flatMap((b) => b.issues);
    const confidence = allIssues.length
      ? Math.round(allIssues.reduce((s, i) => s + (i.confidence ?? 70), 0) / allIssues.length)
      : 85;

    return {
      score,
      confidence,
      summary: `Найдено ${allIssues.length} проблем. Оценка: ${score}/100.`,
      issues: allIssues,
      blocks,
      meta: { url: data.url, finalUrl: data.finalUrl, crawledAt: new Date().toISOString(), durationMs: data.duration_ms },
    };
  }

  /** Orchestrator for worker */
  async run(auditId: string, domainId: string, url: string): Promise<AuditResult> {
    const startMs = Date.now();
    try {
      await updateAuditStatus(auditId, 'processing');
      const crawlData = await this.crawler.crawl(url);
      if (crawlData.error) {
        throw new Error(`Crawl failed: ${crawlData.error}`);
      }
      const result = this.analyze(crawlData);
      const durationMs = Date.now() - startMs;

      await saveAuditResult(auditId, result);
      await updateAuditStatus(auditId, 'done', { score: result.score, confidence: result.confidence, durationMs });
      try { await logEvent('audit_done', { auditId, url, score: result.score, durationMs }); } catch { /* non-critical */ }
      logger.info('AUDIT_SERVICE', `Audit ${auditId} done, score=${result.score}, ${durationMs}ms`);
      return result;
    } catch (err: any) {
      const durationMs = Date.now() - startMs;
      logger.error('AUDIT_SERVICE', `Audit ${auditId} failed: ${err.message}`);
      await updateAuditStatus(auditId, 'error', { errorMsg: err.message, durationMs });
      try { await logEvent('audit_error', { auditId, url, error: err.message }); } catch { /* non-critical */ }
      throw err;
    }
  }

  // ── Block helpers ──────────────────────────────────────────────

  private safeBlock(fn: () => AuditBlock): AuditBlock {
    try {
      return fn();
    } catch (err: any) {
      return {
        name: 'unknown', score: 50, weight: 10,
        issues: [this.issue('block_error', 'warning', 'Ошибка при выполнении проверки', err.message, 'P3', 50, 'internal')],
      };
    }
  }

  private issue(type: string, severity: string, message: string, detail: string, priority: IssuePriority, confidence: number, source: string, rec?: string): AuditIssue {
    return { type, severity, message, detail, priority, confidence, source, category: type, recommendation: rec };
  }

  // ── Block 1: Indexability (weight 15) ──────────────────────────

  private checkIndexability(d: CrawlData): AuditBlock {
    const issues: AuditIssue[] = [];
    const robotsMeta = (d.metaTags['robots'] || '').toLowerCase();

    if (robotsMeta.includes('noindex')) {
      issues.push(this.issue('noindex_meta', 'critical', 'Страница запрещена к индексации (meta robots)', `robots="${d.metaTags['robots']}"`, 'P1', 92, 'html', 'Удалите noindex из мета-тега robots'));
    }
    if ((d.headers['x-robots-tag'] || '').toLowerCase().includes('noindex')) {
      issues.push(this.issue('noindex_header', 'critical', 'X-Robots-Tag: noindex', `Header: ${d.headers['x-robots-tag']}`, 'P1', 95, 'headers', 'Удалите заголовок X-Robots-Tag: noindex'));
    }
    if (!d.robots.index) {
      issues.push(this.issue('robots_txt_block', 'critical', 'Страница заблокирована в robots.txt', 'User-agent: * содержит директиву блокировки', 'P1', 90, 'external', 'Разрешите индексацию в robots.txt'));
    }

    const canonical = d.metaTags['canonical'] || '';
    if (canonical && canonical !== d.finalUrl && canonical !== d.url) {
      issues.push(this.issue('canonical_mismatch', 'warning', 'Canonical URL не совпадает с текущим', `canonical="${canonical}", page="${d.finalUrl}"`, 'P2', 85, 'html', 'Убедитесь что canonical указывает на правильный URL'));
    }

    return { name: 'indexability', weight: 15, score: this.blockScore(issues, 4), issues };
  }

  // ── Block 2: Content Structure (weight 20) ─────────────────────

  private checkContentStructure(d: CrawlData): AuditBlock {
    const issues: AuditIssue[] = [];
    const html = d.renderedHtml;

    const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
    if (h1Count === 0) {
      issues.push(this.issue('no_h1', 'critical', 'Отсутствует H1', 'На странице нет заголовка первого уровня', 'P1', 90, 'dom', 'Добавьте один H1 с ключевой фразой'));
    } else if (h1Count > 1) {
      issues.push(this.issue('multiple_h1', 'warning', `Несколько H1 (${h1Count})`, 'Рекомендуется один H1 на страницу', 'P2', 88, 'dom', 'Оставьте один H1, остальные замените на H2'));
    }

    const hasH2 = /<h2[\s>]/i.test(html);
    if (!hasH2) {
      issues.push(this.issue('no_h2', 'warning', 'Отсутствуют заголовки H2', 'Нет структурных подзаголовков', 'P2', 85, 'dom', 'Добавьте H2 для структурирования контента'));
    }

    const textContent = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(/\s+/).length;
    if (wordCount < 300) {
      issues.push(this.issue('thin_content', 'warning', `Мало текста (${wordCount} слов)`, 'Рекомендуется минимум 300 слов', 'P2', 80, 'dom', 'Расширьте контент до 300+ слов'));
    }

    return { name: 'content_structure', weight: 18, score: this.blockScore(issues, 3), issues };
  }

  // ── Block 3: AI Readiness (weight 18) ──────────────────────────

  private checkAIReadiness(d: CrawlData): AuditBlock {
    const issues: AuditIssue[] = [];

    if (!d.llmsTxt.found) {
      issues.push(this.issue('no_llms_txt', 'warning', 'Отсутствует llms.txt', 'Файл llms.txt помогает LLM-системам понять ваш сайт', 'P2', 90, 'external', 'Создайте /llms.txt с описанием контента'));
    }

    const html = d.renderedHtml.toLowerCase();
    const hasFaq = /<(details|summary)[\s>]/i.test(html) || /\?<\/(h[23])>/i.test(html);
    if (!hasFaq) {
      issues.push(this.issue('no_faq', 'info', 'Не обнаружены FAQ-секции', 'FAQ улучшает видимость в AI-ответах', 'P2', 60, 'heuristic', 'Добавьте секцию FAQ с вопросами и ответами'));
    }

    const hasLists = /<(ul|ol)[\s>]/i.test(html);
    const hasTables = /<table[\s>]/i.test(html);
    if (!hasLists && !hasTables) {
      issues.push(this.issue('no_structured_content', 'info', 'Нет списков и таблиц', 'Структурированный контент лучше воспринимается AI', 'P3', 55, 'heuristic', 'Добавьте списки или таблицы'));
    }

    return { name: 'ai_readiness', weight: 18, score: this.blockScore(issues, 3), issues };
  }

  // ── Block 4: Schema / Structured Data (weight 15) ──────────────

  private checkSchema(d: CrawlData): AuditBlock {
    const issues: AuditIssue[] = [];

    if (d.schemas.length === 0) {
      issues.push(this.issue('no_jsonld', 'critical', 'Отсутствует JSON-LD разметка', 'На странице нет структурированных данных Schema.org', 'P1', 95, 'html', 'Добавьте JSON-LD с типом Organization, WebPage или Article'));
    } else {
      const types = d.schemas.map((s: any) => s['@type']).filter(Boolean);
      const recommended = ['Organization', 'WebPage', 'Article', 'FAQPage', 'BreadcrumbList'];
      const hasRecommended = recommended.some((r) => types.includes(r));
      if (!hasRecommended) {
        issues.push(this.issue('no_recommended_schema', 'warning', 'Нет рекомендуемых типов Schema', `Найдены: ${types.join(', ')}. Рекомендуются: ${recommended.join(', ')}`, 'P2', 85, 'heuristic', 'Добавьте Organization, WebPage или Article'));
      }

      for (const schema of d.schemas) {
        const s = schema as any;
        if (!s['@type']) {
          issues.push(this.issue('schema_no_type', 'warning', 'Schema без @type', JSON.stringify(schema).slice(0, 100), 'P2', 80, 'html', 'Укажите @type в каждом JSON-LD блоке'));
        } else if (!s.name && !s.headline) {
          issues.push(this.issue('schema_no_name', 'info', `Schema ${s['@type']} без name/headline`, 'Поле name или headline рекомендуется', 'P3', 75, 'html', 'Добавьте name или headline'));
        }
      }
    }

    return { name: 'schema', weight: 15, score: this.blockScore(issues, 3), issues };
  }

  // ── Block 5: E-E-A-T Signals (weight 15) ──────────────────────

  private checkEEAT(d: CrawlData): AuditBlock {
    const issues: AuditIssue[] = [];
    const linkTexts = d.links.map((l) => `${l.href} ${l.text || ''}`.toLowerCase());

    const hasContacts = linkTexts.some((l) => /контакт|contact|about|о нас|о компании/.test(l));
    if (!hasContacts) {
      issues.push(this.issue('no_contacts', 'info', 'Не найдена ссылка на страницу контактов', 'Страница контактов повышает доверие', 'P3', 55, 'heuristic', 'Добавьте ссылку на страницу контактов'));
    }

    const socialPatterns = /facebook|twitter|x\.com|linkedin|telegram|vk\.com|instagram|youtube/;
    const hasSocial = linkTexts.some((l) => socialPatterns.test(l));
    if (!hasSocial) {
      issues.push(this.issue('no_social', 'info', 'Нет ссылок на социальные сети', 'Ссылки на соцсети повышают E-E-A-T', 'P3', 50, 'heuristic', 'Добавьте ссылки на социальные сети'));
    }

    const hasAuthor = d.metaTags['author'] || d.schemas.some((s: any) => s['@type'] === 'Person' || s.author);
    if (!hasAuthor) {
      issues.push(this.issue('no_author', 'info', 'Не указан автор контента', 'Авторство повышает E-E-A-T', 'P3', 60, 'heuristic', 'Добавьте мета-тег author или schema Person'));
    }

    return { name: 'eeat', weight: 15, score: this.blockScore(issues, 3), issues };
  }

  // ── Block 6: Technical (weight 15) ─────────────────────────────

  private checkTechnical(d: CrawlData): AuditBlock {
    const issues: AuditIssue[] = [];

    if (d.statusCode >= 400) {
      issues.push(this.issue('http_error', 'critical', `HTTP ${d.statusCode}`, `Сервер вернул код ${d.statusCode}`, 'P1', 98, 'headers', 'Исправьте серверную ошибку'));
    } else if (d.statusCode >= 300 && d.statusCode < 400) {
      issues.push(this.issue('http_redirect', 'warning', `Редирект (${d.statusCode})`, `${d.url} → ${d.finalUrl}`, 'P2', 95, 'headers', 'Убедитесь что редирект корректен'));
    }

    if (d.duration_ms > 3000) {
      issues.push(this.issue('slow_page', 'warning', `Медленная загрузка (${d.duration_ms}ms)`, 'Рекомендуется < 3000ms', 'P2', 88, 'dom', 'Оптимизируйте скорость загрузки'));
    }

    const htmlSizeKb = Math.round(d.html.length / 1024);
    if (htmlSizeKb > 200) {
      issues.push(this.issue('large_html', 'info', `Большой HTML (${htmlSizeKb}KB)`, 'Рекомендуется < 200KB', 'P3', 85, 'dom', 'Уменьшите размер HTML'));
    }

    return { name: 'technical', weight: 15, score: this.blockScore(issues, 3), issues };
  }

  // ── Block 7: Yandex AI Readiness (weight 10) ───────────────────

  private checkYandexAiReadiness(d: CrawlData): AuditBlock {
    const issues: AuditIssue[] = [];
    const html = d.renderedHtml;

    // llms.txt
    if (!d.llmsTxt.found) {
      issues.push(this.issue('yandex_no_llms_txt', 'warning', 'Отсутствует llms.txt для ЯндексGPT', 'Файл llms.txt помогает ЯндексGPT корректно интерпретировать контент сайта', 'P2', 88, 'external', 'Создайте /llms.txt с описанием структуры и ключевых страниц'));
    } else if ((d.llmsTxt.content || '').length < 200) {
      issues.push(this.issue('yandex_thin_llms_txt', 'info', 'llms.txt слишком краткий', 'Рекомендуется подробное описание разделов и важных страниц (>200 символов)', 'P3', 70, 'external', 'Расширьте llms.txt: добавьте описания разделов, ключевые страницы и тематику'));
    }

    // Schema.org — Organization / WebSite
    const types = d.schemas.map((s: any) => s['@type']).filter(Boolean).flat();
    const hasOrg = types.some((t: string) => ['Organization', 'WebSite'].includes(t));
    if (!hasOrg) {
      issues.push(this.issue('yandex_no_org_schema', 'warning', 'Нет Schema Organization/WebSite', 'ЯндексGPT использует эти типы для идентификации бренда и сайта', 'P2', 85, 'html', 'Добавьте JSON-LD с типом Organization или WebSite'));
    }

    // Schema.org — Article / FAQPage / HowTo
    const contentTypes = ['Article', 'BlogPosting', 'FAQPage', 'HowTo'];
    const hasContentSchema = types.some((t: string) => contentTypes.includes(t));
    if (!hasContentSchema) {
      issues.push(this.issue('yandex_no_content_schema', 'info', 'Нет Article/FAQPage/HowTo разметки', 'Эти типы помогают Алисе и ЯндексGPT структурировать ответы', 'P3', 65, 'html', 'Добавьте JSON-LD Article, FAQPage или HowTo'));
    }

    // Вопросительные H2/H3
    const questionHeadings = (html.match(/<h[23][^>]*>[^<]*\?<\/h[23]>/gi) || []).length;
    if (questionHeadings === 0) {
      issues.push(this.issue('yandex_no_question_headings', 'info', 'Нет вопросительных заголовков H2/H3', 'Вопросительные заголовки повышают шансы попасть в ответы Алисы', 'P3', 55, 'dom', 'Добавьте H2/H3 в формате вопросов (Что? Как? Почему?)'));
    }

    // Списки и таблицы
    const hasLists = /<(ul|ol)[\s>]/i.test(html);
    const hasTables = /<table[\s>]/i.test(html);
    if (!hasLists && !hasTables) {
      issues.push(this.issue('yandex_no_lists_tables', 'info', 'Нет списков и таблиц', 'Структурированный контент лучше цитируется ЯндексGPT', 'P3', 50, 'dom', 'Добавьте маркированные/нумерованные списки или таблицы'));
    }

    // Скорость
    if (d.duration_ms > 5000) {
      issues.push(this.issue('yandex_very_slow', 'critical', `Очень медленная загрузка (${d.duration_ms}ms)`, 'Страницы >5с могут не попасть в индекс ЯндексGPT', 'P1', 92, 'dom', 'Оптимизируйте скорость до <3 секунд'));
    } else if (d.duration_ms > 3000) {
      issues.push(this.issue('yandex_slow', 'warning', `Медленная загрузка для AI-краулера (${d.duration_ms}ms)`, 'Рекомендуется <3с для корректной обработки ЯндексGPT', 'P2', 80, 'dom', 'Ускорьте загрузку: сжатие, кэширование, оптимизация изображений'));
    }

    return { name: 'yandex_ai_readiness', weight: 10, score: this.blockScore(issues, 4), issues };
  }

  // ── Scoring ────────────────────────────────────────────────────

  private blockScore(issues: AuditIssue[], maxIssues: number): number {
    if (issues.length === 0) return 100;
    const penalty = issues.reduce((s, i) => {
      const w = i.priority === 'P1' ? 30 : i.priority === 'P2' ? 15 : 5;
      return s + w;
    }, 0);
    return Math.max(0, Math.min(100, 100 - penalty));
  }
}
