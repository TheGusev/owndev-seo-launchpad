/**
 * Structured serializer (default, platform-agnostic).
 *
 * Emits the JSON pack + each section as a standalone Markdown file
 * (so any LLM/IDE can ingest selectively).
 */

import type { SuperPromptPack, PackArtifact } from '../types.js';

export function serializeStructured(pack: SuperPromptPack): PackArtifact[] {
  const arts: PackArtifact[] = [];

  arts.push({
    filename: 'super_prompt_pack.json',
    content: JSON.stringify(pack, null, 2),
    content_type: 'application/json',
  });

  arts.push({
    filename: 'README.md',
    content_type: 'text/markdown',
    content: `# ${pack.business_context.brand} — Super Prompt Pack v${pack.version}

Generated: ${pack.generated_at}
Engine: ${pack.engine_version ?? 'v3'}
Project type: ${pack.business_context.project_type_code ?? '—'}

## Содержимое
- super_prompt_pack.json — машиночитаемый контракт
- mission.md, rules.md, tech.md, business.md, routes.md, contracts.md, schema.md, ui.md, acceptance.md
- public/* — llms.txt, robots.txt, sitemap.xml, .well-known/ai.txt
`,
  });

  arts.push({ filename: 'mission.md', content_type: 'text/markdown', content: renderMission(pack) });
  arts.push({ filename: 'rules.md', content_type: 'text/markdown', content: renderRules(pack) });
  arts.push({ filename: 'tech.md', content_type: 'text/markdown', content: renderTech(pack) });
  arts.push({ filename: 'business.md', content_type: 'text/markdown', content: renderBusiness(pack) });
  arts.push({ filename: 'routes.md', content_type: 'text/markdown', content: renderRoutes(pack) });
  arts.push({ filename: 'contracts.md', content_type: 'text/markdown', content: renderContracts(pack) });
  arts.push({ filename: 'schema.md', content_type: 'text/markdown', content: renderSchema(pack) });
  arts.push({ filename: 'ui.md', content_type: 'text/markdown', content: renderUi(pack) });
  arts.push({ filename: 'acceptance.md', content_type: 'text/markdown', content: renderAcceptance(pack) });

  const c = pack.seo_geo_schema_contract;
  if (c.llms_txt) arts.push({ filename: 'public/llms.txt', content: c.llms_txt, content_type: 'text/plain' });
  if (c.robots_txt) arts.push({ filename: 'public/robots.txt', content: c.robots_txt, content_type: 'text/plain' });
  if (c.sitemap_xml) arts.push({ filename: 'public/sitemap.xml', content: c.sitemap_xml, content_type: 'application/xml' });
  if (c.well_known_ai) arts.push({ filename: 'public/.well-known/ai.txt', content: c.well_known_ai, content_type: 'application/json' });

  return arts;
}

function renderMission(p: SuperPromptPack): string {
  return `# Миссия\n\n${p.mission.primary_goal}\n\n## Критерии успеха\n${p.mission.success_criteria.map((c) => `- ${c}`).join('\n')}\n${p.mission.out_of_scope?.length ? `\n## Out of scope\n${p.mission.out_of_scope.map((c) => `- ${c}`).join('\n')}\n` : ''}`;
}
function renderRules(p: SuperPromptPack): string {
  return `# Non-negotiable rules\n\n${p.non_negotiable_rules.map((r, i) => `${i + 1}. **${r.rule}** — ${r.rationale} (${r.violation_consequence})`).join('\n')}\n`;
}
function renderTech(p: SuperPromptPack): string {
  return `# Tech stack\n- ${p.tech_stack.framework}\n- ${p.tech_stack.styling}\n- ${p.tech_stack.ui_kit ?? '—'}\n- ${p.tech_stack.deployment ?? '—'}\n\n## Constraints\n${(p.tech_stack.constraints ?? []).map((c) => `- ${c}`).join('\n')}\n`;
}
function renderBusiness(p: SuperPromptPack): string {
  return `# Business context\n- Бренд: ${p.business_context.brand}\n- Индустрия: ${p.business_context.industry}\n- Аудитория: ${p.business_context.target_audience}\n- Гео: ${p.business_context.geo?.primary_city ?? '—'} (${p.business_context.geo?.country ?? 'RU'})\n- Языки: ${(p.business_context.languages ?? ['ru']).join(', ')}\n${p.business_context.competitive_position ? `- Позиционирование: ${p.business_context.competitive_position}\n` : ''}`;
}
function renderRoutes(p: SuperPromptPack): string {
  return `# Routes\n\n| pattern | page_type | priority |\n|---|---|---|\n${p.route_map.routes.map((r) => `| \`${r.pattern}\` | ${r.page_type} | ${r.priority ?? 'SHOULD'} |`).join('\n')}\n`;
}
function renderContracts(p: SuperPromptPack): string {
  return `# Page contracts\n\n${p.page_contracts.contracts
    .map(
      (c) => `## ${c.page_type}
- H1 (≤ ${c.h1.max_chars}): \`${c.h1.template}\`
- Title (≤ ${c.title.max_chars}): \`${c.title.template}\`
- Meta (${c.meta_description.min_chars}-${c.meta_description.max_chars}): \`${c.meta_description.template}\`
- Intro: ${c.intro_answer?.min_words ?? 40}-${c.intro_answer?.max_words ?? 80} слов
- FAQ ≥ ${c.faq?.min_items ?? 5}
- Schemas: ${(c.required_schemas ?? []).join(', ')}
- Blocks: ${(c.required_blocks ?? []).join(', ')}
- Signals: ${(c.commercial_signals ?? []).join(', ')}`,
    )
    .join('\n\n')}\n`;
}
function renderSchema(p: SuperPromptPack): string {
  return `# Schema contract\n\n## Global\n${p.seo_geo_schema_contract.global_schemas.map((g) => `- ${g.schema_type}`).join('\n')}\n\n## Per page\n${p.seo_geo_schema_contract.page_schemas.map((s) => `- ${s.page_type} (entities: ${s.graph['@graph'].length})`).join('\n')}\n`;
}
function renderUi(p: SuperPromptPack): string {
  const tokens = p.ui_component_rules.design_tokens ?? {};
  return `# UI rules\n\n## Tokens\n${Object.entries(tokens).map(([k, v]) => `- ${k}: ${v}`).join('\n')}\n\n## Components\n${(p.ui_component_rules.required_components ?? []).map((c) => `- ${c}`).join('\n')}\n\nA11y: ${p.ui_component_rules.accessibility ?? 'WCAG AA'}\n`;
}
function renderAcceptance(p: SuperPromptPack): string {
  const t = p.acceptance_criteria.preflight_targets;
  return `# Acceptance\n\n- SEO ≥ ${t.seo}\n- Direct ≥ ${t.direct}\n- Schema = ${t.schema}\n- AI/LLM ≥ ${t.ai_llm}\n- Total ≥ ${t.total}\n\n## P0\n${p.acceptance_criteria.p0_checks.map((c) => `- [${c.id}] ${c.rule}`).join('\n')}\n\n## Ready signal\n\`${p.acceptance_criteria.ready_signal ?? 'READY'}\`\n`;
}
