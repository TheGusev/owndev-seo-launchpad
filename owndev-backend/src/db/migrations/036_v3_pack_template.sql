-- =============================================================
-- Migration 036 (V3) — pack_template column on formula_project_types
-- =============================================================
-- Колонка `pack_template` ожидается ручкой GET /api/v3/project-types
-- (см. src/api/routes/v3/projectTypes.ts), но в предыдущих миграциях
-- (030–035) её не добавляли. Без этой колонки эндпоинт падает с
-- `column "pack_template" does not exist`.
--
-- Семантика: имя/код шаблона developer-pack'а, который будет
-- собираться для данного типа проекта. Nullable — если не задан,
-- используется дефолт по tier (см. logic в developerPack module).
-- =============================================================

ALTER TABLE formula_project_types
  ADD COLUMN IF NOT EXISTS pack_template TEXT;

COMMENT ON COLUMN formula_project_types.pack_template IS
  'V3 developer-pack template code; NULL = use tier default';

-- Дефолтные имена шаблонов по tier (можно переопределить позже).
UPDATE formula_project_types
   SET pack_template = 'tier_a_seo_geo'
 WHERE tier = 'A' AND pack_template IS NULL;

UPDATE formula_project_types
   SET pack_template = 'tier_b_app_landing'
 WHERE tier = 'B' AND pack_template IS NULL;

UPDATE formula_project_types
   SET pack_template = 'tier_c_special'
 WHERE tier = 'C' AND pack_template IS NULL;
