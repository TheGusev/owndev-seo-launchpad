/**
 * Formula v2 — единый wrapper для BullMQ воркеров.
 *
 * Стартуем 4 воркера:
 *   - build-worker     (formula-v2-build)     — генерация blueprint v2
 *   - crawl-worker     (formula-v2-crawl)     — обход сайта
 *   - audit-worker     (formula-v2-audit)     — gap-анализ + опционально recovery
 *   - wordstat-worker  (formula-v2-wordstat)  — обновление кэша wordstat
 *   - ai-pack-worker   (formula-v2-ai-pack)   — генерация ZIP пака
 *
 * Каждый воркер пишет статус в `formula_jobs` (active/completed/failed).
 */
import { Worker, type Job } from 'bullmq';
import { redis } from '../cache/redis.js';
import { logger } from '../utils/logger.js';
import {
  markJobActive,
  markJobCompleted,
  markJobFailed,
  type FormulaJobPayload,
  type BuildJobPayload,
  type CrawlJobPayload,
  type AuditJobPayload,
  type WordstatJobPayload,
  type AiPackJobPayload,
} from '../queue/formulaV2Jobs.js';

import { buildBlueprintV2 } from '../services/FormulaV2/blueprintBuilder.js';
import { crawlSite } from '../services/CrawlEngine/index.js';
import { analyzeGaps, buildRecovery } from '../services/AuditEngine/index.js';
import { buildAiDeveloperPack, PreflightGateError } from '../services/AiDeveloperPack/index.js';
import { getTop, buildClusters } from '../services/Wordstat/index.js';

// ── helpers ──────────────────────────────────────────────────
function workerCommonOpts() {
  return {
    connection: redis,
    concurrency: 2,
  };
}

async function wrap<T>(job: Job<FormulaJobPayload>, fn: () => Promise<T>): Promise<T> {
  await markJobActive(String(job.id));
  try {
    const result = await fn();
    await markJobCompleted(String(job.id), result);
    return result;
  } catch (err: any) {
    await markJobFailed(String(job.id), err?.message || String(err));
    throw err;
  }
}

// ── build worker ─────────────────────────────────────────────
export function startFormulaBuildWorker(): Worker {
  const w = new Worker<BuildJobPayload>(
    'formula-v2-build',
    async (job) => {
      logger.info('FORMULA_V2_BUILD', `Job ${job.id} starting`);
      return wrap(job as any, async () => {
        const data = job.data;
        const blueprint = await buildBlueprintV2({
          business_name: data.business_name,
          site_url: data.site_url,
          short_description: data.short_description,
          project_type_code: data.project_type_code,
          ...(data.intake || {}),
        } as any);
        return { blueprint };
      });
    },
    workerCommonOpts(),
  );
  w.on('failed', (job, err) =>
    logger.error('FORMULA_V2_BUILD', `Job ${job?.id} failed: ${err.message}`),
  );
  return w;
}

// ── crawl worker ─────────────────────────────────────────────
export function startFormulaCrawlWorker(): Worker {
  const w = new Worker<CrawlJobPayload>(
    'formula-v2-crawl',
    async (job) => {
      logger.info('FORMULA_V2_CRAWL', `Job ${job.id} crawling ${job.data.url}`);
      return wrap(job as any, async () => {
        const r = await crawlSite({
          rootUrl: job.data.url,
          maxPages: job.data.max_pages ?? 50,
          respectRobots: job.data.respect_robots !== false,
          sessionId: job.data.session_id ?? null,
        });
        return {
          crawl_session_id: r.id,
          pages_crawled: r.pages_crawled,
          errors_count: r.errors_count,
        };
      });
    },
    workerCommonOpts(),
  );
  w.on('failed', (job, err) =>
    logger.error('FORMULA_V2_CRAWL', `Job ${job?.id} failed: ${err.message}`),
  );
  return w;
}

