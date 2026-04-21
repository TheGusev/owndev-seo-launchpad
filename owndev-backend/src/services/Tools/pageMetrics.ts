/**
 * Лёгкий HTML-парсер для одной страницы.
 * Возвращает объект, форма которого 1:1 совпадает с интерфейсом
 * PageMetrics в src/components/tools/CompetitorAnalysis.tsx.
 */
import { logger } from '../../utils/logger.js';

export interface PageMetrics {
  url: string;
  title: string;
  description: string;
  h1: string;
  h2Count: number;
  h3Count: number;
  wordCount: number;
  imageCount: number;
  imagesWithoutAlt: number;
  hasJsonLd: boolean;
  jsonLdTypes: string[];
  jsonLdCount: number;
  hasFaq: boolean;
  hasViewport: boolean;
  hasCanonical: boolean;
  hasOg: boolean;
  loadTimeMs: number;
  htmlSizeKB: number;
  internalLinks: number;
  externalLinks: number;
  isHttps: boolean;
  hasRobotsTxt: boolean;
  hasSitemapXml: boolean;
  lang: string;
  listCount: number;
  tableCount: number;
  brokenLinks: string[];
  seoScore: number;
  imgsWithoutDimensions: number;
  hasLazyImages: boolean;
  hasFontDisplaySwap: boolean;
  hasPreloadHero: boolean;
}

const UA = 'Mozilla/5.0 (compatible; OwndevBot/1.0; +https://owndev.ru)';

function safeMatch(html: string, re: RegExp): string {
  const m = html.match(re);
  return m ? (m[1] ?? '').trim() : '';
}

function countMatches(html: string, re: RegExp): number {
  return (html.match(re) || []).length;
}

function extractText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractJsonLdTypes(html: string): string[] {
  const blocks = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi) || [];
  const types: string[] = [];
  for (const block of blocks) {
    const inner = block.replace(/<script[^>]*>/i, '').replace(/<\/script>/i, '');
    try {
      const data = JSON.parse(inner);
      const list = Array.isArray(data) ? data : [data];
      for (const item of list) {
        if (item && typeof item['@type'] === 'string') types.push(item['@type']);
        else if (item && Array.isArray(item['@type'])) types.push(...item['@type']);
      }
    } catch {
      // ignore broken JSON-LD
    }
  }
  return types;
}

function calcSeoScore(m: Omit<PageMetrics, 'seoScore'>): number {
  let score = 0;
  if (m.title.length >= 20 && m.title.length <= 70) score += 12;
  else if (m.title.length > 0) score += 6;
  if (m.description.length >= 80 && m.description.length <= 180) score += 12;
  else if (m.description.length > 0) score += 5;
  if (m.h1) score += 8;
  if (m.h2Count >= 2) score += 8;
  if (m.wordCount >= 600) score += 14;
  else if (m.wordCount >= 300) score += 8;
  else if (m.wordCount >= 100) score += 3;
  if (m.imagesWithoutAlt === 0 && m.imageCount > 0) score += 6;
  if (m.hasJsonLd) score += 8;
  if (m.hasCanonical) score += 5;
  if (m.hasOg) score += 5;
  if (m.hasViewport) score += 4;
  if (m.isHttps) score += 6;
  if (m.hasRobotsTxt) score += 4;
  if (m.hasSitemapXml) score += 4;
  if (m.hasLazyImages) score += 2;
  if (m.htmlSizeKB > 0 && m.htmlSizeKB < 250) score += 2;
  return Math.min(100, score);
}

async function checkSibling(origin: string, path: string): Promise<boolean> {
  try {
    const r = await fetch(`${origin}${path}`, {
      method: 'GET',
      headers: { 'User-Agent': UA },
      signal: AbortSignal.timeout(5000),
    });
    return r.ok;
  } catch {
    return false;
  }
}

