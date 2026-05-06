/**
 * Gap-анализатор: сравнивает crawl-результат с PageContracts для проекта.
 *
 * Идёт по каждой crawled-странице:
 *  - находим контракт по page_type_guess (или 'other' → fallback к ближайшему типу)
 *  - проверяем required_schemas, required_blocks, обязательные мета
 *  - считаем weighted score, агрегируем по SEO/GEO/CRO осям
 */
import { sql } from '../../db/client.js';
import { logger } from '../../utils/logger.js';
import { listPageContracts } from '../FormulaV2/repository.js';
import type { ProjectTypeCode, PageContract } from '../../types/formulaV2.js';
import type { CrawlPageRecord } from '../CrawlEngine/types.js';
import type {
  AuditPageGap,
  AuditRecommendation,
  AuditReport,
} from './types.js';

const SCHEMA_AXIS: Record<string, 'seo' | 'geo' | 'cro'> = {
  Organization: 'seo',
  WebSite: 'seo',
  BreadcrumbList: 'seo',
  Article: 'seo',
  BlogPosting: 'seo',
  FAQPage: 'seo',
  LocalBusiness: 'geo',
  GeoCoordinates: 'geo',
  PostalAddress: 'geo',
  Service: 'geo',
  Product: 'cro',
  Offer: 'cro',
  AggregateRating: 'cro',
  Review: 'cro',
};

const BLOCK_AXIS: Record<string, 'seo' | 'geo' | 'cro'> = {
  hero: 'cro',
  cta: 'cro',
  faq: 'seo',
  reviews: 'cro',
  pricing_table: 'cro',
  contacts_block: 'geo',
  form: 'cro',
  breadcrumbs: 'seo',
  team: 'seo',
  advantages: 'cro',
  portfolio_grid: 'seo',
  stats: 'cro',
  gallery: 'seo',
};

function pickContract(
  pageType: string,
  contracts: PageContract[],
): PageContract | null {
  const exact = contracts.find((c) => c.page_type === pageType);
  if (exact) return exact;
  // fallback: 'home' для всего, что не классифицировалось
  if (pageType === 'other') return contracts.find((c) => c.page_type === 'home') ?? null;
  return null;
}

function checkPageAgainstContract(
  page: CrawlPageRecord,
  contract: PageContract,
): { gap: AuditPageGap | null; weights: { seo: number; geo: number; cro: number } } {
  const missing_schemas: string[] = [];
  const missing_blocks: string[] = [];
  const missing_meta: string[] = [];
  const forbidden_blocks_present: string[] = [];

  const haveSchemas = new Set(page.schemas_found);
  for (const s of contract.required_schemas) {
    if (!haveSchemas.has(s)) missing_schemas.push(s);
  }
  const haveBlocks = new Set(page.blocks_detected);
  for (const b of contract.required_blocks) {
    if (!haveBlocks.has(b)) missing_blocks.push(b);
  }
  for (const f of contract.forbidden_blocks) {
    if (haveBlocks.has(f)) forbidden_blocks_present.push(f);
  }

  if (!page.title || page.title.length < 10) missing_meta.push('title');
  if (!page.meta_description || page.meta_description.length < contract.required_meta_desc_min) {
    missing_meta.push('meta_description');
  }
  if (!page.h1) missing_meta.push('h1');
  if (contract.canonical_required && !page.canonical) missing_meta.push('canonical');

  const word_count_short = (page.word_count ?? 0) < contract.min_word_count;

  // axis weights — каждый промах вычитает из своей оси
  const weights = { seo: 0, geo: 0, cro: 0 };
  for (const s of missing_schemas) {
    const ax = SCHEMA_AXIS[s] ?? 'seo';
    weights[ax] += 6;
  }
  for (const b of missing_blocks) {
    const ax = BLOCK_AXIS[b] ?? 'cro';
    weights[ax] += 4;
  }
  if (missing_meta.includes('title')) weights.seo += 8;
  if (missing_meta.includes('meta_description')) weights.seo += 5;
  if (missing_meta.includes('h1')) weights.seo += 7;
  if (missing_meta.includes('canonical')) weights.seo += 3;
  if (word_count_short) weights.seo += 4;
  if (forbidden_blocks_present.length) weights.cro += 3 * forbidden_blocks_present.length;

  const totalLoss = weights.seo + weights.geo + weights.cro;
  if (totalLoss === 0) return { gap: null, weights };

  const severity: AuditPageGap['severity'] =
    totalLoss >= 25 ? 'critical' : totalLoss >= 15 ? 'high' : totalLoss >= 8 ? 'medium' : 'low';

  const messageBits: string[] = [];
  if (missing_schemas.length) messageBits.push(`нет schema: ${missing_schemas.join(', ')}`);
  if (missing_blocks.length) messageBits.push(`нет блоков: ${missing_blocks.join(', ')}`);
  if (missing_meta.length) messageBits.push(`мета: ${missing_meta.join(', ')}`);
  if (word_count_short) messageBits.push(`мало текста (<${contract.min_word_count} слов)`);
  if (forbidden_blocks_present.length) {
    messageBits.push(`лишние блоки: ${forbidden_blocks_present.join(', ')}`);
  }

  return {
    gap: {
      url: page.url,
      page_type: contract.page_type,
      contract_id: contract.id,
      missing_schemas,
      missing_blocks,
      missing_meta,
      word_count_short,
      forbidden_blocks_present,
      severity,
      message_ru: messageBits.join('; '),
    },
    weights,
  };
}

