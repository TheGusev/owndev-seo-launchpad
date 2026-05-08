/**
 * v3_pipeline_results — persist кэш результатов V3-pipeline.
 *
 * PR-14 (B2): до этого результат жил только в in-memory `RESULT_CACHE = new Map()`
 * в `routes/v3/pipeline.ts`. На PM2 cluster это ломало последующие GET-запросы,
 * если они уходили в другой worker. Теперь результат пишется в БД, где его
 * видит любой воркер.
 *
 * In-memory кэш сохраняется как fallback для unit-тестов и local-dev,
 * где DATABASE_URL не задан.
 */
import { sql } from '../client.js';
import { logger } from '../../utils/logger.js';

const DEFAULT_TTL_MS = 60 * 60 * 1000; // 1 hour

// In-process fallback (для тестов без БД)
const memoryCache = new Map<string, { result: any; cachedAt: number }>();

function evictExpiredMemory() {
  const now = Date.now();
  for (const [k, v] of memoryCache) {
    if (now - v.cachedAt > DEFAULT_TTL_MS) memoryCache.delete(k);
  }
}

/**
 * Проверка наличия БД-подключения.
 * Используется чтобы graceful-fallback на memory cache, если DATABASE_URL пуст.
 */
function hasDatabase(): boolean {
  return !!process.env.DATABASE_URL;
}

/**
 * Сохранить результат пайплайна в кэш.
 */
export async function setPipelineResult(
  jobId: string,
  result: any,
  ttlMs: number = DEFAULT_TTL_MS,
): Promise<void> {
  // Memory layer (всегда пишем — для одного worker это ускоряет последующее чтение).
  memoryCache.set(jobId, { result, cachedAt: Date.now() });

  if (!hasDatabase()) return;

  const status: string = typeof result?.status === 'string' ? result.status : 'unknown';
  const projectCode: string | null =
    typeof result?.project_code === 'string' ? result.project_code : null;
  const expiresAt = new Date(Date.now() + ttlMs);

  try {
    await sql`
      INSERT INTO v3_pipeline_results (job_id, result, status, project_code, cached_at, expires_at)
      VALUES (
        ${jobId},
        ${sql.json(result as any)},
        ${status},
        ${projectCode},
        NOW(),
        ${expiresAt}
      )
      ON CONFLICT (job_id) DO UPDATE SET
        result       = EXCLUDED.result,
        status       = EXCLUDED.status,
        project_code = EXCLUDED.project_code,
        cached_at    = NOW(),
        expires_at   = EXCLUDED.expires_at
    `;
  } catch (err: any) {
    // Не валим запрос пайплайна, если кэш упал — просто логируем.
    logger.error('V3_RESULT_CACHE', `setPipelineResult failed for ${jobId}: ${err.message}`);
  }
}

/**
 * Прочитать результат пайплайна.
 * Сначала проверяет memory; если нет — БД.
 * Если строка протухла (expires_at < NOW), удаляет её и возвращает null.
 */
export async function getPipelineResult(jobId: string): Promise<any | null> {
  evictExpiredMemory();
  const mem = memoryCache.get(jobId);
  if (mem) return mem.result;

  if (!hasDatabase()) return null;

  try {
    const rows = await sql<{ result: any; expires_at: Date }[]>`
      SELECT result, expires_at
      FROM v3_pipeline_results
      WHERE job_id = ${jobId}
      LIMIT 1
    `;
    if (rows.length === 0) return null;

    const row = rows[0];
    if (row.expires_at && new Date(row.expires_at).getTime() < Date.now()) {
      // Протухло — удаляем и возвращаем null
      await sql`DELETE FROM v3_pipeline_results WHERE job_id = ${jobId}`;
      return null;
    }

    // Прогреем memory layer
    memoryCache.set(jobId, { result: row.result, cachedAt: Date.now() });
    return row.result;
  } catch (err: any) {
    logger.error('V3_RESULT_CACHE', `getPipelineResult failed for ${jobId}: ${err.message}`);
    return null;
  }
}

/**
 * Опциональная фоновая чистка (вызывать из cron / on-demand).
 * Не вызывается автоматически — миграции и так живут с idx_expires.
 */
export async function evictExpiredPipelineResults(): Promise<number> {
  if (!hasDatabase()) return 0;
  try {
    const result = await sql`
      DELETE FROM v3_pipeline_results
      WHERE expires_at < NOW()
    `;
    return result.count ?? 0;
  } catch (err: any) {
    logger.error('V3_RESULT_CACHE', `evictExpired failed: ${err.message}`);
    return 0;
  }
}
