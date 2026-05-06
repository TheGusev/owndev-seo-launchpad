-- =============================================================
-- Migration 031 (V3) — Page contracts v2
-- =============================================================
-- V3 enforces strict per-page invariants:
--   • H1 ≤ 35 chars
--   • Title ≤ 60 chars
--   • intro answer 40-80 words
--   • FAQ ≥ 5 items
--   • commercial signals (price/contacts/reviews/case_study/guarantee)
--   • schema graph root + required graph nodes
--
-- We extend formula_page_contracts with V3-specific columns and seed
-- contracts for the 23 V3 project types × default page set.
-- =============================================================

-- ─── 1. Extend formula_page_contracts with V3 fields ─────────
ALTER TABLE formula_page_contracts
  ADD COLUMN IF NOT EXISTS h1_max_chars              INTEGER NOT NULL DEFAULT 35,
  ADD COLUMN IF NOT EXISTS title_max_chars           INTEGER NOT NULL DEFAULT 60,
  ADD COLUMN IF NOT EXISTS intro_answer_words_min    INTEGER NOT NULL DEFAULT 40,
  ADD COLUMN IF NOT EXISTS intro_answer_words_max    INTEGER NOT NULL DEFAULT 80,
  ADD COLUMN IF NOT EXISTS faq_min_items             INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS required_commercial_signals TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS schema_graph_root         VARCHAR(64),
  ADD COLUMN IF NOT EXISTS schema_graph_required     TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS engine_version            VARCHAR(20) NOT NULL DEFAULT '3.0.0';

-- ─── 2. Bump version of all existing contracts to 2.0 (V2) ───
-- so the V3 seeds below can land at version '3.0.0' without conflict
UPDATE formula_page_contracts
SET version = '2.0.0'
WHERE version = '2.0.0' OR version IS NULL;

-- ─── 3. Seed V3 page contracts ───────────────────────────────
-- Helper inserts per project_type. We seed the canonical page set per tier.
-- Note: ON CONFLICT respects (project_type_code, page_type, version).

