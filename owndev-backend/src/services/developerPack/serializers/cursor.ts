/**
 * Cursor serializer.
 *
 * Cursor parses .cursor/rules/*.mdc as project rules + has /TASKS.md as
 * top-level task definition. We split the pack into:
 *   • .cursor/rules/00-stack.mdc
 *   • .cursor/rules/01-non-negotiable.mdc
 *   • .cursor/rules/02-contracts.mdc
 *   • .cursor/rules/03-acceptance.mdc
 *   • TASKS.md
 *   • super_prompt_pack.json (full machine-readable)
 *   • public/* — technical files
 */

import type { SuperPromptPack, PackArtifact } from '../types.js';

export function serializeCursor(pack: SuperPromptPack): PackArtifact[] {
  const arts: PackArtifact[] = [];

  arts.push({
    filename: '.cursor/rules/00-stack.mdc',
    content_type: 'text/markdown',
    content: `---\ndescription: Стек и архитектурные ограничения\nalwaysApply: true\n---\n# Стек\n- Framework: ${pack.tech_stack.framework}\n- Styling: ${pack.tech_stack.styling}\n- UI kit: ${pack.tech_stack.ui_kit ?? '—'}\n- Deployment: ${pack.tech_stack.deployment ?? '—'}\n\n## Constraints\n${(pack.tech_stack.constraints ?? []).map((c) => `- ${c}`).join('\n')}\n`,
  });

  arts.push({
    filename: '.cursor/rules/01-non-negotiable.mdc',
    content_type: 'text/markdown',
    content: `---\ndescription: Жёсткие правила, нарушение которых = fail\nalwaysApply: true\n---\n# NON-NEGOTIABLE\n${pack.non_negotiable_rules
      .map((r, i) => `${i + 1}. **${r.rule}** — ${r.rationale} (consequence: ${r.violation_consequence})`)
      .join('\n')}\n`,
  });

  const contractsBlock = pack.page_contracts.contracts
    .map(
      (c) => `## ${c.page_type}
- H1 ≤ ${c.h1.max_chars}: \`${c.h1.template}\`
- Title ≤ ${c.title.max_chars}: \`${c.title.template}\`
- Meta (${c.meta_description.min_chars}-${c.meta_description.max_chars}): \`${c.meta_description.template}\`
- Intro answer: ${c.intro_answer?.min_words ?? 40}-${c.intro_answer?.max_words ?? 80} слов
- FAQ ≥ ${c.faq?.min_items ?? 5}
- Required schemas: ${(c.required_schemas ?? []).join(', ')}
- Required blocks: ${(c.required_blocks ?? []).join(', ')}
- Commercial signals: ${(c.commercial_signals ?? []).join(', ')}`,
    )
    .join('\n\n');

  arts.push({
    filename: '.cursor/rules/02-contracts.mdc',
    content_type: 'text/markdown',
    content: `---\ndescription: Page contracts (H1/Title/Meta/intro/FAQ/schemas/blocks)\nalwaysApply: true\n---\n${contractsBlock}\n`,
  });

  const t = pack.acceptance_criteria.preflight_targets;
  arts.push({
    filename: '.cursor/rules/03-acceptance.mdc',
    content_type: 'text/markdown',
    content: `---\ndescription: Acceptance criteria + Preflight thresholds\nalwaysApply: true\n---\n# Preflight V3\n- SEO ≥ ${t.seo} • Direct ≥ ${t.direct} • Schema = ${t.schema} • AI/LLM ≥ ${t.ai_llm} • Total ≥ ${t.total}\n\n## P0 checks\n${pack.acceptance_criteria.p0_checks
      .map((c) => `- [${c.id}] ${c.rule}`)
      .join('\n')}\n\n## Ready signal\nКогда всё пройдено — напечатай: \`${pack.acceptance_criteria.ready_signal ?? 'READY'}\`\n`,
  });

  arts.push({
    filename: 'TASKS.md',
    content_type: 'text/markdown',
    content: buildTasks(pack),
  });

  arts.push({
    filename: 'super_prompt_pack.json',
    content: JSON.stringify(pack, null, 2),
    content_type: 'application/json',
  });

  const c = pack.seo_geo_schema_contract;
  if (c.llms_txt) arts.push({ filename: 'public/llms.txt', content: c.llms_txt, content_type: 'text/plain' });
  if (c.robots_txt) arts.push({ filename: 'public/robots.txt', content: c.robots_txt, content_type: 'text/plain' });
  if (c.sitemap_xml) arts.push({ filename: 'public/sitemap.xml', content: c.sitemap_xml, content_type: 'application/xml' });
  if (c.well_known_ai) arts.push({ filename: 'public/.well-known/ai.txt', content: c.well_known_ai, content_type: 'application/json' });

  return arts;
}

function buildTasks(pack: SuperPromptPack): string {
  const lines = [
    `# ${pack.business_context.brand} — TASKS`,
    '',
    `**Цель:** ${pack.mission.primary_goal}`,
    '',
    `## Шаги`,
    `1. Установить стек: ${pack.tech_stack.framework} + ${pack.tech_stack.styling}${pack.tech_stack.ui_kit ? ' + ' + pack.tech_stack.ui_kit : ''}.`,
    `2. Сгенерировать страницы по \`/route_map\` (${pack.route_map.routes.length} routes).`,
    `3. Реализовать page_contracts из \`.cursor/rules/02-contracts.mdc\`.`,
    `4. Положить файлы в public/: llms.txt, robots.txt, sitemap.xml, .well-known/ai.txt.`,
    `5. Внедрить Schema.org @graph согласно \`super_prompt_pack.json#/seo_geo_schema_contract\`.`,
    `6. Подключить dataLayer события (см. ${(pack.seo_geo_schema_contract.data_layer_events ?? []).length} событий).`,
    `7. Прогнать preflight локально и Lighthouse.`,
    `8. Напечатать \`${pack.acceptance_criteria.ready_signal ?? 'READY'}\`, когда все P0 пройдены.`,
  ];
  return lines.join('\n');
}
