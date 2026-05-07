-- Migration 038 — V3 page contracts: tier_size column
-- =====================================================================
-- Контекст:
--   v3 buildStrategy сейчас выдаёт ОДИН набор страниц на любой
--   project_code независимо от размера проекта (start / growth / scale).
--   Это даёт лендинг-формату 30+ страниц (избыточно), а сетевой клинике —
--   8 страниц «как лендинг» (недостаточно).
--
--   v1 уже умеет классифицировать проект по размеру (project_class).
--   Чтобы пробросить эту классификацию в v3, нужен механизм:
--   контракты страниц помечаются tier_size, и buildStrategy выбирает
--   подходящий вариант контракта.
--
-- Что делаем:
--   1) Добавляем колонку tier_size в formula_page_contracts.
--   2) Все существующие контракты получают tier_size='all' — поведение
--      v3 не меняется (фильтр 'all' включает их в любой выборке).
--   3) Индекс для быстрой выборки по (project_type_code, tier_size).
--
-- Что НЕ делаем здесь:
--   - НЕ добавляем новые контракты для конкретных tier (это сделают
--     отдельные миграции с сидами по мере полировки 23 ниш).
--   - НЕ удаляем и не меняем существующие контракты.
--
-- Безопасность:
--   - Idempotent: ALTER ... ADD IF NOT EXISTS, CHECK через DO-блок,
--     CREATE INDEX IF NOT EXISTS.
--   - Backward-compatible: по умолчанию 'all' — старый код не сломается.

BEGIN;

-- 1) Колонка tier_size
ALTER TABLE formula_page_contracts
  ADD COLUMN IF NOT EXISTS tier_size TEXT NOT NULL DEFAULT 'all';

-- 2) CHECK на допустимые значения (через DO-блок для идемпотентности)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'formula_page_contracts_tier_size_check'
  ) THEN
    ALTER TABLE formula_page_contracts
      ADD CONSTRAINT formula_page_contracts_tier_size_check
      CHECK (tier_size IN ('start', 'growth', 'scale', 'all'));
  END IF;
END $$;

-- 3) Индекс для быстрой выборки по (project_type_code, tier_size, version)
CREATE INDEX IF NOT EXISTS idx_formula_page_contracts_tier_size
  ON formula_page_contracts (project_type_code, tier_size, version)
  WHERE is_active = TRUE;

-- 4) Комментарий, чтобы при ревью БД было понятно назначение
COMMENT ON COLUMN formula_page_contracts.tier_size IS
  'Размерная категория проекта: start | growth | scale | all. ''all'' = контракт применим к любому размеру (используется как универсальный по умолчанию). Конкретные значения добавляются по мере полировки вертикалей.';

COMMIT;
