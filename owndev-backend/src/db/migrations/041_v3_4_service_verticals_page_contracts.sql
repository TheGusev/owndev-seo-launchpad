-- =============================================================
-- Migration 041 (V3) — Page contracts for 4 new service verticals (PR-14)
-- =============================================================
-- PR-10 расширил каталог 23 → 27 (service_pest_control, service_repair_home,
-- service_auto, service_beauty), миграция 040 засеяла formula_project_types,
-- но formula_page_contracts остались БЕЗ записей для этих 4 кодов.
--
-- В результате strategyBuilder.ts:124 кидал
-- `No V3 page contracts seeded for project type ${code}` для любого PRO-запуска
-- этих ниш, и пайплайн падал в 500.
--
-- Эта миграция копирует структуру контрактов 'service_geo' (5 страниц:
-- home / service / pricing / contacts / article) на каждую из 4 новых ниш.
-- Тип бизнеса у всех LocalBusiness + Service — паттерны валидации, схемы
-- и набор коммерческих сигналов идентичны service_geo.
--
-- Если позже потребуется специализация (например service_auto использует
-- AutoRepair вместо LocalBusiness в schema_graph_root) — это делается отдельной
-- миграцией поверх через ON CONFLICT (project_type_code, page_type, version)
-- DO UPDATE.
--
-- ON CONFLICT ... DO NOTHING — миграцию безопасно перезапускать.
-- =============================================================

