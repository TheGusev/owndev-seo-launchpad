/**
 * Утилиты для постановки задач Formula v2 + зеркалирование в `formula_jobs`.
 *
 * Каждый enqueue:
 *   1. Создаёт запись в formula_jobs (status='queued', сохраняется payload)
 *   2. Кладёт джоб в BullMQ с jobId = formula_jobs.id для удобной корреляции
 */
import { sql } from '../db/client.js';
import {
  formulaBuildQueue,
  formulaCrawlQueue,
  formulaAuditQueue,
  formulaWordstatQueue,
  formulaAiPackQueue,
  type FormulaV2Queue,
} from './formulaV2Queues.js';
import type { ProjectTypeCode } from '../types/formulaV2.js';

export type FormulaJobType = 'build' | 'crawl' | 'audit' | 'recovery' | 'ai-pack' | 'wordstat';

export interface BuildJobPayload {
  type: 'build';
  session_id?: string | null;
  business_name: string;
  site_url: string;
  short_description: string;
  project_type_code?: ProjectTypeCode;
  intake?: Record<string, any>;
}

export interface CrawlJobPayload {
  type: 'crawl';
  session_id?: string | null;
  url: string;
  max_pages?: number;
  respect_robots?: boolean;
}

export interface AuditJobPayload {
  type: 'audit';
  session_id?: string | null;
  url: string;
  project_type_code: ProjectTypeCode;
  max_pages?: number;
  /** \u0435\u0441\u043b\u0438 \u0441\u0440\u0430\u0437\u0443 \u0441\u0442\u0440\u043e\u0438\u043c recovery */
  build_recovery?: boolean;
}

export interface WordstatJobPayload {
  type: 'wordstat';
  session_id?: string | null;
  phrases: string[];
  region_id?: number;
  build_clusters?: boolean;
}

export interface AiPackJobPayload {
  type: 'ai-pack';
  session_id?: string | null;
  blueprint: any;
  audit_id?: string;
  recovery_id?: string;
  business_name?: string;
  site_url?: string;
  publish_threshold?: number;
}

export type FormulaJobPayload =
  | BuildJobPayload
  | CrawlJobPayload
  | AuditJobPayload
  | WordstatJobPayload
  | AiPackJobPayload;

const QUEUE_BY_TYPE: Record<FormulaJobType, FormulaV2Queue> = {
  build: formulaBuildQueue,
  crawl: formulaCrawlQueue,
  audit: formulaAuditQueue,
  recovery: formulaAuditQueue, // recovery идёт в audit-воркер как отдельный шаг
  'ai-pack': formulaAiPackQueue,
  wordstat: formulaWordstatQueue,
};

export interface EnqueuedJob {
  id: string;          // formula_jobs.id
  bullmq_job_id: string;
  queue: string;
  type: FormulaJobType;
}

async function insertJobRow(
  type: FormulaJobType,
  queueName: string,
  payload: any,
  sessionId: string | null,
): Promise<{ id: string }> {
  // Используем temp UUID, BullMQ примет его как jobId.
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO formula_jobs (job_id, queue, type, session_id, payload, status)
    VALUES (
      gen_random_uuid()::text, ${queueName}, ${type},
      ${sessionId}, ${sql.json(payload as any)}, 'queued'
    )
    RETURNING id, job_id
  `;
  return row;
}

async function patchJobBullmqId(rowId: string, bullmqJobId: string): Promise<void> {
  await sql`
    UPDATE formula_jobs SET job_id = ${bullmqJobId}, updated_at = NOW()
    WHERE id = ${rowId}
  `;
}

export async function enqueueFormulaJob(
  payload: FormulaJobPayload,
): Promise<EnqueuedJob> {
  const type = payload.type;
  const queue = QUEUE_BY_TYPE[type];
  if (!queue) throw new Error(`Unknown formula job type: ${type}`);

  const session_id = (payload as any).session_id ?? null;
  const row = await insertJobRow(type, queue.name, payload, session_id);

  const job = await queue.add(type, payload, {
    jobId: row.id, // 1:1 с formula_jobs.id
  });
  await patchJobBullmqId(row.id, String(job.id));

  return {
    id: row.id,
    bullmq_job_id: String(job.id),
    queue: queue.name,
    type,
  };
}

export async function markJobActive(jobId: string): Promise<void> {
  await sql`
    UPDATE formula_jobs
    SET status = 'active', attempts = attempts + 1, updated_at = NOW()
    WHERE id = ${jobId} OR job_id = ${jobId}
  `;
}

export async function markJobCompleted(jobId: string, result: any): Promise<void> {
  await sql`
    UPDATE formula_jobs
    SET status = 'completed',
        result = ${sql.json(result as any)},
        updated_at = NOW()
    WHERE id = ${jobId} OR job_id = ${jobId}
  `;
}

export async function markJobFailed(jobId: string, error: string): Promise<void> {
  await sql`
    UPDATE formula_jobs
    SET status = 'failed', error = ${error}, updated_at = NOW()
    WHERE id = ${jobId} OR job_id = ${jobId}
  `;
}

export async function getJobStatus(id: string) {
  const [row] = await sql<any[]>`
    SELECT id, job_id, queue, type, session_id, status, attempts,
           result, error, created_at, updated_at
    FROM formula_jobs
    WHERE id = ${id} OR job_id = ${id}
    LIMIT 1
  `;
  return row || null;
}
