export const COLORS = {
  bg_dark:       '#0a0a0f',
  bg_card:       '#12121a',
  bg_card2:      '#1a1a2e',
  purple:        '#8b5cf6',
  purple_light:  '#a78bfa',
  purple_dark:   '#6d28d9',
  critical:      '#ef4444',
  high:          '#f97316',
  medium:        '#eab308',
  low:           '#6b7280',
  success:       '#10b981',
  info:          '#3b82f6',
  text_white:    '#ffffff',
  text_gray:     '#9ca3af',
  text_dark:     '#4b5563',
  cat_technical: '#3b82f6',
  cat_content:   '#8b5cf6',
  cat_schema:    '#6366f1',
  cat_ai:        '#10b981',
  cat_direct:    '#ec4899',
};

export const PRINT_COLORS = {
  bg:            '#ffffff',
  bg_alt:        '#f9fafb',
  bg_header:     '#f3f4f6',
  text:          '#1a1a1a',
  text_secondary:'#6b7280',
  border:        '#e5e7eb',
  accent:        '#7c3aed',
  critical:      '#dc2626',
  high:          '#ea580c',
  medium:        '#ca8a04',
  low:           '#6b7280',
  success:       '#059669',
  info:          '#2563eb',
};

export const getSeverityColor = (severity: string): string => {
  const map: Record<string, string> = {
    critical: COLORS.critical,
    high: COLORS.high,
    medium: COLORS.medium,
    low: COLORS.low,
  };
  return map[severity] || COLORS.low;
};

export const getSeverityLabel = (severity: string): string => {
  const map: Record<string, string> = {
    critical: 'Критично',
    high: 'Важно',
    medium: 'Средне',
    low: 'Мелко',
  };
  return map[severity] || severity;
};

export const getCategoryLabel = (category: string): string => {
  const map: Record<string, string> = {
    technical: 'Техника',
    content: 'Контент',
    schema: 'Schema.org',
    ai: 'AI-готовность',
    direct: 'Яндекс.Директ',
  };
  return map[category] || category;
};

export const getScoreStatus = (score: number): { label: string; color: string } => {
  if (score >= 80) return { label: 'Отлично', color: COLORS.success };
  if (score >= 60) return { label: 'Хорошо', color: COLORS.medium };
  if (score >= 40) return { label: 'Требует работы', color: COLORS.high };
  return { label: 'Критично', color: COLORS.critical };
};

export const calcPotentialGain = (issues: any[]): number => {
  return issues
    .filter(i => i.severity === 'critical' || i.severity === 'high')
    .reduce((sum, i) => sum + (i.impact_score || 0), 0);
};

export const formatDate = (date: Date = new Date()): string => {
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
};

export const truncate = (str: string, max: number): string => {
  if (!str) return '';
  return str.length > max ? str.slice(0, max) + '...' : str;
};

export interface ReportData {
  url: string;
  domain: string;
  theme: string;
  scanDate: string;
  scores: {
    total: number;
    seo: number;
    direct: number;
    schema: number;
    ai: number;
  };
  issues: any[];
  keywords: any[];
  minusWords: any[];
  competitors: any[];
  comparisonTable: any;
  directMeta: any;
  seoData: any;
}
