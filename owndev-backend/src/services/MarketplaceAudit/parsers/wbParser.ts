import type { ParsedProduct } from '../../../types/marketplaceAudit.js';
import { logger } from '../../../utils/logger.js';

const WB_BASKET_HOSTS = [
  'basket-01','basket-02','basket-03','basket-04','basket-05',
  'basket-06','basket-07','basket-08','basket-09','basket-10',
  'basket-11','basket-12','basket-13','basket-14','basket-15',
];

function vol(nm: number): number { return Math.floor(nm / 1e5); }
function part(nm: number): number { return Math.floor(nm / 1e3); }

function basketUrl(nm: number, host: string): string {
  return `https://${host}.wbbasket.ru/vol${vol(nm)}/part${part(nm)}/${nm}/info/ru/card.json`;
}

function imagesFor(nm: number, count: number, host: string): string[] {
  const urls: string[] = [];
  for (let i = 1; i <= count; i++) {
    urls.push(`https://${host}.wbbasket.ru/vol${vol(nm)}/part${part(nm)}/${nm}/images/big/${i}.webp`);
  }
  return urls;
}

export function extractWbNm(input: string): number | null {
  // Accept full URL like https://www.wildberries.ru/catalog/12345678/detail.aspx or bare SKU
  const m = String(input).match(/(\d{6,12})/);
  return m ? Number(m[1]) : null;
}

export async function parseWb(input: string): Promise<ParsedProduct> {
  const nm = extractWbNm(input);
  if (!nm) throw new Error('Не удалось определить артикул WB из значения');

  // 1) basic detail (price, brand, name, supplierId, …)
  const detailUrl = `https://card.wb.ru/cards/v2/detail?appType=1&curr=rub&dest=-1257786&spp=30&nm=${nm}`;
  let basicJson: any = null;
  try {
    const r = await fetch(detailUrl, { headers: { 'User-Agent': 'Mozilla/5.0 OWNDEVBot/1.0' } });
    if (r.ok) basicJson = await r.json();
  } catch (e) {
    logger.warn('WB_PARSER', `detail fetch failed: ${(e as Error).message}`);
  }

  const product = basicJson?.data?.products?.[0];
  let title = product?.name?.trim() || '';
  let brand = product?.brand?.trim() || '';
  let category = product?.entity || product?.subj_root_name || product?.subjectName || '';
  let images: string[] = [];
  const picsCount = Number(product?.pics ?? 0);

  // 2) detailed card.json from basket — for description / characteristics
  let cardJson: any = null;
  for (const host of WB_BASKET_HOSTS) {
    try {
      const r = await fetch(basketUrl(nm, host), { headers: { 'User-Agent': 'Mozilla/5.0 OWNDEVBot/1.0' } });
      if (r.ok) {
        cardJson = await r.json();
        if (picsCount > 0) images = imagesFor(nm, Math.min(picsCount, 12), host);
        break;
      }
    } catch { /* try next basket */ }
  }

  if (cardJson) {
    if (!title && typeof cardJson.imt_name === 'string') title = cardJson.imt_name;
  }
  const description = String(cardJson?.description ?? '').trim();

  const attributes: Record<string, string> = {};
  if (Array.isArray(cardJson?.options)) {
    for (const opt of cardJson.options) {
      const name = String(opt?.name ?? '').trim();
      const value = String(opt?.value ?? '').trim();
      if (name && value) attributes[name] = value;
    }
  } else if (Array.isArray(cardJson?.grouped_options)) {
    for (const grp of cardJson.grouped_options) {
      for (const opt of grp.options ?? []) {
        const name = String(opt?.name ?? '').trim();
        const value = String(opt?.value ?? '').trim();
        if (name && value) attributes[name] = value;
      }
    }
  }
  if (brand && !attributes['Бренд']) attributes['Бренд'] = brand;

  if (!title && !description && images.length === 0) {
    throw new Error('Не удалось получить данные карточки с Wildberries. Используйте ручной ввод.');
  }

  return {
    platform: 'wb',
    title: title || `Артикул ${nm}`,
    description,
    category: category || 'Не определена',
    attributes,
    images,
    reviewsCount: Number(product?.feedbacks ?? 0),
    rating: Number(product?.reviewRating ?? 0),
    url: `https://www.wildberries.ru/catalog/${nm}/detail.aspx`,
    sourceData: { nm, picsCount },
  };
}
