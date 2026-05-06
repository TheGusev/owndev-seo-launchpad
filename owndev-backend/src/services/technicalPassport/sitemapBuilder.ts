/**
 * sitemap.xml builder — V3.
 *
 * Generates a Sitemaps 0.9 compliant XML from strategy.pages.
 * For pages with parametrised URL patterns ({slug}, {city}, ...), the
 * builder emits a single representative URL with priority/changefreq;
 * downstream the developerPack can expand parametric URLs from clusters.
 */

import type { PassportInputs } from './types.js';
import type { SiteStrategy, SitePage } from '../strategy/types.js';

export function buildSitemapXml(inputs: PassportInputs, strategy: SiteStrategy): string {
  const today = new Date().toISOString().slice(0, 10);

  const urls: string[] = [];
  for (const page of strategy.pages) {
    const url = inputs.base_url + materialiseUrl(page.url_pattern);
    urls.push(
      [
        '  <url>',
        `    <loc>${escapeXml(url)}</loc>`,
        `    <lastmod>${today}</lastmod>`,
        `    <changefreq>${page.changefreq}</changefreq>`,
        `    <priority>${page.priority.toFixed(1)}</priority>`,
        '  </url>',
      ].join('\n'),
    );
  }

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
}

function materialiseUrl(pattern: string): string {
  // Replace {placeholders} with URL-safe defaults so sitemap is valid even
  // before clusters are expanded.
  return pattern.replace(/\{([^}]+)\}/g, (_, name) => `:${name}`);
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function expandSitemapForPage(
  baseUrl: string,
  page: SitePage,
  values: Record<string, string>,
): string {
  let url = page.url_pattern;
  for (const [k, v] of Object.entries(values)) {
    url = url.replace(`{${k}}`, encodeURIComponent(v));
  }
  return baseUrl + url;
}
