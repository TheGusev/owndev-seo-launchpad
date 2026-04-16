-- OwnDev Site Formula: blueprint sessions and reports
-- Migration 002

CREATE TABLE IF NOT EXISTS blueprint_sessions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  status      VARCHAR(20) NOT NULL DEFAULT 'draft',
  raw_answers JSONB,
  engine_state JSONB,
  preview_payload JSONB,
  full_report_payload JSONB,
  rules_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  template_version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blueprint_reports (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID        NOT NULL REFERENCES blueprint_sessions(id) ON DELETE CASCADE,
  status      VARCHAR(20) NOT NULL DEFAULT 'locked',
  unlock_token VARCHAR(64),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blueprint_sessions_status ON blueprint_sessions(status);
CREATE INDEX IF NOT EXISTS idx_blueprint_reports_session ON blueprint_reports(session_id);