export async function fetchPageMetrics(targetUrl: string): Promise<PageMetrics | null> {
  let url: URL;
  try {
    url = new URL(targetUrl);
  } catch {
    return null;
  }

  const t0 = Date.now();
  let html = '';
  let status = 0;

  try {
    const r = await fetch(url.toString(), {
      headers: { 'User-Agent': UA, Accept: 'text/html,*/*' },
      signal: AbortSignal.timeout(15_000),
      redirect: 'follow',
    });
    status = r.status;
    html = await r.text();
  } catch (e) {
    logger.warn('PAGE_METRICS', `fetch ${url.toString()} failed: ${(e as Error).message}`);
    return null;
  }

  const loadTimeMs = Date.now() - t0;
  if (status >= 400 || !html) return null;

  const htmlSizeKB = Math.round(new TextEncoder().encode(html).byteLength / 1024);

  const title = safeMatch(html, /<title[^>]*>([^<]*)<\/title>/i);
  const description = safeMatch(html, /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
  const h1 = safeMatch(html, /<h1[^>]*>([\s\S]*?)<\/h1>/i).replace(/<[^>]+>/g, '').trim();
  const lang = safeMatch(html, /<html[^>]+lang=["']([^"']+)["']/i);

  const h2Count = countMatches(html, /<h2[\s>]/gi);
  const h3Count = countMatches(html, /<h3[\s>]/gi);
  const listCount = countMatches(html, /<(ul|ol)[\s>]/gi);
  const tableCount = countMatches(html, /<table[\s>]/gi);

  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const imageCount = imgs.length;
  const imagesWithoutAlt = imgs.filter((t) => !/\salt=/i.test(t)).length;
  const imgsWithoutDimensions = imgs.filter((t) => !(/\swidth=/i.test(t) && /\sheight=/i.test(t))).length;
  const hasLazyImages = imgs.some((t) => /loading=["']lazy["']/i.test(t));

  const jsonLdTypes = extractJsonLdTypes(html);
  const hasJsonLd = jsonLdTypes.length > 0;
  const hasFaq = jsonLdTypes.some((t) => /FAQPage/i.test(t));
  const hasViewport = /<meta[^>]+name=["']viewport["']/i.test(html);
  const hasCanonical = /<link[^>]+rel=["']canonical["']/i.test(html);
  const hasOg = /<meta[^>]+property=["']og:/i.test(html);
  const hasFontDisplaySwap = /font-display\s*:\s*swap/i.test(html);
  const hasPreloadHero = /<link[^>]+rel=["']preload["'][^>]+as=["'](image|font)["']/i.test(html);

  const text = extractText(html);
  const wordCount = text ? text.split(/\s+/).filter(Boolean).length : 0;

  const links = [...html.matchAll(/<a\b[^>]*href=["']([^"'#]+)["']/gi)].map((m) => m[1]);
  const origin = url.origin;
  let internalLinks = 0;
  let externalLinks = 0;
  for (const href of links) {
    if (!href || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('javascript:')) continue;
    if (href.startsWith('/') || href.startsWith(origin)) internalLinks++;
    else if (/^https?:\/\//i.test(href)) externalLinks++;
    else internalLinks++;
  }

  const [hasRobotsTxt, hasSitemapXml] = await Promise.all([
    checkSibling(origin, '/robots.txt'),
    checkSibling(origin, '/sitemap.xml'),
  ]);

  const base: Omit<PageMetrics, 'seoScore'> = {
    url: url.toString(),
    title,
    description,
    h1,
    h2Count,
    h3Count,
    wordCount,
    imageCount,
    imagesWithoutAlt,
    hasJsonLd,
    jsonLdTypes,
    jsonLdCount: jsonLdTypes.length,
    hasFaq,
    hasViewport,
    hasCanonical,
    hasOg,
    loadTimeMs,
    htmlSizeKB,
    internalLinks,
    externalLinks,
    isHttps: url.protocol === 'https:',
    hasRobotsTxt,
    hasSitemapXml,
    lang,
    listCount,
    tableCount,
    brokenLinks: [],
    imgsWithoutDimensions,
    hasLazyImages,
    hasFontDisplaySwap,
    hasPreloadHero,
  };

  return { ...base, seoScore: calcSeoScore(base) };
}