-- ─── service_pest_control ────────────────────────────────────
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_h1_pattern, required_title_pattern,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, forbidden_blocks,
  min_word_count, recommended_blocks, recommended_schemas,
  must_be_indexable, must_be_in_sitemap, canonical_required,
  notes_ru, h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
  ('service_pest_control','home','3.0.0',
    '.*({brand}|{service_main}).*', '.*{brand}.*',
    120, 160,
    ARRAY['Organization','LocalBusiness','WebSite','WebPage']::TEXT[],
    ARRAY['hero','services','trust','cta','contacts','faq']::TEXT[], ARRAY[]::TEXT[],
    700, ARRAY['reviews','case_studies','team']::TEXT[], ARRAY['FAQPage','BreadcrumbList']::TEXT[],
    TRUE, TRUE, TRUE,
    'Главная дезинфекции: H1=бренд+ключ, USP, telephone в hero, акцент на сезонность',
    35, 60, 40, 80, 5,
    ARRAY['phone','address','price_or_pricing_link','reviews_count_or_block','working_hours']::TEXT[],
    'LocalBusiness', ARRAY['Organization','LocalBusiness','WebSite','WebPage','FAQPage']::TEXT[], '3.0.0'),

  ('service_pest_control','service','3.0.0',
    '.*{service}.*', '.*{service}.*{city}.*',
    120, 160,
    ARRAY['Service','LocalBusiness','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','description','price','how_we_work','trust','cta','faq','contacts']::TEXT[], ARRAY[]::TEXT[],
    900, ARRAY['reviews','case_studies','gallery']::TEXT[], ARRAY['Offer']::TEXT[],
    TRUE, TRUE, TRUE,
    'Услуга дезинфекции: четкий ответ за 40-80 слов, диапазон цены, безопасность для людей/животных, гарантия',
    35, 60, 40, 80, 5,
    ARRAY['phone','price','guarantee','working_hours','reviews_count_or_block','delivery_or_arrival_time']::TEXT[],
    'Service', ARRAY['Organization','LocalBusiness','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('service_pest_control','pricing','3.0.0',
    '.*(цен|стоимост|тариф).*', '.*(цены|стоимость|прайс).*',
    120, 160,
    ARRAY['Service','LocalBusiness','FAQPage']::TEXT[],
    ARRAY['hero','price_table','whats_included','cta','faq','contacts']::TEXT[], ARRAY[]::TEXT[],
    600, ARRAY['reviews','calculator']::TEXT[], ARRAY['Offer']::TEXT[],
    TRUE, TRUE, TRUE,
    'Прайс дезинфекции: таблица по типам обработки и площади, что входит, FAQ',
    35, 60, 40, 80, 5,
    ARRAY['price','phone','guarantee','what_included']::TEXT[],
    'Service', ARRAY['Organization','LocalBusiness','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('service_pest_control','contacts','3.0.0',
    '.*контакт.*', '.*контакты.*',
    120, 160,
    ARRAY['LocalBusiness','Organization']::TEXT[],
    ARRAY['hero','address','phone','email','working_hours','map','form','contacts']::TEXT[], ARRAY[]::TEXT[],
    300, ARRAY['social_links','messengers']::TEXT[], ARRAY[]::TEXT[],
    TRUE, TRUE, TRUE,
    'Контакты: NAP, карта, форма, мессенджеры',
    35, 60, 40, 80, 3,
    ARRAY['phone','address','working_hours','email']::TEXT[],
    'LocalBusiness', ARRAY['Organization','LocalBusiness','WebPage','BreadcrumbList']::TEXT[], '3.0.0'),

  ('service_pest_control','article','3.0.0',
    '.*', '.*',
    120, 160,
    ARRAY['Article','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['intro_answer','toc','sections','faq','cta_inline','contacts']::TEXT[], ARRAY[]::TEXT[],
    1200, ARRAY['related_articles','author_bio']::TEXT[], ARRAY[]::TEXT[],
    TRUE, TRUE, TRUE,
    'Статья дезинфекции: интро-ответ 40-80 слов, TOC, FAQ ≥ 5',
    35, 60, 40, 80, 5,
    ARRAY['cta_inline','phone']::TEXT[],
    'Article', ARRAY['Organization','WebSite','WebPage','BreadcrumbList','Article','FAQPage']::TEXT[], '3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── service_repair_home ─────────────────────────────────────
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_h1_pattern, required_title_pattern,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, forbidden_blocks,
  min_word_count, recommended_blocks, recommended_schemas,
  must_be_indexable, must_be_in_sitemap, canonical_required,
  notes_ru, h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
  ('service_repair_home','home','3.0.0',
    '.*({brand}|{service_main}).*', '.*{brand}.*',
    120, 160,
    ARRAY['Organization','LocalBusiness','WebSite','WebPage']::TEXT[],
    ARRAY['hero','services','trust','cta','contacts','faq']::TEXT[], ARRAY[]::TEXT[],
    800, ARRAY['reviews','case_studies','gallery','team']::TEXT[], ARRAY['FAQPage','BreadcrumbList']::TEXT[],
    TRUE, TRUE, TRUE,
    'Главная ремонта: H1=бренд+услуга, обязательная галерея кейсов, телефон в hero',
    35, 60, 40, 80, 5,
    ARRAY['phone','address','price_or_pricing_link','reviews_count_or_block','working_hours']::TEXT[],
    'LocalBusiness', ARRAY['Organization','LocalBusiness','WebSite','WebPage','FAQPage']::TEXT[], '3.0.0'),

  ('service_repair_home','service','3.0.0',
    '.*{service}.*', '.*{service}.*{city}.*',
    120, 160,
    ARRAY['Service','LocalBusiness','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','description','price','how_we_work','trust','cta','faq','contacts','gallery']::TEXT[], ARRAY[]::TEXT[],
    1000, ARRAY['reviews','case_studies']::TEXT[], ARRAY['Offer']::TEXT[],
    TRUE, TRUE, TRUE,
    'Услуга ремонта: цена за м², этапы, гарантия, обязательные кейсы с фото до/после',
    35, 60, 40, 80, 5,
    ARRAY['phone','price','guarantee','working_hours','reviews_count_or_block','delivery_or_arrival_time']::TEXT[],
    'Service', ARRAY['Organization','LocalBusiness','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('service_repair_home','pricing','3.0.0',
    '.*(цен|стоимост|тариф).*', '.*(цены|стоимость|прайс).*',
    120, 160,
    ARRAY['Service','LocalBusiness','FAQPage']::TEXT[],
    ARRAY['hero','price_table','whats_included','cta','faq','contacts']::TEXT[], ARRAY[]::TEXT[],
    700, ARRAY['reviews','calculator']::TEXT[], ARRAY['Offer']::TEXT[],
    TRUE, TRUE, TRUE,
    'Прайс ремонта: таблица по типам ремонта и метражу, что входит, что нет',
    35, 60, 40, 80, 5,
    ARRAY['price','phone','guarantee','what_included']::TEXT[],
    'Service', ARRAY['Organization','LocalBusiness','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('service_repair_home','contacts','3.0.0',
    '.*контакт.*', '.*контакты.*',
    120, 160,
    ARRAY['LocalBusiness','Organization']::TEXT[],
    ARRAY['hero','address','phone','email','working_hours','map','form','contacts']::TEXT[], ARRAY[]::TEXT[],
    300, ARRAY['social_links','messengers']::TEXT[], ARRAY[]::TEXT[],
    TRUE, TRUE, TRUE,
    'Контакты ремонта: NAP, карта офиса/шоурума, форма заявки, мессенджеры',
    35, 60, 40, 80, 3,
    ARRAY['phone','address','working_hours','email']::TEXT[],
    'LocalBusiness', ARRAY['Organization','LocalBusiness','WebPage','BreadcrumbList']::TEXT[], '3.0.0'),

  ('service_repair_home','article','3.0.0',
    '.*', '.*',
    120, 160,
    ARRAY['Article','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['intro_answer','toc','sections','faq','cta_inline','contacts']::TEXT[], ARRAY[]::TEXT[],
    1300, ARRAY['related_articles','author_bio','gallery']::TEXT[], ARRAY[]::TEXT[],
    TRUE, TRUE, TRUE,
    'Статья ремонта: интро-ответ 40-80 слов, TOC, фото-кейсы, FAQ ≥ 5',
    35, 60, 40, 80, 5,
    ARRAY['cta_inline','phone']::TEXT[],
    'Article', ARRAY['Organization','WebSite','WebPage','BreadcrumbList','Article','FAQPage']::TEXT[], '3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── service_auto ────────────────────────────────────────────
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_h1_pattern, required_title_pattern,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, forbidden_blocks,
  min_word_count, recommended_blocks, recommended_schemas,
  must_be_indexable, must_be_in_sitemap, canonical_required,
  notes_ru, h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
  ('service_auto','home','3.0.0',
    '.*({brand}|{service_main}).*', '.*{brand}.*',
    120, 160,
    ARRAY['Organization','LocalBusiness','AutoRepair','WebSite','WebPage']::TEXT[],
    ARRAY['hero','services','trust','cta','contacts','faq']::TEXT[], ARRAY[]::TEXT[],
    700, ARRAY['reviews','case_studies','team']::TEXT[], ARRAY['FAQPage','BreadcrumbList']::TEXT[],
    TRUE, TRUE, TRUE,
    'Главная автосервиса: H1+услуга+район, телефон/эвакуатор в hero, привязка к трассе',
    35, 60, 40, 80, 5,
    ARRAY['phone','address','price_or_pricing_link','reviews_count_or_block','working_hours']::TEXT[],
    'AutoRepair', ARRAY['Organization','LocalBusiness','AutoRepair','WebSite','WebPage','FAQPage']::TEXT[], '3.0.0'),

  ('service_auto','service','3.0.0',
    '.*{service}.*', '.*{service}.*{city}.*',
    120, 160,
    ARRAY['Service','AutoRepair','LocalBusiness','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','description','price','how_we_work','trust','cta','faq','contacts']::TEXT[], ARRAY[]::TEXT[],
    900, ARRAY['reviews','case_studies','gallery']::TEXT[], ARRAY['Offer']::TEXT[],
    TRUE, TRUE, TRUE,
    'Услуга автосервиса: ответ 40-80 слов, диапазон цены, гарантия на работы, время выполнения',
    35, 60, 40, 80, 5,
    ARRAY['phone','price','guarantee','working_hours','reviews_count_or_block','delivery_or_arrival_time']::TEXT[],
    'Service', ARRAY['Organization','AutoRepair','LocalBusiness','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('service_auto','pricing','3.0.0',
    '.*(цен|стоимост|тариф).*', '.*(цены|стоимость|прайс).*',
    120, 160,
    ARRAY['Service','AutoRepair','LocalBusiness','FAQPage']::TEXT[],
    ARRAY['hero','price_table','whats_included','cta','faq','contacts']::TEXT[], ARRAY[]::TEXT[],
    600, ARRAY['reviews','calculator']::TEXT[], ARRAY['Offer']::TEXT[],
    TRUE, TRUE, TRUE,
    'Прайс автосервиса: таблица по работам/моделям, что входит, диагностика бесплатно',
    35, 60, 40, 80, 5,
    ARRAY['price','phone','guarantee','what_included']::TEXT[],
    'Service', ARRAY['Organization','AutoRepair','LocalBusiness','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('service_auto','contacts','3.0.0',
    '.*контакт.*', '.*контакты.*',
    120, 160,
    ARRAY['LocalBusiness','AutoRepair','Organization']::TEXT[],
    ARRAY['hero','address','phone','email','working_hours','map','form','contacts']::TEXT[], ARRAY[]::TEXT[],
    300, ARRAY['social_links','messengers']::TEXT[], ARRAY[]::TEXT[],
    TRUE, TRUE, TRUE,
    'Контакты автосервиса: NAP, карта с подъездом, форма, мессенджеры, эвакуатор 24/7',
    35, 60, 40, 80, 3,
    ARRAY['phone','address','working_hours','email']::TEXT[],
    'AutoRepair', ARRAY['Organization','LocalBusiness','AutoRepair','WebPage','BreadcrumbList']::TEXT[], '3.0.0'),

  ('service_auto','article','3.0.0',
    '.*', '.*',
    120, 160,
    ARRAY['Article','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['intro_answer','toc','sections','faq','cta_inline','contacts']::TEXT[], ARRAY[]::TEXT[],
    1200, ARRAY['related_articles','author_bio']::TEXT[], ARRAY[]::TEXT[],
    TRUE, TRUE, TRUE,
    'Статья автосервиса: интро-ответ 40-80 слов, TOC, FAQ ≥ 5',
    35, 60, 40, 80, 5,
    ARRAY['cta_inline','phone']::TEXT[],
    'Article', ARRAY['Organization','WebSite','WebPage','BreadcrumbList','Article','FAQPage']::TEXT[], '3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── service_beauty ──────────────────────────────────────────
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_h1_pattern, required_title_pattern,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, forbidden_blocks,
  min_word_count, recommended_blocks, recommended_schemas,
  must_be_indexable, must_be_in_sitemap, canonical_required,
  notes_ru, h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
  ('service_beauty','home','3.0.0',
    '.*({brand}|{service_main}).*', '.*{brand}.*',
    120, 160,
    ARRAY['Organization','LocalBusiness','BeautySalon','WebSite','WebPage']::TEXT[],
    ARRAY['hero','services','trust','cta','contacts','faq']::TEXT[], ARRAY[]::TEXT[],
    700, ARRAY['reviews','case_studies','team','gallery']::TEXT[], ARRAY['FAQPage','BreadcrumbList']::TEXT[],
    TRUE, TRUE, TRUE,
    'Главная салона: H1=бренд+услуга, фото мастеров, кнопка онлайн-записи в hero',
    35, 60, 40, 80, 5,
    ARRAY['phone','address','price_or_pricing_link','reviews_count_or_block','working_hours']::TEXT[],
    'BeautySalon', ARRAY['Organization','LocalBusiness','BeautySalon','WebSite','WebPage','FAQPage']::TEXT[], '3.0.0'),

  ('service_beauty','service','3.0.0',
    '.*{service}.*', '.*{service}.*{city}.*',
    120, 160,
    ARRAY['Service','BeautySalon','LocalBusiness','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','description','price','how_we_work','trust','cta','faq','contacts','gallery']::TEXT[], ARRAY[]::TEXT[],
    900, ARRAY['reviews','case_studies','team']::TEXT[], ARRAY['Offer']::TEXT[],
    TRUE, TRUE, TRUE,
    'Услуга бьюти: ответ 40-80 слов, цена, длительность, фото работ, мастера',
    35, 60, 40, 80, 5,
    ARRAY['phone','price','guarantee','working_hours','reviews_count_or_block','delivery_or_arrival_time']::TEXT[],
    'Service', ARRAY['Organization','BeautySalon','LocalBusiness','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('service_beauty','pricing','3.0.0',
    '.*(цен|стоимост|тариф).*', '.*(цены|стоимость|прайс).*',
    120, 160,
    ARRAY['Service','BeautySalon','LocalBusiness','FAQPage']::TEXT[],
    ARRAY['hero','price_table','whats_included','cta','faq','contacts']::TEXT[], ARRAY[]::TEXT[],
    600, ARRAY['reviews','calculator']::TEXT[], ARRAY['Offer']::TEXT[],
    TRUE, TRUE, TRUE,
    'Прайс бьюти: таблица по услугам/мастерам, длительность, скидки на повторный визит',
    35, 60, 40, 80, 5,
    ARRAY['price','phone','guarantee','what_included']::TEXT[],
    'Service', ARRAY['Organization','BeautySalon','LocalBusiness','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('service_beauty','contacts','3.0.0',
    '.*контакт.*', '.*контакты.*',
    120, 160,
    ARRAY['LocalBusiness','BeautySalon','Organization']::TEXT[],
    ARRAY['hero','address','phone','email','working_hours','map','form','contacts']::TEXT[], ARRAY[]::TEXT[],
    300, ARRAY['social_links','messengers']::TEXT[], ARRAY[]::TEXT[],
    TRUE, TRUE, TRUE,
    'Контакты бьюти: NAP, карта, онлайн-запись, мессенджеры, соцсети',
    35, 60, 40, 80, 3,
    ARRAY['phone','address','working_hours','email']::TEXT[],
    'BeautySalon', ARRAY['Organization','LocalBusiness','BeautySalon','WebPage','BreadcrumbList']::TEXT[], '3.0.0'),

  ('service_beauty','article','3.0.0',
    '.*', '.*',
    120, 160,
    ARRAY['Article','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['intro_answer','toc','sections','faq','cta_inline','contacts']::TEXT[], ARRAY[]::TEXT[],
    1200, ARRAY['related_articles','author_bio','gallery']::TEXT[], ARRAY[]::TEXT[],
    TRUE, TRUE, TRUE,
    'Статья бьюти: интро-ответ 40-80 слов, TOC, FAQ ≥ 5, фото',
    35, 60, 40, 80, 5,
    ARRAY['cta_inline','phone']::TEXT[],
    'Article', ARRAY['Organization','WebSite','WebPage','BreadcrumbList','Article','FAQPage']::TEXT[], '3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- =============================================================
-- Sanity check (run manually):
-- SELECT project_type_code, COUNT(*)
-- FROM formula_page_contracts
-- WHERE project_type_code IN ('service_pest_control','service_repair_home','service_auto','service_beauty')
-- GROUP BY project_type_code;
-- expected: 5 rows per code
-- =============================================================
