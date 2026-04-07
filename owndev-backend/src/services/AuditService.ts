import { CrawlerService } from './CrawlerService.js';
import { SchemaService } from './SchemaService.js';
import { LlmsService } from './LlmsService.js';
import { updateAuditStatus, saveAuditResult } from '../db/queries/audits.js';
import { logEvent } from '../db/queries/events.js';
import type { AuditResult, AuditIssue } from '../types/audit.js';
import { logger } from '../utils/logger.js';

export class AuditService {
  private crawler = new CrawlerService();
  private schema = new SchemaService();
  private llms = new LlmsService();

  async run(auditId: string, domainId: string, url: string): Promise<AuditResult> {
    const startMs = Date.now();

    try {
      await updateAuditStatus(auditId, 'processing');

      const page = await this.crawler.crawl(url);
      const schemaIssues = this.schema.validate(page.schemas);
      const llmsIssues = await this.llms.check(url, page.robotsTxt);

      const issues: AuditIssue[] = [...schemaIssues, ...llmsIssues];

      const score = Math.max(0, 100 - issues.reduce((acc, i) => {
        const w = i.priority === 'P1' ? 15 : i.priority === 'P2' ? 7 : 3;
        return acc + w;
      }, 0));

      const durationMs = Date.now() - startMs;
      const confidence = 70;

      const result: AuditResult = {
        score,
        confidence: 0.7,
        summary: `Найдено ${issues.length} проблем. Оценка: ${score}/100.`,
        issues,
        meta: {
          url,
          crawledAt: new Date().toISOString(),
          pagesChecked: 1,
          durationMs,
        },
      };

      await saveAuditResult(auditId, result);
      await updateAuditStatus(auditId, 'done', { score, confidence, durationMs });
      await logEvent('audit_done', { auditId, url, score, durationMs });

      logger.info('AUDIT_SERVICE', `Audit ${auditId} done, score=${score}, ${durationMs}ms`);
      return result;
    } catch (err: any) {
      const durationMs = Date.now() - startMs;
      logger.error('AUDIT_SERVICE', `Audit ${auditId} failed:`, err.message);
      await updateAuditStatus(auditId, 'error', { errorMsg: err.message, durationMs });
      await logEvent('audit_error', { auditId, url, error: err.message });
      throw err;
    }
  }
}
