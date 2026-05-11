/**
 * llms.txt builder — V3.
 *
 * Spec-of-record: https://llmstxt.org
 * Format:
 *   # Brand name
 *   > Short summary (1-3 sentences)
 *
 *   ## Section
 *   - [Page title](URL): Optional description
 *
 *   Our generator produces:
 *     • Header with brand + 1-2 sentence positioning
 *     • Section "Business KPIs" — KPI/CR/CPA из vertical_profile (PR-21, H9)
 *     • Sections grouped by funnel stage (Главное / Услуги / Прайс / Контент / Контакты)
 *     • Optional citation policy block
 */

import type { PassportInputs } from './types.js';
import type { SiteStrategy } from '../strategy/types.js';
import { getVerticalProfile } from '../verticals/index.js';

export function buildLlmsTxt(inputs: PassportInputs, strategy: SiteStrategy): string {
  const lines: string[] = [];
  lines.push(`# ${inputs.brand_name}`);
  lines.push('');
  lines.push(`> ${strategy.positioning}`);
  lines.push('');

  const policyBlock =
    inputs.ai_training_policy === 'deny'
      ? 'Использование контента для обучения языковых моделей запрещено. Цитирование с указанием источника разрешено.'
      : inputs.ai_training_policy === 'allow_with_attribution'
        ? 'Использование контента для обучения и цитирования разрешено при обязательном указании источника и обратной ссылки.'
        : 'Использование контента в рамках разумного цитирования разрешено.';
  lines.push(`## Политика использования контента`);
  lines.push(`${policyBlock}`);
  if (inputs.license) lines.push(`Лицензия: ${inputs.license}`);
  lines.push('');

  // ── PR-21: Business KPIs (H9) ─────────────────────────────────────
  // Подтягиваем типичные KPI ниши (CR visit→lead, CR lead→sale, CPA, AOV,
  // LTV, sales cycle) из vertical_profile по strategy.project_code, чтобы
  // LLM мог опираться на бизнес-метрики страницы при генерации контента.
  const profile = getVerticalProfile(strategy.project_code);
  if (profile) {
    const kpi = profile.kpi;
    const kpiLines: string[] = [];
    if (typeof kpi.cr_visit_to_lead === 'number') {
      const pct = (kpi.cr_visit_to_lead * 100).toFixed(1);
      kpiLines.push(`- Conversion Rate (visit → lead): ~${pct}%`);
    }
    if (typeof kpi.cr_lead_to_sale === 'number') {
      const pct = (kpi.cr_lead_to_sale * 100).toFixed(0);
      kpiLines.push(`- Conversion Rate (lead → sale): ~${pct}%`);
    }
    if (typeof kpi.cpa_rub === 'number' && kpi.cpa_rub > 0) {
      kpiLines.push(`- CPA target: ~${kpi.cpa_rub.toLocaleString('ru-RU')} ₽`);
    }
    if (typeof kpi.average_order_rub === 'number' && kpi.average_order_rub > 0) {
      kpiLines.push(`- Средний чек (AOV): ~${kpi.average_order_rub.toLocaleString('ru-RU')} ₽`);
    }
    if (typeof kpi.ltv_rub === 'number' && kpi.ltv_rub > 0) {
      kpiLines.push(`- LTV: ~${kpi.ltv_rub.toLocaleString('ru-RU')} ₽`);
    }
    if (typeof kpi.sales_cycle_days === 'number' && kpi.sales_cycle_days > 0) {
      kpiLines.push(`- Цикл сделки: ~${kpi.sales_cycle_days} дн.`);
    }
    if (typeof kpi.frequency_index === 'number') {
      kpiLines.push(`- Частотный индекс ниши: ${kpi.frequency_index}/100`);
    }
    if (kpiLines.length > 0) {
      lines.push('## Business KPIs');
      lines.push(`Типичные бизнес-метрики ниши «${profile.title_ru}» (модель: ${profile.monetization}).`);
      lines.push(...kpiLines);
      lines.push('');
    }
  }

  // Group pages by funnel stage
  const byStage = new Map<string, typeof strategy.pages>();
  for (const stage of strategy.funnel_stages) {
    byStage.set(stage.stage, []);
  }
  for (const page of strategy.pages) {
    const stage = strategy.funnel_stages.find((s) => s.page_types.includes(page.page_type));
    const key = stage?.stage ?? 'consideration';
    if (!byStage.has(key)) byStage.set(key, []);
    byStage.get(key)!.push(page);
  }

  const stageLabels: Record<string, string> = {
    awareness: 'Главное и контент',
    consideration: 'Услуги и продукты',
    decision: 'Цены, контакты, бронирование',
    retention: 'Поддержка и сообщество',
  };

  for (const [stage, pages] of byStage) {
    if (pages.length === 0) continue;
    lines.push(`## ${stageLabels[stage] ?? stage}`);
    for (const p of pages) {
      const title = p.contract.h1_template;
      const url = inputs.base_url + p.url_pattern.replace(/\{[^}]+\}/g, ':param');
      const desc = p.contract.intro_answer_template
        .split(/[.!?]/)[0]
        .trim()
        .slice(0, 140);
      lines.push(`- [${title}](${url}): ${desc}`);
    }
    lines.push('');
  }

  lines.push('## Контакт для AI');
  lines.push(`- email: ${inputs.contact_email}`);
  lines.push(`- сайт: ${inputs.base_url}`);

  return lines.join('\n');
}
