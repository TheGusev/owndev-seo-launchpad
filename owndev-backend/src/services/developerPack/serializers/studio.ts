/**
 * Studio serializer — human-readable specification for a developer or studio.
 *
 * Mode: 'studio' (pack_mode). Generates a comprehensive "Техзадание" pack
 * suitable for handing off to a human web-development team:
 *   • Техническое_задание.html — opens in any browser; "Save as PDF" gives
 *     a print-ready PDF, opens directly in MS Word as .doc
 *   • Техническое_задание.md  — Markdown copy for editing/version-control
 *   • super_prompt_pack.json   — full machine-readable pack (reference)
 *   • routes.csv               — route-map summary
 *   • public/* — technical files (llms.txt, robots, sitemap, ai.txt)
 *
 * Notes:
 *   • Pure-string output, no external libraries (pdfkit/docx). The HTML
 *     uses inline CSS so it prints cleanly and Word renders it natively.
 *   • Russian throughout — this is the human-facing artifact.
 */

import type { SuperPromptPack, PackArtifact } from '../types.js';

export function serializeStudio(pack: SuperPromptPack): PackArtifact[] {
  const md = buildStudioMarkdown(pack);
  const html = buildStudioHtml(pack);
  const routesCsv = [
    'page_type,pattern,priority',
    ...pack.route_map.routes.map((r) => `${r.page_type},${r.pattern},${r.priority ?? 'SHOULD'}`),
  ].join('\n');

  const arts: PackArtifact[] = [
    {
      filename: 'Техническое_задание.html',
      content: html,
      content_type: 'text/html',
    },
    {
      filename: 'Техническое_задание.md',
      content: md,
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

// ─── Markdown ────────────────────────────────────────────────────────

function buildStudioMarkdown(pack: SuperPromptPack): string {
  const lines: string[] = [];
  const bc = pack.business_context;
  const t = pack.acceptance_criteria.preflight_targets;

  lines.push(`# Техническое задание на разработку сайта`);
  lines.push('');
  lines.push(`**Бренд:** ${bc.brand}`);
  lines.push(`**Отрасль:** ${bc.industry}`);
  lines.push(`**Аудитория:** ${bc.target_audience}`);
  if (bc.geo?.primary_city) lines.push(`**Регион:** ${bc.geo.country ?? 'RU'} / ${bc.geo.primary_city}`);
  lines.push(`**Версия пакета:** ${pack.version} • engine ${pack.engine_version}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  lines.push(`## 1. Цель проекта`);
  lines.push(pack.mission.primary_goal);
  lines.push('');
  lines.push(`### Критерии успеха`);
  pack.mission.success_criteria.forEach((c) => lines.push(`- ${c}`));
  if (pack.mission.out_of_scope?.length) {
    lines.push('');
    lines.push(`### Вне рамок проекта`);
    pack.mission.out_of_scope.forEach((c) => lines.push(`- ${c}`));
  }
  lines.push('');

  lines.push(`## 2. Технологический стек (рекомендуемый)`);
  lines.push(`- **Framework:** ${pack.tech_stack.framework}`);
  lines.push(`- **Стилизация:** ${pack.tech_stack.styling}`);
  if (pack.tech_stack.ui_kit) lines.push(`- **UI kit:** ${pack.tech_stack.ui_kit}`);
  if (pack.tech_stack.deployment) lines.push(`- **Deployment:** ${pack.tech_stack.deployment}`);
  if (pack.tech_stack.constraints?.length) {
    lines.push(`- **Ограничения:**`);
    pack.tech_stack.constraints.forEach((c) => lines.push(`  - ${c}`));
  }
  lines.push('');
  lines.push(`> Стек указан как ориентир — команда может использовать привычный стек, при условии что выполняются acceptance criteria из раздела 7.`);
  lines.push('');

  lines.push(`## 3. Жёсткие требования (NON-NEGOTIABLE)`);
  lines.push(`Несоблюдение любого пункта = проект не принимается.`);
  lines.push('');
  pack.non_negotiable_rules.forEach((r, i) => {
    lines.push(`**${i + 1}. ${r.rule}**`);
    lines.push(`- Обоснование: ${r.rationale}`);
    lines.push(`- Последствие нарушения: ${r.violation_consequence}`);
    lines.push('');
  });

  lines.push(`## 4. Карта маршрутов (структура страниц)`);
  lines.push('');
  lines.push(`| URL | Тип страницы | Приоритет |`);
  lines.push(`|-----|--------------|-----------|`);
  pack.route_map.routes.forEach((r) => {
    lines.push(`| \`${r.pattern}\` | ${r.page_type} | ${r.priority ?? 'SHOULD'} |`);
  });
  lines.push('');

  lines.push(`## 5. Контракты страниц`);
  lines.push(`Шаблоны и ограничения для каждого типа страницы.`);
  lines.push('');
  pack.page_contracts.contracts.forEach((c) => {
    lines.push(`### 5.${pack.page_contracts.contracts.indexOf(c) + 1}. ${c.page_type}`);
    lines.push('');
    lines.push(`- **H1:** \`${c.h1.template}\` (≤ ${c.h1.max_chars} симв.)`);
    lines.push(`- **Title:** \`${c.title.template}\` (≤ ${c.title.max_chars} симв.)`);
    lines.push(`- **Meta-description:** \`${c.meta_description.template}\` (${c.meta_description.min_chars}–${c.meta_description.max_chars} симв.)`);
    if (c.intro_answer) {
      lines.push(`- **Intro answer:** ${c.intro_answer.min_words}–${c.intro_answer.max_words} слов`);
      if (c.intro_answer.guidance) lines.push(`  - ${c.intro_answer.guidance}`);
    }
    if (c.faq?.min_items) lines.push(`- **FAQ:** минимум ${c.faq.min_items} вопросов`);
    if (c.required_schemas?.length) lines.push(`- **Schema.org разметка:** ${c.required_schemas.join(', ')}`);
    if (c.required_blocks?.length) lines.push(`- **Обязательные блоки:** ${c.required_blocks.join(', ')}`);
    if (c.commercial_signals?.length) lines.push(`- **Коммерческие сигналы:** ${c.commercial_signals.join(', ')}`);
    lines.push('');
  });

  lines.push(`## 6. Технические файлы`);
  lines.push(`Готовые к публикации файлы поставляются в архиве в папке \`public/\`:`);
  lines.push(`- \`llms.txt\` — карта сайта для AI-ботов (ChatGPT, Claude, Perplexity и т.д.)`);
  lines.push(`- \`robots.txt\` — правила для поисковых роботов с явным разрешением 17 AI-ботов`);
  lines.push(`- \`sitemap.xml\` — карта сайта для индексации`);
  lines.push(`- \`.well-known/ai.txt\` — политика работы с AI-обучением`);
  lines.push('');

  lines.push(`## 7. Acceptance criteria (критерии приёмки)`);
  lines.push('');
  lines.push(`Сайт считается принятым только если каждая страница проходит Preflight 4-осей:`);
  lines.push('');
  lines.push(`| Ось | Минимальный балл |`);
  lines.push(`|-----|------------------|`);
  lines.push(`| SEO | ≥ ${t.seo} |`);
  lines.push(`| Прямой контент (Direct) | ≥ ${t.direct} |`);
  lines.push(`| Schema.org разметка | = ${t.schema} |`);
  lines.push(`| AI / LLM готовность | ≥ ${t.ai_llm} |`);
  lines.push(`| **Итого** | **≥ ${t.total}** |`);
  lines.push('');
  lines.push(`### P0-проверки (любая ошибка = страница не принята)`);
  pack.acceptance_criteria.p0_checks.slice(0, 30).forEach((c) => {
    lines.push(`- **${c.id}** — ${c.rule}`);
  });
  if (pack.acceptance_criteria.verification_steps?.length) {
    lines.push('');
    lines.push(`### Шаги верификации`);
    pack.acceptance_criteria.verification_steps.forEach((s, i) => lines.push(`${i + 1}. ${s}`));
  }
  lines.push('');

  if (pack.ui_component_rules) {
    lines.push(`## 8. UI-правила и компоненты`);
    if (pack.ui_component_rules.design_tokens) {
      lines.push(`### Design tokens`);
      Object.entries(pack.ui_component_rules.design_tokens).forEach(([k, v]) => lines.push(`- **${k}:** ${v}`));
    }
    if (pack.ui_component_rules.required_components?.length) {
      lines.push('');
      lines.push(`### Обязательные компоненты`);
      pack.ui_component_rules.required_components.forEach((c) => lines.push(`- ${c}`));
    }
    if (pack.ui_component_rules.accessibility) {
      lines.push('');
      lines.push(`### Доступность`);
      lines.push(pack.ui_component_rules.accessibility);
    }
    lines.push('');
  }

  lines.push(`---`);
  lines.push('');
  lines.push(`> Документ сгенерирован Site Formula PRO (OWNDEV). Сопровождающий машиночитаемый пакет — \`super_prompt_pack.json\`.`);
  return lines.join('\n');
}

// ─── HTML (opens in Word, prints to PDF) ─────────────────────────────

function buildStudioHtml(pack: SuperPromptPack): string {
  const bc = pack.business_context;
  const t = pack.acceptance_criteria.preflight_targets;

  const css = `
    body { font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 880px; margin: 32px auto; padding: 0 24px; color: #1a1a1a; line-height: 1.55; }
    h1 { font-size: 28px; border-bottom: 3px solid #6d28d9; padding-bottom: 8px; margin-top: 0; }
    h2 { font-size: 20px; color: #4c1d95; margin-top: 32px; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
    h3 { font-size: 16px; color: #5b21b6; margin-top: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 12px 0; }
    th, td { border: 1px solid #d1d5db; padding: 8px 10px; text-align: left; font-size: 14px; }
    th { background: #f3f4f6; font-weight: 600; }
    code { background: #f3f4f6; padding: 1px 5px; border-radius: 3px; font-family: 'Courier New', monospace; font-size: 13px; }
    .meta { background: #faf5ff; border-left: 4px solid #7c3aed; padding: 12px 16px; margin: 16px 0; border-radius: 4px; font-size: 14px; }
    .non-neg { background: #fef2f2; border-left: 4px solid #dc2626; padding: 12px 16px; margin: 12px 0; border-radius: 4px; }
    .non-neg strong { color: #991b1b; }
    ul, ol { padding-left: 24px; }
    li { margin: 4px 0; }
    .footer { margin-top: 48px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
    @media print { body { margin: 0; max-width: 100%; } h2 { page-break-after: avoid; } table, .non-neg { page-break-inside: avoid; } }
  `.trim();

  const html: string[] = [];
  html.push('<!DOCTYPE html>');
  html.push('<html lang="ru"><head>');
  html.push('<meta charset="UTF-8">');
  html.push(`<title>ТЗ — ${esc(bc.brand)}</title>`);
  html.push(`<style>${css}</style>`);
  html.push('</head><body>');

  html.push(`<h1>Техническое задание на разработку сайта</h1>`);
  html.push(`<div class="meta">`);
  html.push(`<strong>Бренд:</strong> ${esc(bc.brand)}<br>`);
  html.push(`<strong>Отрасль:</strong> ${esc(bc.industry)}<br>`);
  html.push(`<strong>Аудитория:</strong> ${esc(bc.target_audience)}<br>`);
  if (bc.geo?.primary_city) html.push(`<strong>Регион:</strong> ${esc(bc.geo.country ?? 'RU')} / ${esc(bc.geo.primary_city)}<br>`);
  html.push(`<strong>Версия пакета:</strong> ${esc(pack.version)} • engine ${esc(pack.engine_version)}`);
  html.push(`</div>`);

  html.push(`<h2>1. Цель проекта</h2>`);
  html.push(`<p>${esc(pack.mission.primary_goal)}</p>`);
  html.push(`<h3>Критерии успеха</h3><ul>`);
  pack.mission.success_criteria.forEach((c) => html.push(`<li>${esc(c)}</li>`));
  html.push(`</ul>`);

  html.push(`<h2>2. Технологический стек (рекомендуемый)</h2><ul>`);
  html.push(`<li><strong>Framework:</strong> ${esc(pack.tech_stack.framework)}</li>`);
  html.push(`<li><strong>Стилизация:</strong> ${esc(pack.tech_stack.styling)}</li>`);
  if (pack.tech_stack.ui_kit) html.push(`<li><strong>UI kit:</strong> ${esc(pack.tech_stack.ui_kit)}</li>`);
  if (pack.tech_stack.deployment) html.push(`<li><strong>Deployment:</strong> ${esc(pack.tech_stack.deployment)}</li>`);
  html.push(`</ul>`);
  html.push(`<p><em>Стек указан как ориентир — команда может использовать привычный стек, при условии что выполняются acceptance criteria.</em></p>`);

  html.push(`<h2>3. Жёсткие требования (NON-NEGOTIABLE)</h2>`);
  html.push(`<p>Несоблюдение любого пункта = проект не принимается.</p>`);
  pack.non_negotiable_rules.forEach((r, i) => {
    html.push(`<div class="non-neg"><strong>${i + 1}. ${esc(r.rule)}</strong><br>`);
    html.push(`Обоснование: ${esc(r.rationale)}<br>`);
    html.push(`Последствие: ${esc(r.violation_consequence)}</div>`);
  });

  html.push(`<h2>4. Карта маршрутов</h2>`);
  html.push(`<table><thead><tr><th>URL</th><th>Тип страницы</th><th>Приоритет</th></tr></thead><tbody>`);
  pack.route_map.routes.forEach((r) => {
    html.push(`<tr><td><code>${esc(r.pattern)}</code></td><td>${esc(r.page_type)}</td><td>${esc(r.priority ?? 'SHOULD')}</td></tr>`);
  });
  html.push(`</tbody></table>`);

  html.push(`<h2>5. Контракты страниц</h2>`);
  pack.page_contracts.contracts.forEach((c, idx) => {
    html.push(`<h3>5.${idx + 1}. ${esc(c.page_type)}</h3><ul>`);
    html.push(`<li><strong>H1:</strong> <code>${esc(c.h1.template)}</code> (≤ ${c.h1.max_chars} симв.)</li>`);
    html.push(`<li><strong>Title:</strong> <code>${esc(c.title.template)}</code> (≤ ${c.title.max_chars} симв.)</li>`);
    html.push(`<li><strong>Meta-description:</strong> <code>${esc(c.meta_description.template)}</code> (${c.meta_description.min_chars}–${c.meta_description.max_chars} симв.)</li>`);
    if (c.intro_answer) html.push(`<li><strong>Intro answer:</strong> ${c.intro_answer.min_words}–${c.intro_answer.max_words} слов${c.intro_answer.guidance ? ` — ${esc(c.intro_answer.guidance)}` : ''}</li>`);
    if (c.faq?.min_items) html.push(`<li><strong>FAQ:</strong> минимум ${c.faq.min_items} вопросов</li>`);
    if (c.required_schemas?.length) html.push(`<li><strong>Schema.org:</strong> ${c.required_schemas.map(esc).join(', ')}</li>`);
    if (c.required_blocks?.length) html.push(`<li><strong>Блоки:</strong> ${c.required_blocks.map(esc).join(', ')}</li>`);
    if (c.commercial_signals?.length) html.push(`<li><strong>Коммерческие сигналы:</strong> ${c.commercial_signals.map(esc).join(', ')}</li>`);
    html.push(`</ul>`);
  });

  html.push(`<h2>6. Технические файлы</h2>`);
  html.push(`<p>Готовые к публикации файлы поставляются в архиве в папке <code>public/</code>:</p><ul>`);
  html.push(`<li><code>llms.txt</code> — карта сайта для AI-ботов</li>`);
  html.push(`<li><code>robots.txt</code> — правила для поисковых роботов с явным разрешением 17 AI-ботов</li>`);
  html.push(`<li><code>sitemap.xml</code> — карта сайта для индексации</li>`);
  html.push(`<li><code>.well-known/ai.txt</code> — политика работы с AI-обучением</li>`);
  html.push(`</ul>`);

  html.push(`<h2>7. Acceptance criteria</h2>`);
  html.push(`<p>Сайт считается принятым только если каждая страница проходит Preflight 4-осей:</p>`);
  html.push(`<table><thead><tr><th>Ось</th><th>Минимальный балл</th></tr></thead><tbody>`);
  html.push(`<tr><td>SEO</td><td>≥ ${t.seo}</td></tr>`);
  html.push(`<tr><td>Прямой контент (Direct)</td><td>≥ ${t.direct}</td></tr>`);
  html.push(`<tr><td>Schema.org разметка</td><td>= ${t.schema}</td></tr>`);
  html.push(`<tr><td>AI / LLM готовность</td><td>≥ ${t.ai_llm}</td></tr>`);
  html.push(`<tr><td><strong>Итого</strong></td><td><strong>≥ ${t.total}</strong></td></tr>`);
  html.push(`</tbody></table>`);
  html.push(`<h3>P0-проверки</h3><ul>`);
  pack.acceptance_criteria.p0_checks.slice(0, 30).forEach((c) => {
    html.push(`<li><strong>${esc(c.id)}</strong> — ${esc(c.rule)}</li>`);
  });
  html.push(`</ul>`);

  html.push(`<div class="footer">Документ сгенерирован Site Formula PRO (OWNDEV). Машиночитаемый пакет — <code>super_prompt_pack.json</code>.</div>`);
  html.push('</body></html>');
  return html.join('\n');
}

function esc(s: string | undefined): string {
  if (s === undefined || s === null) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
