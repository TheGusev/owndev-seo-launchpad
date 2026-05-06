/**
 * services/audit — V3 audit module public API.
 *
 * NOTE: This is the V3 PageEvidence collector that drives services/preflight.
 * The legacy services/SiteCheckPipeline.ts (2249 LoC) is preserved for V2
 * backward compatibility (its façade remains services/SiteCheck/index.ts).
 *
 * Module layout:
 *   extractors/  — pure HTML → structured data
 *   audits/      — DIRECT (cheerio CTA/trust/forms), AI/LLM, SCHEMA
 *   scoring/     — composes PageEvidence from extractor + audit outputs
 */

export type {
  AuditInput,
  AuditOutput,
  HeadMeta,
  SchemaExtract,
  ContentExtract,
} from './types.js';

export {
  extractHeadMeta,
  isIndexable,
  extractSchema,
  extractContent,
} from './extractors/index.js';

export {
  runDirectAudit,
  runAiLlmAudit,
  runSchemaAudit,
  type DirectAuditResult,
  type AiLlmAuditResult,
  type SchemaAuditResult,
} from './audits/index.js';

export { buildEvidence } from './scoring/index.js';

export { AuditService, auditService } from './service.js';
