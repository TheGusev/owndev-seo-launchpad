/**
 * services/conversion — trust signals auditor.
 *
 * Heuristic detection of trust-building blocks:
 *   • Reviews / testimonials (отзывы)
 *   • Aggregate rating (5/5, рейтинг 4.8 и т.п.)
 *   • Certifications (сертификат, лицензия)
 *   • Guarantee (гарантия)
 *   • Team / about (о компании, наша команда)
 *   • Case studies (кейс, портфолио, выполненные работы)
 */

import * as cheerio from 'cheerio';
import type { TrustAuditInput, TrustSignalAuditResult } from './types.js';

interface PatternHit {
  found: boolean;
  count: number;
}

function findKeyword($: cheerio.CheerioAPI, regex: RegExp): PatternHit {
  let count = 0;
  $('h1, h2, h3, h4, .title, .section-title, .heading').each((_, el) => {
    const t = $(el).text().toLowerCase();
    if (regex.test(t)) count++;
  });
  $('section, [class*="reviews"], [class*="testimonials"], [id*="reviews"], [id*="testimonials"]').each(
    (_, el) => {
      const id = ($(el).attr('id') ?? '').toLowerCase();
      const cls = ($(el).attr('class') ?? '').toLowerCase();
      if (regex.test(id) || regex.test(cls)) count++;
    },
  );
  return { found: count > 0, count };
}

export function auditTrustSignals(input: TrustAuditInput): TrustSignalAuditResult {
  const $ = cheerio.load(input.html);
  const issues: string[] = [];
  const recommendations: string[] = [];

  const reviews = findKeyword($, /отзыв|review|testimon|клиенты говорят/);
  const certifications = findKeyword($, /сертифик|лицензи|certification|certified/);
  const guarantee = findKeyword($, /гаранти|guarantee|возврат|refund/);
  const team = findKeyword($, /команд|team|сотрудник|о нас|about/);
  const cases = findKeyword($, /кейс|портфоли|case|portfolio|примеры работ/);

  const ratingMatch = $('body').text().match(/(\d[.,]\d)\s*(?:из|\/)\s*5|рейтинг[^0-9]*(\d[.,]\d)/i);
  const hasRating = !!ratingMatch;

  // Count individual review items
  let reviewItems = 0;
  $('[class*="review"], [class*="testimonial"], [data-review]').each((_, el) => {
    if ($(el).children().length > 0) reviewItems++;
  });

  const signals = [
    reviews.found,
    hasRating,
    certifications.found,
    guarantee.found,
    team.found,
    cases.found,
  ].filter(Boolean).length;

  const trustScore = Math.min(100, signals * 20 + Math.min(reviewItems * 2, 20));

  if (!reviews.found) {
    issues.push('Нет блока отзывов');
    recommendations.push('Добавить блок отзывов клиентов (минимум 3-5)');
  }
  if (!hasRating && reviews.found) {
    recommendations.push('Добавить агрегированный рейтинг (4.8 / 5)');
  }
  if (!guarantee.found) {
    recommendations.push('Указать гарантию (возврат денег, бесплатная переделка)');
  }
  if (!cases.found) {
    recommendations.push('Добавить блок кейсов / выполненных работ');
  }
  if (!team.found) {
    recommendations.push('Добавить блок "о компании" или "команда"');
  }

  return {
    reviews_count: reviewItems,
    has_review_rating_aggregate: hasRating,
    has_certifications_block: certifications.found,
    has_guarantee_block: guarantee.found,
    has_team_block: team.found,
    has_case_studies_block: cases.found,
    trust_score: trustScore,
    signal_count: signals,
    issues,
    recommendations,
  };
}
