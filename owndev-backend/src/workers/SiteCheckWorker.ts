import { Worker, type Job } from 'bullmq';
import { redis } from '../cache/redis.js';
import { sql } from '../db/client.js';
import { runPipeline } from '../services/SiteCheckPipeline.js';
import { logger } from '../utils/logger.js';

interface SiteCheckJobData {
  scan_id: string;
  url: string;
  mode: string;
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

async function loadDbRules(): Promise<any[]> {
  try {
    const rows = await sql`SELECT * FROM scan_rules WHERE active = true`;
    return rows as any[];
  } catch {
    // Table may not exist in local DB — return empty
    return [];
  }
}

async function processSiteCheckJob(job: Job<SiteCheckJobData>): Promise<void> {
  const { scan_id, url, mode } = job.data;
  logger.info('SITE_CHECK_WORKER', `Processing scan ${scan_id} for ${url}`);

  try {
    const dbRules = await loadDbRules();

    const result = await runPipeline(
      url,
      mode,
      async (pct, partialData) => {
        const updates: Record<string, any> = { progress_pct: pct, updated_at: new Date() };
        if (partialData) {
          if (partialData.theme) updates.theme = partialData.theme;
          if (partialData.is_spa !== undefined) updates.is_spa = partialData.is_spa;
          if (partialData.scores) updates.scores = JSON.stringify(partialData.scores);
          if (partialData.issues) updates.issues = JSON.stringify(partialData.issues);
          if (partialData.seo_data) updates.seo_data = JSON.stringify(partialData.seo_data);
          if (partialData.keywords) updates.keywords = JSON.stringify(partialData.keywords);
        }
        await sql`
          UPDATE site_check_scans
          SET ${sql(updates)}
          WHERE id = ${scan_id}
        `;
      },
      OPENAI_API_KEY,
      dbRules,
    );

    // Save final result
    await sql`
      UPDATE site_check_scans
      SET status = 'done',
          progress_pct = 100,
          theme = ${result.theme},
          is_spa = ${result.is_spa},
          scores = ${JSON.stringify(result.scores)}::jsonb,
          issues = ${JSON.stringify(result.issues)}::jsonb,
          competitors = ${JSON.stringify(result.competitors)}::jsonb,
          keywords = ${JSON.stringify(result.keywords)}::jsonb,
          minus_words = ${JSON.stringify(result.minus_words)}::jsonb,
          seo_data = ${JSON.stringify(result.seo_data)}::jsonb,
          updated_at = NOW()
      WHERE id = ${scan_id}
    `;

    logger.info('SITE_CHECK_WORKER', `Scan ${scan_id} done, score=${result.scores.total}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('SITE_CHECK_WORKER', `Scan ${scan_id} failed: ${message}`);
    await sql`
      UPDATE site_check_scans
      SET status = 'error',
          error_message = ${message},
          updated_at = NOW()
      WHERE id = ${scan_id}
    `.catch(() => {});
  }
}

export function startSiteCheckWorker() {
  const worker = new Worker<SiteCheckJobData>(
    'site-check',
    processSiteCheckJob,
    {
      connection: redis,
      concurrency: Number(process.env.MAX_CONCURRENT_SITE_CHECKS ?? 3),
    },
  );

  worker.on('failed', (job, err) => {
    logger.error('SITE_CHECK_WORKER', `Job ${job?.id} failed: ${err.message}`);
  });

  worker.on('completed', (job) => {
    logger.info('SITE_CHECK_WORKER', `Job ${job.id} completed`);
  });

  return worker;
}
