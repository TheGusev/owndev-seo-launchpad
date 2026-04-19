import type { BreakdownJson, ScoresJson } from '../../../types/marketplaceAudit.js';

export function calcTotalScore(b: BreakdownJson): ScoresJson {
  const total = Math.round(
    b.content.score * b.content.weight +
    b.search.score * b.search.weight +
    b.conversion.score * b.conversion.weight +
    b.ads.score * b.ads.weight,
  );
  return {
    total,
    content: b.content.score,
    search: b.search.score,
    conversion: b.conversion.score,
    ads: b.ads.score,
    breakdown: b,
  };
}
