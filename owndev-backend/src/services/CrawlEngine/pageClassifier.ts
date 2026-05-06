/**
 * Эвристический классификатор типа страницы по URL + содержимому.
 * Возвращает page_type, который потом сопоставляется с PageContract.
 *
 * Это намеренно дешёвый детектор — точность 70..80%, чего достаточно
 * для формирования gap-отчёта. Финальное соответствие проверяется
 * по контракту (gapAnalyzer).
 */

export interface PageClassifyInput {
  url: string;
  rootUrl: string;
  title?: string | null;
  h1?: string | null;
  schemas?: string[];
  blocks?: string[];
}

const URL_RULES: Array<[RegExp, string]> = [
  [/^\/?$/, 'home'],
  [/^\/(index|main)(\.html?)?$/i, 'home'],
  [/^\/about(\/|$)/i, 'about'],
  [/^\/contacts?(\/|$)/i, 'contacts'],
  [/^\/contact(s)?\/?$/i, 'contacts'],
  [/^\/blog(\/|$)/i, 'blog_index'],
  [/^\/blog\/[^/]+\/?$/i, 'blog_post'],
  [/^\/news(\/|$)/i, 'blog_index'],
  [/^\/articles?(\/|$)/i, 'blog_index'],
  [/^\/faq(\/|$)/i, 'faq'],
  [/^\/pricing(\/|$)/i, 'pricing'],
  [/^\/price(s)?(\/|$)/i, 'pricing'],
  [/^\/services?(\/|$)$/i, 'services_index'],
  [/^\/services?\/[^/]+\/?$/i, 'service_detail'],
  [/^\/uslugi\/?$/i, 'services_index'],
  [/^\/uslugi\/[^/]+\/?$/i, 'service_detail'],
  [/^\/portfolio(\/|$)/i, 'portfolio_index'],
  [/^\/cases?(\/|$)/i, 'portfolio_index'],
  [/^\/case[s]?\/[^/]+\/?$/i, 'case_detail'],
  [/^\/products?(\/|$)$/i, 'product_index'],
  [/^\/products?\/[^/]+\/?$/i, 'product_detail'],
  [/^\/catalog(\/|$)$/i, 'category'],
  [/^\/catalog\/[^/]+\/?$/i, 'category'],
  [/^\/cart\/?$/i, 'cart'],
  [/^\/checkout\/?$/i, 'checkout'],
  [/^\/[a-z-]+\/(moskva|spb|ekaterinburg|kazan|nsk|nizhny|rostov|krasnodar)\/?$/i, 'geo_landing'],
];

export function classifyPage(input: PageClassifyInput): string {
  const u = new URL(input.url);
  const path = u.pathname;
  for (const [rx, type] of URL_RULES) {
    if (rx.test(path)) return type;
  }

  // Schema-based fallbacks
  const schemas = (input.schemas || []).map((s) => s.toLowerCase());
  if (schemas.includes('product')) return 'product_detail';
  if (schemas.includes('article') || schemas.includes('blogposting')) return 'blog_post';
  if (schemas.includes('faqpage')) return 'faq';
  if (schemas.includes('localbusiness')) return 'home';
  if (schemas.includes('service')) return 'service_detail';

  // Block-based fallback
  const blocks = input.blocks || [];
  if (blocks.includes('pricing_table')) return 'pricing';
  if (blocks.includes('faq')) return 'faq';

  // Heuristic via H1 keywords
  const h1 = (input.h1 || '').toLowerCase();
  if (/прайс|цены|стоимость|тариф/.test(h1)) return 'pricing';
  if (/контакт/.test(h1)) return 'contacts';
  if (/о (нас|компании)|about/.test(h1)) return 'about';

  return 'other';
}
