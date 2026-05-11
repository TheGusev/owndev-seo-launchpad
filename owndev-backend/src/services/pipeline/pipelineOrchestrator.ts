/**
 * services/pipeline — V3 Pipeline Orchestrator.
 *
 * Linear stages:
 *   0. INTAKE      — validate input
 *   1. DEMAND      — Wordstat clusters + geo distribution
 *   2. CRAWL       — fetch site (cheerio + Jina fallback for SPA)
 *   3. AUDIT       — extractors + audits → PageEvidence per page
 *   4. PREFLIGHT   — 4-axis scoring per page + rollup
 *   5. PACK        — strategy + page contracts + technical passport →
 *                    super_prompt_pack v1 → ZIP bundle
 *
 * The orchestrator REUSES the existing BullMQ infrastructure (5 queues
 * + 5 workers in src/queue, src/workers) — V3 only ties services together
 * for synchronous, in-process execution; queue-driven runs go through the
 * V2 workers which now load V3 services where appropriate.
 */

import { randomUUID } from 'node:crypto';
import { logger } from '../../utils/logger.js';
import { sql } from '../../db/client.js';
import { runDemandIntelligence } from '../demand/index.js';
import { crawlSite } from '../CrawlEngine/index.js';
import { auditService } from '../audit/index.js';
import { preflightService, type PageEvidence, type PreflightReport } from '../preflight/index.js';
import { loadActiveRules } from '../preflight/repository.js';
import { buildStrategy } from '../strategy/index.js';
import { technicalPassportService } from '../technicalPassport/index.js';
import { buildGraph } from '../schemaRegistry/index.js';
import { developerPackService, savePackArtifact } from '../developerPack/index.js';
import { pickProfileForIndustry } from '../demand/profiles/index.js';
import { buildProReport } from './proReportBuilder.js';
import type {
  PipelineInput,
  PipelineResultV3,
  PipelineStage,
  PipelineStageResult,
  PipelineDecisionTraceEntry,
} from './types.js';
import type { EngineModule, ProjectTypeCodeV3 } from '../../types/formulaV3.js';
import type { CrawlPageRecord } from '../CrawlEngine/types.js';
import type { DemandIntelligenceResult } from '../demand/types.js';
import type { SiteStrategy, SitePage } from '../strategy/types.js';
import type { TechnicalPassportArtifacts, PassportInputs } from '../technicalPassport/types.js';

interface FetchResult {
  url: string;
  status: number;
  html: string;
  headers: Record<string, string>;
}

const DEFAULT_UA =
  'Mozilla/5.0 (compatible; OwndevV3-Pipeline/1.0; +https://owndev.ru/bot)';

async function fetchPageHtml(url: string, ua = DEFAULT_UA): Promise<FetchResult> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 12_000);
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': ua, Accept: 'text/html,*/*;q=0.8' },
      redirect: 'follow',
      signal: ctrl.signal,
    });
    const ct = res.headers.get('content-type') ?? '';
    const html = ct.includes('text/html') ? await res.text() : '';
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => {
      headers[k] = v;
    });
    return { url, status: res.status, html, headers };
  } finally {
    clearTimeout(t);
  }
}

function deriveDomain(rootUrl: string): string {
  try {
    return new URL(rootUrl).hostname;
  } catch {
    return rootUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  }
}

function deriveBaseUrl(rootUrl: string): string {
  try {
    const u = new URL(rootUrl);
    return `${u.protocol}//${u.host}`;
  } catch {
    return rootUrl.replace(/\/$/, '');
  }
}

function pickPageContractFor(strategy: SiteStrategy, pageUrl: string): SitePage | undefined {
  const path = (() => {
    try {
      return new URL(pageUrl).pathname || '/';
    } catch {
      return '/';
    }
  })();
  // Try exact url_pattern match (without dynamic segments)
  for (const p of strategy.pages) {
    const pattern = p.url_pattern.replace(/:\w+/g, '[^/]+').replace(/\*/g, '.*');
    try {
      const rx = new RegExp(`^${pattern}$`);
      if (rx.test(path)) return p;
    } catch {
      // ignore bad pattern
    }
  }
  // Fallback: home page → '/'
  if (path === '/' || path === '') {
    return strategy.pages.find((p) => p.page_type === 'home');
  }
  return undefined;
}

