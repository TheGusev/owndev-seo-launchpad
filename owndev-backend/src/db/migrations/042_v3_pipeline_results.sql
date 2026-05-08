-- =============================================================
-- Migration 042 (V3) — Persist pipeline results in DB (PR-14, B2)
-- =============================================================
-- До этой миграции `routes/v3/pipeline.ts` хранил результат запуска в
-- in-memory `RESULT_CACHE = new Map()`. На production-сервере с PM2 cluster
-- (несколько worker-процессов) это означало:
--   • POST /pipeline/run попадал на worker A, кэш писался в его памяти,
--   • GET  /pack/:job_id или /result/:job_id мог попасть на worker B —
--     и отдавал 404 «Result not found or expired».
--
-- Эта миграция создаёт таблицу `v3_pipeline_results`, в которой персистится
-- весь PipelineResultV3 в JSONB. Все воркеры читают/пишут одну и ту же таблицу,
-- + появляется TTL-чистка на стороне БД.
-- =============================================================

CREATE TABLE IF NOT EXISTS v3_pipeline_results (
  job_id        TEXT PRIMARY KEY,
  result        JSONB NOT NULL,
  status        TEXT NOT NULL,                      -- mirror PipelineResultV3.status (pending/running/done/error)
  project_code  TEXT,                               -- denormalised для быстрых выборок по нише
  cached_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at    TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour'
);

CREATE INDEX IF NOT EXISTS idx_v3_pipeline_results_expires
  ON v3_pipeline_results(expires_at);
CREATE INDEX IF NOT EXISTS idx_v3_pipeline_results_project
  ON v3_pipeline_results(project_code);

-- =============================================================
-- Sanity check (run manually):
-- SELECT COUNT(*), status FROM v3_pipeline_results GROUP BY status;
-- DELETE FROM v3_pipeline_results WHERE expires_at < NOW();  -- ручная чистка
-- =============================================================
