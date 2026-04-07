-- OWNDEV: начальная миграция

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE plan_type AS ENUM ('free', 'solo', 'pro', 'agency');
CREATE TYPE audit_status AS ENUM ('pending', 'processing', 'done', 'error');
CREATE TYPE domain_status AS ENUM ('active', 'monitoring', 'archived');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  plan plan_type NOT NULL DEFAULT 'free',
  api_key TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  status domain_status NOT NULL DEFAULT 'active',
  last_audit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(url)
);

CREATE TABLE audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  status audit_status NOT NULL DEFAULT 'pending',
  result JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ
);

CREATE TABLE audit_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  severity TEXT NOT NULL,
  priority TEXT DEFAULT 'P2',
  message TEXT NOT NULL,
  detail TEXT,
  category TEXT,
  recommendation TEXT,
  confidence REAL DEFAULT 0.7,
  source TEXT DEFAULT 'heuristic'
);

CREATE INDEX idx_audits_domain ON audits(domain_id);
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audit_issues_audit ON audit_issues(audit_id);
