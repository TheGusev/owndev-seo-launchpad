-- =============================================================
-- Migration 021 — Wordstat / demand intelligence layer.
-- =============================================================
-- Tables:
--   wordstat_cache    — TTL'd cache of phrase volumes / dynamics
--   demand_clusters   — clustered intents (group of related phrases)
--   demand_phrases    — individual phrases inside a cluster (FK)
-- =============================================================

CREATE TABLE IF NOT EXISTS wordstat_cache (
  id              BIGSERIAL PRIMARY KEY,
  phrase          VARCHAR(255) NOT NULL,
  region_code     VARCHAR(16) NOT NULL DEFAULT '225',  -- 225 = Россия
  metric          VARCHAR(32) NOT NULL,                 -- 'top','dynamics','regions'
  payload         JSONB NOT NULL,
  source          VARCHAR(32) NOT NULL DEFAULT 'yandex_search_api',
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at      TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  UNIQUE (phrase, region_code, metric)
);

CREATE INDEX IF NOT EXISTS idx_wordstat_cache_lookup
  ON wordstat_cache (phrase, region_code, metric);
CREATE INDEX IF NOT EXISTS idx_wordstat_cache_expiry
  ON wordstat_cache (expires_at);

-- ─── Clusters ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demand_clusters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID,                                    -- blueprint_sessions.id, nullable
  cluster_name    VARCHAR(255) NOT NULL,
  intent_type     VARCHAR(32) NOT NULL,                    -- 'informational','commercial','navigational','transactional'
  total_volume    INTEGER NOT NULL DEFAULT 0,              -- sum of phrase volumes
  region_code     VARCHAR(16) NOT NULL DEFAULT '225',
  recommended_h1  TEXT,                                    -- LLM- or rule-suggested H1
  recommended_title TEXT,
  recommended_faq JSONB NOT NULL DEFAULT '[]'::jsonb,      -- [{q,a}, ...]
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demand_clusters_session
  ON demand_clusters (session_id);
CREATE INDEX IF NOT EXISTS idx_demand_clusters_volume
  ON demand_clusters (total_volume DESC);

-- ─── Phrases inside clusters ─────────────────────────────────
CREATE TABLE IF NOT EXISTS demand_phrases (
  id              BIGSERIAL PRIMARY KEY,
  cluster_id      UUID NOT NULL
                    REFERENCES demand_clusters(id) ON DELETE CASCADE,
  phrase          VARCHAR(255) NOT NULL,
  volume          INTEGER NOT NULL DEFAULT 0,
  competition     VARCHAR(16),                              -- 'low','medium','high'
  intent_subtype  VARCHAR(32),                              -- 'how-to','comparison','price','review','near-me'
  has_local_modifier BOOLEAN NOT NULL DEFAULT FALSE,        -- contains city/region word
  position        INTEGER NOT NULL DEFAULT 0,               -- rank inside cluster
  metadata        JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demand_phrases_cluster
  ON demand_phrases (cluster_id, volume DESC);
CREATE INDEX IF NOT EXISTS idx_demand_phrases_text
  ON demand_phrases USING GIN (to_tsvector('russian', phrase));
