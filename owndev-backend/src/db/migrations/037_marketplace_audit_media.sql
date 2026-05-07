-- OwnDev Marketplace Audit — media generation (DALL-E images + ffmpeg slideshow video)
-- Migration 037 — extends marketplace_audits with generated creatives.

-- 1) add 'media' status to enum (idempotent)
DO $$ BEGIN
  ALTER TYPE marketplace_audit_status ADD VALUE IF NOT EXISTS 'media';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) columns for generated assets
ALTER TABLE marketplace_audits
  ADD COLUMN IF NOT EXISTS generated_images_json JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE marketplace_audits
  ADD COLUMN IF NOT EXISTS generated_video_url TEXT;
