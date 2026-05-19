/**
 * dataConfidence — оценка точности парсинга карточки маркетплейса.
 *
 * Считает «процент доверия» к распарсенным данным: сколько информативных
 * полей реально извлечено. Помогает понять, какой парсер недокрутили
 * и какие поля нужно дотащить в продакшен.
 *
 * Веса полей подобраны под влияние на скоринг: title/description —
 * критичны, video/seller — приятный бонус.
 *
 * Адаптация под реальный ParsedProduct:
 *   - attributes — Record<string,string> (не массив пар); считаем по числу ключей.
 *   - reviewsCount/videoCount/category — реальные поля.
 *   - brand/seller/breadcrumbs прямых полей нет; пытаемся достать их из
 *     attributes (типичный ключ «бренд», «продавец») и из sourceData.
 */
import type { ParsedProduct } from '../../../types/marketplaceAudit.js';

export interface DataConfidenceResult {
  data_confidence_pct: number;
  missing_fields: string[];
  filled_fields: string[];
  field_weights: Record<string, number>;
  notes: string[];
}

const WEIGHTS: Record<string, number> = {
  title: 15,
  description: 15,
  price: 12,
  rating: 8,
  reviews_count: 8,
  images: 10,
  attributes: 12,
  category: 8,
  brand: 5,
  video: 4,
  seller: 3,
};

function findAttrCaseInsensitive(
  attrs: Record<string, string> | undefined,
  needle: RegExp,
): string | undefined {
  if (!attrs) return undefined;
  for (const [k, v] of Object.entries(attrs)) {
    if (needle.test(k) && v && String(v).trim()) return String(v).trim();
  }
  return undefined;
}

function getPrice(card: ParsedProduct): number | undefined {
  // Цена обычно лежит в sourceData / attributes — единого поля нет.
  const sd = card.sourceData ?? {};
  const candidates: any[] = [
    sd.price, sd.salePrice, sd.priceU, sd.finalPrice,
  ];
  for (const c of candidates) {
    const n = Number(c);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  // Попробуем атрибут «цена»
  const a = findAttrCaseInsensitive(card.attributes, /цена|price/i);
  if (a) {
    const n = Number(a.replace(/[^\d.,]/g, '').replace(',', '.'));
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return undefined;
}

export function computeDataConfidence(card: ParsedProduct): DataConfidenceResult {
  const filled: string[] = [];
  const missing: string[] = [];
  const notes: string[] = [];
  let score = 0;

  // title
  if (typeof card.title === 'string' && card.title.trim().length >= 5) {
    filled.push('title');
    score += WEIGHTS.title;
  } else {
    missing.push('title');
    notes.push('Парсер не извлёк title >= 5 символов — проверьте селектор заголовка карточки.');
  }

  // description
  if (typeof card.description === 'string' && card.description.trim().length >= 50) {
    filled.push('description');
    score += WEIGHTS.description;
  } else {
    missing.push('description');
    notes.push('Описание короткое (<50 симв.) или отсутствует — проверьте парсер блока «Описание» WB/Ozon.');
  }

  // price
  const price = getPrice(card);
  if (price && price > 0) {
    filled.push('price');
    score += WEIGHTS.price;
  } else {
    missing.push('price');
    notes.push('Цена не распознана — добавьте парсинг priceU/salePriceU (WB) или price (Ozon) в sourceData.');
  }

  // rating
  if (typeof card.rating === 'number' && card.rating > 0) {
    filled.push('rating');
    score += WEIGHTS.rating;
  } else {
    missing.push('rating');
    notes.push('Рейтинг карточки не извлечён — без него scoring занижает доверие к товару.');
  }

  // reviews_count
  if (typeof card.reviewsCount === 'number' && card.reviewsCount > 0) {
    filled.push('reviews_count');
    score += WEIGHTS.reviews_count;
  } else {
    missing.push('reviews_count');
    notes.push('Количество отзывов = 0 или отсутствует — проверьте поле feedbacks (WB) / reviews (Ozon).');
  }

  // images (>= 3)
  if (Array.isArray(card.images) && card.images.length >= 3) {
    filled.push('images');
    score += WEIGHTS.images;
  } else {
    missing.push('images');
    notes.push(`Картинок ${Array.isArray(card.images) ? card.images.length : 0} (нужно >=3) — расширьте парсер галереи.`);
  }

  // attributes (>= 5)
  const attrCount = card.attributes ? Object.keys(card.attributes).length : 0;
  if (attrCount >= 5) {
    filled.push('attributes');
    score += WEIGHTS.attributes;
  } else {
    missing.push('attributes');
    notes.push(`Атрибутов ${attrCount} (нужно >=5) — характеристики критичны для seo-факторов маркетплейса.`);
  }

  // category / breadcrumbs
  if (typeof card.category === 'string' && card.category.trim() && card.category !== 'Не определена') {
    filled.push('category');
    score += WEIGHTS.category;
  } else {
    missing.push('category');
    notes.push('Категория/хлебные крошки не определены — без них рекомендации по нишам неточны.');
  }

  // brand — пытаемся из attributes / sourceData
  const brand =
    findAttrCaseInsensitive(card.attributes, /бренд|brand|марка/i) ??
    (typeof card.sourceData?.brand === 'string' ? card.sourceData.brand : undefined);
  if (brand && String(brand).trim()) {
    filled.push('brand');
    score += WEIGHTS.brand;
  } else {
    missing.push('brand');
  }

  // video
  if (typeof card.videoCount === 'number' && card.videoCount > 0) {
    filled.push('video');
    score += WEIGHTS.video;
  } else {
    missing.push('video');
  }

  // seller
  const seller =
    findAttrCaseInsensitive(card.attributes, /продавец|seller|магазин/i) ??
    (typeof card.sourceData?.seller === 'string' ? card.sourceData.seller : undefined) ??
    (typeof card.sourceData?.supplier === 'string' ? card.sourceData.supplier : undefined);
  if (seller && String(seller).trim()) {
    filled.push('seller');
    score += WEIGHTS.seller;
  } else {
    missing.push('seller');
  }

  const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0); // = 100
  const pct = Math.max(0, Math.min(100, Math.round((score / total) * 100)));

  if (notes.length === 0) {
    notes.push('Парсер отработал чисто — все ключевые поля заполнены.');
  }

  return {
    data_confidence_pct: pct,
    missing_fields: missing,
    filled_fields: filled,
    field_weights: { ...WEIGHTS },
    notes,
  };
}
