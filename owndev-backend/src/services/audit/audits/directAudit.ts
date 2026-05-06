/**
 * audits/directAudit — DIRECT axis (CTA + trust + forms).
 *
 * Wraps services/conversion auditors and aggregates results for evidence.
 */

import { auditCta, auditTrustSignals, auditFormFlow } from '../../conversion/index.js';
import type { CtaAuditResult, TrustSignalAuditResult, FormFlowAuditResult } from '../../conversion/index.js';

export interface DirectAuditResult {
  cta: CtaAuditResult;
  trust: TrustSignalAuditResult;
  forms: FormFlowAuditResult;
}

export function runDirectAudit(html: string): DirectAuditResult {
  return {
    cta: auditCta({ html }),
    trust: auditTrustSignals({ html }),
    forms: auditFormFlow({ html }),
  };
}
