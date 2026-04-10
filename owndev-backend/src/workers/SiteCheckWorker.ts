import { Worker, type Job } from 'bullmq';
import { redis } from '../cache/redis.js';
import { sql } from '../db/client.js';
import { CrawlerService } from '../services/CrawlerService.js';
import { AuditService } from '../services/AuditService.js';
import { logger } from '../utils/logger.js';

interface SiteCheckJobData {
  scan_id: string;
  url: string;
  mode: string;
}

const crawler = new CrawlerService();
const auditor = new AuditService();

async function updateProgress(scan_id: string, pct: number): Promise<void> {
  await sql`
    UPDATE site_check_scans
    SET progress_pct = ${pct}, updated_at = NOW()
    WHERE id = ${scan_id}
  `;
}

async function processSiteCheckJob(job: Job<SiteCheckJobData>): Promise<void> {
  const { scan_id, url } = job.data;
  logger.info('SITE_CHECK_WORKER', `Processing scan ${scan_id} for ${url}`);

  try {
    await updateProgress(scan_id, 5);

    const crawlData = await crawler.crawl(url);
    await updateProgress(scan_id, 50);

    if (crawlData.error) {
      throw new Error(`Crawl failed: ${crawlData.error}`);
    }

    const result = auditor.analyze(crawlData);
    await updateProgress(scan_id, 90);

    const scores = {
      seo: result.score,
      confidence: result.confidence,
      issues_count: result.issues.length,
      blocks: result.blocks.map((b) => ({ name: b.name, score: b.score, weight: b.weight })),
    };

    await sql`
      UPDATE site_check_scans
      SET status = 'done',
          progress_pct = 100,
          scores = ${JSON.stringify(scores) as unknown as any}::jsonb,
          result = ${JSON.stringify(result) as unknown as any}::jsonb,
          updated_at = NOW()
      WHERE id = ${scan_id}
    `;

    logger.info('SITE_CHECK_WORKER', `Scan ${scan_id} done, score=${result.score}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.error('SITE_CHECK_WORKER', `Scan ${scan_id} failed: ${message}`);
    await sql`
      UPDATE site_check_scans
      SET status = 'error',
          error_message = ${message},
          updated_at = NOW()
      WHERE id = ${scan_id}
    `.catch(() => { /* best effort */ });
  }
}

export function startSiteCheckWorker() {
  const worker = new Worker<SiteCheckJobData>(
    'site-check',
    processSiteCheckJob,
    {
      connection: redis,
      concurrency: Number(process.env.MAX_CONCURRENT_SITE_CHECKS ?? 5),
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
