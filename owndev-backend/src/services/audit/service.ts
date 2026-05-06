/**
 * services/audit — V3 audit orchestrator.
 *
 * Public API:
 *   • runAudit(input) → AuditOutput { evidence, raw }
 *
 * Pipeline:
 *   1. extract head meta, content, schema from HTML
 *   2. run direct (CTA/trust/forms), AI/LLM, schema audits
 *   3. build PageEvidence ready for services/preflight
 */

import { extractHeadMeta, extractContent, extractSchema, isIndexable } from './extractors/index.js';
import { runDirectAudit, runAiLlmAudit, runSchemaAudit } from './audits/index.js';
import { buildEvidence } from './scoring/index.js';
import type { AuditInput, AuditOutput } from './types.js';

export class AuditService {
  run(input: AuditInput): AuditOutput {
    const head = extractHeadMeta(input.html);
    const content = extractContent(input.html, input.url);
    const schema = extractSchema(input.html);
    const direct = runDirectAudit(input.html);
    const aiLlm = runAiLlmAudit({
      llms_txt: input.llms_txt,
      robots_txt: input.robots_txt,
      well_known_ai: input.well_known_ai,
    });
    const schemaAudit = runSchemaAudit(schema, input.required_schema_types ?? []);

    const indexable = isIndexable(head.robots_meta, input.response_headers);

    // sitemap presence — heuristic check on supplied sitemap_xml content
    const inSitemap = !!(input.sitemap_xml && input.sitemap_xml.includes(input.url));

    const evidence = buildEvidence({
      url: input.url,
      project_code: input.project_code,
      page_type: input.page_type,
      head,
      content,
      schema,
      schemaAudit,
      direct,
      aiLlm,
      is_indexable: indexable,
      in_sitemap: inSitemap,
      required_schema_types: input.required_schema_types ?? [],
    });

    return {
      evidence,
      raw: {
        cta: direct.cta,
        trust: direct.trust,
        forms: direct.forms,
        head_meta: head,
        schema,
        content,
      },
    };
  }
}

export const auditService = new AuditService();