// PR-19: маппинг стадий оркестратора на имена модулей в БД
// (formula_project_types.engine_modules). Стадия 'pack' в коде = модуль
// 'developerPack' в БД. Все остальные совпадают по имени.
const STAGE_TO_MODULE: Record<Exclude<PipelineStage, 'done' | 'failed'>, EngineModule> = {
  intake: 'intake',
  demand: 'demand',
  crawl: 'crawl',
  audit: 'audit',
  preflight: 'preflight',
  pack: 'developerPack',
};

// PR-19: грузит whitelist из БД для указанного project_code.
// Если запись не найдена или engine_modules пустые — возвращает null,
// что означает «гейтинг отключён, поведение как до PR-19».
async function loadEngineModulesFromDb(
  project_code: ProjectTypeCodeV3,
): Promise<EngineModule[] | null> {
  try {
    const rows = await sql<Array<{ engine_modules: string[] | null }>>`
      SELECT engine_modules
      FROM formula_project_types
      WHERE code = ${project_code}
      LIMIT 1
    `;
    const arr = rows[0]?.engine_modules;
    if (!arr || arr.length === 0) return null;
    return arr as EngineModule[];
  } catch (err: any) {
    logger.warn(
      'PIPELINE',
      `engine_modules load failed for ${project_code}: ${err.message} — gating disabled`,
    );
    return null;
  }
}

