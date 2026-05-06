/**
 * extractors/headMeta — extracts <head> meta from HTML.
 */

import * as cheerio from 'cheerio';
import type { HeadMeta } from '../types.js';

export function extractHeadMeta(html: string): HeadMeta {
  const $ = cheerio.load(html);

  const ogProps: Record<string, string> = {};
  $('meta[property^="og:"]').each((_, el) => {
    const prop = $(el).attr('property');
    const content = $(el).attr('content');
    if (prop && content) ogProps[prop] = content;
  });

  return {
    title: ($('head > title').first().text() || '').trim() || null,
    meta_description: $('meta[name="description"]').attr('content') ?? null,
    canonical: $('link[rel="canonical"]').attr('href') ?? null,
    robots_meta: $('meta[name="robots"]').attr('content') ?? null,
    lang: $('html').attr('lang') ?? null,
    open_graph: ogProps,
  };
}

export function isIndexable(robotsMeta: string | null, headers?: Record<string, string>): boolean {
  const tag = (robotsMeta ?? '').toLowerCase();
  if (tag.includes('noindex') || tag.includes('none')) return false;
  const xRobots = (headers?.['x-robots-tag'] ?? headers?.['X-Robots-Tag'] ?? '').toLowerCase();
  if (xRobots.includes('noindex') || xRobots.includes('none')) return false;
  return true;
}
