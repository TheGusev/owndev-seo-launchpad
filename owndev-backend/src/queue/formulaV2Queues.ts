/**
 * BullMQ очереди для Formula v2.
 *  - formula-v2-build      — генерация blueprint (может занимать секунды)
 *  - formula-v2-crawl      — обход сайта (десятки секунд)
 *  - formula-v2-audit      — gap-анализ + recovery (CPU)
 *  - formula-v2-wordstat   — обновление кэша Wordstat
 *  - formula-v2-ai-pack    — генерация ZIP
 *
 * BullMQ ≥ 5 запрещает символ ':' в имени очереди (используется как
 * разделитель Redis-ключей внутри). Поэтому имена через дефис.
 *
 * Все джобы зеркалируются в таблицу `formula_jobs` для observability и
 * восстановления (BullMQ хранит state только в Redis).
 */
import { Queue, type JobsOptions } from 'bullmq';
import { redis } from '../cache/redis.js';

export const FORMULA_V2_DEFAULT_JOB_OPTIONS: JobsOptions = {
  attempts: 3,
  backoff: { type: 'exponential', delay: 8000 },
  removeOnComplete: 200,
  removeOnFail: 100,
};

export const formulaBuildQueue = new Queue('formula-v2-build', {
  connection: redis,
  defaultJobOptions: FORMULA_V2_DEFAULT_JOB_OPTIONS,
});

export const formulaCrawlQueue = new Queue('formula-v2-crawl', {
  connection: redis,
  defaultJobOptions: { ...FORMULA_V2_DEFAULT_JOB_OPTIONS, attempts: 2 },
});

export const formulaAuditQueue = new Queue('formula-v2-audit', {
  connection: redis,
  defaultJobOptions: FORMULA_V2_DEFAULT_JOB_OPTIONS,
});

export const formulaWordstatQueue = new Queue('formula-v2-wordstat', {
  connection: redis,
  defaultJobOptions: FORMULA_V2_DEFAULT_JOB_OPTIONS,
});

export const formulaAiPackQueue = new Queue('formula-v2-ai-pack', {
  connection: redis,
  defaultJobOptions: { ...FORMULA_V2_DEFAULT_JOB_OPTIONS, attempts: 2 },
});

export type FormulaV2Queue =
  | typeof formulaBuildQueue
  | typeof formulaCrawlQueue
  | typeof formulaAuditQueue
  | typeof formulaWordstatQueue
  | typeof formulaAiPackQueue;
