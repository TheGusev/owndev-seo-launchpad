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

/**
 * Извлечь категорию из бредкрамбсов Ozon. Варианты, которые видит Jina:
 *   "Главная / Раздел / Категория / ..."
 *   "Главная > Раздел > Категория"
 *   "Каталог / Раздел / Категория"
 * Берём предпоследний элемент (последний часто — имя самого товара).
 */
function extractCategory(text: string, metadata?: any): string {
  // 1) Пробуем metadata Jina (description, og-tags)
  const metaDesc = String(metadata?.description ?? '');
  for (const candidate of [text.slice(0, 1500), metaDesc]) {
    if (!candidate) continue;
    const m = candidate.match(/(?:Главная|Каталог)\s*[\/>»]\s*([^\n\r]{4,300})/);
    if (m) {
      const trail = m[1];
      const parts = trail.split(/\s*[\/>»]\s*/).map((s) => s.trim()).filter(Boolean);
      if (parts.length >= 1) {
        // последний элемент обычно — имя товара. Предпоследний — категория.
        // Но если элементов ≤2 — берём последний.
        const idx = parts.length >= 3 ? parts.length - 2 : parts.length - 1;
        const cat = parts[idx];
        if (cat && cat.length >= 2 && cat.length <= 80) return cat;
      }
    }
  }
  return '';
}

/**
 * Извлечь характеристики товара из markdown-content Jina.
 * Ozon рендерит блок списком «Имя: Значение» или «Имя\nЗначение»,
 * обычно после заголовка «Характеристики» / «Спецификация».
 */
function extractAttributes(text: string): Record<string, string> {
  const out: Record<string, string> = {};

  // ищем секцию характеристик (от заголовка до следующего блока)
  const headerRx =
    /(?:^|\n)#{0,4}\s*(?:Характеристики(?:\s+товара)?|Спецификация)\s*\n([\s\S]{0,4000})/i;
  const m = text.match(headerRx);
  const section = m ? m[1] : text;

  // Проходимся по строкам, ловим «Имя: Значение» (или «Имя Значение» в markdown-table)
  const lineRx = /^[\-\*\|\s]*([А-Яа-яёЁ0-9A-Za-z][А-Яа-яёЁ0-9A-Za-z\s\-\/\(\),.]{1,60}?)\s*[:—\|]\s*(.+?)$/;
  for (const line of section.split(/\n/)) {
    const trimmed = line.trim();
    if (trimmed.length < 4 || trimmed.length > 200) continue;
    const lm = trimmed.match(lineRx);
    if (!lm) continue;
    const name = lm[1].trim().replace(/[\s ]+$/, '');
    let value = lm[2].trim()
      .replace(/^\|\s*/, '')
      .replace(/\s*\|$/, '')
      .replace(/^\[\s*/, '')
      .replace(/\s*\]\(.*?\)$/, '');
    if (!name || !value) continue;
    if (value.length > 200) value = value.slice(0, 197) + '...';
    // отрезаем служебные ячейки / ссылки
    if (/^https?:\/\//.test(value)) continue;
    if (/^\-+$/.test(value)) continue;
    out[name] = value;
    if (Object.keys(out).length >= 40) break; // жёсткий потолок
  }
  return out;
}

/**
 * Оценка кол-ва видео в карточке Ozon по markdown-content Jina.
 * Работает грубо — Jina обычно вставляет маркеры «[Видео]» / iframe-линки
 * или конструкции "видео: N" в блоке медиа.
 */
function countVideos(text: string, data: any): number {
  let count = 0;
  // 1) Jina иногда отдаёт список видео
  if (Array.isArray(data?.videos)) count += data.videos.length;
  // 2) маркеры в тексте — одно видео обычно оставляет несколько
  // пересекающихся следов («[Видео]» + "video.ozonusercontent" + ".mp4"),
  // поэтому делим примерно на 3, потолок 6.
  const hits = text.match(/(?:\[Видео\]|video\.ozonusercontent|\.mp4|\.m3u8|<video)/gi);
  if (hits) count += Math.min(Math.ceil(hits.length / 3), 6);
  return count;
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
  const metadata = data?.metadata ?? null;
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

  // Категория из бредкрамбсов + характеристики из блока «Характеристики»,
  // видео — по маркерам content / Jina-data.videos.
  const category = extractCategory(content, metadata);
  const attributes = extractAttributes(content);
  if (brand && !attributes['Бренд']) attributes['Бренд'] = brand;
  const videoCount = countVideos(content, data);

  return {
    platform: 'ozon',
    title,
    description,
    category: category || 'Не определена',
    attributes,
    images,
    videoCount,
    reviewsCount,
    rating,
    url: targetUrl,
    sourceData: {
      path,
      source: 'jina',
      attributesCount: Object.keys(attributes).length,
      videoCount,
      categoryFound: !!category,
    },
  };
}
