/**
 * Генерация super_prompt.txt — главный промпт для AI-кодера.
 * Инструктирует Claude/GPT/Cursor построить сайт по нашей формуле.
 */
import type { BlueprintV2 } from '../../types/formulaV2.js';
import type { AuditReport, RecoveryBlueprint } from '../AuditEngine/types.js';

export function generateSuperPrompt(args: {
  blueprint: BlueprintV2;
  audit?: AuditReport | null;
  recovery?: RecoveryBlueprint | null;
  businessName?: string;
  siteUrl?: string;
}): string {
  const { blueprint, audit, recovery } = args;
  const business = args.businessName || 'Бренд';
  const url = args.siteUrl || '(укажите URL)';
  const lines: string[] = [];

  lines.push('# OWNDEV AI DEVELOPER PACK — SUPER PROMPT v1');
  lines.push('');
  lines.push(`Тип проекта: **${blueprint.project_type_code}**`);
  lines.push(`Бренд: **${business}**`);
  lines.push(`URL: ${url}`);
  lines.push(`Engine version: ${blueprint.engine_version}`);
  lines.push(`Preflight score (текущий): ${blueprint.preflight.score}/100 ${blueprint.preflight.publishable ? '✅ publishable' : '⛔ нужно довести до 90+'}`);
  lines.push('');
  lines.push('## ЗАДАЧА ДЛЯ ИИ-КОДЕРА');
  lines.push('');
  lines.push('Построить сайт по формуле OWNDEV (SEO + GEO + CRO).');
  lines.push('Соблюсти все Page Contracts (см. `page_contracts.json`).');
  lines.push('Все JSON-LD схемы из `schema_pack.json` встроить в соответствующие страницы.');
  lines.push('Маршруты — в `routes.json`. llms.txt и robots.txt — корневые файлы сайта.');
  lines.push('');
  lines.push('## КРИТЕРИИ ПРИЁМКИ');
  lines.push('');
  lines.push('Каждая страница должна:');
  lines.push('1. Иметь все required_schemas (JSON-LD, валидируется Google Rich Results Test).');
  lines.push('2. Содержать все required_blocks (см. контракт страницы).');
  lines.push('3. Иметь уникальные title (≥10 симв.), meta description (160-180), h1.');
  lines.push('4. Min word_count соблюдён.');
  lines.push('5. Canonical, hreflang и open graph корректно проставлены.');
  lines.push('6. Pageweight ≤ 1.5 МБ, LCP < 2.5s, CLS < 0.1, INP < 200ms.');
  lines.push('7. robots.txt разрешает GPTBot/PerplexityBot/ClaudeBot/Google-Extended/CCBot, llms.txt — присутствует в корне.');
  lines.push('');
  lines.push(`## СТРАНИЦЫ (всего: ${blueprint.pages.length})`);
  lines.push('');
  for (const p of blueprint.pages) {
    lines.push(`- **${p.page_type}** \`${p.url_pattern}\``);
    lines.push(`  - title: ${p.title_template}`);
    lines.push(`  - h1: ${p.h1_template}`);
    lines.push(`  - schemas: ${p.required_schemas.join(', ') || '—'}`);
    lines.push(`  - blocks: ${p.required_blocks.join(', ') || '—'}`);
  }
  lines.push('');
  if (audit && audit.gaps.length) {
    lines.push('## ТЕКУЩИЙ АУДИТ САЙТА');
    lines.push('');
    lines.push(`Overall: ${audit.overall_score}/100 (SEO ${audit.seo_score} / GEO ${audit.geo_score} / CRO ${audit.cro_score})`);
    lines.push(`Контрактов passed/failed: ${audit.contracts_passed}/${audit.contracts_failed}`);
    lines.push('');
    lines.push('### Gaps (топ-критичных)');
    const top = audit.gaps
      .slice()
      .sort((a, b) => severityRank(b.severity) - severityRank(a.severity))
      .slice(0, 15);
    for (const g of top) {
      lines.push(`- [${g.severity}] ${g.url} — ${g.message_ru}`);
    }
    lines.push('');
  }
  if (recovery) {
    lines.push('## RECOVERY PLAN');
    lines.push('');
    lines.push(`Прогноз preflight после фиксов: ${recovery.preflight_score}/100`);
    lines.push(`Всего исправлений: ${recovery.fixes.length}`);
    lines.push(`Schema-патчей: ${recovery.schema_patches.length}, контентных: ${recovery.content_patches.length}`);
    lines.push('');
  }
  lines.push('## ФОРМАТ ВЫВОДА');
  lines.push('');
  lines.push('Для каждой страницы создай `<page>.tsx` (или `.html`) с встроенным JSON-LD,');
  lines.push('используй Tailwind, семантические теги, sitemap.xml в корне, llms.txt и robots.txt.');
  lines.push('После генерации проверь acceptance_checklist.md и ответь "READY" если все пункты ✅.');
  lines.push('');
  lines.push('## КОНЕЦ');
  return lines.join('\n');
}

function severityRank(s: string): number {
  return ({ critical: 4, high: 3, medium: 2, low: 1 } as Record<string, number>)[s] ?? 0;
}
