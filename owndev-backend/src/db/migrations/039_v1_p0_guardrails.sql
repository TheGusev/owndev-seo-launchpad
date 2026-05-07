-- 039_v1_p0_guardrails.sql
-- ─────────────────────────────────────────────────────────────────────────
-- Мост v1 → v3, шаг 2 «Правила + веса».
--
-- Цель: поднять 6 P0-guardrails из config/rules.v1.json в БД, чтобы preflight
-- v3 мог их подгружать как «универсальные» правила P0 поверх существующих
-- 32 preflight_rules (миграция 033). Это даёт v3-страницам тот же набор
-- архитектурных гарантий, который v1 даёт через runEngine.
--
-- ВАЖНО:
--   • v1-ядро (runEngine) НЕ модифицируется.
--   • Эти 6 guardrails — справочник; preflight v3 применяет их как P0-правила
--     с axis = 'SEO' (для one_url_one_entity, utility_*, centralized_routing)
--     и axis = 'AI_LLM' (для verification_on_scale).
--   • При отсутствии engine_state в pipeline guardrails применяются как «всегда
--     активные», совпадая с поведением v1 (condition: 'always').
--   • При наличии engine_state.project_class = 'scale' активируется
--     P0_VERIFICATION_ON_SCALE.
--
-- Идемпотентна.
-- ─────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS formula_v1_p0_guardrails (
  id SERIAL PRIMARY KEY,
  rule_code TEXT NOT NULL UNIQUE,
  axis TEXT NOT NULL,
  -- условие применения: 'always' (всегда) или 'scale_or_high_restructuring_risk'
  applies_when TEXT NOT NULL DEFAULT 'always',
  flag_name TEXT NOT NULL,
  description_ru TEXT NOT NULL,
  remediation_ru TEXT NOT NULL,
  source_v1_rule_id TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  engine_version TEXT NOT NULL DEFAULT '3.0.0',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'formula_v1_p0_guardrails_axis_chk'
  ) THEN
    ALTER TABLE formula_v1_p0_guardrails
      ADD CONSTRAINT formula_v1_p0_guardrails_axis_chk
      CHECK (axis IN ('SEO', 'DIRECT', 'SCHEMA', 'AI_LLM'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'formula_v1_p0_guardrails_when_chk'
  ) THEN
    ALTER TABLE formula_v1_p0_guardrails
      ADD CONSTRAINT formula_v1_p0_guardrails_when_chk
      CHECK (applies_when IN ('always', 'scale_or_high_restructuring_risk'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_formula_v1_p0_guardrails_active
  ON formula_v1_p0_guardrails (active) WHERE active = TRUE;

-- ─────────────────────────────────────────────────────────────────────────
-- Seed: 6 P0-guardrails из config/rules.v1.json (1:1 соответствие).
-- Используем ON CONFLICT (rule_code) DO UPDATE — миграция переисполнима.
-- ─────────────────────────────────────────────────────────────────────────

INSERT INTO formula_v1_p0_guardrails (
  rule_code, axis, applies_when, flag_name,
  description_ru, remediation_ru, source_v1_rule_id
) VALUES
  (
    'V1_P0_ONE_URL_ONE_ENTITY', 'SEO', 'always', 'one_url_one_entity',
    'Каждый URL должен соответствовать одной уникальной сущности с отдельной поисковой ценностью.',
    'Проверьте, что нет дублей контента под разными URL и нет страниц без уникальной поисковой ценности. Объедините дубли в каноникал.',
    'P0_ONE_URL_ONE_ENTITY'
  ),
  (
    'V1_P0_UTILITY_NOINDEX', 'SEO', 'always', 'utility_always_noindex',
    'Служебные и платные страницы (корзина, кабинет, оплата, спасибо) всегда закрыты от индексации.',
    'Добавьте meta robots noindex и/или X-Robots-Tag: noindex для всех utility-страниц. Проверьте, что они не попадают в sitemap.',
    'P0_UTILITY_NOINDEX'
  ),
  (
    'V1_P0_UTILITY_NO_SITEMAP', 'SEO', 'always', 'utility_excluded_from_sitemap',
    'Служебные страницы полностью исключены из карты сайта (sitemap.xml).',
    'Удалите из sitemap.xml все utility-URL: /cart, /account, /checkout, /thank-you, /password-reset и подобные.',
    'P0_UTILITY_NO_SITEMAP'
  ),
  (
    'V1_P0_UTILITY_NO_SEO_LINKING', 'SEO', 'always', 'utility_excluded_from_seo_linking',
    'Служебные страницы не участвуют в SEO-перелинковке: не должны принимать вес из SEO-страниц.',
    'Удалите ссылки на utility-страницы из внутренней перелинковки SEO-страниц или закройте rel="nofollow".',
    'P0_UTILITY_NO_SEO_LINKING'
  ),
  (
    'V1_P0_CENTRALIZED_ROUTING', 'SEO', 'always', 'centralized_routing',
    'Маршрутизация, canonical и карта сайта управляются централизованно из одной точки конфигурации.',
    'Не размазывайте canonical/sitemap по компонентам — соберите в один модуль/конфиг. Проверьте, что для каждой страницы canonical детерминированный.',
    'P0_CENTRALIZED_ROUTING'
  ),
  (
    'V1_P0_VERIFICATION_ON_SCALE', 'AI_LLM', 'scale_or_high_restructuring_risk', 'verification_required',
    'При масштабировании или высоком риске реструктуризации требуется верификационный проход (E-E-A-T, llms.txt, last-updated, источники).',
    'Добавьте /llms.txt, last-updated на ключевых страницах, блок «об авторе/команде» и ссылки на первоисточники для всех scale-проектов.',
    'P0_VERIFICATION_ON_SCALE'
  )
ON CONFLICT (rule_code) DO UPDATE SET
  axis = EXCLUDED.axis,
  applies_when = EXCLUDED.applies_when,
  flag_name = EXCLUDED.flag_name,
  description_ru = EXCLUDED.description_ru,
  remediation_ru = EXCLUDED.remediation_ru,
  source_v1_rule_id = EXCLUDED.source_v1_rule_id;
