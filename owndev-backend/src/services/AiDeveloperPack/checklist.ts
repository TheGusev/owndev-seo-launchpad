import type { BlueprintV2 } from '../../types/formulaV2.js';

export function generateAcceptanceChecklist(blueprint: BlueprintV2): string {
  const lines: string[] = [];
  lines.push('# Acceptance checklist');
  lines.push('');
  lines.push('## Технические требования');
  lines.push('');
  lines.push('- [ ] LCP < 2.5s, INP < 200ms, CLS < 0.1');
  lines.push('- [ ] Lighthouse SEO ≥ 95, Performance ≥ 90');
  lines.push('- [ ] robots.txt разрешает основные AI-боты (GPTBot, PerplexityBot, ClaudeBot, Google-Extended, CCBot)');
  lines.push('- [ ] llms.txt в корне, ссылается на ключевые страницы');
  lines.push('- [ ] sitemap.xml в корне, перечислены все индексируемые страницы');
  lines.push('- [ ] hreflang выставлен (если мультиязычный)');
  lines.push('- [ ] HTTPS, HSTS, gzip/brotli включены');
  lines.push('');
  lines.push('## Page Contracts');
  lines.push('');
  for (const p of blueprint.pages) {
    lines.push(`### ${p.page_type} (${p.url_pattern})`);
    lines.push(`- [ ] title и meta description заполнены, длина в пределах нормы`);
    lines.push(`- [ ] H1 уникален, соответствует шаблону "${p.h1_template}"`);
    if (p.required_schemas.length) {
      lines.push(`- [ ] JSON-LD: ${p.required_schemas.join(', ')}`);
    }
    if (p.required_blocks.length) {
      lines.push(`- [ ] Блоки: ${p.required_blocks.join(', ')}`);
    }
    lines.push('');
  }
  lines.push('## Финальная проверка');
  lines.push('');
  lines.push('- [ ] Прогон через Google Rich Results Test (все JSON-LD валидны)');
  lines.push('- [ ] Прогон через Schema.org validator');
  lines.push('- [ ] Все формы лидогенерации работают, события отправляются в analytics');
  lines.push('- [ ] Контактные данные (NAP) совпадают на всех страницах и в JSON-LD');
  return lines.join('\n');
}

export function generateReadmeForAI(blueprint: BlueprintV2, businessName: string): string {
  return [
    `# README для AI-кодера — ${businessName}`,
    '',
    'В этом архиве содержатся все артефакты, нужные для разработки сайта:',
    '',
    '- `super_prompt.txt` — главный промпт. Сначала прочитай его.',
    '- `routes.json` — список маршрутов и шаблоны URL.',
    '- `page_contracts.json` — обязательные требования к каждой странице.',
    '- `schema_pack.json` — готовые JSON-LD для встраивания.',
    '- `metadata.json` — метаданные пака (engine_version, project_type, preflight_score).',
    '- `acceptance_checklist.md` — критерии приёмки. Прогоняй после генерации сайта.',
    '- `llms.txt` и `robots.txt` — кладутся в корень сайта.',
    '- `sitemap.xml` — скелет sitemap, доработать после генерации страниц.',
    '',
    `Тип проекта: \`${blueprint.project_type_code}\``,
    `Engine version: \`${blueprint.engine_version}\``,
    `Preflight score: \`${blueprint.preflight.score}/100\` ${blueprint.preflight.publishable ? '(можно публиковать)' : '(нужно довести до 90+)'}`,
    '',
    '## Workflow',
    '1. Прочитай `super_prompt.txt`.',
    '2. По `routes.json` создай страницы; для каждой загрузи контракт из `page_contracts.json`.',
    '3. Встрой соответствующие JSON-LD из `schema_pack.json`.',
    '4. Положи `llms.txt`, `robots.txt`, `sitemap.xml` в корень.',
    '5. Прогоняй `acceptance_checklist.md` пока все пункты не зелёные.',
    '6. Ответь "READY" в чат, когда сайт собран.',
    '',
  ].join('\n');
}
