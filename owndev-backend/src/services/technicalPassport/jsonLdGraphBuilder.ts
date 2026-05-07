/**
 * services/technicalPassport/jsonLdGraphBuilder
 *
 * Собирает готовый JSON-LD graph для вставки в <head> сайта.
 * Включает Organization + WebSite + BreadcrumbList + LocalBusiness (если geo).
 *
 * Формат — schema.org/JSON-LD, отдаётся как готовая строка с обёрткой <script>.
 */

import type { PassportInputs } from './types.js';
import type { SiteStrategy } from '../strategy/types.js';

export interface JsonLdGraphResult {
  /** Полный <script type="application/ld+json"> блок — копируй как есть в <head> */
  script_tag: string;
  /** Сырой JSON-объект (без <script> обёртки) — для отдельного встраивания */
  raw_json: string;
}

export function buildJsonLdGraph(
  inputs: PassportInputs,
  _strategy: SiteStrategy,
): JsonLdGraphResult {
  const baseUrl = inputs.base_url.replace(/\/$/, '');

  const organization: Record<string, unknown> = {
    '@type': 'Organization',
    '@id': `${baseUrl}#organization`,
    name: inputs.brand_name,
    url: baseUrl,
    description: inputs.description_ru,
    email: inputs.contact_email,
    logo: {
      '@type': 'ImageObject',
      url: `${baseUrl}/logo.png`,
      width: '512',
      height: '512',
    },
    areaServed: {
      '@type': 'Country',
      name: inputs.primary_geo === 'RU' ? 'Россия' : inputs.primary_geo,
    },
    inLanguage: inputs.languages,
  };

  const website: Record<string, unknown> = {
    '@type': 'WebSite',
    '@id': `${baseUrl}#website`,
    url: baseUrl,
    name: inputs.brand_name,
    description: inputs.description_ru,
    inLanguage: inputs.languages[0] ?? 'ru',
    publisher: { '@id': `${baseUrl}#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${baseUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const breadcrumb: Record<string, unknown> = {
    '@type': 'BreadcrumbList',
    '@id': `${baseUrl}#breadcrumb-home`,
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Главная',
        item: baseUrl,
      },
    ],
  };

  const graph: Array<Record<string, unknown>> = [organization, website, breadcrumb];

  // LocalBusiness — если задан primary_geo как RU-XXX (региональный код)
  if (inputs.primary_geo && inputs.primary_geo.startsWith('RU-')) {
    graph.push({
      '@type': 'LocalBusiness',
      '@id': `${baseUrl}#localbusiness`,
      name: inputs.brand_name,
      url: baseUrl,
      email: inputs.contact_email,
      areaServed: inputs.primary_geo,
      address: { '@type': 'PostalAddress', addressCountry: 'RU' },
    });
  }

  const ldJson = {
    '@context': 'https://schema.org',
    '@graph': graph,
  };

  const raw_json = JSON.stringify(ldJson, null, 2);
  const script_tag = `<script type="application/ld+json">\n${raw_json}\n</script>`;

  return { script_tag, raw_json };
}
