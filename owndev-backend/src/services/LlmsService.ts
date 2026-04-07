import type { AuditIssue } from '../types/audit.js';

export class LlmsService {
  async check(url: string, robotsTxt: string): Promise<AuditIssue[]> {
    const issues: AuditIssue[] = [];
    const origin = new URL(url).origin;

    // Check llms.txt
    try {
      const resp = await fetch(`${origin}/llms.txt`);
      if (!resp.ok) {
        issues.push({
          type: 'missing_llms_txt',
          severity: 'medium',
          message: 'llms.txt не найден',
          detail: 'Файл /llms.txt отсутствует. AI-системы не смогут узнать о доступном контенте.',
          category: 'llm',
          recommendation: 'Создайте /llms.txt с описанием разделов сайта.',
          priority: 'P2',
          confidence: 0.9,
          source: 'fetch',
        });
      }
    } catch {
      issues.push({
        type: 'llms_txt_error',
        severity: 'low',
        message: 'Не удалось проверить llms.txt',
        detail: 'Ошибка при запросе /llms.txt.',
        category: 'llm',
        priority: 'P3',
        confidence: 0.5,
        source: 'fetch',
      });
    }

    // Check robots.txt for AI bot directives
    if (robotsTxt) {
      const aiBlockPatterns = ['GPTBot', 'ChatGPT-User', 'Google-Extended', 'Anthropic'];
      const blocked = aiBlockPatterns.filter((b) => robotsTxt.includes(b));

      if (blocked.length > 0) {
        issues.push({
          type: 'ai_bots_blocked',
          severity: 'high',
          message: `AI-боты заблокированы в robots.txt: ${blocked.join(', ')}`,
          detail: 'Это может снизить видимость сайта в AI-системах.',
          category: 'llm',
          recommendation: 'Убедитесь, что блокировка AI-ботов намеренная.',
          priority: 'P1',
          confidence: 0.95,
          source: 'parser',
        });
      }
    }

    return issues;
  }
}
