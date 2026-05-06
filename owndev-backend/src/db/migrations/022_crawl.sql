-- =============================================================
-- Migration 022 — Crawl engine: persistent storage of crawl sessions
--                                and per-URL page snapshots.
-- =============================================================
-- crawl_sessions  — one row per "audit a site" operation
-- crawl_pages     — every URL we visited during that session
-- =============================================================

CREATE TABLE IF NOT EXISTS crawl_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID,                          -- blueprint_sessions.id (optional)
  root_url        TEXT NOT NULL,
  max_pages       INTEGER NOT NULL DEFAULT 50,
  status          VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending|running|done|failed
  pages_crawled   INTEGER NOT NULL DEFAULT 0,
  errors_count    INTEGER NOT NULL DEFAULT 0,
  user_agent      VARCHAR(255) NOT NULL DEFAULT 'OwndevBot/2.0 (+https://owndev.ru)',
  respect_robots  BOOLEAN NOT NULL DEFAULT TRUE,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crawl_sessions_session
  ON crawl_sessions (session_id);

CREATE TABLE IF NOT EXISTS crawl_pages (
  id              BIGSERIAL PRIMARY KEY,
  crawl_session_id UUID NOT NULL
                    REFERENCES crawl_sessions(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  http_status     INTEGER,
  content_type    VARCHAR(128),
  title           TEXT,
  h1              TEXT,
  meta_description TEXT,
  canonical       TEXT,
  robots_meta     VARCHAR(64),
  word_count      INTEGER,
  schemas_found   TEXT[] NOT NULL DEFAULT '{}',
  blocks_detected TEXT[] NOT NULL DEFAULT '{}',
  page_type_guess VARCHAR(64),                  -- 'home','category','service',...
  raw_html_size   INTEGER,
  fetch_ms        INTEGER,
  outbound_links  INTEGER NOT NULL DEFAULT 0,
  notes           JSONB NOT NULL DEFAULT '{}'::jsonb,
  fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (crawl_session_id, url)
);

CREATE INDEX IF NOT EXISTS idx_crawl_pages_session
  ON crawl_pages (crawl_session_id);
CREATE INDEX IF NOT EXISTS idx_crawl_pages_type
  ON crawl_pages (crawl_session_id, page_type_guess);
