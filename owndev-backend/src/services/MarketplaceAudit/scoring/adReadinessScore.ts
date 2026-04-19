import type { ParsedProduct, SubScore, ScoreFactor } from '../../../types/marketplaceAudit.js';

const WEIGHT = 0.15;
const FORBIDDEN = ['лучший', 'лучшая', 'лучшее', '№1', 'номер 1', 'идеальный', 'идеальная', '100%', 'гарантированно'];

function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

function hasDuplicates(title: string): boolean {
  const words = title.toLowerCase().replace(/[^\wа-яё\s]/gi, '').split(/\s+/).filter((w) => w.length > 3);
  const seen = new Set<string>();
  for (const w of words) {
    if (seen.has(w)) return true;
    seen.add(w);
  }
  return false;
}

function findForbidden(text: string): string[] {
  const low = text.toLowerCase();
  return FORBIDDEN.filter((w) => low.includes(w));
}

export function calcAdReadinessScore(product: ParsedProduct): SubScore {
  const title = product.title;
  const titleLen = title.length;

  const titleLenScore = titleLen === 0 ? 0 : titleLen <= 100 ? 95 : titleLen <= 120 ? 80 : titleLen <= 140 ? 50 : 25;
  const dupScore = hasDuplicates(title) ? 40 : 95;
  const forbidden = findForbidden(`${title} ${product.description}`);
  const forbiddenScore = forbidden.length === 0 ? 95 : forbidden.length === 1 ? 50 : 20;

  // Brand + category co-occurrence — important for Ad creative auto-generation
  const hasBrand = !!product.attributes?.['Бренд'];
  const brandScore = hasBrand ? 90 : 50;

  const factors: ScoreFactor[] = [
    { name: 'title_ad_length', score: titleLenScore, weight: 0.30, reason: `${titleLen} симв (оптимум до 100)`, dataPresent: titleLen > 0 },
    { name: 'no_duplicates', score: dupScore, weight: 0.20, reason: hasDuplicates(title) ? 'Найдены дубли слов в title' : 'Дублей нет', dataPresent: titleLen > 0 },
    { name: 'no_forbidden_words', score: forbiddenScore, weight: 0.30, reason: forbidden.length ? `Запрещённые: ${forbidden.join(', ')}` : 'Запрещённых слов нет', dataPresent: true },
    { name: 'brand_present', score: brandScore, weight: 0.20, reason: hasBrand ? 'Бренд указан' : 'Бренд не указан', dataPresent: hasBrand },
  ];

  const score = clamp(factors.reduce((s, f) => s + f.score * f.weight, 0));
  const missing: string[] = [];
  if (!hasBrand) missing.push('brand');

  return { score, weight: WEIGHT, factors, missingData: missing };
}
