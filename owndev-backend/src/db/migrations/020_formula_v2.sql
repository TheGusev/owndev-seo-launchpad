-- =============================================================
-- Migration 020 — Formula v2: project types, page contracts,
--                  schema templates, and async jobs.
-- =============================================================
-- This migration introduces the v2 layer of the SEO/GEO/CRO formula:
--   * formula_project_types     — 19 verticals (service_geo, ecommerce, …)
--   * formula_page_contracts    — required H1/Title/CTA/schemas per page type
--   * formula_schema_templates  — JSON-LD templates with {{placeholder}}s
--   * formula_jobs              — long-running async tasks (build/audit/recovery)
--
-- v1 stays untouched: blueprint_sessions / blueprint_reports keep working.
-- =============================================================

-- ─── 1. Project types (19 verticals) ─────────────────────────
CREATE TABLE IF NOT EXISTS formula_project_types (
  code            VARCHAR(64) PRIMARY KEY,                -- e.g. 'service_geo'
  name_ru         VARCHAR(128) NOT NULL,                  -- e.g. 'Услуги с гео-привязкой'
  name_en         VARCHAR(128) NOT NULL,
  group_code      VARCHAR(64) NOT NULL,                   -- e.g. 'services', 'ecommerce'
  description     TEXT,
  default_intents JSONB NOT NULL DEFAULT '[]'::jsonb,     -- ['informational','transactional',...]
  default_layers  JSONB NOT NULL DEFAULT '[]'::jsonb,     -- which blueprint layers activate
  required_schemas TEXT[] NOT NULL DEFAULT '{}',          -- e.g. {'LocalBusiness','Service'}
  is_active       BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formula_project_types_group
  ON formula_project_types (group_code);

-- ─── 2. Page contracts ────────────────────────────────────────
-- A page contract is a "must satisfy" rule set per (project_type, page_type):
-- which schemas required, which CTA blocks, content min length, etc.
-- These are inviolable invariants checked by Preflight Audit.
CREATE TABLE IF NOT EXISTS formula_page_contracts (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_type_code VARCHAR(64) NOT NULL
                      REFERENCES formula_project_types(code) ON DELETE CASCADE,
  page_type         VARCHAR(64) NOT NULL,                  -- 'home','category','service','article','contacts'
  version           VARCHAR(20) NOT NULL DEFAULT '2.0.0',
  -- Hard requirements (P0):
  required_h1_pattern   TEXT,                              -- regex/template for H1
  required_title_pattern TEXT,
  required_meta_desc_min INTEGER NOT NULL DEFAULT 70,
  required_meta_desc_max INTEGER NOT NULL DEFAULT 160,
  required_schemas      TEXT[] NOT NULL DEFAULT '{}',      -- which JSON-LD types
  required_blocks       TEXT[] NOT NULL DEFAULT '{}',      -- 'hero','cta','faq','contacts','price'
  forbidden_blocks      TEXT[] NOT NULL DEFAULT '{}',
  min_word_count        INTEGER NOT NULL DEFAULT 400,
  -- Soft requirements (P1-P4):
  recommended_blocks    TEXT[] NOT NULL DEFAULT '{}',
  recommended_schemas   TEXT[] NOT NULL DEFAULT '{}',
  -- Indexing rules:
  must_be_indexable     BOOLEAN NOT NULL DEFAULT TRUE,
  must_be_in_sitemap    BOOLEAN NOT NULL DEFAULT TRUE,
  canonical_required    BOOLEAN NOT NULL DEFAULT TRUE,
  -- Notes & docs for human reviewers:
  notes_ru              TEXT,
  is_active             BOOLEAN NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (project_type_code, page_type, version)
);

CREATE INDEX IF NOT EXISTS idx_page_contracts_type
  ON formula_page_contracts (project_type_code, page_type) WHERE is_active = TRUE;

-- ─── 3. JSON-LD schema templates ──────────────────────────────
-- Reusable JSON-LD blocks with {{placeholder}} variables.
-- The blueprint builder fills placeholders from session answers.
CREATE TABLE IF NOT EXISTS formula_schema_templates (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  schema_type       VARCHAR(64) NOT NULL,                  -- e.g. 'LocalBusiness', 'Service', 'FAQPage'
  variant           VARCHAR(64) NOT NULL DEFAULT 'default',-- 'medical','legal','restaurant',...
  version           VARCHAR(20) NOT NULL DEFAULT '2.0.0',
  template_json     JSONB NOT NULL,                        -- the JSON-LD with {{vars}}
  required_vars     TEXT[] NOT NULL DEFAULT '{}',          -- variable names to fill
  optional_vars     TEXT[] NOT NULL DEFAULT '{}',
  description_ru    TEXT,
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (schema_type, variant, version)
);

CREATE INDEX IF NOT EXISTS idx_schema_templates_type
  ON formula_schema_templates (schema_type) WHERE is_active = TRUE;

-- ─── 4. Async jobs (build / audit / recovery / wordstat) ──────
-- Generic job tracker for long-running v2 operations.
-- BullMQ stores transient state in Redis; this table is the durable log.
CREATE TABLE IF NOT EXISTS formula_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id      UUID,                                    -- blueprint_sessions.id when applicable
  job_type        VARCHAR(32) NOT NULL,                    -- 'build','audit','recovery','wordstat','crawl'
  status          VARCHAR(20) NOT NULL DEFAULT 'queued',   -- queued|running|done|failed|cancelled
  progress_pct    SMALLINT NOT NULL DEFAULT 0,             -- 0..100
  current_step    VARCHAR(128),
  bullmq_job_id   VARCHAR(64),
  input_payload   JSONB,
  result_payload  JSONB,
  error_message   TEXT,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_formula_jobs_session
  ON formula_jobs (session_id);
CREATE INDEX IF NOT EXISTS idx_formula_jobs_status
  ON formula_jobs (status, job_type);

-- ─── 5. Extend blueprint_sessions with v2 fields ──────────────
-- These are nullable so v1 sessions remain valid.
ALTER TABLE blueprint_sessions
  ADD COLUMN IF NOT EXISTS project_type_code VARCHAR(64)
    REFERENCES formula_project_types(code) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS preflight_score SMALLINT,         -- 0..100, blocks publish if < 90
  ADD COLUMN IF NOT EXISTS preflight_report JSONB,
  ADD COLUMN IF NOT EXISTS engine_version VARCHAR(20) NOT NULL DEFAULT '1.0.0';

CREATE INDEX IF NOT EXISTS idx_blueprint_sessions_project_type
  ON blueprint_sessions (project_type_code);

-- ─── 6. Seed: 19 project types ────────────────────────────────
INSERT INTO formula_project_types (code, name_ru, name_en, group_code, description, default_intents, required_schemas, sort_order)
VALUES
  ('service_geo',   'Услуги с гео-привязкой',  'Geo-bound services',   'services',   'Локальные услуги (мойка, ремонт, клининг)', '["transactional","local"]'::jsonb, '{LocalBusiness,Service,FAQPage,BreadcrumbList}', 10),
  ('service_pro',   'Профессиональные услуги', 'Professional services','services',   'Юристы, консультанты, бухгалтерия',        '["informational","transactional"]'::jsonb, '{ProfessionalService,Service,FAQPage}', 20),
  ('service_b2b',   'B2B-услуги',              'B2B services',         'services',   'Корпоративные сервисы, SaaS-агентства',     '["informational","commercial"]'::jsonb, '{Service,Organization,FAQPage}', 30),
  ('ecommerce',     'Интернет-магазин',        'E-commerce store',     'ecommerce',  'Онлайн-продажа товаров (catalog + cart)',   '["transactional","commercial"]'::jsonb, '{Product,Offer,BreadcrumbList,Organization}', 40),
  ('marketplace',   'Маркетплейс',             'Marketplace',          'ecommerce',  'Многосторонняя площадка с продавцами',      '["transactional"]'::jsonb, '{Product,Offer,Organization,BreadcrumbList}', 50),
  ('saas',          'SaaS-продукт',            'SaaS product',         'tech',       'Подписочный софт, B2B / B2C',               '["informational","commercial"]'::jsonb, '{SoftwareApplication,Organization,FAQPage}', 60),
  ('mobile_app',    'Мобильное приложение',    'Mobile application',   'tech',       'iOS/Android-приложение',                    '["informational","commercial"]'::jsonb, '{MobileApplication,Organization,FAQPage}', 70),
  ('media',         'Медиа / журнал',          'Media / publication',  'content',    'Новостной сайт, журнал, блог-сеть',         '["informational"]'::jsonb, '{Article,NewsArticle,Organization,Person}', 80),
  ('blog',          'Авторский блог',          'Personal blog',        'content',    'Один автор, экспертный контент',            '["informational"]'::jsonb, '{Article,BlogPosting,Person}', 90),
  ('education',     'Онлайн-обучение / курсы', 'Online education',     'education',  'Курсы, школы, образовательные платформы',   '["informational","commercial"]'::jsonb, '{Course,EducationalOrganization,FAQPage,Review}', 100),
  ('medical',       'Медицинская клиника',     'Medical clinic',       'health',     'Клиники, врачи (E-E-A-T критичен)',         '["informational","local"]'::jsonb, '{MedicalBusiness,Physician,FAQPage,LocalBusiness}', 110),
  ('legal',         'Юридическая фирма',       'Law firm',             'health',     'Юристы, нотариусы (E-E-A-T критичен)',      '["informational","commercial","local"]'::jsonb, '{LegalService,Attorney,FAQPage,LocalBusiness}', 120),
  ('finance',       'Финансовые услуги',       'Financial services',   'health',     'Банки, инвесткомпании, страхование',        '["informational","commercial"]'::jsonb, '{FinancialService,Organization,FAQPage}', 130),
  ('realestate',    'Недвижимость',            'Real estate',          'commerce',   'Агентства, застройщики, аренда',            '["transactional","local"]'::jsonb, '{RealEstateAgent,Residence,LocalBusiness}', 140),
  ('hospitality',   'Отели / рестораны',       'Hospitality',          'commerce',   'Гостиницы, кафе, рестораны',                '["transactional","local"]'::jsonb, '{Hotel,Restaurant,LocalBusiness,Menu}', 150),
  ('events',        'События / билеты',        'Events & tickets',     'commerce',   'Концерты, конференции, спорт',              '["transactional"]'::jsonb, '{Event,EventVenue,Organization,Offer}', 160),
  ('nonprofit',     'НКО / благотворительность','Non-profit',          'org',        'Фонды, общественные организации',           '["informational"]'::jsonb, '{NGO,Organization,DonateAction,FAQPage}', 170),
  ('gov',           'Государственный сайт',    'Government site',      'org',        'Госорганы, муниципалитеты',                 '["informational"]'::jsonb, '{GovernmentOrganization,Service,FAQPage}', 180),
  ('portfolio',     'Портфолио / визитка',     'Portfolio / business card', 'content','Личное портфолио, агентство, визитка',     '["informational"]'::jsonb, '{Person,Organization,CreativeWork}', 190)
ON CONFLICT (code) DO NOTHING;
