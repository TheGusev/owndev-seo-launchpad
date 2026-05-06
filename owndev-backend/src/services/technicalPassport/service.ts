/**
 * services/technicalPassport — V3 orchestrator.
 *
 * Composes all builder outputs into a single TechnicalPassportArtifacts
 * object that the developerPack can later embed into the super-prompt
 * pack ZIP.
 */

import type { PassportInputs, TechnicalPassportArtifacts } from './types.js';
import type { SiteStrategy } from '../strategy/types.js';
import { buildLlmsTxt } from './llmsTxtBuilder.js';
import { buildRobotsTxt } from './robotsTxtBuilder.js';
import { buildAiWellKnown } from './aiWellKnownBuilder.js';
import { buildSitemapXml } from './sitemapBuilder.js';
import { buildDataLayer } from './dataLayerBuilder.js';
import { buildHeaders, flattenHeaders } from './headersBuilder.js';

export class TechnicalPassportService {
  build(inputs: PassportInputs, strategy: SiteStrategy): TechnicalPassportArtifacts {
    const llms_txt = buildLlmsTxt(inputs, strategy);
    const robots = buildRobotsTxt(inputs);
    const wellKnown = buildAiWellKnown(inputs);
    const sitemap_xml = buildSitemapXml(inputs, strategy);
    const dataLayer = buildDataLayer(strategy);
    const headerRules = buildHeaders(inputs);

    return {
      llms_txt,
      robots_txt: robots.content,
      ai_well_known: wellKnown.content,
      sitemap_xml,
      data_layer: {
        init_snippet: dataLayer.init_snippet,
        events: dataLayer.events,
        ga4_event_map: dataLayer.ga4_event_map,
        yandex_goals: dataLayer.yandex_goals,
      },
      required_headers: flattenHeaders(headerRules),
      ai_bots_allowed: robots.allowed,
      ai_bots_blocked: robots.blocked,
      csp_recommendation: headerRules.csp_recommendation,
    };
  }
}

export const technicalPassportService = new TechnicalPassportService();
