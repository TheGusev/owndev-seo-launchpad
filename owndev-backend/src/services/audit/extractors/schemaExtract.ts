/**
 * extractors/schemaExtract — extracts and inspects JSON-LD blocks.
 */

import * as cheerio from 'cheerio';
import type { SchemaExtract } from '../types.js';

export function extractSchema(html: string): SchemaExtract {
  const $ = cheerio.load(html);
  const blocks: any[] = [];
  let parsedOk = true;

  $('script[type="application/ld+json"]').each((_, el) => {
    const text = $(el).contents().text().trim();
    if (!text) return;
    try {
      const parsed = JSON.parse(text);
      blocks.push(parsed);
    } catch {
      parsedOk = false;
    }
  });

  const types = new Set<string>();
  let hasGraph = false;
  let hasBreadcrumb = false;
  let hasSameas = false;
  let hasAggregateRating = false;

  const visit = (node: any): void => {
    if (!node || typeof node !== 'object') return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (node['@graph']) {
      hasGraph = true;
      visit(node['@graph']);
    }
    const t = node['@type'];
    if (t) {
      if (Array.isArray(t)) t.forEach((tt: string) => types.add(String(tt)));
      else types.add(String(t));
      if (String(t).includes('BreadcrumbList')) hasBreadcrumb = true;
      if (String(t).includes('AggregateRating')) hasAggregateRating = true;
    }
    if (node.sameAs) hasSameas = true;
    for (const k of Object.keys(node)) {
      if (k.startsWith('@')) continue;
      visit(node[k]);
    }
  };
  blocks.forEach(visit);

  return {
    blocks,
    parsed_ok: parsedOk,
    has_graph: hasGraph || blocks.some((b) => Array.isArray(b)),
    types_present: Array.from(types),
    has_breadcrumb: hasBreadcrumb,
    has_sameas: hasSameas,
    has_aggregate_rating: hasAggregateRating,
  };
}
