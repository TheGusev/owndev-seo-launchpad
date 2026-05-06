-- =============================================================
-- Migration 032 (V3) — Demand Intelligence
-- =============================================================
-- Replaces ad-hoc Wordstat caching with a proper demand-intelligence
-- layer:
--   • demand_quota_log         — daily unit consumption per endpoint
--   • demand_clusters          — clustered keywords with intent + recommendations
--   • demand_geo_distribution  — per-region affinity for the seed/cluster
--
-- Yandex Wordstat (Search API v2) endpoints are:
--   POST topRequests              (1 unit)
--   POST getDynamics              (2 units)
--   POST getRegionsDistribution   (2 units)
--   GET  getRegionsTree           (free)
-- Daily sync quota: 100 000 units. We track usage to avoid 429s.
-- =============================================================

-- ─── 1. Quota log (per day, per endpoint) ────────────────────
CREATE TABLE IF NOT EXISTS demand_quota_log (
  id              BIGSERIAL PRIMARY KEY,
  log_date        DATE NOT NULL DEFAULT (NOW() AT TIME ZONE 'UTC')::date,
  endpoint        VARCHAR(48) NOT NULL,    -- 'topRequests' | 'getDynamics' | ...
  units_used      INTEGER NOT NULL DEFAULT 0,
  request_count   INTEGER NOT NULL DEFAULT 0,
  last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (log_date, endpoint)
);

CREATE INDEX IF NOT EXISTS idx_demand_quota_date
  ON demand_quota_log (log_date DESC);

-- ─── 2. Demand clusters (intent-based grouping of keywords) ───
CREATE TABLE IF NOT EXISTS demand_clusters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID NOT NULL,
  cluster_label   VARCHAR(255) NOT NULL,
  intent          VARCHAR(32) NOT NULL,    -- informational | commercial | transactional | navigational | local
  seed_keyword    VARCHAR(255) NOT NULL,
  region_code     VARCHAR(16) NOT NULL DEFAULT '225',
  keywords        JSONB NOT NULL DEFAULT '[]'::jsonb, -- [{phrase, frequency, trend?}]
  total_frequency INTEGER NOT NULL DEFAULT 0,
  recommended_page_type   VARCHAR(64),
  recommended_url_pattern TEXT,
  recommended_h1_template TEXT,
  recommended_title_template TEXT,
  recommended_faq_questions JSONB DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demand_clusters_session
  ON demand_clusters (session_id);
CREATE INDEX IF NOT EXISTS idx_demand_clusters_intent
  ON demand_clusters (session_id, intent);

-- ─── 3. Per-region demand distribution ───────────────────────
CREATE TABLE IF NOT EXISTS demand_geo_distribution (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id           UUID NOT NULL,
  cluster_id           UUID REFERENCES demand_clusters(id) ON DELETE CASCADE,
  region_code          VARCHAR(16) NOT NULL,
  region_name_ru       VARCHAR(128) NOT NULL,
  affinity_index       NUMERIC(6,3) NOT NULL DEFAULT 0,   -- % share, 0..100
  absolute_frequency   INTEGER NOT NULL DEFAULT 0,
  is_recommended_geo   BOOLEAN NOT NULL DEFAULT FALSE,
  fetched_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (session_id, cluster_id, region_code)
);

CREATE INDEX IF NOT EXISTS idx_demand_geo_session
  ON demand_geo_distribution (session_id);
CREATE INDEX IF NOT EXISTS idx_demand_geo_recommended
  ON demand_geo_distribution (session_id, is_recommended_geo) WHERE is_recommended_geo;

-- ─── 4. Static cache of regions tree (refreshed weekly) ──────
CREATE TABLE IF NOT EXISTS yandex_regions_tree (
  region_code        VARCHAR(16) PRIMARY KEY,
  region_name_ru     VARCHAR(128) NOT NULL,
  parent_code        VARCHAR(16),
  region_type        VARCHAR(32),     -- country | district | region | city
  is_active          BOOLEAN NOT NULL DEFAULT TRUE,
  refreshed_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_yandex_regions_parent
  ON yandex_regions_tree (parent_code);

-- ─── 5. Helper view: today's quota usage ──────────────────────
CREATE OR REPLACE VIEW v3_demand_quota_today AS
SELECT
  endpoint,
  units_used,
  request_count,
  CASE endpoint
    WHEN 'topRequests'             THEN 1
    WHEN 'getDynamics'             THEN 2
    WHEN 'getRegionsDistribution'  THEN 2
    WHEN 'getRegionsTree'          THEN 0
    ELSE 1
  END AS units_per_call,
  100000  AS daily_units_limit,
  100000 - (SELECT COALESCE(SUM(units_used), 0)
            FROM demand_quota_log
            WHERE log_date = (NOW() AT TIME ZONE 'UTC')::date) AS units_remaining
FROM demand_quota_log
WHERE log_date = (NOW() AT TIME ZONE 'UTC')::date;

-- ─── 6. Comments ─────────────────────────────────────────────
COMMENT ON TABLE demand_quota_log IS
  'Yandex Wordstat (Search API v2) daily quota tracking per endpoint';
COMMENT ON TABLE demand_clusters IS
  'V3 demand intelligence: keyword clusters by intent with page recommendations';
COMMENT ON TABLE demand_geo_distribution IS
  'V3 demand intelligence: per-region affinity used to drive GEO targeting';
