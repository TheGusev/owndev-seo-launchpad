/**
 * audits/schemaAudit — SCHEMA axis audit.
 *
 * Wraps richResultsValidator from services/schemaRegistry for V3 use.
 */

import type { SchemaExtract } from '../types.js';

export interface SchemaAuditResult {
  parsed_ok: boolean;
  has_graph_root: boolean;
  required_present: string[];
  required_missing: string[];
  rich_results_eligible: boolean;
}

export function runSchemaAudit(extract: SchemaExtract, requiredTypes: string[] = []): SchemaAuditResult {
  const requiredMissing = requiredTypes.filter((t) => !extract.types_present.includes(t));
  const requiredPresent = requiredTypes.filter((t) => extract.types_present.includes(t));

  const richEligible =
    extract.parsed_ok &&
    extract.has_graph &&
    requiredMissing.length === 0 &&
    extract.types_present.length >= 2;

  return {
    parsed_ok: extract.parsed_ok,
    has_graph_root: extract.has_graph,
    required_present: requiredPresent,
    required_missing: requiredMissing,
    rich_results_eligible: richEligible,
  };
}
