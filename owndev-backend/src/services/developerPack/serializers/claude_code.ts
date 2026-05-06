/**
 * Claude Code serializer.
 *
 * Claude Code reads CLAUDE.md as project context + can read any file.
 * We emit:
 *   • CLAUDE.md          — high-level project context with table of contents
 *   • specs/00-mission.md
 *   • specs/01-rules.md
 *   • specs/02-tech-stack.md
 *   • specs/03-routes.md
 *   • specs/04-page-contracts.md
 *   • specs/05-schema.md
 *   • specs/06-acceptance.md
 *   • super_prompt_pack.json
 *   • public/* — technical files
 */

import type { SuperPromptPack, PackArtifact } from '../types.js';

export function serializeClaudeCode(pack: SuperPromptPack): PackArtifact[] {
  const arts: PackArtifact[] = [];

  arts.push({
    filename: 'CLAUDE.md',
    content_type: 'text/markdown',
    content: `# ${pack.business_context.brand}

> Контекст для Claude Code. Engine v3, pack ${pack.version}, generated ${pack.generated_at}.

## Структура
- specs/00-mission.md — миссия и критерии успеха
- specs/01-rules.md — non-negotiable правила
- specs/02-tech-stack.md — стек и ограничения
- specs/03-routes.md — карта URL
- specs/04-page-contracts.md — H1/Title/Meta/intro/FAQ/блоки
- specs/05-schema.md — JSON-LD контракт
- specs/06-acceptance.md — preflight gate и P0 чеки
- super_prompt_pack.json — машиночитаемый пакет
- public/ — llms.txt, robots.txt, sitemap.xml, .well-known/ai.txt

## Стек
${pack.tech_stack.framework} + ${pack.tech_stack.styling}${pack.tech_stack.ui_kit ? ' + ' + pack.tech_stack.ui_kit : ''}.

## Жёсткие лимиты
- H1 ≤ 35, Title ≤ 60, intro_answer 40-80 слов, FAQ ≥ 5
- Schema graph через @id, валидация Rich Results Test
- robots.txt с AI-bot правилами обязателен
- 4 оси preflight: SEO ≥ 85, Direct ≥ 90, Schema = 100, AI/LLM ≥ 85

## Готовность
После прохождения всех P0 — напечатай **${pack.acceptance_criteria.ready_signal ?? 'READY'}**.
`,
  });

  arts.push({
    filename: 'specs/00-mission.md',
    content_type: 'text/markdown',
    content: `# Миссия\n\n${pack.mission.primary_goal}\n\n## Критерии успеха\n${pack.mission.success_criteria.map((c) => `- ${c}`).join('\n')}\n${pack.mission.out_of_scope?.length ? `\n## Out of scope\n${pack.mission.out_of_scope.map((c) => `- ${c}`).join('\n')}\n` : ''}`,
  });

  arts.push({
    filename: 'specs/01-rules.md',
    content_type: 'text/markdown',
    content: `# Non-negotiable rules\n\n${pack.non_negotiable_rules
      .map((r, i) => `## ${i + 1}. ${r.rule}\n- Зачем: ${r.rationale}\n- Нарушение: ${r.violation_consequence}`)
      .join('\n\n')}\n`,
  });

  arts.push({
    filename: 'specs/02-tech-stack.md',
    content_type: 'text/markdown',
    content: `# Tech stack\n- Framework: ${pack.tech_stack.framework}\n- Styling: ${pack.tech_stack.styling}\n- UI kit: ${pack.tech_stack.ui_kit ?? '—'}\n- State: ${pack.tech_stack.state_management ?? '—'}\n- Deployment: ${pack.tech_stack.deployment ?? '—'}\n\n## Constraints\n${(pack.tech_stack.constraints ?? []).map((c) => `- ${c}`).join('\n')}\n`,
  });

  arts.push({
    filename: 'specs/03-routes.md',
    content_type: 'text/markdown',
    content: `# Routes\n\n| pattern | page_type | priority |\n|---|---|---|\n${pack.route_map.routes
      .map((r) => `| \`${r.pattern}\` | ${r.page_type} | ${r.priority ?? 'SHOULD'} |`)
      .join('\n')}\n`,
  });

  arts.push({
    filename: 'specs/04-page-contracts.md',
    content_type: 'text/markdown',
    content:
      `# Page contracts\n\n` +
      pack.page_contracts.contracts
        .map(
          (c) => `## ${c.page_type}
- **H1** (≤ ${c.h1.max_chars}): \`${c.h1.template}\`
- **Title** (≤ ${c.title.max_chars}): \`${c.title.template}\`
- **Meta** (${c.meta_description.min_chars}-${c.meta_description.max_chars}): \`${c.meta_description.template}\`
- **Intro answer**: ${c.intro_answer?.min_words ?? 40}-${c.intro_answer?.max_words ?? 80} слов — ${c.intro_answer?.guidance ?? ''}
- **FAQ**: ≥ ${c.faq?.min_items ?? 5} вопросов
- **Required schemas**: ${(c.required_schemas ?? []).join(', ')}
- **Required blocks**: ${(c.required_blocks ?? []).join(', ')}
- **Commercial signals**: ${(c.commercial_signals ?? []).join(', ')}
- **Min word count**: ${c.min_word_count ?? 400}`,
        )
        .join('\n\n'),
  });

  arts.push({
    filename: 'specs/05-schema.md',
    content_type: 'text/markdown',
    content: `# Schema contract\n\nГлобальные сущности (на каждой странице):\n${pack.seo_geo_schema_contract.global_schemas
      .map((g) => `- ${g.schema_type}`)
      .join('\n')}\n\nПо страницам:\n${pack.seo_geo_schema_contract.page_schemas
      .map((p) => `- ${p.page_type} → @graph (${p.graph['@graph'].length} entities)`)
      .join('\n')}\n\nПолный JSON см. в \`super_prompt_pack.json#/seo_geo_schema_contract\`.`,
  });

  const t = pack.acceptance_criteria.preflight_targets;
  arts.push({
    filename: 'specs/06-acceptance.md',
    content_type: 'text/markdown',
    content: `# Acceptance\n\n## Preflight V3\n- SEO ≥ ${t.seo}\n- Direct ≥ ${t.direct}\n- Schema = ${t.schema}\n- AI/LLM ≥ ${t.ai_llm}\n- Total ≥ ${t.total}\n\n## P0 (любой fail = fail)\n${pack.acceptance_criteria.p0_checks
      .map((c) => `- [${c.id}] ${c.rule}`)
      .join('\n')}\n\n## P1\n${(pack.acceptance_criteria.p1_checks ?? [])
      .map((c) => `- [${c.id}] ${c.rule}`)
      .join('\n')}\n\n## Verification steps\n${(pack.acceptance_criteria.verification_steps ?? []).map((s) => `- ${s}`).join('\n')}\n`,
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
