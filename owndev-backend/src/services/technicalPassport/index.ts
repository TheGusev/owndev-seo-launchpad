/**
 * services/technicalPassport — V3 public API.
 */

export type { PassportInputs, TechnicalPassportArtifacts } from './types.js';
export { AI_BOTS, aiBotsForPolicy } from './aiBotsRegistry.js';
export { buildLlmsTxt } from './llmsTxtBuilder.js';
export { buildRobotsTxt } from './robotsTxtBuilder.js';
export { buildAiWellKnown } from './aiWellKnownBuilder.js';
export { buildSitemapXml, expandSitemapForPage } from './sitemapBuilder.js';
export { buildDataLayer } from './dataLayerBuilder.js';
export { buildHeaders, flattenHeaders } from './headersBuilder.js';
export { TechnicalPassportService, technicalPassportService } from './service.js';