// ── audit worker (включает recovery как опцию) ──────────────
export function startFormulaAuditWorker(): Worker {
  const w = new Worker<AuditJobPayload>(
    'formula-v2-audit',
    async (job) => {
      logger.info('FORMULA_V2_AUDIT', `Job ${job.id} auditing ${job.data.url}`);
      return wrap(job as any, async () => {
        // 1) crawl
        const crawl = await crawlSite({
          rootUrl: job.data.url,
          maxPages: job.data.max_pages ?? 50,
          respectRobots: true,
          sessionId: job.data.session_id ?? null,
        });
        // 2) gap analysis
        const audit = await analyzeGaps({
          projectTypeCode: job.data.project_type_code,
          url: job.data.url,
          crawlSessionId: crawl.id,
          pages: crawl.pages,
          sessionId: job.data.session_id ?? null,
        });
        // 3) optional recovery
        let recovery = null;
        if (job.data.build_recovery && audit.audit_id) {
          recovery = await buildRecovery(audit, { sessionId: job.data.session_id ?? null });
        }
        return {
          crawl: { id: crawl.id, pages: crawl.pages_crawled, errors: crawl.errors_count },
          audit_id: audit.audit_id,
          overall_score: audit.overall_score,
          seo_score: audit.seo_score,
          geo_score: audit.geo_score,
          cro_score: audit.cro_score,
          gaps: audit.gaps.length,
          recovery_id: recovery?.recovery_id ?? null,
        };
      });
    },
    workerCommonOpts(),
  );
  w.on('failed', (job, err) =>
    logger.error('FORMULA_V2_AUDIT', `Job ${job?.id} failed: ${err.message}`),
  );
  return w;
}

// ── wordstat worker ──────────────────────────────────────────
export function startFormulaWordstatWorker(): Worker {
  const w = new Worker<WordstatJobPayload>(
    'formula-v2-wordstat',
    async (job) => {
      logger.info(
        'FORMULA_V2_WORDSTAT',
        `Job ${job.id} processing ${job.data.phrases.length} phrases`,
      );
      return wrap(job as any, async () => {
        const phrases = job.data.phrases.slice(0, 50);
        const region_code = job.data.region_id ? String(job.data.region_id) : '225';
        const results: Array<{ phrase: string; found?: boolean; error?: string }> = [];
        for (const p of phrases) {
          try {
            const r = await getTop(p, region_code);
            results.push({ phrase: p, found: !!r });
          } catch (e: any) {
            results.push({ phrase: p, error: e?.message || String(e) });
          }
        }
        let cluster_count = 0;
        if (job.data.build_clusters && phrases.length > 0) {
          try {
            // берём первую фразу как seed и строим от неё кластеры
            const clusters = await buildClusters({
              seed: phrases[0],
              region_code,
            });
            cluster_count = clusters.length;
          } catch (e: any) {
            logger.warn(
              'FORMULA_V2_WORDSTAT',
              `cluster build failed: ${e?.message || e}`,
            );
          }
        }
        return { processed: results.length, cluster_count };
      });
    },
    workerCommonOpts(),
  );
  w.on('failed', (job, err) =>
    logger.error('FORMULA_V2_WORDSTAT', `Job ${job?.id} failed: ${err.message}`),
  );
  return w;
}

// ── ai-pack worker ───────────────────────────────────────────
export function startFormulaAiPackWorker(): Worker {
  const w = new Worker<AiPackJobPayload>(
    'formula-v2-ai-pack',
    async (job) => {
      logger.info('FORMULA_V2_AI_PACK', `Job ${job.id} building pack`);
      return wrap(job as any, async () => {
        try {
          const r = await buildAiDeveloperPack(
            {
              blueprint: job.data.blueprint,
              businessName: job.data.business_name,
              siteUrl: job.data.site_url,
              publishThreshold: job.data.publish_threshold,
            } as any,
            { sessionId: job.data.session_id ?? null },
          );
          return {
            pack_id: r.pack_id,
            preflight_score: r.preflight_score,
            zip_size_bytes: r.zip_buffer.length,
            zip_sha256: r.zip_sha256,
            publishable: r.publishable,
          };
        } catch (e: any) {
          if (e instanceof PreflightGateError) {
            return {
              error: 'preflight_gate',
              score: e.score,
              threshold: e.threshold,
              publishable: false,
            };
          }
          throw e;
        }
      });
    },
    workerCommonOpts(),
  );
  w.on('failed', (job, err) =>
    logger.error('FORMULA_V2_AI_PACK', `Job ${job?.id} failed: ${err.message}`),
  );
  return w;
}

// ── single entry-point ───────────────────────────────────────
export function startAllFormulaV2Workers(): Worker[] {
  return [
    startFormulaBuildWorker(),
    startFormulaCrawlWorker(),
    startFormulaAuditWorker(),
    startFormulaWordstatWorker(),
    startFormulaAiPackWorker(),
  ];
}
