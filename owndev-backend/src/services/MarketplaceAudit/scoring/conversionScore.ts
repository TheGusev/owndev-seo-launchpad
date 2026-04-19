import type { ParsedProduct, SubScore, ScoreFactor } from '../../../types/marketplaceAudit.js';

const WEIGHT = 0.25;
function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

export function calcConversionScore(product: ParsedProduct): SubScore {
  const photos = product.images.length;
  const hasVideo = (product.videoCount ?? 0) > 0;
  const hasBullets = /[•\-—]\s/.test(product.description) || (product.bullets?.length ?? 0) > 0;
  const reviews = product.reviewsCount ?? 0;
  const rating = product.rating ?? 0;

  const photoScore = photos >= 7 ? 95 : photos >= 5 ? 75 : photos >= 3 ? 55 : photos >= 1 ? 30 : 0;
  const videoScore = hasVideo ? 90 : 30;
  const bulletScore = hasBullets ? 85 : 35;
  const trustScore = (() => {
    if (reviews === 0 && rating === 0) return 50; // unknown — neutral
    if (rating >= 4.5 && reviews > 50) return 95;
    if (rating >= 4.0 && reviews > 10) return 75;
    if (rating >= 3.0) return 55;
    return 30;
  })();

  const factors: ScoreFactor[] = [
    { name: 'photo_richness', score: photoScore, weight: 0.40, reason: `${photos} фото`, dataPresent: photos > 0 },
    { name: 'video_present', score: videoScore, weight: 0.20, reason: hasVideo ? 'Видео есть' : 'Видео отсутствует', dataPresent: true },
    { name: 'description_bullets', score: bulletScore, weight: 0.20, reason: hasBullets ? 'Структурированное описание' : 'Без списков и буллетов', dataPresent: product.description.length > 0 },
    { name: 'social_proof', score: trustScore, weight: 0.20, reason: reviews ? `${reviews} отзывов, рейтинг ${rating}` : 'Нет данных об отзывах', dataPresent: reviews > 0 },
  ];

  const score = clamp(factors.reduce((s, f) => s + f.score * f.weight, 0));
  const missing: string[] = [];
  if (reviews === 0 && rating === 0) missing.push('reviews_data');
  if (!hasVideo) missing.push('video');

  return { score, weight: WEIGHT, factors, missingData: missing };
}