function buildRecommendations(gaps: AuditPageGap[]): AuditRecommendation[] {
  const out: AuditRecommendation[] = [];
  for (const g of gaps) {
    for (const s of g.missing_schemas) {
      out.push({
        page_type: g.page_type,
        action: 'add_schema',
        target: s,
        description_ru: `Добавить JSON-LD ${s} на ${g.page_type}`,
        priority: g.severity === 'critical' ? 1 : 2,
      });
    }
    for (const b of g.missing_blocks) {
      out.push({
        page_type: g.page_type,
        action: 'add_block',
        target: b,
        description_ru: `Добавить блок ${b} на страницу ${g.page_type}`,
        priority: g.severity === 'critical' ? 1 : 2,
      });
    }
    if (g.missing_meta.includes('title')) {
      out.push({
        page_type: g.page_type,
        action: 'rewrite_meta',
        target: 'title',
        description_ru: `Заполнить <title> на ${g.url}`,
        priority: 1,
      });
    }
    if (g.missing_meta.includes('h1')) {
      out.push({
        page_type: g.page_type,
        action: 'fix_h1',
        target: 'h1',
        description_ru: `Добавить уникальный H1 на ${g.url}`,
        priority: 1,
      });
    }
    if (g.missing_meta.includes('meta_description')) {
      out.push({
        page_type: g.page_type,
        action: 'rewrite_meta',
        target: 'meta_description',
        description_ru: `Дополнить meta description (${g.url})`,
        priority: 2,
      });
    }
    if (g.missing_meta.includes('canonical')) {
      out.push({
        page_type: g.page_type,
        action: 'add_canonical',
        target: 'canonical',
        description_ru: `Указать canonical для ${g.url}`,
        priority: 2,
      });
    }
    if (g.word_count_short) {
      out.push({
        page_type: g.page_type,
        action: 'increase_content',
        target: 'body',
        description_ru: `Расширить текст на ${g.url} (мало слов)`,
        priority: 3,
      });
    }
    for (const f of g.forbidden_blocks_present) {
      out.push({
        page_type: g.page_type,
        action: 'remove_block',
        target: f,
        description_ru: `Убрать запрещённый блок ${f} с ${g.url}`,
        priority: 3,
      });
    }
  }
  // dedupe by (page_type, action, target)
  const seen = new Set<string>();
  return out.filter((r) => {
    const k = `${r.page_type}|${r.action}|${r.target}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

export async function analyzeGaps(args: {
  projectTypeCode: ProjectTypeCode;
  url: string;
  crawlSessionId: string | null;
  pages: CrawlPageRecord[];
  sessionId?: string | null;
  persist?: boolean;
}): Promise<AuditReport> {
  const contracts = await listPageContracts(args.projectTypeCode);
  const gaps: AuditPageGap[] = [];
  const totals = { seo: 0, geo: 0, cro: 0 };
  let contractsPassed = 0;
  let contractsFailed = 0;
  let pagesAudited = 0;

  for (const p of args.pages) {
    const ptype = p.page_type_guess || 'other';
    const contract = pickContract(ptype, contracts);
    if (!contract) continue;
    pagesAudited += 1;
    const r = checkPageAgainstContract(p, contract);
    totals.seo += r.weights.seo;
    totals.geo += r.weights.geo;
    totals.cro += r.weights.cro;
    if (r.gap) {
      gaps.push(r.gap);
      contractsFailed += 1;
    } else {
      contractsPassed += 1;
    }
  }

  // нормализуем потери в score 0..100 на каждую ось
  const norm = (loss: number) => Math.max(0, 100 - Math.round(loss / Math.max(1, pagesAudited)));
  const seo_score = norm(totals.seo);
  const geo_score = norm(totals.geo);
  const cro_score = norm(totals.cro);
  const overall_score = Math.round(seo_score * 0.5 + geo_score * 0.25 + cro_score * 0.25);

  const recommendations = buildRecommendations(gaps);

  const report: AuditReport = {
    audit_id: null,
    project_type_code: args.projectTypeCode,
    url: args.url,
    pages_total: args.pages.length,
    pages_audited: pagesAudited,
    overall_score,
    seo_score,
    geo_score,
    cro_score,
    contracts_passed: contractsPassed,
    contracts_failed: contractsFailed,
    gaps,
    recommendations,
    raw: { sampled_pages: args.pages.slice(0, 10) },
    generated_at: new Date().toISOString(),
  };

  if (args.persist !== false) {
    try {
      const [row] = await sql<{ id: string }[]>`
        INSERT INTO site_audit_results (
          session_id, crawl_session_id, project_type_code, url,
          pages_total, pages_audited,
          overall_score, seo_score, geo_score, cro_score,
          contracts_passed, contracts_failed, gaps, recommendations, raw
        ) VALUES (
          ${args.sessionId ?? null}, ${args.crawlSessionId},
          ${args.projectTypeCode}, ${args.url},
          ${report.pages_total}, ${report.pages_audited},
          ${report.overall_score}, ${report.seo_score}, ${report.geo_score}, ${report.cro_score},
          ${report.contracts_passed}, ${report.contracts_failed},
          ${sql.json(report.gaps as any)}, ${sql.json(report.recommendations as any)}, ${sql.json(report.raw as any)}
        )
        RETURNING id
      `;
      report.audit_id = row.id;
    } catch (e: any) {
      logger.warn('AUDIT', `persist failed: ${e?.message || e}`);
    }
  }

  return report;
}
