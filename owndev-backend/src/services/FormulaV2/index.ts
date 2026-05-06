/**
 * FormulaV2 — public barrel export.
 *
 * Consumers (routes, workers, future gap-analyzer) MUST import from here.
 */
export {
  classifyProjectType,
  type IntakeAnswers,
  type IntakeResult,
} from './intake.js';

export {
  listProjectTypes,
  getProjectType,
  listPageContracts,
  getPageContract,
  listSchemaTemplates,
  getSchemaTemplate,
  resetCache,
} from './repository.js';

export {
  renderSchema,
  renderManySchemas,
  listAvailableSchemas,
  type RenderResult,
} from './schemaRegistry.js';

export {
  generateLlmsTxt,
  generateRobotsTxt,
  generateSitemapXml,
  pagePlanToLlmsTxtPages,
  type LlmsTxtInput,
  type RobotsTxtInput,
  type SitemapSkeletonInput,
} from './llmsGenerator.js';

export {
  runPreflight,
  PREFLIGHT_PUBLISH_THRESHOLD,
} from './preflight.js';

export {
  buildBlueprintV2,
  ENGINE_VERSION,
  type BuildContext,
} from './blueprintBuilder.js';