-- 3a. Tier A — service_geo (full set)
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
  ('service_geo','home','3.0.0',
    '.*({brand}|{service_main}).*', '.*{brand}.*',
    120, 160,
    ARRAY['Organization','LocalBusiness','WebSite','WebPage']::TEXT[],
    ARRAY['hero','services','trust','cta','contacts','faq']::TEXT[], ARRAY[]::TEXT[],
    700, ARRAY['reviews','case_studies','team']::TEXT[], ARRAY['FAQPage','BreadcrumbList']::TEXT[],
    TRUE, TRUE, TRUE,
    'Главная страница локального сервиса: H1=бренд+ключ, USP, telephone в hero',
    35, 60, 40, 80, 5,
    ARRAY['phone','address','price_or_pricing_link','reviews_count_or_block','working_hours']::TEXT[],
    'LocalBusiness', ARRAY['Organization','LocalBusiness','WebSite','WebPage','FAQPage']::TEXT[], '3.0.0'),

  ('service_geo','service','3.0.0',
    '.*{service}.*', '.*{service}.*{city}.*',
    120, 160,
    ARRAY['Service','LocalBusiness','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','description','price','how_we_work','trust','cta','faq','contacts']::TEXT[], ARRAY[]::TEXT[],
    900, ARRAY['reviews','case_studies','gallery']::TEXT[], ARRAY['Offer']::TEXT[],
    TRUE, TRUE, TRUE,
    'Страница услуги: четкий ответ за 40-80 слов, цена/диапазон, гарантии',
    35, 60, 40, 80, 5,
    ARRAY['phone','price','guarantee','working_hours','reviews_count_or_block','delivery_or_arrival_time']::TEXT[],
    'Service', ARRAY['Organization','LocalBusiness','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('service_geo','pricing','3.0.0',
    '.*(цен|стоимост|тариф).*', '.*(цены|стоимость|прайс).*',
    120, 160,
    ARRAY['Service','LocalBusiness','FAQPage']::TEXT[],
    ARRAY['hero','price_table','whats_included','cta','faq','contacts']::TEXT[], ARRAY[]::TEXT[],
    600, ARRAY['reviews','calculator']::TEXT[], ARRAY['Offer']::TEXT[],
    TRUE, TRUE, TRUE,
    'Прайс: таблица услуг + что входит + ответы на FAQ о ценообразовании',
    35, 60, 40, 80, 5,
    ARRAY['price','phone','guarantee','what_included']::TEXT[],
    'Service', ARRAY['Organization','LocalBusiness','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('service_geo','contacts','3.0.0',
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

  ('service_geo','article','3.0.0',
    '.*', '.*',
    120, 160,
    ARRAY['Article','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['intro_answer','toc','sections','faq','cta_inline','contacts']::TEXT[], ARRAY[]::TEXT[],
    1200, ARRAY['related_articles','author_bio']::TEXT[], ARRAY[]::TEXT[],
    TRUE, TRUE, TRUE,
    'Статья: интро-ответ 40-80 слов сразу после H1, TOC, FAQ ≥ 5',
    35, 60, 40, 80, 5,
    ARRAY['cta_inline','phone']::TEXT[],
    'Article', ARRAY['Organization','WebSite','WebPage','BreadcrumbList','Article','FAQPage']::TEXT[], '3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- 3b. Tier A — ecommerce
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, min_word_count,
  recommended_schemas, must_be_indexable, must_be_in_sitemap, canonical_required,
  notes_ru, h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
  ('ecommerce','home','3.0.0',
    120, 160, ARRAY['Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','categories','featured_products','trust','cta']::TEXT[], 400,
    ARRAY[]::TEXT[], TRUE, TRUE, TRUE,
    'Главная магазина: категории, USP, доставка/возврат сразу видны', 35, 60, 30, 80, 3,
    ARRAY['shipping_terms','payment_methods','returns_policy','phone']::TEXT[],
    'Organization', ARRAY['Organization','WebSite','WebPage']::TEXT[], '3.0.0'),
  ('ecommerce','category','3.0.0',
    120, 160, ARRAY['WebPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','filters','product_grid','faq','cta']::TEXT[], 500,
    ARRAY[]::TEXT[], TRUE, TRUE, TRUE,
    'Категория: SEO-текст 300-500 слов, фильтры, FAQ ≥ 3', 35, 60, 40, 80, 3,
    ARRAY['shipping_terms','returns_policy']::TEXT[],
    'WebPage', ARRAY['Organization','WebSite','WebPage','BreadcrumbList']::TEXT[], '3.0.0'),
  ('ecommerce','product','3.0.0',
    120, 160, ARRAY['Product','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['hero','gallery','description','price','offer','reviews','faq','cross_sell']::TEXT[], 400,
    ARRAY['Offer','AggregateRating']::TEXT[], TRUE, TRUE, TRUE,
    'Карточка: image, price, availability, reviews, FAQ ≥ 5', 35, 60, 40, 80, 5,
    ARRAY['price','availability','shipping_terms','returns_policy','reviews_count_or_block']::TEXT[],
    'Product', ARRAY['Organization','WebSite','WebPage','BreadcrumbList','Product','FAQPage']::TEXT[], '3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- 3c. Tier A — saas
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, min_word_count,
  must_be_indexable, must_be_in_sitemap, canonical_required,
  notes_ru, h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
  ('saas','home','3.0.0',
    120, 160, ARRAY['Organization','WebSite','WebPage','SoftwareApplication']::TEXT[],
    ARRAY['hero','how_it_works','features','trust','pricing_link','cta','faq']::TEXT[], 600,
    TRUE, TRUE, TRUE,
    'Хиро ≤ 35 chars, демо/триал кнопка выше fold, soc proof', 35, 60, 40, 80, 5,
    ARRAY['cta_demo_or_trial','trust_logos','price_or_pricing_link']::TEXT[],
    'SoftwareApplication', ARRAY['Organization','WebSite','WebPage']::TEXT[], '3.0.0'),
  ('saas','pricing','3.0.0',
    120, 160, ARRAY['WebPage','Service','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','price_table','plan_features','trust','cta','faq']::TEXT[], 500,
    TRUE, TRUE, TRUE,
    'Прайс: 3 тарифа, выделить рекомендуемый, FAQ о биллинге', 35, 60, 40, 80, 5,
    ARRAY['price','trial_or_demo','refund_policy','plan_compare']::TEXT[],
    'Service', ARRAY['Organization','WebSite','WebPage','BreadcrumbList','Service','FAQPage']::TEXT[], '3.0.0'),
  ('saas','article','3.0.0',
    120, 160, ARRAY['Article','WebPage','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['intro_answer','toc','sections','faq','cta_inline']::TEXT[], 1200,
    TRUE, TRUE, TRUE,
    'Контентный лонгрид с интро-ответом и FAQ', 35, 60, 40, 80, 5,
    ARRAY['cta_inline']::TEXT[],
    'Article', ARRAY['Organization','WebSite','WebPage','BreadcrumbList','Article','FAQPage']::TEXT[], '3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- 3d. Tier A — medical / legal (E-E-A-T critical)
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, min_word_count,
  must_be_indexable, must_be_in_sitemap, canonical_required,
  notes_ru, h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
  ('medical','home','3.0.0',120,160,ARRAY['MedicalBusiness','Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','specialties','doctors','licenses','trust','cta','faq','contacts']::TEXT[], 800, TRUE, TRUE, TRUE,
    'Лицензии и врачи на видном месте, политика конфиденциальности обязательна',
    35, 60, 40, 80, 5,
    ARRAY['phone','address','working_hours','licenses','doctors']::TEXT[],
    'MedicalBusiness',ARRAY['Organization','MedicalBusiness','WebSite','WebPage','FAQPage']::TEXT[],'3.0.0'),
  ('medical','service','3.0.0',120,160,ARRAY['Service','MedicalBusiness','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','description','doctor_card','price','faq','cta','contacts']::TEXT[], 900, TRUE, TRUE, TRUE,
    'Услуга-процедура: показания, противопоказания, врач, цена',
    35, 60, 40, 80, 5,
    ARRAY['price','phone','doctor','licenses','working_hours']::TEXT[],
    'Service',ARRAY['Organization','MedicalBusiness','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[],'3.0.0'),
  ('legal','home','3.0.0',120,160,ARRAY['LegalService','Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','services','team','licenses','trust','cta','contacts','faq']::TEXT[], 700, TRUE, TRUE, TRUE,
    'Юристы — Person с дипломами и стажем; категория услуг',
    35, 60, 40, 80, 5,
    ARRAY['phone','address','working_hours','team_credentials','price_or_consultation_cta']::TEXT[],
    'LegalService',ARRAY['Organization','LegalService','WebSite','WebPage','FAQPage']::TEXT[],'3.0.0'),
  ('legal','service','3.0.0',120,160,ARRAY['Service','LegalService','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','description','price','how_we_work','cta','faq','contacts']::TEXT[], 800, TRUE, TRUE, TRUE,
    'Юр. услуга: цена/диапазон, гарантии, опыт',
    35, 60, 40, 80, 5,
    ARRAY['price','phone','team_credentials','case_study_or_practice']::TEXT[],
    'Service',ARRAY['Organization','LegalService','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[],'3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- 3e. Other Tier A: service_pro / service_b2b / education / realestate / marketplace
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, min_word_count,
  must_be_indexable, must_be_in_sitemap, canonical_required,
  notes_ru, h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
  ('service_pro','home','3.0.0',120,160,ARRAY['ProfessionalService','Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','services','team','cases','trust','cta','faq','contacts']::TEXT[],700,TRUE,TRUE,TRUE,
    'Профуслуги: команда + кейсы',35,60,40,80,5,
    ARRAY['phone','team_credentials','case_studies','price_or_pricing_link']::TEXT[],
    'ProfessionalService',ARRAY['Organization','ProfessionalService','WebSite','WebPage','FAQPage']::TEXT[],'3.0.0'),
  ('service_pro','service','3.0.0',120,160,ARRAY['Service','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','description','price','how_we_work','cases','cta','faq']::TEXT[],800,TRUE,TRUE,TRUE,
    'Услуга: четкий результат, цена, кейсы',35,60,40,80,5,
    ARRAY['price','phone','case_studies','guarantee']::TEXT[],
    'Service',ARRAY['Organization','ProfessionalService','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[],'3.0.0'),
  ('service_b2b','home','3.0.0',120,160,ARRAY['Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','services','clients','case_studies','trust','cta','contacts']::TEXT[],700,TRUE,TRUE,TRUE,
    'B2B: клиенты-логотипы, кейсы',35,60,40,80,5,
    ARRAY['client_logos','case_studies','phone','demo_or_call_cta']::TEXT[],
    'Organization',ARRAY['Organization','WebSite','WebPage']::TEXT[],'3.0.0'),
  ('education','home','3.0.0',120,160,ARRAY['EducationalOrganization','Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','courses','teachers','reviews','trust','cta','faq']::TEXT[],700,TRUE,TRUE,TRUE,
    'Школа/курсы: преподаватели, программа, отзывы выпускников',35,60,40,80,5,
    ARRAY['price_or_pricing_link','reviews_count_or_block','teacher_credentials','certificate_or_diploma']::TEXT[],
    'EducationalOrganization',ARRAY['Organization','EducationalOrganization','WebSite','WebPage','FAQPage']::TEXT[],'3.0.0'),
  ('education','course','3.0.0',120,160,ARRAY['Course','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','program','outcomes','teacher','price','reviews','cta','faq']::TEXT[],900,TRUE,TRUE,TRUE,
    'Курс: программа, итоги обучения, цена, отзывы',35,60,40,80,5,
    ARRAY['price','duration','certificate_or_diploma','teacher_credentials','reviews_count_or_block']::TEXT[],
    'Course',ARRAY['Organization','EducationalOrganization','Course','WebPage','BreadcrumbList','FAQPage']::TEXT[],'3.0.0'),
  ('realestate','home','3.0.0',120,160,ARRAY['RealEstateAgent','Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','listings','trust','team','cta','contacts']::TEXT[],600,TRUE,TRUE,TRUE,
    'Недвижимость: объекты, команда, гарантии',35,60,40,80,5,
    ARRAY['phone','address','team_credentials','working_hours']::TEXT[],
    'RealEstateAgent',ARRAY['Organization','RealEstateAgent','WebSite','WebPage']::TEXT[],'3.0.0'),
  ('realestate','listing','3.0.0',120,160,ARRAY['Product','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['hero','gallery','price','specs','location_map','description','cta_form','contacts']::TEXT[],500,TRUE,TRUE,TRUE,
    'Объект: фото, цена, метраж, локация',35,60,40,80,5,
    ARRAY['price','phone','address','gallery','specifications']::TEXT[],
    'Product',ARRAY['Organization','RealEstateAgent','WebPage','BreadcrumbList','Product','FAQPage']::TEXT[],'3.0.0'),
  ('marketplace','home','3.0.0',120,160,ARRAY['Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','categories','featured','trust','cta']::TEXT[],400,TRUE,TRUE,TRUE,
    'Маркетплейс главная',35,60,30,80,3,
    ARRAY['shipping_terms','payment_methods','returns_policy']::TEXT[],
    'Organization',ARRAY['Organization','WebSite','WebPage']::TEXT[],'3.0.0'),
  ('marketplace','category','3.0.0',120,160,ARRAY['WebPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','filters','product_grid','faq']::TEXT[],400,TRUE,TRUE,TRUE,
    'Категория агрегатора',35,60,30,80,3,
    ARRAY['shipping_terms']::TEXT[],
    'WebPage',ARRAY['Organization','WebSite','WebPage','BreadcrumbList']::TEXT[],'3.0.0'),
  ('marketplace','product','3.0.0',120,160,ARRAY['Product','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['hero','gallery','price','offer','seller_card','reviews','faq']::TEXT[],400,TRUE,TRUE,TRUE,
    'Карточка маркетплейса',35,60,30,80,5,
    ARRAY['price','availability','seller_info','returns_policy','reviews_count_or_block']::TEXT[],
    'Product',ARRAY['Organization','WebSite','WebPage','BreadcrumbList','Product','FAQPage']::TEXT[],'3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- 3f. Tier B — mobile_app
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, min_word_count,
  must_be_indexable, must_be_in_sitemap, canonical_required,
  notes_ru, h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
  ('mobile_app','home','3.0.0',120,160,ARRAY['MobileApplication','Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','screenshots','features','reviews','store_badges','cta','faq']::TEXT[],500,TRUE,TRUE,TRUE,
    'Лендинг приложения: badges, скриншоты, отзывы',35,60,40,80,5,
    ARRAY['store_badges_apple_google','screenshots','reviews_rating','price_or_free','deep_link']::TEXT[],
    'MobileApplication',ARRAY['Organization','WebSite','WebPage']::TEXT[],'3.0.0'),
  ('mobile_app','feature','3.0.0',120,160,ARRAY['Service','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','feature_description','demo_video','faq','cta']::TEXT[],600,TRUE,TRUE,TRUE,
    'Фича приложения: видео, скриншоты, FAQ',35,60,40,80,5,
    ARRAY['store_badges_apple_google','deep_link']::TEXT[],
    'Service',ARRAY['Organization','WebSite','WebPage','BreadcrumbList','Service','FAQPage']::TEXT[],'3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- 3g. Tier C — finance / hospitality / events / nonprofit / gov / portfolio / media / blog
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, min_word_count,
  must_be_indexable, must_be_in_sitemap, canonical_required,
  notes_ru, h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
  ('finance','home','3.0.0',120,160,ARRAY['FinancialService','Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','products','licenses','trust','cta','faq']::TEXT[],700,TRUE,TRUE,TRUE,
    'Финансы: лицензии ЦБ, регулятор, отчетность',35,60,40,80,5,
    ARRAY['licenses','phone','address','trust_signals_regulator']::TEXT[],
    'FinancialService',ARRAY['Organization','FinancialService','WebSite','WebPage','FAQPage']::TEXT[],'3.0.0'),
  ('hospitality','home','3.0.0',120,160,ARRAY['Restaurant','Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','menu_or_rooms','gallery','price_range','reviews','cta','contacts']::TEXT[],500,TRUE,TRUE,TRUE,
    'Ресторан/отель: меню/номера, фото, бронь',35,60,40,80,5,
    ARRAY['phone','address','working_hours','price_range','booking_cta']::TEXT[],
    'Restaurant',ARRAY['Organization','Restaurant','WebSite','WebPage','FAQPage']::TEXT[],'3.0.0'),
  ('events','event','3.0.0',120,160,ARRAY['Event','WebPage','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['hero','date_location','programme','speakers','price','cta','faq']::TEXT[],500,TRUE,TRUE,TRUE,
    'Событие: дата, место, спикеры, билет',35,60,40,80,5,
    ARRAY['date','location','price','booking_cta']::TEXT[],
    'Event',ARRAY['Organization','WebSite','WebPage','BreadcrumbList','Event','FAQPage']::TEXT[],'3.0.0'),
  ('nonprofit','home','3.0.0',120,160,ARRAY['NGO','Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','mission','projects','donate_cta','trust','contacts']::TEXT[],500,TRUE,TRUE,TRUE,
    'НКО: миссия, проекты, пожертвовать',35,60,40,80,3,
    ARRAY['donate_cta','reports_link','trust_signals_regulator']::TEXT[],
    'NGO',ARRAY['Organization','NGO','WebSite','WebPage']::TEXT[],'3.0.0'),
  ('gov','home','3.0.0',120,160,ARRAY['GovernmentOrganization','Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','services','documents','contacts','announcements']::TEXT[],400,TRUE,TRUE,TRUE,
    'Госсайт: услуги, документы, контакты',35,60,40,80,3,
    ARRAY['phone','address','working_hours']::TEXT[],
    'GovernmentOrganization',ARRAY['Organization','GovernmentOrganization','WebSite','WebPage']::TEXT[],'3.0.0'),
  ('portfolio','home','3.0.0',120,160,ARRAY['Person','Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','about','projects','services','contacts','cta']::TEXT[],400,TRUE,TRUE,TRUE,
    'Портфолио: кейсы, услуги, контакты',35,60,40,80,3,
    ARRAY['phone_or_email','projects','case_studies']::TEXT[],
    'Person',ARRAY['Organization','WebSite','WebPage','Person']::TEXT[],'3.0.0'),
  ('media','article','3.0.0',120,160,ARRAY['NewsArticle','Article','WebPage','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['intro_answer','sections','quotes','images','related','faq']::TEXT[],1200,TRUE,TRUE,TRUE,
    'Статья медиа: автор, дата, источники',35,80,40,80,3,
    ARRAY['author_byline','date','sources']::TEXT[],
    'NewsArticle',ARRAY['Organization','WebSite','WebPage','BreadcrumbList','NewsArticle']::TEXT[],'3.0.0'),
  ('blog','article','3.0.0',120,160,ARRAY['BlogPosting','Article','WebPage','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['intro_answer','toc','sections','faq','author_bio','cta_inline']::TEXT[],1000,TRUE,TRUE,TRUE,
    'Блог: автор, FAQ, CTA',35,60,40,80,5,
    ARRAY['author_byline','cta_inline']::TEXT[],
    'BlogPosting',ARRAY['Organization','WebSite','WebPage','BreadcrumbList','BlogPosting','FAQPage']::TEXT[],'3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- 3h. Tier C V3-new: promo_event / personal_brand / franchise_multi / b2b_media
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, min_word_count,
  must_be_indexable, must_be_in_sitemap, canonical_required,
  notes_ru, h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
  ('promo_event','home','3.0.0',120,160,ARRAY['Event','Offer','Organization','WebPage','FAQPage']::TEXT[],
    ARRAY['hero','countdown','offer','benefits','cta','faq','contacts']::TEXT[],400,TRUE,TRUE,TRUE,
    'Промо-лендинг: дедлайн + оффер выше fold',35,60,40,80,5,
    ARRAY['date','offer_terms','price','booking_cta','countdown']::TEXT[],
    'Event',ARRAY['Organization','WebSite','WebPage','Event','FAQPage']::TEXT[],'3.0.0'),
  ('personal_brand','home','3.0.0',120,160,ARRAY['Person','ProfessionalService','Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','about','services','cases','media_press','cta','contacts','faq']::TEXT[],600,TRUE,TRUE,TRUE,
    'Личный бренд: фото, регалии, услуги, медиа',35,60,40,80,5,
    ARRAY['phone_or_email','case_studies','team_credentials','media_press_logos']::TEXT[],
    'Person',ARRAY['Organization','WebSite','WebPage','Person','FAQPage']::TEXT[],'3.0.0'),
  ('personal_brand','article','3.0.0',120,160,ARRAY['Article','WebPage','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['intro_answer','toc','sections','faq','cta_inline','author_bio']::TEXT[],1000,TRUE,TRUE,TRUE,
    'Авторская статья личного бренда',35,60,40,80,5,
    ARRAY['author_byline','cta_inline']::TEXT[],
    'Article',ARRAY['Organization','WebSite','WebPage','BreadcrumbList','Article','FAQPage']::TEXT[],'3.0.0'),
  ('franchise_multi','home','3.0.0',120,160,ARRAY['Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','locations_map','services','franchise_offer','cta','trust']::TEXT[],600,TRUE,TRUE,TRUE,
    'Франшиза/сеть: карта городов + офферы',35,60,40,80,5,
    ARRAY['phone','locations_count','franchise_terms','case_studies']::TEXT[],
    'Organization',ARRAY['Organization','WebSite','WebPage']::TEXT[],'3.0.0'),
  ('franchise_multi','location','3.0.0',120,160,ARRAY['LocalBusiness','Service','FAQPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','address_map','services','price','cta','faq','contacts']::TEXT[],600,TRUE,TRUE,TRUE,
    'Страница филиала: NAP, локальные услуги',35,60,40,80,5,
    ARRAY['phone','address','working_hours','price_or_pricing_link']::TEXT[],
    'LocalBusiness',ARRAY['Organization','LocalBusiness','Service','WebPage','BreadcrumbList','FAQPage']::TEXT[],'3.0.0'),
  ('b2b_media','home','3.0.0',120,160,ARRAY['Organization','WebSite','WebPage']::TEXT[],
    ARRAY['hero','featured_articles','subscribe_form','sponsors','topics_cloud']::TEXT[],500,TRUE,TRUE,TRUE,
    'B2B-медиа: подписка, рубрики, спецпроекты',35,60,40,80,3,
    ARRAY['subscribe_form','sponsors_or_clients','featured_authors']::TEXT[],
    'Organization',ARRAY['Organization','WebSite','WebPage']::TEXT[],'3.0.0'),
  ('b2b_media','article','3.0.0',120,160,ARRAY['NewsArticle','WebPage','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['intro_answer','sections','sources','quotes','subscribe_cta','related']::TEXT[],1200,TRUE,TRUE,TRUE,
    'B2B-статья: эксперты, источники, подписка',35,60,40,80,5,
    ARRAY['author_byline','date','sources','subscribe_form']::TEXT[],
    'NewsArticle',ARRAY['Organization','WebSite','WebPage','BreadcrumbList','NewsArticle','FAQPage']::TEXT[],'3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── 4. View: page contracts coverage ───────────────────────
CREATE OR REPLACE VIEW v3_page_contracts_coverage AS
SELECT
  pt.code AS project_code,
  pt.tier,
  pt.name_ru,
  COUNT(pc.id) FILTER (WHERE pc.version = '3.0.0' AND pc.is_active) AS contracts_v3,
  ARRAY_AGG(pc.page_type ORDER BY pc.page_type)
    FILTER (WHERE pc.version = '3.0.0' AND pc.is_active) AS page_types_v3
FROM formula_project_types pt
LEFT JOIN formula_page_contracts pc ON pc.project_type_code = pt.code
GROUP BY pt.code, pt.tier, pt.name_ru, pt.sort_order
ORDER BY pt.tier, pt.sort_order;
