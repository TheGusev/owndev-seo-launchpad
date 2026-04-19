import type { CompetitorBlock } from '../../types/marketplaceAudit.js';

/**
 * Phase 1 MVP: only manual competitor URLs are honored.
 * We don't fetch them yet — we just surface them as placeholders so the UI
 * can render the "competitors block" without empty-screen shock.
 */
export function buildManualCompetitors(urls: string[] | undefined): CompetitorBlock[] {
  if (!urls || urls.length === 0) return [];
  return urls.slice(0, 5).map((url) => ({
    url,
    title: 'Конкурент (введён вручную)',
    score: 0,
    gap: ['Анализ конкурентов добавлен в Phase 2'],
  }));
}
