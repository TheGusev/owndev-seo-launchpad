-- =============================================================
-- Migration 040 (V3) — Seed 4 new service sub-verticals (PR-12)
-- =============================================================
-- PR-10 расширил каталог 23 → 27 (service_pest_control, service_repair_home,
-- service_auto, service_beauty). Профили попали в profiles/all.json и в TS-типы,
-- но миграция БД не была создана — поэтому endpoint /api/v3/project-types на
-- проде продолжал отдавать 23 типа.
--
-- Эта миграция seedит 4 типа в formula_project_types как Tier A
-- (полный V3-пайплайн SEO/GEO/Schema), все из group_code='services',
-- sort_order 11..14 — сразу после базовой service_geo (sort_order=10).
--
-- ON CONFLICT (code) DO UPDATE — миграцию безопасно перезапускать.
-- =============================================================

INSERT INTO formula_project_types (
  code, name_ru, name_en, group_code, description,
  default_intents, required_schemas, sort_order,
  tier, tier_reason, engine_modules
) VALUES
  (
    'service_pest_control',
    'Дезинфекция и дератизация',
    'Pest control / disinfection',
    'services',
    'Уничтожение насекомых и грызунов: тараканы, клопы, муравьи, крысы, мыши, плесень. Сильная сезонность весна-лето.',
    '["local","transactional","commercial","informational"]'::jsonb,
    '{LocalBusiness,Service,FAQPage,BreadcrumbList,Organization}',
    11,
    'A',
    'Гео-услуга с высокой сезонностью апр-сен (×1.5-1.7), CPC 220₽, lead_gen',
    ARRAY['intake','demand','strategy','pageContracts','schemaRegistry','technicalPassport','conversion','preflight','crawl','audit','developerPack']
  ),
  (
    'service_repair_home',
    'Ремонт квартир и домов',
    'Home renovation services',
    'services',
    'Капитальный, косметический, дизайнерский ремонт: квартиры под ключ, ванные, кухни, частные дома. Длинный цикл сделки.',
    '["commercial","local","transactional","informational"]'::jsonb,
    '{LocalBusiness,Service,FAQPage,BreadcrumbList,Organization}',
    12,
    'A',
    'Гео-услуга с длинным циклом сделки 21+ день, AOV ~350k₽, важна галерея кейсов',
    ARRAY['intake','demand','strategy','pageContracts','schemaRegistry','technicalPassport','conversion','preflight','crawl','audit','developerPack']
  ),
  (
    'service_auto',
    'Автосервис и услуги для авто',
    'Auto service / car repair',
    'services',
    'СТО, шиномонтаж, эвакуатор, автомойка, кузовной ремонт. Привязка к району и трассе, не только к городу.',
    '["local","transactional","commercial","informational"]'::jsonb,
    '{LocalBusiness,AutoRepair,Service,FAQPage,BreadcrumbList,Organization}',
    13,
    'A',
    'Гео-услуга с двойной сезонностью (окт-дек шиномонтаж, мар-апр пере­обувка)',
    ARRAY['intake','demand','strategy','pageContracts','schemaRegistry','technicalPassport','conversion','preflight','crawl','audit','developerPack']
  ),
  (
    'service_beauty',
    'Салоны красоты и мастера бьюти',
    'Beauty salons / beauty masters',
    'services',
    'Салоны, барбершопы, мастера маникюра, бровиста, парикмахеры, косметологи. Записи через сайт и соцсети.',
    '["local","transactional","commercial","informational"]'::jsonb,
    '{LocalBusiness,BeautySalon,Service,FAQPage,BreadcrumbList,Organization}',
    14,
    'A',
    'Гео-услуга с высокой частотой визитов (LTV/AOV ≈ 8), важны фото мастеров',
    ARRAY['intake','demand','strategy','pageContracts','schemaRegistry','technicalPassport','conversion','preflight','crawl','audit','developerPack']
  )
ON CONFLICT (code) DO UPDATE SET
  name_ru          = EXCLUDED.name_ru,
  name_en          = EXCLUDED.name_en,
  group_code       = EXCLUDED.group_code,
  description      = EXCLUDED.description,
  default_intents  = EXCLUDED.default_intents,
  required_schemas = EXCLUDED.required_schemas,
  sort_order       = EXCLUDED.sort_order,
  tier             = EXCLUDED.tier,
  tier_reason      = EXCLUDED.tier_reason,
  engine_modules   = EXCLUDED.engine_modules,
  is_active        = TRUE;

-- Sanity check: после миграции в БД должно быть 27 active типов
-- SELECT COUNT(*) FROM formula_project_types WHERE is_active = TRUE; -- expected: 27
-- SELECT tier, COUNT(*) FROM formula_project_types WHERE is_active = TRUE GROUP BY tier;
--   tier A: 14 (10 базовых + 4 новых)
--   tier B: 1
--   tier C: 12 (8 v2 + 4 special)
