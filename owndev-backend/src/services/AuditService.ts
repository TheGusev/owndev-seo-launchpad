import { CrawlerService } from './CrawlerService.js';
import { SchemaService } from './SchemaService.js';
import { LlmsService } from './LlmsService.js';
import { updateAuditResult, setAuditError } from '../db/queries/audits.js';
import { updateLastAudit } from '../db/queries/domains.js';
import type { AuditResult, AuditIssue } from '../types/audit.js';
import { logger } from '../utils/logger.js';

export class AuditService {
  private crawler = new CrawlerService();
  private schema = new SchemaService();
  private llms = new LlmsService();

  async run(auditId: string, domainId: string, url: string): Promise<AuditResult> {
    try {
      const page = await this.crawler.crawl(url);
      const schemaIssues = this.schema.validate(page.schemas);
      const llmsIssues = await this.llms.check(url, page.robotsTxt);

      const issues: AuditIssue[] = [...schemaIssues, ...llmsIssues];

      const score = Math.max(0, 100 - issues.reduce((acc, i) => {
        const w = i.priority === 'P1' ? 15 : i.priority === 'P2' ? 7 : 3;
        return acc + w;
      }, 0));

      const result: AuditResult = {
        score,
        confidence: 0.7,
        summary: `Найдено ${issues.length} проблем. Оценка: ${score}/100.`,
        issues,
        meta: {
          url,
          crawledAt: new Date().toISOString(),
          pagesChecked: 1,
        },
      };

      await updateAuditResult(auditId, result);
      await updateLastAudit(domainId);

      logger.info('AUDIT_SERVICE', `Audit ${auditId} done, score=${score}`);
      return result;
    } catch (err: any) {
      logger.error('AUDIT_SERVICE', `Audit ${auditId} failed:`, err.message);
      await setAuditError(auditId, err.message);
      throw err;
    }
  }
}
