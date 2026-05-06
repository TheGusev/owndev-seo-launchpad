-- =============================================================
-- Migration 023 — Audit / Recovery / AI Developer Pack
-- =============================================================
-- site_audit_results — снапшот результата гэп-анализа crawl vs PageContracts
-- recovery_blueprints — план «как починить» (на основе аудита)
-- ai_developer_packs  — артефакты Module 9 (ZIP + метаданные)
-- formula_jobs        — durable очередь задач (BullMQ зеркало для observability)
-- =============================================================

CREATE TABLE IF NOT EXISTS site_audit_results (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID,                                   -- blueprint_sessions.id (optional)
  crawl_session_id   UUID REFERENCES crawl_sessions(id) ON DELETE SET NULL,
  project_type_code  VARCHAR(64),
  url                TEXT NOT NULL,
  pages_total        INTEGER NOT NULL DEFAULT 0,
  pages_audited      INTEGER NOT NULL DEFAULT 0,
  overall_score      INTEGER NOT NULL DEFAULT 0,             -- 0..100
  seo_score          INTEGER NOT NULL DEFAULT 0,
  geo_score          INTEGER NOT NULL DEFAULT 0,
  cro_score          INTEGER NOT NULL DEFAULT 0,
  contracts_passed   INTEGER NOT NULL DEFAULT 0,
  contracts_failed   INTEGER NOT NULL DEFAULT 0,
  gaps               JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{page_type, url, missing:[...], severity}]
  recommendations    JSONB NOT NULL DEFAULT '[]'::jsonb,
  raw                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_site_audit_session
  ON site_audit_results (session_id);
CREATE INDEX IF NOT EXISTS idx_site_audit_url
  ON site_audit_results (url);

CREATE TABLE IF NOT EXISTS recovery_blueprints (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id           UUID NOT NULL REFERENCES site_audit_results(id) ON DELETE CASCADE,
  session_id         UUID,
  project_type_code  VARCHAR(64),
  fixes              JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{page_type, action, code, priority}]
  schema_patches     JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{type, jsonld}]
  content_patches    JSONB NOT NULL DEFAULT '[]'::jsonb,     -- [{url, missing_blocks, suggested_h1, ...}]
  preflight_score    INTEGER NOT NULL DEFAULT 0,             -- score after applying fixes (predicted)
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_audit
  ON recovery_blueprints (audit_id);

CREATE TABLE IF NOT EXISTS ai_developer_packs (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id         UUID,
  audit_id           UUID REFERENCES site_audit_results(id) ON DELETE SET NULL,
  recovery_id        UUID REFERENCES recovery_blueprints(id) ON DELETE SET NULL,
  project_type_code  VARCHAR(64),
  url                TEXT,
  preflight_score    INTEGER NOT NULL DEFAULT 0,
  zip_size_bytes     INTEGER NOT NULL DEFAULT 0,
  zip_sha256         CHAR(64),
  manifest           JSONB NOT NULL DEFAULT '{}'::jsonb,     -- список файлов в ZIP
  zip_path           TEXT,                                   -- путь на диске (артефакт)
  zip_blob           BYTEA,                                  -- inline ZIP для маленьких паков (<5MB)
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_pack_session
  ON ai_developer_packs (session_id);

-- Durable mirror очереди (BullMQ хранит state в Redis;
--  сюда пишем для аудита и восстановления).
CREATE TABLE IF NOT EXISTS formula_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        VARCHAR(128) NOT NULL UNIQUE,    -- bullmq job id
  queue         VARCHAR(64)  NOT NULL,           -- 'formula' | 'crawl' | 'wordstat'
  type          VARCHAR(64)  NOT NULL,           -- 'build' | 'audit' | 'recovery' | 'ai-pack' | 'crawl' | ...
  session_id    UUID,
  payload       JSONB NOT NULL DEFAULT '{}'::jsonb,
  status        VARCHAR(20) NOT NULL DEFAULT 'queued',  -- queued|active|completed|failed
  attempts      INTEGER NOT NULL DEFAULT 0,
  result        JSONB,
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formula_jobs_queue_status
  ON formula_jobs (queue, status);
CREATE INDEX IF NOT EXISTS idx_formula_jobs_session
  ON formula_jobs (session_id);
