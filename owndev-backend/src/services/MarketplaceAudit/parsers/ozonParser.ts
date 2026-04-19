import type { ParsedProduct } from '../../../types/marketplaceAudit.js';
import { logger } from '../../../utils/logger.js';

/**
 * Ozon doesn't expose a stable public JSON for product details without auth.
 * MVP strategy:
 *  1) Try fetching the product page HTML and extract OG meta + JSON-LD.
 *  2) If fails — throw, the orchestrator will surface a friendly error
 *     suggesting manual input.
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

function extractMeta(html: string, prop: string): string | null {
  const re = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'i');
  const m = html.match(re);
  return m ? m[1] : null;
}

function extractAllMeta(html: string, prop: string): string[] {
  const re = new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']+)["']`, 'gi');
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) out.push(m[1]);
  return out;
}

function extractJsonLd(html: string): any[] {
  const out: any[] = [];
  const re = /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null) {
    try { out.push(JSON.parse(m[1].trim())); } catch { /* skip */ }
  }
  return out;
}

export async function parseOzon(input: string): Promise<ParsedProduct> {
  const path = extractOzonProductPath(input);
  if (!path) throw new Error('Не удалось определить URL карточки Ozon');

  const url = `https://www.ozon.ru${path}`;
  let html = '';
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'ru-RU,ru;q=0.9',
      },
      redirect: 'follow',
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    html = await r.text();
  } catch (e) {
    logger.warn('OZON_PARSER', `fetch failed: ${(e as Error).message}`);
    throw new Error('Не удалось получить данные с Ozon. Используйте ручной ввод.');
  }

  const ogTitle = extractMeta(html, 'og:title') || '';
  const ogDesc  = extractMeta(html, 'og:description') || '';
  const ogImage = extractMeta(html, 'og:image');
  const ogImages = extractAllMeta(html, 'og:image');

  const jsonLd = extractJsonLd(html);
  const product = jsonLd.find((j) => j['@type'] === 'Product' || (Array.isArray(j['@type']) && j['@type'].includes('Product'))) || {};

  const title = (product.name as string) || ogTitle || '';
  const description = (product.description as string) || ogDesc || '';
  let images: string[] = Array.isArray(product.image) ? product.image : (product.image ? [product.image] : []);
  if (images.length === 0 && ogImages.length > 0) images = ogImages;
  else if (images.length === 0 && ogImage) images = [ogImage];

  const brand = product.brand?.name || product.brand || '';
  const category = product.category || '';

  const attributes: Record<string, string> = {};
  if (brand) attributes['Бренд'] = String(brand);
  if (Array.isArray(product.additionalProperty)) {
    for (const p of product.additionalProperty) {
      const n = String(p?.name ?? '').trim();
      const v = String(p?.value ?? '').trim();
      if (n && v) attributes[n] = v;
    }
  }

  if (!title && !description && images.length === 0) {
    throw new Error('Карточка Ozon вернула пустые данные. Используйте ручной ввод.');
  }

  return {
    platform: 'ozon',
    title: title || 'Без названия',
    description,
    category: String(category || 'Не определена'),
    attributes,
    images,
    url,
    sourceData: { path },
  };
}
