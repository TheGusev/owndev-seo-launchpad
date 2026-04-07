import type { AuditIssue } from '../types/audit.js';

const RECOMMENDED_TYPES = ['Organization', 'WebSite', 'WebPage', 'BreadcrumbList', 'FAQPage'];

export class SchemaService {
  validate(schemas: object[]): AuditIssue[] {
    const issues: AuditIssue[] = [];

    if (schemas.length === 0) {
      issues.push({
        type: 'missing_schema',
        severity: 'high',
        message: 'JSON-LD разметка отсутствует',
        detail: 'На странице не найдено ни одного блока <script type="application/ld+json">.',
        category: 'schema',
        recommendation: 'Добавьте как минимум Organization и WebSite schema.',
        priority: 'P1',
        confidence: 0.95,
        source: 'parser',
      });
      return issues;
    }

    const foundTypes = new Set<string>();
    for (const s of schemas) {
      const t = (s as any)['@type'];
      if (typeof t === 'string') foundTypes.add(t);
      if (Array.isArray(t)) t.forEach((x: string) => foundTypes.add(x));
    }

    for (const rec of RECOMMENDED_TYPES) {
      if (!foundTypes.has(rec)) {
        issues.push({
          type: 'missing_schema_type',
          severity: rec === 'Organization' ? 'high' : 'medium',
          message: `Отсутствует ${rec} schema`,
          detail: `Рекомендуется добавить разметку типа ${rec} для улучшения видимости в AI.`,
          category: 'schema',
          recommendation: `Добавьте JSON-LD блок с @type: "${rec}".`,
          priority: rec === 'Organization' ? 'P1' : 'P2',
          confidence: 0.85,
          source: 'heuristic',
        });
      }
    }

    return issues;
  }
}
