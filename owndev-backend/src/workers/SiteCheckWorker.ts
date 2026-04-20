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

const API_KEY = process.env.OPENAI_API_KEY || '';

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

  // Guard against invalid URLs that somehow ended up in the queue.
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
    if (!parsedUrl.hostname || parsedUrl.hostname.length < 3 || !parsedUrl.hostname.includes('.')) {
      throw new Error('hostname invalid');
    }
  } catch {
    logger.error('SITE_CHECK_WORKER', `Invalid URL in job: ${url}`);
    await sql`
      UPDATE site_check_scans
      SET status = 'error', error_message = 'Некорректный URL', updated_at = NOW()
      WHERE id = ${scan_id}
    `.catch(() => {});
    return;
  }

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
      API_KEY,
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

    // Auto-upsert into geo_rating
    try {
      let hostname: string | null = null;
      try {
        hostname = new URL(url).hostname;
      } catch {
        hostname = null;
      }
      if (!hostname) {
        logger.error('SITE_CHECK_WORKER', `geo_rating upsert skipped: invalid URL ${url}`);
      } else {
        await sql`
          CREATE TABLE IF NOT EXISTS geo_rating (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            domain TEXT NOT NULL,
            display_name TEXT NOT NULL,
            category TEXT NOT NULL DEFAULT 'Сервисы',
            llm_score INTEGER NOT NULL DEFAULT 0,
            seo_score INTEGER NOT NULL DEFAULT 0,
            schema_score INTEGER NOT NULL DEFAULT 0,
            direct_score INTEGER NOT NULL DEFAULT 0,
            has_llms_txt BOOLEAN NOT NULL DEFAULT false,
            has_faqpage BOOLEAN NOT NULL DEFAULT false,
            has_schema BOOLEAN NOT NULL DEFAULT false,
            errors_count INTEGER NOT NULL DEFAULT 0,
            top_errors JSONB DEFAULT '[]'::jsonb,
            last_checked_at TIMESTAMPTZ DEFAULT NOW(),
            created_at TIMESTAMPTZ DEFAULT NOW()
          )
        `;
        await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_geo_rating_domain ON geo_rating(domain)`;

        const scores = result.scores;
        const displayName = result.seo_data?.title?.trim() || hostname;
        const hasLlmsTxtIssue = (result.issues || []).some((i: any) => /llms\.txt/i.test(i.title || ''));
        const hasSchemaIssue = (result.issues || []).some((i: any) => i.module === 'schema' && /JSON-LD не найден/i.test(i.title || ''));
        const hasFaqIssue = (result.issues || []).some((i: any) => /faqpage/i.test(i.found || ''));
        const topErrors = (result.issues || [])
          .filter((i: any) => i.severity === 'critical' || i.severity === 'high')
          .slice(0, 5)
          .map((i: any) => i.title);

        await sql`
          INSERT INTO geo_rating (domain, display_name, category, llm_score, seo_score, schema_score, direct_score, has_llms_txt, has_faqpage, has_schema, errors_count, top_errors, last_checked_at)
          VALUES (${hostname}, ${displayName}, ${'Сервисы'}, ${scores.ai ?? 0}, ${scores.seo ?? 0}, ${scores.schema ?? 0}, ${scores.direct ?? 0}, ${!hasLlmsTxtIssue}, ${!hasFaqIssue}, ${!hasSchemaIssue}, ${(result.issues || []).length}, ${JSON.stringify(topErrors)}, NOW())
          ON CONFLICT (domain) DO UPDATE SET
            display_name = EXCLUDED.display_name,
            llm_score = EXCLUDED.llm_score,
            seo_score = EXCLUDED.seo_score,
            schema_score = EXCLUDED.schema_score,
            direct_score = EXCLUDED.direct_score,
            has_llms_txt = EXCLUDED.has_llms_txt,
            has_faqpage = EXCLUDED.has_faqpage,
            has_schema = EXCLUDED.has_schema,
            errors_count = EXCLUDED.errors_count,
            top_errors = EXCLUDED.top_errors,
            last_checked_at = NOW()
        `;
        logger.info('SITE_CHECK_WORKER', `Upserted ${hostname} into geo_rating`);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      logger.error('SITE_CHECK_WORKER', `geo_rating upsert failed: ${msg}`);
    }
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