export class PipelineOrchestrator {
  async run(input: PipelineInput): Promise<PipelineResultV3> {
    const stages: PipelineStageResult[] = [];
    const decisionTrace: PipelineDecisionTraceEntry[] = [];
    const startAll = Date.now();
    const result: PipelineResultV3 = {
      job_id: input.job_id,
      root_url: input.root_url ?? undefined,
      status: 'failed',
      stages,
      decision_trace: decisionTrace,
      generated_at: new Date().toISOString(),
    };

    // PR-19: грузим engine_modules whitelist. Приоритет: input override → БД.
    // Если ничего нет — гейтинг отключён (поведение как до PR-19).
    let engineModules: EngineModule[] | null = null;
    if (input.engine_modules && input.engine_modules.length > 0) {
      engineModules = input.engine_modules;
    } else if (input.project_code) {
      engineModules = await loadEngineModulesFromDb(input.project_code);
    }
    if (engineModules) {
      logger.info(
        'PIPELINE',
        `[${input.job_id}] engine_modules whitelist: [${engineModules.join(',')}]`,
      );
    }

    // PR-19: предварительно вычисляем решение по каждой стадии и пишем
    // decision_trace заранее. Это гарантирует, что трасса будет полной даже
    // если оркестратор упадёт на промежуточной стадии (например, при ошибке
    // buildStrategy между demand и audit). whitelist приоритетнее skip_*:
    // если стадия отключена в engine_modules — это 'engine_modules_disabled',
    // даже когда юзер выставил skip-флаг.
    const stageDecision: Record<Exclude<PipelineStage, 'done' | 'failed'>, boolean> = {
      intake: true, demand: true, crawl: true, audit: true, preflight: true, pack: true,
    };
    const decide = (
      stage: Exclude<PipelineStage, 'done' | 'failed'>,
      userSkip?: boolean,
    ): void => {
      const moduleName = STAGE_TO_MODULE[stage];
      const whitelistAllows =
        engineModules === null ? true : engineModules.includes(moduleName);
      if (!whitelistAllows) {
        decisionTrace.push({
          stage,
          status: 'skipped',
          reason: 'engine_modules_disabled',
        });
        stageDecision[stage] = false;
        return;
      }
      if (userSkip === true) {
        decisionTrace.push({ stage, status: 'skipped', reason: 'user_skip_flag' });
        stageDecision[stage] = false;
        return;
      }
      decisionTrace.push({ stage, status: 'enabled' });
    };
    decide('intake');
    decide('demand', input.skip_demand);
    decide('crawl', input.skip_crawl);
    decide('audit');
    decide('preflight');
    decide('pack');
    const isStageEnabled = (stage: Exclude<PipelineStage, 'done' | 'failed'>) =>
      stageDecision[stage];

    try {
      // ── Stage 0: INTAKE ────────────────────────────────────────────────
      // root_url опционален — клиент может ещё не иметь домена.
      const hasUrl = !!input.root_url && input.root_url.trim().length > 0;
      // intake — валидация входа, по сути обязательная стадия. Если в whitelist
      // её нет — пропускаем валидацию (но всё равно проверяем project_code,
      // потому что без него мы не смогли бы даже загрузить whitelist).
      if (isStageEnabled('intake')) {
        const tIntake = await this.timeStage('intake', async () => {
          if (!input.project_code) {
            throw new Error('project_code is required');
          }
          if (!input.brand?.name) {
            throw new Error('brand.name is required');
          }
          if (hasUrl) {
            try {
              new URL(input.root_url!);
            } catch {
              throw new Error(`Invalid root_url: ${input.root_url}`);
            }
          }
        });
        stages.push(tIntake);
      }

      // ── Stage 1: DEMAND ────────────────────────────────────────────────
      // Авто-seed: если клиент не передал seed_keywords, но есть отрасль и города —
      // собираем базовый набор запросов сами, чтобы DEMAND/Wordstat не пропускался.
      // Без этого PRO-отчёт получался пустым ("всё за секунду" в UI).
      let effectiveSeeds: string[] = Array.isArray(input.seed_keywords)
        ? input.seed_keywords.filter((s) => typeof s === 'string' && s.trim().length > 0)
        : [];
      const autoSeedUsed = effectiveSeeds.length === 0 && !!input.brand?.industry;
      if (autoSeedUsed) {
        const industry = input.brand.industry.trim().toLowerCase();
        const cityList: string[] = [];
        if (input.brand.primary_city) cityList.push(input.brand.primary_city);
        // вытаскиваем доп.города из competitive_position (туда фронт их кладёт)
        const cpos = input.brand.competitive_position ?? '';
        const m = cpos.match(/Города работы:\s*([^.]+)/i);
        if (m) {
          for (const c of m[1].split(',').map((x) => x.trim()).filter(Boolean)) {
            if (!cityList.includes(c)) cityList.push(c);
          }
        }
        const cities = cityList.length > 0 ? cityList : ['Москва'];
        const profile = pickProfileForIndustry(industry);
        const seeds = new Set<string>();
        // базовый seed — сама отрасль
        seeds.add(industry);
        // seed «отрасль + город» и с модификаторами по профилю
        for (const c of cities) {
          const cl = c.toLowerCase();
          seeds.add(`${industry} ${cl}`);
          for (const mod of profile.modifiers_per_city) {
            seeds.add(`${industry} ${cl} ${mod}`);
          }
        }
        // глобальные модификаторы без города (инфо/обзоры)
        for (const mod of profile.modifiers_global) {
          seeds.add(`${industry} ${mod}`);
        }
        effectiveSeeds = Array.from(seeds).slice(0, 16);
        logger.info(
          'PIPELINE',
          `[${input.job_id}] DEMAND auto-seed: ${effectiveSeeds.length} seeds ` +
            `(industry="${industry}", profile="${profile.id}", cities=${cities.length})`,
        );
      }

      // session_id для demand-репо должен быть валидным UUID (Postgres uuid колонка),
      // а input.job_id может быть произвольной строкой. Минтим UUID если нужно.
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const demandSessionId = UUID_RE.test(input.job_id) ? input.job_id : randomUUID();
      if (demandSessionId !== input.job_id) {
        logger.info(
          'PIPELINE',
          `[${input.job_id}] DEMAND minted UUID session_id=${demandSessionId} (job_id is not a UUID)`,
        );
      }

      let demand: DemandIntelligenceResult | undefined;
      if (isStageEnabled('demand')) {
        const tDemand = await this.timeStage('demand', async () => {
          if (effectiveSeeds.length === 0) {
            logger.info('PIPELINE', `[${input.job_id}] DEMAND skipped (no seeds)`);
            return;
          }
          try {
            demand = await runDemandIntelligence(demandSessionId, effectiveSeeds, {
              brand_tokens: [input.brand.name],
              with_geo_distribution: true,
              with_dynamics: false,
            });
          } catch (err: any) {
            logger.warn('PIPELINE', `[${input.job_id}] DEMAND degraded: ${err.message}`);
            demand = {
              session_id: demandSessionId,
              seed_keywords: effectiveSeeds,
              clusters: [],
              geo_distribution: [],
              recommended_geos: input.recommended_geos ?? ['225'],
              total_volume: 0,
              quota_used: 0,
              generated_at: new Date().toISOString(),
            };
          }
        });
        stages.push(tDemand);
      }
      result.demand = demand;

      // ── Stage 2: CRAWL ─────────────────────────────────────────────────
      let crawlPages: CrawlPageRecord[] = [];
      if (isStageEnabled('crawl')) {
        const tCrawl = await this.timeStage('crawl', async () => {
          if (!hasUrl) {
            logger.info('PIPELINE', `[${input.job_id}] CRAWL skipped (no URL)`);
            return;
          }
          const session = await crawlSite({
            rootUrl: input.root_url!,
            maxPages: input.max_crawl_pages ?? 30,
            respectRobots: true,
            enableJinaFallback: true,
            sessionId: input.job_id,
          });
          crawlPages = session.pages ?? [];
          logger.info(
            'PIPELINE',
            `[${input.job_id}] CRAWL collected ${crawlPages.length} pages (status=${session.status})`,
          );
        });
        stages.push(tCrawl);
      }
      result.crawl_pages = crawlPages;

      // ── Stage 1b/3 prep: build STRATEGY ────────────────────────────────
      // Strategy is needed both for audit (required_schema_types per page)
      // and for pack composition. We build it once here.
      const strategy = await buildStrategy({
        project_code: input.project_code,
        brand_name: input.brand.name,
        brand_positioning: input.brand.competitive_position,
        city: input.brand.primary_city,
        service_main: input.brand.industry,
        clusters: demand?.clusters ?? [],
        recommended_geos:
          demand?.recommended_geos ?? input.recommended_geos ?? ['225'],
        // Мост v1 → v3: пробрасываем engine_state из PRO-входа.
        // Если его нет — strategyBuilder поведёт себя ровно как раньше (legacy).
        engine_state: input.engine_state,
        // PR-3 Fan-out: разворачиваем страницы по городам/направлениям, включаем hub-страницы.
        cities: input.cities,
        service_directions: input.service_directions,
        enable_hub_pages: input.enable_hub_pages,
        // PR-11: защита от взрыва cross-product (направления × города).
        fanout_max_pages: input.fanout_max_pages,
        disable_cross_product: input.disable_cross_product,
      });
      result.strategy = strategy;

      // ── Build TECHNICAL PASSPORT (so audit can see llms.txt / robots) ─
      // Если домена нет — используем placeholder, чтобы passport сгенерировался.
      // Разработчик потом заменит brand.example на реальный домен.
      const effectiveRootUrl = hasUrl ? input.root_url! : 'https://brand.example';
      const baseUrl = deriveBaseUrl(effectiveRootUrl);
      const domain = deriveDomain(effectiveRootUrl);
      const passportInputs: PassportInputs = {
        brand_name: input.brand.name,
        domain,
        base_url: baseUrl,
        contact_email: input.brand.contact_email ?? `info@${domain}`,
        description_ru:
          input.brand.competitive_position ??
          `${input.brand.name} — ${input.brand.industry}`,
        primary_geo: 'RU',
        languages: ['ru'],
        ai_training_policy: input.ai_training_policy ?? 'allow_with_attribution',
        ai_attribution_required: input.ai_training_policy === 'allow_with_attribution',
        license: 'proprietary',
        sitemap_pages: strategy.pages.map((p) => ({
          url: `${baseUrl}${p.url_pattern.replace(/:\w+/g, '').replace(/\/$/, '') || '/'}`,
          priority: p.priority,
          changefreq: p.changefreq,
        })),
      };
      const passport: TechnicalPassportArtifacts = technicalPassportService.build(
        passportInputs,
        strategy,
      );
      result.passport = passport;

      // ── Stage 3: AUDIT (PageEvidence per page) ─────────────────────────
      const evidences: Array<{ page: SitePage | undefined; evidence: PageEvidence; record: CrawlPageRecord }> = [];
      const auditEnabled = isStageEnabled('audit');
      const tAudit = auditEnabled ? await this.timeStage('audit', async () => {
        if (!hasUrl) {
          logger.info('PIPELINE', `[${input.job_id}] AUDIT skipped (no URL)`);
          return;
        }
        // Decide which URLs to audit. If we have crawl results, audit them.
        // Otherwise audit just the root_url.
        const urlsToAudit =
          crawlPages.length > 0
            ? crawlPages.slice(0, 20)
            : [
                {
                  url: input.root_url!,
                  http_status: null,
                  content_type: null,
                  title: null,
                  h1: null,
                  meta_description: null,
                  canonical: null,
                  robots_meta: null,
                  word_count: null,
                  schemas_found: [],
                  blocks_detected: [],
                  page_type_guess: 'home',
                  raw_html_size: null,
                  fetch_ms: null,
                  outbound_links: 0,
                  notes: {},
                } as unknown as CrawlPageRecord,
              ];

        for (const rec of urlsToAudit) {
          let html = '';
          let httpStatus: number | undefined;
          let headers: Record<string, string> = {};
          try {
            const fetched = await fetchPageHtml(rec.url);
            html = fetched.html;
            httpStatus = fetched.status;
            headers = fetched.headers;
          } catch (err: any) {
            logger.warn('PIPELINE', `[${input.job_id}] AUDIT fetch failed for ${rec.url}: ${err.message}`);
            continue;
          }
          if (!html) {
            logger.warn('PIPELINE', `[${input.job_id}] AUDIT no HTML for ${rec.url}`);
            continue;
          }

          const sitePage = pickPageContractFor(strategy, rec.url);
          const requiredSchemaTypes =
            sitePage?.contract.required_schema_graph ?? [];

          const out = auditService.run({
            url: rec.url,
            html,
            http_status: httpStatus,
            response_headers: headers,
            llms_txt: passport.llms_txt,
            robots_txt: passport.robots_txt,
            well_known_ai: passport.ai_well_known,
            sitemap_xml: passport.sitemap_xml,
            project_code: input.project_code,
            page_type: sitePage?.page_type ?? rec.page_type_guess ?? 'home',
            required_schema_types: requiredSchemaTypes,
          });

          evidences.push({ page: sitePage, evidence: out.evidence, record: rec });
        }
      }) : null;
      if (tAudit) stages.push(tAudit);

      // ── Stage 4: PREFLIGHT (per-page + rollup) ─────────────────────────
      const reports: PreflightReport[] = [];
      if (isStageEnabled('preflight')) {
        const tPreflight = await this.timeStage('preflight', async () => {
          for (const e of evidences) {
            try {
              const report = await preflightService.run(
                e.evidence,
                {
                  project_code: input.project_code,
                  page_type: e.page?.page_type ?? e.evidence.page_type,
                  // PR-2 Мост v1→v3: engine_state пробрасываем в preflight,
                  // чтобы подмешались v1-guardrails и считался weighted_total_score.
                  engine_state: input.engine_state,
                },
                input.job_id,
              );
              reports.push(report);
            } catch (err: any) {
              logger.warn(
                'PIPELINE',
                `[${input.job_id}] PREFLIGHT failed for ${e.evidence.url}: ${err.message}`,
              );
            }
          }
        });
        stages.push(tPreflight);
      }
      result.preflight_per_page = reports;

      // Rollup
      if (reports.length > 0) {
        const totals = reports.map((r) => r.total_score);
        const passed = reports.filter((r) => r.passed).length;
        const failedP0 = Array.from(
          new Set(reports.flatMap((r) => r.failed_p0)),
        );
        const axisAvg = (axis: 'SEO' | 'DIRECT' | 'SCHEMA' | 'AI_LLM') => {
          const xs = reports
            .map((r) => r.axes.find((a) => a.axis === axis)?.score ?? 0);
          return xs.length > 0 ? Math.round(xs.reduce((s, x) => s + x, 0) / xs.length) : 0;
        };
        result.preflight_rollup = {
          total_pages: reports.length,
          avg_total_score: Math.round(totals.reduce((s, x) => s + x, 0) / totals.length),
          pages_passed: passed,
          pages_failed: reports.length - passed,
          failed_p0_codes: failedP0,
          axis_avg: {
            seo: axisAvg('SEO'),
            direct: axisAvg('DIRECT'),
            schema: axisAvg('SCHEMA'),
            ai_llm: axisAvg('AI_LLM'),
          },
        };
      }

      // ── Stage 5: PACK (super_prompt_pack v1 + ZIP) ─────────────────────
      const packEnabled = isStageEnabled('pack');
      const tPack = packEnabled ? await this.timeStage('pack', async () => {
        // Build per-page schema graphs so the pack carries ready-to-paste JSON-LD.
        const schemaPerPage: Array<{
          page_type: string;
          graph: { '@context': string; '@graph': any[] };
        }> = [];
        const seen = new Set<string>();
        for (const p of strategy.pages) {
          if (seen.has(p.page_type)) continue;
          seen.add(p.page_type);
          try {
            const built = buildGraph({
              project_code: input.project_code,
              page_type: p.page_type,
              page_url: `${baseUrl}${p.url_pattern.replace(/:\w+/g, '').replace(/\/$/, '') || '/'}`,
              page_name: p.contract.h1_template,
              page_description: p.contract.intro_answer_template ?? p.contract.h1_template,
              schema_ctx: {
                brand_name: input.brand.name,
                url: baseUrl,
                phone: undefined,
                email: input.brand.contact_email,
                address: input.brand.primary_city
                  ? {
                      street: '',
                      city: input.brand.primary_city,
                      region: input.brand.primary_city,
                      country: 'RU',
                    }
                  : undefined,
              } as any,
            });
            schemaPerPage.push({ page_type: p.page_type, graph: built.graph as any });
          } catch (err: any) {
            logger.warn(
              'PIPELINE',
              `[${input.job_id}] schema build failed for ${p.page_type}: ${err.message}`,
            );
          }
        }

        const preflightRules = await loadActiveRules({ project_code: input.project_code });

        const bundle = await developerPackService.buildPack(
          {
            strategy,
            passport,
            preflight_rules: preflightRules,
            schema_per_page: schemaPerPage,
            brand: {
              name: input.brand.name,
              industry: input.brand.industry,
              target_audience: input.brand.target_audience,
              competitive_position: input.brand.competitive_position,
              geo: {
                country: 'RU',
                regions: strategy.recommended_geos,
                primary_city: input.brand.primary_city,
              },
              languages: ['ru'],
            },
          },
          input.pack_mode ?? 'structured',
          input.platform_target,
        );
        result.pack = bundle.pack;
        result.pack_zip_size = bundle.zip_buffer?.length;

        // Persist pack artifact (migration 034: pack_artifacts).
        // Без try/catch ошибка БД упадёт в timeStage и пометит stage 'pack' как failed,
        // что корректно отразит реальное состояние результата.
        try {
          const artifactId = await savePackArtifact({
            formula_job_id: input.job_id,
            pack: bundle.pack,
            mode: bundle.mode,
            platform_target: bundle.platform ?? null,
            zip_size_bytes: bundle.zip_buffer?.length ?? null,
            zip_storage_key: null, // ZIP пока в памяти, отдаётся через /api/v3/pack/:job/zip
          });
          logger.info(
            'PIPELINE',
            `[${input.job_id}] pack artifact saved id=${artifactId} mode=${bundle.mode} ` +
              `zip=${bundle.zip_buffer?.length ?? 0}B`,
          );
        } catch (err: any) {
          logger.warn(
            'PIPELINE',
            `[${input.job_id}] savePackArtifact failed: ${err.message}`,
          );
          throw err;
        }
      }) : null;
      if (tPack) stages.push(tPack);

      const allOk = stages.every((s) => s.ok);
      result.status = allOk ? 'done' : 'failed';
      result.generated_at = new Date().toISOString();

      // PR-6 PRO-отчёт: собираем блок project_class + KPI + ROI для UI.
      // Без engine_state и вертикального профиля вернёт undefined — фронт спокойно это переживёт.
      try {
        const proReport = buildProReport(input, result);
        if (proReport) result.pro_report = proReport;
      } catch (e) {
        logger.warn('PIPELINE', `[${input.job_id}] PRO-report build failed: ${(e as Error).message}`);
      }

      logger.info(
        'PIPELINE',
        `[${input.job_id}] DONE in ${Date.now() - startAll}ms — status=${result.status}, ` +
          `pages=${result.preflight_per_page?.length ?? 0}, ` +
          `avg_total=${result.preflight_rollup?.avg_total_score ?? 'n/a'}`,
      );
      return result;
    } catch (err: any) {
      const failed: PipelineStageResult = {
        stage: 'failed',
        started_at: new Date(startAll).toISOString(),
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startAll,
        ok: false,
        error: err.message,
      };
      stages.push(failed);
      result.status = 'failed';
      logger.error('PIPELINE', `[${input.job_id}] FAILED: ${err.message}`);
      return result;
    }
  }

  private async timeStage(
    stage: PipelineStage,
    fn: () => Promise<void>,
  ): Promise<PipelineStageResult> {
    const t0 = Date.now();
    const startedAt = new Date(t0).toISOString();
    try {
      await fn();
      return {
        stage,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - t0,
        ok: true,
      };
    } catch (err: any) {
      logger.warn('PIPELINE', `stage ${stage} failed: ${err.message}`);
      return {
        stage,
        started_at: startedAt,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - t0,
        ok: false,
        error: err.message,
      };
    }
  }
}

export const pipelineOrchestrator = new PipelineOrchestrator();
