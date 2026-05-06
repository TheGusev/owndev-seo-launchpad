/**
 * v0 (Vercel) serializer.
 *
 * v0 expects a single concise prompt + visual cues. We emit:
 *   • prompt.txt — short, verb-led, ready to paste
 *   • design_brief.md — design tokens / component list
 *   • super_prompt_pack.json
 *   • public/* — technical files
 */

import type { SuperPromptPack, PackArtifact } from '../types.js';

export function serializeV0(pack: SuperPromptPack): PackArtifact[] {
  const arts: PackArtifact[] = [];

  arts.push({
    filename: 'prompt.txt',
    content_type: 'text/plain',
    content: buildShortPrompt(pack),
  });

  arts.push({
    filename: 'design_brief.md',
    content_type: 'text/markdown',
    content: buildDesignBrief(pack),
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

function buildShortPrompt(pack: SuperPromptPack): string {
  const tokens = pack.ui_component_rules.design_tokens ?? {};
  const lines: string[] = [];
  lines.push(
    `Сгенерируй ${pack.tech_stack.framework} сайт «${pack.business_context.brand}» (${pack.business_context.industry}) для аудитории: ${pack.business_context.target_audience}.`,
  );
  lines.push('');
  lines.push(`Стек: ${pack.tech_stack.framework}, ${pack.tech_stack.styling}${pack.tech_stack.ui_kit ? ', ' + pack.tech_stack.ui_kit : ''}.`);
  lines.push(
    `Дизайн-токены: primary ${tokens.primary_color ?? '#0F62FE'}, шрифт ${tokens.font_heading ?? 'Inter'}, radius ${tokens.border_radius ?? '12px'}.`,
  );
  lines.push('');
  lines.push(`Страницы (route_map):`);
  pack.route_map.routes.forEach((r) => lines.push(`- ${r.pattern} → ${r.page_type}`));
  lines.push('');
  lines.push(`Жёсткие лимиты на КАЖДОЙ странице:`);
  lines.push(`- H1 ≤ 35 символов`);
  lines.push(`- Title ≤ 60 символов`);
  lines.push(`- Первый параграф = прямой ответ 40-80 слов`);
  lines.push(`- FAQ блок минимум 5 вопросов`);
  lines.push(`- JSON-LD @graph согласно required_schemas`);
  lines.push(`- Above-the-fold primary CTA + кликабельный телефон tel:`);
  lines.push('');
  lines.push(`Файлы public/: llms.txt, robots.txt, sitemap.xml, .well-known/ai.txt — взять из приложенных.`);
  lines.push('');
  lines.push(`Acceptance: SEO ≥ 85, Direct ≥ 90, Schema = 100, AI/LLM ≥ 85, Total ≥ 90.`);
  return lines.join('\n');
}

function buildDesignBrief(pack: SuperPromptPack): string {
  const lines: string[] = [`# Design brief — ${pack.business_context.brand}`, ''];
  if (pack.ui_component_rules.design_tokens) {
    lines.push(`## Tokens`);
    Object.entries(pack.ui_component_rules.design_tokens).forEach(([k, v]) => lines.push(`- ${k}: ${v}`));
    lines.push('');
  }
  if (pack.ui_component_rules.required_components?.length) {
    lines.push(`## Required components`);
    pack.ui_component_rules.required_components.forEach((c) => lines.push(`- ${c}`));
    lines.push('');
  }
  if (pack.ui_component_rules.performance_budgets) {
    const b = pack.ui_component_rules.performance_budgets;
    lines.push(`## Performance budget`);
    lines.push(`- LCP ≤ ${b.lcp_ms ?? 2500} ms`);
    lines.push(`- CLS ≤ ${b.cls ?? 0.1}`);
    lines.push(`- INP ≤ ${b.inp_ms ?? 200} ms`);
    lines.push(`- Page weight ≤ ${b.page_weight_kb ?? 1500} kb`);
  }
  return lines.join('\n');
}
