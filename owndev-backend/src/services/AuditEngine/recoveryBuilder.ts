/**
 * RecoveryBuilder — превращает AuditReport в Recovery Blueprint:
 * предлагает JSON-LD патчи и контентные правки, оценивает прогноз preflight-score
 * после применения всех фиксов.
 */
import { sql } from '../../db/client.js';
import { logger } from '../../utils/logger.js';
import { renderSchema } from '../FormulaV2/schemaRegistry.js';
import type { ProjectTypeCode } from '../../types/formulaV2.js';
import type { AuditReport, RecoveryBlueprint, AuditRecommendation } from './types.js';

const TITLE_TEMPLATES: Record<string, string> = {
  home: 'Главная — {brand}',
  about: 'О компании — {brand}',
  contacts: 'Контакты — {brand}',
  services_index: 'Услуги — {brand}',
  service_detail: '{service} — {brand}',
  pricing: 'Цены и тарифы — {brand}',
  faq: 'Часто задаваемые вопросы — {brand}',
  blog_index: 'Блог — {brand}',
  blog_post: '{topic} — блог {brand}',
  product_index: 'Каталог — {brand}',
  product_detail: '{product} — {brand}',
  category: '{category} — каталог {brand}',
  case_detail: 'Кейс: {project} — {brand}',
};

const H1_TEMPLATES: Record<string, string> = {
  home: '{brand}',
  about: 'О компании {brand}',
  contacts: 'Контакты',
  services_index: 'Наши услуги',
  service_detail: '{service}',
  pricing: 'Цены и тарифы',
  faq: 'Частые вопросы',
  blog_index: 'Блог',
  blog_post: '{topic}',
  product_detail: '{product}',
};

function pickBrand(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    return host.split('.')[0];
  } catch {
    return 'Бренд';
  }
}

async function buildSchemaPatches(
  fixes: AuditRecommendation[],
  brand: string,
  url: string,
): Promise<Array<{ schema_type: string; jsonld: Record<string, any> }>> {
  const out: Array<{ schema_type: string; jsonld: Record<string, any> }> = [];
  const seen = new Set<string>();
  for (const f of fixes) {
    if (f.action !== 'add_schema') continue;
    if (seen.has(f.target)) continue;
    seen.add(f.target);
    try {
      const jsonld = await renderSchemaForType(f.target, brand, url);
      if (jsonld) out.push({ schema_type: f.target, jsonld });
    } catch (e: any) {
      logger.warn('RECOVERY', `cannot render schema ${f.target}: ${e?.message || e}`);
    }
  }
  return out;
}

async function renderSchemaForType(
  type: string,
  brand: string,
  url: string,
): Promise<Record<string, any> | null> {
  // Пробуем через реестр; если шаблон не найден — даём минимальный валидный JSON-LD.
  try {
    const r = await renderSchema(
      type,
      {
        name: brand,
        url,
        logo: `${url.replace(/\/$/, '')}/logo.png`,
        description: `${brand} — официальный сайт`,
      },
      'default',
    );
    if (r.rendered) return r.rendered as Record<string, any>;
  } catch {
    /* fallthrough to minimal */
  }
  return {
    '@context': 'https://schema.org',
    '@type': type,
    name: brand,
    url,
  };
}

function buildContentPatches(report: AuditReport, brand: string) {
  const out: RecoveryBlueprint['content_patches'] = [];
  for (const g of report.gaps) {
    const t = TITLE_TEMPLATES[g.page_type] ?? '{brand}';
    const h1 = H1_TEMPLATES[g.page_type] ?? brand;
    out.push({
      url: g.url,
      suggested_h1: g.missing_meta.includes('h1') ? h1.replace('{brand}', brand) : null,
      suggested_title: g.missing_meta.includes('title')
        ? t.replace('{brand}', brand)
        : null,
      suggested_meta: g.missing_meta.includes('meta_description')
        ? `${brand} — ${g.page_type}. Узнайте подробнее на нашем сайте.`
        : null,
      missing_blocks: g.missing_blocks,
    });
  }
  return out;
}

function predictScore(report: AuditReport): number {
  // если применить ВСЕ исправления — overall_score должен дойти до ~95 (с запасом).
  // Прогноз = текущий + (100 - текущий) * 0.85.
  return Math.min(100, Math.round(report.overall_score + (100 - report.overall_score) * 0.85));
}

export async function buildRecovery(
  report: AuditReport,
  opts: { sessionId?: string | null; persist?: boolean } = {},
): Promise<RecoveryBlueprint> {
  if (!report.audit_id) {
    throw new Error('AuditReport must be persisted (audit_id required) before recovery');
  }
  const brand = pickBrand(report.url);
  const fixes = report.recommendations;
  const schema_patches = await buildSchemaPatches(fixes, brand, report.url);
  const content_patches = buildContentPatches(report, brand);
  const preflight_score = predictScore(report);

  const blueprint: RecoveryBlueprint = {
    recovery_id: null,
    audit_id: report.audit_id,
    project_type_code: report.project_type_code as ProjectTypeCode,
    fixes,
    schema_patches,
    content_patches,
    preflight_score,
  };

  if (opts.persist !== false) {
    try {
      const [row] = await sql<{ id: string }[]>`
        INSERT INTO recovery_blueprints (
          audit_id, session_id, project_type_code,
          fixes, schema_patches, content_patches, preflight_score
        ) VALUES (
          ${report.audit_id}, ${opts.sessionId ?? null}, ${report.project_type_code},
          ${sql.json(fixes as any)}, ${sql.json(schema_patches as any)}, ${sql.json(content_patches as any)},
          ${preflight_score}
        )
        RETURNING id
      `;
      blueprint.recovery_id = row.id;
    } catch (e: any) {
      logger.warn('RECOVERY', `persist failed: ${e?.message || e}`);
    }
  }

  return blueprint;
}
