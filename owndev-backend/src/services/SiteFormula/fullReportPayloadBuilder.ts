import type { EngineState, FullReportPayload, ReportSection, TemplateConfig } from '../../types/siteFormula.js';
import { activateReportBlocks } from './reportBlockActivator.js';
import { getRulesVersion, getTemplateVersion } from './configLoader.js';

export function buildFullReportPayload(
  state: EngineState,
  template: TemplateConfig
): FullReportPayload {
  const sections: ReportSection[] = activateReportBlocks(state, template);

  const traceSummary = state.decision_trace
    .filter((t) => t.condition_met)
    .map((t) => `[${t.priority}] ${t.reason_human}`);

  return {
    project_class: state.project_class,
    sections,
    decision_trace_summary: traceSummary,
    metadata: {
      rules_version: getRulesVersion(),
      template_version: getTemplateVersion(),
      generated_at: new Date().toISOString(),
    },
  };
}
