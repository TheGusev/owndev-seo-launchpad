import { Worker, type Job } from 'bullmq';
import { redis } from '../cache/redis.js';
import { runMarketplaceAudit } from '../services/MarketplaceAudit/index.js';
import {
  getMarketplaceAudit,
  updateAuditProgress,
  saveAuditResult,
  saveAuditMedia,
  failAudit,
} from '../db/queries/marketplaceAudits.js';
import { generateProductImages } from '../services/MarketplaceAudit/media/imageGen.js';
import { generateSlideshowVideo } from '../services/MarketplaceAudit/media/videoGen.js';
import { logger } from '../utils/logger.js';
import type { MarketplaceAuditJob } from '../queue/marketplaceAuditQueue.js';
import type { ManualInput } from '../types/marketplaceAudit.js';

const API_KEY = process.env.OPENAI_API_KEY || '';

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

    // ─── Stage: media generation ───
    // Images and slideshow video are best-effort: any failure is logged and
    // saved as null/empty array, audit row still finishes with status=done.
    try {
      await updateAuditProgress(audit_id, 'media', 92);
      const imgPrompts = result.recommendations.imagePrompts?.bullets ?? [];
      const generatedImages = await generateProductImages({
        productTitle: result.product.title,
        category: result.product.category,
        prompts: imgPrompts,
        apiKey: API_KEY,
        count: 3,
      });

      let videoUrl: string | null = null;
      if (generatedImages.length > 0) {
        const captions = [
          result.recommendations.newTitle || result.product.title,
          ...result.recommendations.bullets.slice(0, 4),
        ].slice(0, generatedImages.length);
        const vid = await generateSlideshowVideo({
          auditId: audit_id,
          imageUrls: generatedImages,
          captions,
        });
        videoUrl = vid.url;
      }

      await saveAuditMedia(audit_id, generatedImages, videoUrl);
      logger.info(
        'MA_WORKER',
        `${audit_id} media: images=${generatedImages.length} video=${videoUrl ? 'yes' : 'no'}`,
      );
    } catch (mediaErr) {
      logger.warn('MA_WORKER', `${audit_id} media stage failed: ${(mediaErr as Error).message}`);
      await saveAuditMedia(audit_id, [], null).catch(() => {});
    }

    // Final status set after media to keep progress monotonic
    await updateAuditProgress(audit_id, 'done', 100);

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
