/**
 * Извлекаем структурированные данные из HTML с помощью cheerio.
 * Без puppeteer — только статический HTML. Для SPA fallback вызывающий
 * слой может использовать Jina Reader (https://r.jina.ai/<url>),
 * это уже задача более высокого уровня, здесь — чистый парсер.
 */
import * as cheerio from 'cheerio';
import type { CrawlPageRecord } from './types.js';

const SCHEMA_BLOCK_HINTS: Array<[string, RegExp]> = [
  ['hero', /(hero|jumbotron|first-screen|main-banner)/i],
  ['cta', /(cta|call-to-action|book-now|order-btn)/i],
  ['faq', /(faq|accordion|questions?-)/i],
  ['reviews', /(review|testimonial|otz[yi]v)/i],
  ['pricing_table', /(pricing|price-table|tariff|tarif)/i],
  ['contacts_block', /(contacts?|address|phone-list|map-block)/i],
  ['form', /(form-?lead|callback-form|contact-form|order-form)/i],
  ['gallery', /(gallery|slider|carousel-images)/i],
  ['breadcrumbs', /(breadcrumb)/i],
  ['team', /(team|crew|our-people)/i],
  ['advantages', /(advantages?|benefits?|features?|why-us|why-choose)/i],
  ['portfolio_grid', /(portfolio|cases?-grid|works-grid)/i],
  ['stats', /(stats|counters|achievement-numbers)/i],
];

function detectSchemas($: cheerio.CheerioAPI): string[] {
  const types = new Set<string>();
  $('script[type="application/ld+json"]').each((_, el) => {
    const txt = $(el).contents().text();
    if (!txt) return;
    try {
      const parsed = JSON.parse(txt);
      const arr = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of arr) {
        if (!node) continue;
        const t = node['@type'];
        if (Array.isArray(t)) t.forEach((x) => typeof x === 'string' && types.add(x));
        else if (typeof t === 'string') types.add(t);
        if (Array.isArray(node['@graph'])) {
          for (const g of node['@graph']) {
            const gt = g?.['@type'];
            if (Array.isArray(gt)) gt.forEach((x) => typeof x === 'string' && types.add(x));
            else if (typeof gt === 'string') types.add(gt);
          }
        }
      }
    } catch {
      /* ignore malformed */
    }
  });
  // Microdata fallback
  $('[itemscope][itemtype]').each((_, el) => {
    const t = $(el).attr('itemtype') || '';
    const m = t.match(/schema\.org\/(\w+)/);
    if (m) types.add(m[1]);
  });
  return Array.from(types);
}

function detectBlocks($: cheerio.CheerioAPI): string[] {
  const blocks = new Set<string>();
  // class/id-based hints
  $('*[class],*[id]').each((_, el) => {
    const cls = ($(el).attr('class') || '') + ' ' + ($(el).attr('id') || '');
    if (!cls) return;
    for (const [name, rx] of SCHEMA_BLOCK_HINTS) {
      if (rx.test(cls)) blocks.add(name);
    }
  });
  // semantic
  if ($('header').length) blocks.add('header');
  if ($('footer').length) blocks.add('footer');
  if ($('form').length) blocks.add('form');
  if ($('nav').length) blocks.add('nav');
  return Array.from(blocks);
}

function wordCount(text: string): number {
  return (text.match(/[\p{L}\p{N}]+/gu) || []).length;
}

export function extractFromHtml(
  url: string,
  html: string,
  httpStatus: number | null,
  contentType: string | null,
  fetchMs: number,
): Omit<CrawlPageRecord, 'page_type_guess'> {
  const $ = cheerio.load(html);
  const title = $('head title').first().text().trim() || null;
  const h1 = $('h1').first().text().trim() || null;
  const meta_description =
    $('meta[name="description"]').attr('content')?.trim() ||
    $('meta[property="og:description"]').attr('content')?.trim() ||
    null;
  const canonical = $('link[rel="canonical"]').attr('href')?.trim() || null;
  const robots_meta = $('meta[name="robots"]').attr('content')?.trim() || null;

  // word_count from <main> or <body>
  const text = ($('main').text() || $('body').text() || '').replace(/\s+/g, ' ').trim();
  const word_count = wordCount(text);

  const schemas_found = detectSchemas($);
  const blocks_detected = detectBlocks($);

  const outbound_links = $('a[href^="http"]').length;

  return {
    url,
    http_status: httpStatus,
    content_type: contentType,
    title,
    h1,
    meta_description,
    canonical,
    robots_meta,
    word_count,
    schemas_found,
    blocks_detected,
    raw_html_size: html.length,
    fetch_ms: fetchMs,
    outbound_links,
    notes: {},
  };
}

export function extractInternalLinks(
  $base: string,
  html: string,
): string[] {
  const $ = cheerio.load(html);
  const out = new Set<string>();
  const base = new URL($base);
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href');
    if (!href) return;
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    try {
      const u = new URL(href, base);
      if (u.host !== base.host) return;
      // strip hash + utm
      u.hash = '';
      const sp = u.searchParams;
      Array.from(sp.keys())
        .filter((k) => k.startsWith('utm_') || k === 'fbclid' || k === 'yclid')
        .forEach((k) => sp.delete(k));
      out.add(u.toString().replace(/\/$/, '') || u.toString());
    } catch {
      /* invalid href */
    }
  });
  return Array.from(out);
}
