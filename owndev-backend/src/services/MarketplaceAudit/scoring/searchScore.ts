import type { ParsedProduct, SubScore, ScoreFactor } from '../../../types/marketplaceAudit.js';

const WEIGHT = 0.30;
function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

/** Very lightweight category-keyword guess for MVP — no heavy NLP. */
function deriveSeedKeywords(category: string, title: string): string[] {
  const out = new Set<string>();
  const norm = (s: string) => s.toLowerCase().replace(/[^а-яёa-z0-9\s]/gi, ' ').split(/\s+/).filter((w) => w.length > 3);
  for (const w of norm(category)) out.add(w);
  for (const w of norm(title).slice(0, 6)) out.add(w);
  return Array.from(out).slice(0, 12);
}

export interface SearchAnalysis {
  sub: SubScore;
  covered: string[];
  missing: string[];
  coveragePct: number;
}

export function calcSearchScore(product: ParsedProduct, providedKeywords?: string[]): SearchAnalysis {
  const titleLow = product.title.toLowerCase();
  const descLow = product.description.toLowerCase();
  const haystack = `${titleLow} ${descLow}`;

  const seeds = providedKeywords && providedKeywords.length > 0
    ? providedKeywords.map((k) => k.toLowerCase())
    : deriveSeedKeywords(product.category, product.title);

  const covered: string[] = [];
  const missing: string[] = [];
  for (const k of seeds) {
    if (k && haystack.includes(k)) covered.push(k);
    else missing.push(k);
  }
  const coveragePct = seeds.length === 0 ? 0 : Math.round((covered.length / seeds.length) * 100);

  // Factor 1: title contains category root word
  const catRoot = (product.category || '').toLowerCase().split(/[\s,/]/).find((w) => w.length > 3) || '';
  const titleHasCategory = catRoot ? titleLow.includes(catRoot) : false;

  // Factor 2: keyword coverage
  const coverageScore = coveragePct;

  // Factor 3: synonyms presence (rough — at least 2 distinct stems in description)
  const stems = new Set<string>();
  for (const w of descLow.split(/\s+/)) {
    const s = w.replace(/[^а-яёa-z]/gi, '').slice(0, 5);
    if (s.length >= 4) stems.add(s);
  }
  const stemDiversity = Math.min(100, Math.round((stems.size / 30) * 100));

  const factors: ScoreFactor[] = [
    {
      name: 'title_has_category',
      score: titleHasCategory ? 90 : 30,
      weight: 0.35,
      reason: titleHasCategory ? `Категория «${catRoot}» найдена в title` : 'Категория не отражена в title',
      dataPresent: !!catRoot,
    },
    {
      name: 'keywords_coverage',
      score: coverageScore,
      weight: 0.45,
      reason: `Покрытие ${coveragePct}% (${covered.length} из ${seeds.length})`,
      dataPresent: seeds.length > 0,
    },
    {
      name: 'lexical_diversity',
      score: stemDiversity,
      weight: 0.20,
      reason: `Лексическое разнообразие: ${stems.size} основ`,
      dataPresent: stems.size > 0,
    },
  ];

  const score = clamp(factors.reduce((s, f) => s + f.score * f.weight, 0));
  const missingData: string[] = [];
  if (!providedKeywords) missingData.push('search_volume');

  return {
    sub: { score, weight: WEIGHT, factors, missingData },
    covered,
    missing,
    coveragePct,
  };
}
