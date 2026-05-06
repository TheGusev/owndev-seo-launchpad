/**
 * Antigravity serializer.
 *
 * Antigravity (Google's AI-IDE) — workspace-based platform similar to Cursor.
 * Reads project rules from `.antigravity/rules.md` and uses agent-style
 * single-prompt orchestration. We emit a Lovable-flavoured single prompt
 * + Cursor-flavoured rule files so the user can drop the pack as-is.
 */

import type { SuperPromptPack, PackArtifact } from '../types.js';

export function serializeAntigravity(pack: SuperPromptPack): PackArtifact[] {
  const md = buildAntigravityPrompt(pack);
  const routesCsv = [
    'page_type,pattern,priority',
    ...pack.route_map.routes.map((r) => `${r.page_type},${r.pattern},${r.priority ?? 'SHOULD'}`),
  ].join('\n');

  const arts: PackArtifact[] = [
    {
      filename: '.antigravity/PROMPT.md',
      content: md,
      content_type: 'text/markdown',
    },
    {
      filename: '.antigravity/rules.md',
      content: buildAntigravityRules(pack),
      content_type: 'text/markdown',
    },
    {
      filename: 'super_prompt_pack.json',
      content: JSON.stringify(pack, null, 2),
      content_type: 'application/json',
    },
    {
      filename: 'routes.csv',
      content: routesCsv,
      content_type: 'text/csv',
    },
  ];

  // Embed technical artifacts under public/
  const c = pack.seo_geo_schema_contract;
  if (c.llms_txt) arts.push({ filename: 'public/llms.txt', content: c.llms_txt, content_type: 'text/plain' });
  if (c.robots_txt) arts.push({ filename: 'public/robots.txt', content: c.robots_txt, content_type: 'text/plain' });
  if (c.sitemap_xml) arts.push({ filename: 'public/sitemap.xml', content: c.sitemap_xml, content_type: 'application/xml' });
  if (c.well_known_ai) arts.push({ filename: 'public/.well-known/ai.txt', content: c.well_known_ai, content_type: 'application/json' });

  return arts;
}

function buildAntigravityPrompt(pack: SuperPromptPack): string {
  const lines: string[] = [];
  lines.push(`# ${pack.business_context.brand} — Antigravity Build Brief`);
  lines.push('');
  lines.push(`> Инженерное задание для Antigravity. Pack v${pack.version} • engine ${pack.engine_version}.`);
  lines.push('');

  lines.push(`## Роль агента`);
  lines.push(`Ты — ${pack.agent_role.title}. Тон: ${pack.agent_role.tone}.`);
  lines.push(`Экспертиза:`);
  pack.agent_role.expertise.forEach((e) => lines.push(`- ${e}`));
  lines.push('');

  lines.push(`## Миссия`);
  lines.push(pack.mission.primary_goal);
  lines.push('');
  lines.push(`### Критерии успеха`);
  pack.mission.success_criteria.forEach((c) => lines.push(`- ${c}`));
  lines.push('');

  lines.push(`## Стек`);
  lines.push(`- Framework: ${pack.tech_stack.framework}`);
  lines.push(`- Styling: ${pack.tech_stack.styling}`);
  if (pack.tech_stack.ui_kit) lines.push(`- UI kit: ${pack.tech_stack.ui_kit}`);
  if (pack.tech_stack.deployment) lines.push(`- Deployment: ${pack.tech_stack.deployment}`);
  lines.push('');

  lines.push(`## Бизнес-контекст`);
  lines.push(`- Бренд: ${pack.business_context.brand}`);
  lines.push(`- Индустрия: ${pack.business_context.industry}`);
  lines.push(`- Аудитория: ${pack.business_context.target_audience}`);
  if (pack.business_context.geo?.primary_city) {
    lines.push(`- Гео: ${pack.business_context.geo.country ?? 'RU'} / ${pack.business_context.geo.primary_city}`);
  }
  lines.push('');

  lines.push(`## Карта маршрутов`);
  pack.route_map.routes.forEach((r) => {
    lines.push(`- \`${r.pattern}\` — ${r.page_type} (${r.priority ?? 'SHOULD'})`);
  });
  lines.push('');

  lines.push(`## Контракты страниц`);
  pack.page_contracts.contracts.forEach((c) => {
    lines.push(`### ${c.page_type}`);
    lines.push(`- H1: \`${c.h1.template}\` (≤ ${c.h1.max_chars})`);
    lines.push(`- Title: \`${c.title.template}\` (≤ ${c.title.max_chars})`);
    lines.push(`- Meta: \`${c.meta_description.template}\` (${c.meta_description.min_chars}-${c.meta_description.max_chars})`);
    if (c.required_schemas?.length) lines.push(`- Schemas: ${c.required_schemas.join(', ')}`);
    if (c.required_blocks?.length) lines.push(`- Блоки: ${c.required_blocks.join(', ')}`);
    lines.push('');
  });

  lines.push(`## Acceptance criteria`);
  const t = pack.acceptance_criteria.preflight_targets;
  lines.push(`- Preflight: SEO ≥ ${t.seo}, Direct ≥ ${t.direct}, Schema = ${t.schema}, AI/LLM ≥ ${t.ai_llm}, Total ≥ ${t.total}`);
  lines.push(`- P0 проверки (см. \`.antigravity/rules.md\`)`);
  lines.push('');

  lines.push(`## Готовность`);
  lines.push(`После прохождения всех чеков напечатай: **${pack.acceptance_criteria.ready_signal ?? 'READY'}**`);
  return lines.join('\n');
}

function buildAntigravityRules(pack: SuperPromptPack): string {
  const lines: string[] = [];
  lines.push(`# Project rules — non-negotiable`);
  lines.push('');
  lines.push(`## Жёсткие правила`);
  pack.non_negotiable_rules.forEach((r, i) => {
    lines.push(`${i + 1}. **${r.rule}**`);
    lines.push(`   - Зачем: ${r.rationale}`);
    lines.push(`   - Нарушение: ${r.violation_consequence}`);
  });
  lines.push('');
  lines.push(`## P0 проверки (fail acceptance при любом провале)`);
  pack.acceptance_criteria.p0_checks.slice(0, 30).forEach((c) => {
    lines.push(`- [${c.id}] ${c.rule}`);
  });
  return lines.join('\n');
}
