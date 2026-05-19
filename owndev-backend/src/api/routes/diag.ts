/**
 * Diag-роуты — диагностика интеграций без раскрытия секретов.
 *
 * GET /api/v1/diag/wordstat            — статус Wordstat (mode + has_* + quota)
 * GET /api/v1/diag/wordstat?probe=1     — выполнить тестовый topRequests-вызов
 *
 * НИКОГДА не возвращает значения YANDEX_API_KEY или YANDEX_FOLDER_ID —
 * только булевы флаги наличия. Quota — простой in-memory счётчик probe-
 * вызовов за текущую UTC-дату, переживает только жизнь процесса.
 */
import type { FastifyInstance } from 'fastify';
import { topRequests } from '../../services/demand/wordstatClient.js';

const QUOTA_LIMIT_PER_DAY = 50;

interface ProbeState {
  date_utc: string; // 'YYYY-MM-DD'
  used: number;
  last_ok: boolean | null;
  last_at: string | null; // ISO
  last_error: string | null;
}

const state: ProbeState = {
  date_utc: new Date().toISOString().slice(0, 10),
  used: 0,
  last_ok: null,
  last_at: null,
  last_error: null,
};

function rolloverIfNewDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.date_utc !== today) {
    state.date_utc = today;
    state.used = 0;
  }
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return await Promise.race([
    p,
    new Promise<T>((_resolve, reject) =>
      setTimeout(() => reject(new Error(`probe timeout after ${ms}ms`)), ms),
    ),
  ]);
}

export async function diagRoutes(app: FastifyInstance) {
  app.get('/api/v1/diag/wordstat', async (req, reply) => {
    rolloverIfNewDay();

    const mode = process.env.YANDEX_WORDSTAT_MODE ?? 'mock';
    const apiKey = process.env.YANDEX_API_KEY ?? process.env.YANDEX_IAM_TOKEN ?? '';
    const has_api_key = Boolean(apiKey && apiKey.length > 10);
    const has_folder_id = Boolean(process.env.YANDEX_FOLDER_ID);
    const build_sha =
      process.env.BUILD_SHA ?? process.env.COMMIT_SHA ?? 'unknown';

    const q = (req.query ?? {}) as { probe?: string };
    if (q.probe === '1') {
      if (state.used >= QUOTA_LIMIT_PER_DAY) {
        const msg = `[diag/wordstat] probe quota exhausted (${state.used}/${QUOTA_LIMIT_PER_DAY})`;
        // eslint-disable-next-line no-console
        console.log(msg);
        return reply.status(429).send({
          success: false,
          error: 'probe_quota_exhausted',
          quota_today_used: state.used,
          quota_today_limit: QUOTA_LIMIT_PER_DAY,
        });
      }

      state.used += 1;
      // eslint-disable-next-line no-console
      console.log(
        `[diag/wordstat] probe запущен (mode=${mode}, used=${state.used}/${QUOTA_LIMIT_PER_DAY})`,
      );

      try {
        const resp = await withTimeout(
          topRequests({ phrase: 'купить кофе', geoIds: ['213'] }),
          8000,
        );
        state.last_ok = true;
        state.last_at = new Date().toISOString();
        state.last_error = null;
        // eslint-disable-next-line no-console
        console.log(
          `[diag/wordstat] probe ok: topRequests.length=${resp.topRequests?.length ?? 0}`,
        );
      } catch (err: any) {
        state.last_ok = false;
        state.last_at = new Date().toISOString();
        state.last_error = err?.message || String(err);
        // eslint-disable-next-line no-console
        console.log(`[diag/wordstat] probe failed: ${state.last_error}`);
      }
    }

    return reply.send({
      success: true,
      data: {
        mode,
        has_api_key,
        has_folder_id,
        last_probe_ok: state.last_ok,
        last_probe_at: state.last_at,
        last_probe_error: state.last_error,
        quota_today_used: state.used,
        quota_today_limit: QUOTA_LIMIT_PER_DAY,
        build_sha,
      },
    });
  });
}
