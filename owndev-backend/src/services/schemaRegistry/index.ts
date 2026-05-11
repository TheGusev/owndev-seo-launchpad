/**
 * services/schemaRegistry — V3 JSON-LD layer.
 *
 * Public API:
 *   buildGraph(input)            — assemble per-page @graph
 *   validateGraph(graph)         — Rich Results / Yandex eligibility check
 *   getRecipe(code, pageType)    — peek the recipe for a given page
 *   renderGraphScript(graph)     — render <script type="application/ld+json">
 */
export * from './types.js';
export {
  buildGraph,
  renderGraphScript,
  type GraphBuildInput,
  type GraphBuildResult,
} from './graphBuilder.js';
export {
  validateGraph,
  validateNodeStandalone,
} from './richResultsValidator.js';
export {
  getRecipe,
  listPageTypes,
  RECIPES,
  type GraphRecipe,
} from './verticalVariants.js';
export {
  buildOrganization,
  buildLocalBusiness,
  buildWebSite,
  buildWebPage,
  buildService,
  buildProduct,
  buildFaqPage,
  buildBreadcrumb,
  buildArticle,
  buildPerson,
  buildEvent,
  buildMobileApplication,
  buildNGO,
} from './templateBuilder.js';
