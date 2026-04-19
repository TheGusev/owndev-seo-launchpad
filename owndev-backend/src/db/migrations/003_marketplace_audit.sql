-- OwnDev Marketplace Audit (WB / Ozon)
-- Migration 003 — fully isolated, no FKs to other modules

DO $$ BEGIN
  CREATE TYPE marketplace_platform AS ENUM ('wb', 'ozon');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE marketplace_input_type AS ENUM ('url', 'sku', 'manual');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE marketplace_audit_status AS ENUM ('pending','parsing','scoring','llm','done','error');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS marketplace_audits (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_platform      marketplace_platform NOT NULL,
  input_type           marketplace_input_type NOT NULL,
  input_value          TEXT NOT NULL,
  status               marketplace_audit_status NOT NULL DEFAULT 'pending',
  progress_pct         INT  NOT NULL DEFAULT 0,
  product_title        TEXT,
  product_description  TEXT,
  attributes_json      JSONB NOT NULL DEFAULT '{}'::jsonb,
  category             TEXT,
  images_json          JSONB NOT NULL DEFAULT '[]'::jsonb,
  scores_json          JSONB NOT NULL DEFAULT '{}'::jsonb,
  issues_json          JSONB NOT NULL DEFAULT '[]'::jsonb,
  keywords_json        JSONB NOT NULL DEFAULT '{}'::jsonb,
  competitors_json     JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommendations_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_summary           TEXT,
  error_msg            TEXT,
  rules_version        VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ma_status_created ON marketplace_audits (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ma_platform_input ON marketplace_audits (source_platform, input_value);

CREATE OR REPLACE FUNCTION ma_set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ma_updated_at ON marketplace_audits;
CREATE TRIGGER trg_ma_updated_at BEFORE UPDATE ON marketplace_audits
  FOR EACH ROW EXECUTE FUNCTION ma_set_updated_at();
