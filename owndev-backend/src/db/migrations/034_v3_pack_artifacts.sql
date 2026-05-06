-- Migration 034 — V3 Pack Artifacts (Module 9 super_prompt_pack)
-- =================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS pack_artifacts (
  id              SERIAL PRIMARY KEY,
  formula_job_id  TEXT,
  version         TEXT NOT NULL,
  engine_version  TEXT NOT NULL DEFAULT 'v3',
  generated_at    TIMESTAMPTZ NOT NULL,
  mode            TEXT NOT NULL CHECK (mode IN ('full', 'structured', 'platform_specific')),
  platform_target TEXT CHECK (platform_target IN ('lovable', 'cursor', 'v0', 'claude_code', 'raw')),
  pack_json       JSONB NOT NULL,
  zip_size_bytes  INTEGER,
  zip_storage_key TEXT,                            -- S3 / local path if persisted
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pack_artifacts_job ON pack_artifacts(formula_job_id);
CREATE INDEX IF NOT EXISTS idx_pack_artifacts_mode ON pack_artifacts(mode);
CREATE INDEX IF NOT EXISTS idx_pack_artifacts_platform ON pack_artifacts(platform_target);

CREATE TABLE IF NOT EXISTS pack_export_modes (
  code        TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT TRUE
);

INSERT INTO pack_export_modes (code, description) VALUES
  ('full',              'Один JSON со всеми разделами inline'),
  ('structured',        'JSON skeleton + per-section .md файлы в ZIP'),
  ('platform_specific', 'Адаптация под конкретную платформу (Lovable / Cursor / v0 / Claude Code)')
ON CONFLICT (code) DO NOTHING;

COMMIT;
