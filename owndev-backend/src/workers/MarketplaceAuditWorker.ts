import { Worker, type Job } from 'bullmq';
import { redis } from '../cache/redis.js';
import { runMarketplaceAudit } from '../services/MarketplaceAudit/index.js';
import {
  getMarketplaceAudit,
  updateAuditProgress,
  saveAuditResult,
  failAudit,
} from '../db/queries/marketplaceAudits.js';
import { logger } from '../utils/logger.js';
import type { MarketplaceAuditJob } from '../queue/marketplaceAuditQueue.js';
import type { ManualInput } from '../types/marketplaceAudit.js';

const API_KEY = process.env.LOVABLE_API_KEY || '';

async function processJob(job: Job<MarketplaceAuditJob>): Promise<void> {
  const { audit_id } = job.data;
  logger.info('MA_WORKER', `Processing ${audit_id}`);

  try {
    const row = await getMarketplaceAudit(audit_id);
    if (!row) throw new Error('Audit row not found');

    let manual: ManualInput | undefined;
    if (row.input_type === 'manual') {
      const a = row.attributes_json as any;
      manual = {
        title: a?.title ?? '',
        description: a?.description ?? '',
        specs: a?.specs ?? {},
        category: a?.category ?? '',
        competitorUrls: a?.competitorUrls ?? [],
      };
    }

    await updateAuditProgress(audit_id, 'parsing', 10);

    const result = await runMarketplaceAudit(
      {
        platform: row.source_platform,
        inputType: row.input_type,
        value: row.input_value,
        manual,
      },
      API_KEY,
      async (status, pct) => updateAuditProgress(audit_id, status, pct),
    );

    await saveAuditResult(audit_id, {
      product_title: result.product.title,
      product_description: result.product.description,
      category: result.product.category,
      attributes_json: result.product.attributes,
      images_json: result.product.images,
      scores_json: result.scores,
      issues_json: result.issues,
      keywords_json: result.keywords,
      competitors_json: result.competitors,
      recommendations_json: result.recommendations,
      ai_summary: result.ai_summary,
    });

    logger.info('MA_WORKER', `${audit_id} done, total=${result.scores.total}, issues=${result.issues.length}`);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('MA_WORKER', `${audit_id} failed: ${msg}`);
    await failAudit(audit_id, msg).catch(() => {});
  }
}

export function startMarketplaceAuditWorker() {
  const worker = new Worker<MarketplaceAuditJob>(
    'marketplace-audit',
    processJob,
    {
      connection: redis,
      concurrency: Number(process.env.MAX_CONCURRENT_MARKETPLACE ?? 2),
    },
  );

  worker.on('failed', (job, err) => {
    logger.error('MA_WORKER', `Job ${job?.id} failed: ${err.message}`);
  });
  worker.on('completed', (job) => {
    logger.info('MA_WORKER', `Job ${job.id} completed`);
  });

  return worker;
}
