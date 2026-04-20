import type { ParsedProduct } from '../../../types/marketplaceAudit.js';
import { logger } from '../../../utils/logger.js';

/**
 * Ozon serves a JS-only SPA shell to server-side fetches (often 403 / empty).
 * MVP strategy: proxy through Jina Reader (https://r.jina.ai/<url>), which
 * renders the page and returns clean JSON with title + content. We then
 * extract price/rating/reviews/brand via regex from the rendered text.
 */

export function extractOzonProductPath(input: string): string | null {
  const trimmed = String(input).trim();
  if (/^https?:\/\//.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      if (!u.hostname.includes('ozon')) return null;
      return u.pathname.replace(/\/+$/, '');
    } catch { return null; }
  }
  // bare SKU — Ozon has numeric SKUs
  if (/^\d{6,12}$/.test(trimmed)) {
    return `/product/${trimmed}`;
  }
  return null;
}

function cleanTitle(t: string): string {
  return t
    .replace(/\s*[—|-]\s*купить.*$/i, '')
    .replace(/\s*\|\s*Ozon.*$/i, '')
    .replace(/\s*интернет[- ]магазин.*$/i, '')
    .trim();
}

function extractBrand(text: string): string {
  const m = text.match(/Бренд[:\s]+([A-Za-zА-Яа-я0-9 \-_.&]{2,40})/);
  return m ? m[1].trim() : '';
}

export async function parseOzon(input: string): Promise<ParsedProduct> {
  const path = extractOzonProductPath(input);
  if (!path) throw new Error('Не удалось определить URL карточки Ozon');

  const targetUrl = `https://www.ozon.ru${path}`;
  const jinaUrl = `https://r.jina.ai/${targetUrl}`;

  let jina: any = null;
  try {
    const r = await fetch(jinaUrl, {
      headers: {
        Accept: 'application/json',
        'X-Return-Format': 'json',
      },
      signal: AbortSignal.timeout(30000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    jina = await r.json();
  } catch (e) {
    logger.warn('OZON_PARSER', `jina fetch failed: ${(e as Error).message}`);
    throw new Error('Не удалось получить данные Ozon. Используйте ручной ввод.');
  }

  const data = jina?.data ?? jina ?? {};
  const rawTitle: string = String(data.title ?? '').trim();
  const content: string = String(data.content ?? '').trim();

  if (!content || content.length < 100) {
    throw new Error('Не удалось получить данные Ozon. Используйте ручной ввод.');
  }

  const title = cleanTitle(rawTitle) || 'Без названия';

  // Numeric extractions
  const ratingMatch = content.match(/(\d+[.,]\d+)\s*из\s*5/i);
  const rating = ratingMatch ? parseFloat(ratingMatch[1].replace(',', '.')) : 0;

  const reviewMatch = content.match(/(\d[\d\s]*)\s*отзыв/i);
  const reviewsCount = reviewMatch ? parseInt(reviewMatch[1].replace(/\s/g, ''), 10) : 0;

  const brand = extractBrand(content);

  // Description: first ~1500 chars of content, trimmed
  const description = content.slice(0, 1500).trim();

  // Images — Jina sometimes returns data.images as array of URLs
  let images: string[] = [];
  if (Array.isArray(data.images)) {
    images = data.images.filter((u: any) => typeof u === 'string').slice(0, 12);
  } else if (data.images && typeof data.images === 'object') {
    images = Object.values(data.images).filter((u: any) => typeof u === 'string').slice(0, 12) as string[];
  }

  const attributes: Record<string, string> = {};
  if (brand) attributes['Бренд'] = brand;

  return {
    platform: 'ozon',
    title,
    description,
    category: 'Не определена',
    attributes,
    images,
    reviewsCount,
    rating,
    url: targetUrl,
    sourceData: { path, source: 'jina' },
  };
}
