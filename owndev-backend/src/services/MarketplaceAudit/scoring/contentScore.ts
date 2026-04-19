import type { ParsedProduct, SubScore, ScoreFactor } from '../../../types/marketplaceAudit.js';

const WEIGHT = 0.30;

function clamp(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }

function titleLengthScore(len: number): { score: number; reason: string } {
  if (len === 0) return { score: 0, reason: 'Заголовок отсутствует' };
  if (len < 40) return { score: 30, reason: `Title ${len} симв (норма 60–100)` };
  if (len < 60) return { score: 60, reason: `Title ${len} симв (норма 60–100)` };
  if (len <= 100) return { score: 95, reason: `Title ${len} симв — оптимально` };
  if (len <= 130) return { score: 75, reason: `Title ${len} симв — длинноват` };
  return { score: 50, reason: `Title ${len} симв — слишком длинный` };
}

function descriptionScore(len: number, hasStructure: boolean): { score: number; reason: string } {
  if (len === 0) return { score: 0, reason: 'Описание отсутствует' };
  let base = 0;
  if (len < 200) base = 30;
  else if (len < 500) base = 55;
  else if (len < 1500) base = 90;
  else base = 80;
  if (hasStructure) base = clamp(base + 5);
  return { score: base, reason: `${len} симв${hasStructure ? ', есть структура' : ', стена текста'}` };
}

function imagesScore(count: number): { score: number; reason: string } {
  if (count === 0) return { score: 0, reason: 'Фото не добавлены' };
  if (count < 3) return { score: 30, reason: `${count} фото (минимум 5)` };
  if (count < 5) return { score: 55, reason: `${count} фото (рекомендовано 7+)` };
  if (count < 7) return { score: 75, reason: `${count} фото — нормально` };
  return { score: 95, reason: `${count} фото — отлично` };
}

function attributesScore(filled: number): { score: number; reason: string } {
  if (filled === 0) return { score: 0, reason: 'Характеристики не заполнены' };
  if (filled < 5) return { score: 30, reason: `${filled} характеристик (мало)` };
  if (filled < 10) return { score: 65, reason: `${filled} характеристик` };
  return { score: 95, reason: `${filled} характеристик — отлично` };
}

function hasStructure(desc: string): boolean {
  return /\n\s*\n/.test(desc) || /[•\-—]\s/.test(desc) || /\d\.\s/.test(desc);
}

export function calcContentScore(product: ParsedProduct): SubScore {
  const titleLen = product.title.length;
  const descLen = product.description.length;
  const imagesCount = product.images.length;
  const attrCount = Object.keys(product.attributes ?? {}).length;

  const tf = titleLengthScore(titleLen);
  const df = descriptionScore(descLen, hasStructure(product.description));
  const imf = imagesScore(imagesCount);
  const af = attributesScore(attrCount);

  const factors: ScoreFactor[] = [
    { name: 'title_length', score: tf.score, weight: 0.20, reason: tf.reason, dataPresent: titleLen > 0 },
    { name: 'description_quality', score: df.score, weight: 0.30, reason: df.reason, dataPresent: descLen > 0 },
    { name: 'images_count', score: imf.score, weight: 0.30, reason: imf.reason, dataPresent: imagesCount > 0 },
    { name: 'attributes_completeness', score: af.score, weight: 0.20, reason: af.reason, dataPresent: attrCount > 0 },
  ];

  const score = clamp(factors.reduce((s, f) => s + f.score * f.weight, 0));
  const missing: string[] = [];
  if (imagesCount === 0) missing.push('images');
  if (attrCount === 0) missing.push('attributes');

  return { score, weight: WEIGHT, factors, missingData: missing };
}
