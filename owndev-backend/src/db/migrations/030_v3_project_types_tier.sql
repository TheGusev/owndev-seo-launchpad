-- =============================================================
-- Migration 030 (V3) — Project types Tier A/B/C + 4 special verticals
-- =============================================================
-- V3 reclassifies the 19 V2 project types into tiers and adds 4 new
-- special verticals (promo_event, personal_brand, franchise_multi, b2b_media).
--
--   Tier A — Web/SEO-driven   (10 types)  : full SEO + GEO + Schema + AI-LLM
--   Tier B — App-driven       (5  types)  : screens + deep links + ASO + landing
--   Tier C — Special verticals (4 types)  : event/personal/franchise/b2b-media
--
-- Tier governs which Modules of the V3 pipeline run and which page contracts
-- apply (see services/pageContracts and services/strategy).
-- =============================================================

-- ─── 1. Add tier column (A/B/C) ──────────────────────────────
ALTER TABLE formula_project_types
  ADD COLUMN IF NOT EXISTS tier         VARCHAR(1)  NOT NULL DEFAULT 'A'
    CHECK (tier IN ('A', 'B', 'C')),
  ADD COLUMN IF NOT EXISTS tier_reason  TEXT,
  ADD COLUMN IF NOT EXISTS engine_modules TEXT[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_formula_project_types_tier
  ON formula_project_types (tier);

-- ─── 2. Backfill tier values for existing 19 types ───────────
-- Tier A — web sites where SEO/GEO/Schema is the core game
UPDATE formula_project_types SET tier = 'A',
  tier_reason = 'Веб-сайт с SEO/GEO-трафиком как основным каналом',
  engine_modules = ARRAY['intake','demand','strategy','pageContracts','schemaRegistry','technicalPassport','conversion','preflight','crawl','audit','developerPack']
WHERE code IN (
  'service_geo','service_pro','service_b2b','ecommerce','marketplace',
  'saas','education','medical','legal','realestate'
);

-- Tier B — app-centric (mobile_app stays here; will get 4 more app types in S8)
UPDATE formula_project_types SET tier = 'B',
  tier_reason = 'App-driven: ASO + лендинг + deep links вместо классического SEO',
  engine_modules = ARRAY['intake','demand','strategy','pageContracts','schemaRegistry','technicalPassport','conversion','preflight','developerPack']
WHERE code IN ('mobile_app');

-- Tier C — special: media/blog/finance/hospitality/events/nonprofit/gov/portfolio
-- These have unusual SEO patterns or are not the V3 sweet spot, but must still ship.
UPDATE formula_project_types SET tier = 'C',
  tier_reason = 'Особый вертикал: специфичный контракт страниц и схем',
  engine_modules = ARRAY['intake','demand','strategy','pageContracts','schemaRegistry','technicalPassport','preflight','crawl','audit','developerPack']
WHERE code IN (
  'finance','hospitality','events','nonprofit','gov','portfolio','media','blog'
);

-- ─── 3. Seed 4 new special types (Tier C) ────────────────────
INSERT INTO formula_project_types (
  code, name_ru, name_en, group_code, description,
  default_intents, required_schemas, sort_order, tier, tier_reason, engine_modules
) VALUES
  (
    'promo_event',
    'Промо-сайт акции / события',
    'Promo / event landing',
    'commerce',
    'Одностраничный лендинг под акцию, распродажу, конференцию или запуск',
    '["transactional","commercial"]'::jsonb,
    '{Event,Offer,Organization,FAQPage,BreadcrumbList}',
    200,
    'C',
    'Лендинг с коротким жизненным циклом: фокус на CTA + Event/Offer schema',
    ARRAY['intake','strategy','pageContracts','schemaRegistry','technicalPassport','conversion','preflight','developerPack']
  ),
  (
    'personal_brand',
    'Личный бренд / эксперт',
    'Personal brand / expert',
    'content',
    'Сайт-визитка эксперта: услуги, кейсы, медиа-присутствие',
    '["informational","commercial"]'::jsonb,
    '{Person,ProfessionalService,Article,FAQPage,Organization}',
    210,
    'C',
    'E-E-A-T на Person + услуги + медиа: гибрид content/services',
    ARRAY['intake','demand','strategy','pageContracts','schemaRegistry','technicalPassport','conversion','preflight','crawl','audit','developerPack']
  ),
  (
    'franchise_multi',
    'Франшиза / сеть филиалов',
    'Franchise / multi-location',
    'services',
    'Сеть с несколькими городами/филиалами и шаблонными страницами локаций',
    '["transactional","local","commercial"]'::jsonb,
    '{Organization,LocalBusiness,Service,FAQPage,BreadcrumbList}',
    220,
    'C',
    'Multi-location SEO: GEO-кластер на каждый филиал + единый brand layer',
    ARRAY['intake','demand','strategy','pageContracts','schemaRegistry','technicalPassport','conversion','preflight','crawl','audit','developerPack']
  ),
  (
    'b2b_media',
    'B2B медиа / отраслевой портал',
    'B2B media / industry portal',
    'content',
    'Отраслевое медиа с лидогенерацией: контент + подписка + спецпроекты',
    '["informational","commercial"]'::jsonb,
    '{NewsArticle,Article,Organization,Person,FAQPage}',
    230,
    'C',
    'B2B-контент-маркетинг с целевыми лендингами, требует особого strategy layer',
    ARRAY['intake','demand','strategy','pageContracts','schemaRegistry','technicalPassport','conversion','preflight','crawl','audit','developerPack']
  )
ON CONFLICT (code) DO UPDATE SET
  name_ru        = EXCLUDED.name_ru,
  name_en        = EXCLUDED.name_en,
  group_code     = EXCLUDED.group_code,
  description    = EXCLUDED.description,
  default_intents = EXCLUDED.default_intents,
  required_schemas = EXCLUDED.required_schemas,
  sort_order     = EXCLUDED.sort_order,
  tier           = EXCLUDED.tier,
  tier_reason    = EXCLUDED.tier_reason,
  engine_modules = EXCLUDED.engine_modules;

-- ─── 4. View: tier counts (for dashboard) ────────────────────
CREATE OR REPLACE VIEW v3_project_types_tier_summary AS
SELECT
  tier,
  COUNT(*)        AS total,
  COUNT(*) FILTER (WHERE is_active) AS active,
  ARRAY_AGG(code ORDER BY sort_order) AS codes
FROM formula_project_types
GROUP BY tier
ORDER BY tier;

-- ─── 5. Comments ─────────────────────────────────────────────
COMMENT ON COLUMN formula_project_types.tier IS
  'V3 tier: A=web/SEO-driven, B=app-driven, C=special vertical';
COMMENT ON COLUMN formula_project_types.engine_modules IS
  'Whitelist of V3 engine modules to run for this project type';
