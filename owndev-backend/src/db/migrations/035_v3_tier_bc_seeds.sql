-- Migration 035 — Tier B (mobile_app) + Tier C (special verticals) page contracts
-- ================================================================================
-- Adds contracts for app-specific screens (deep_link, screenshot_gallery) and the
-- remaining special verticals (b2b_media, promo_event/landing, personal_brand/case).

BEGIN;

-- =================================================================
-- mobile_app — Tier B (extra screens)
-- =================================================================
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_h1_pattern, required_title_pattern,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, forbidden_blocks,
  min_word_count, recommended_blocks, recommended_schemas,
  must_be_indexable, must_be_in_sitemap, canonical_required, notes_ru,
  h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
(
  'mobile_app', 'screenshot_gallery', '3.0',
  '{app_name} — скриншоты и видео', '{app_name} — галерея экранов',
  70, 160,
  ARRAY['MobileApplication','ImageGallery','BreadcrumbList'],
  ARRAY['hero','screenshot_carousel','feature_callouts','app_store_links','faq','cta'],
  ARRAY['',''],
  300,
  ARRAY['video_demo','testimonials'],
  ARRAY['VideoObject','AggregateRating'],
  TRUE, TRUE, TRUE,
  'Галерея скриншотов экранов приложения с короткими подписями. Минимум 6 изображений + 1 видео.',
  35, 60, 40, 80, 5,
  ARRAY['app_store_links','reviews','price'],
  'MobileApplication',
  ARRAY['MobileApplication','ImageGallery','BreadcrumbList'], 'v3'
),
(
  'mobile_app', 'deep_link', '3.0',
  'Открыть {feature} в приложении', '{feature} в {app_name} — открыть',
  70, 160,
  ARRAY['WebPage','MobileApplication','BreadcrumbList'],
  ARRAY['hero','deep_link_button','fallback_install_link','faq','cta'],
  ARRAY[''],
  250,
  ARRAY['related_features'],
  ARRAY['ItemList'],
  TRUE, TRUE, TRUE,
  'Deep link landing — открывает экран в приложении или ведёт на установку. Обязательно fallback на App Store / Google Play.',
  35, 60, 40, 80, 5,
  ARRAY['app_store_links'],
  'WebPage',
  ARRAY['WebPage','MobileApplication','BreadcrumbList'], 'v3'
),
(
  'mobile_app', 'support', '3.0',
  '{app_name} — поддержка и помощь', 'Поддержка {app_name}: FAQ и контакты',
  70, 160,
  ARRAY['ContactPage','MobileApplication','FAQPage','BreadcrumbList'],
  ARRAY['hero','contact_methods','faq','known_issues','cta'],
  ARRAY[''],
  400,
  ARRAY['changelog_link','status_page'],
  ARRAY['Article'],
  TRUE, TRUE, TRUE,
  'Раздел поддержки приложения с FAQ ≥ 8, контактами и ссылками на known issues / статус.',
  35, 60, 40, 80, 8,
  ARRAY['phone','messengers','working_hours'],
  'ContactPage',
  ARRAY['ContactPage','MobileApplication','FAQPage','BreadcrumbList'], 'v3'
)
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- =================================================================
-- promo_event — Tier C (extra contracts)
-- =================================================================
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_h1_pattern, required_title_pattern,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, forbidden_blocks,
  min_word_count, recommended_blocks, recommended_schemas,
  must_be_indexable, must_be_in_sitemap, canonical_required, notes_ru,
  h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
(
  'promo_event', 'agenda', '3.0',
  'Программа {event_name}', '{event_name} — программа и спикеры',
  70, 160,
  ARRAY['Event','ItemList','BreadcrumbList'],
  ARRAY['hero','schedule_table','speakers_grid','faq','registration_cta'],
  ARRAY[''],
  500,
  ARRAY['workshops','networking_block'],
  ARRAY['Person','Place'],
  TRUE, TRUE, TRUE,
  'Программа мероприятия с расписанием по сессиям и спикерам. Каждый блок имеет startDate/endDate.',
  35, 60, 40, 80, 6,
  ARRAY['price','working_hours'],
  'Event',
  ARRAY['Event','ItemList','BreadcrumbList'], 'v3'
),
(
  'promo_event', 'speaker', '3.0',
  '{speaker_name} на {event_name}', '{speaker_name}: спикер {event_name}',
  70, 160,
  ARRAY['Person','Event','BreadcrumbList'],
  ARRAY['hero','bio','session_card','social_links','registration_cta'],
  ARRAY[''],
  300,
  ARRAY['video_intro','past_talks'],
  ARRAY['VideoObject'],
  TRUE, TRUE, TRUE,
  'Карточка спикера: bio, тема выступления, время, соцсети.',
  35, 60, 40, 80, 5,
  ARRAY['price'],
  'Person',
  ARRAY['Person','Event','BreadcrumbList'], 'v3'
)
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- =================================================================
-- personal_brand — Tier C (extra contracts)
-- =================================================================
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_h1_pattern, required_title_pattern,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, forbidden_blocks,
  min_word_count, recommended_blocks, recommended_schemas,
  must_be_indexable, must_be_in_sitemap, canonical_required, notes_ru,
  h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
(
  'personal_brand', 'case', '3.0',
  'Кейс: {result}', 'Кейс {client_name}: {result_short}',
  70, 160,
  ARRAY['Article','Person','CreativeWork','BreadcrumbList'],
  ARRAY['hero','client_intro','problem','solution','metrics_table','testimonial','cta'],
  ARRAY[''],
  600,
  ARRAY['video_proof','tools_used'],
  ARRAY['ImageObject','VideoObject'],
  TRUE, TRUE, TRUE,
  'Кейс с измеримым результатом: до/после, метрики, отзыв клиента, использованные инструменты.',
  35, 60, 40, 80, 5,
  ARRAY['phone','messengers'],
  'Article',
  ARRAY['Article','Person','BreadcrumbList'], 'v3'
),
(
  'personal_brand', 'speaking', '3.0',
  '{speaker_name} — выступления и спикерство', 'Спикерство {speaker_name}: темы и условия',
  70, 160,
  ARRAY['Person','ItemList','BreadcrumbList'],
  ARRAY['hero','topics_grid','past_events','testimonials','booking_cta'],
  ARRAY[''],
  400,
  ARRAY['video_reel','speaker_kit_link'],
  ARRAY['VideoObject'],
  TRUE, TRUE, TRUE,
  'Страница для приглашения спикером: темы, кейсы выступлений, форма booking.',
  35, 60, 40, 80, 5,
  ARRAY['phone','messengers'],
  'Person',
  ARRAY['Person','BreadcrumbList'], 'v3'
)
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- =================================================================
-- franchise_multi — Tier C (extra contracts)
-- =================================================================
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_h1_pattern, required_title_pattern,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, forbidden_blocks,
  min_word_count, recommended_blocks, recommended_schemas,
  must_be_indexable, must_be_in_sitemap, canonical_required, notes_ru,
  h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
(
  'franchise_multi', 'franchise_offer', '3.0',
  'Франшиза {brand} в {city}', 'Франшиза {brand}: открыть в {city}',
  70, 160,
  ARRAY['Service','Offer','BreadcrumbList','FAQPage'],
  ARRAY['hero','franchise_kpi','pricing_table','steps_to_open','calculator','case_studies','faq','application_form'],
  ARRAY[''],
  800,
  ARRAY['unit_economics_pdf','team_block'],
  ARRAY['Article','VideoObject'],
  TRUE, TRUE, TRUE,
  'Лендинг для покупателей франшизы: KPI, юнит-экономика, шаги, кейсы.',
  35, 60, 40, 80, 8,
  ARRAY['price','phone','messengers','reviews'],
  'Service',
  ARRAY['Service','Offer','BreadcrumbList','FAQPage'], 'v3'
)
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- =================================================================
-- b2b_media — Tier C (NEW)
-- =================================================================
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_h1_pattern, required_title_pattern,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, forbidden_blocks,
  min_word_count, recommended_blocks, recommended_schemas,
  must_be_indexable, must_be_in_sitemap, canonical_required, notes_ru,
  h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
(
  'b2b_media', 'home', '3.0',
  '{brand} — медиа для {audience}', '{brand}: издание для {audience}',
  70, 160,
  ARRAY['NewsMediaOrganization','WebSite','BreadcrumbList'],
  ARRAY['hero','featured_articles','category_grid','newsletter_signup','about_brand','sponsors_block'],
  ARRAY[''],
  500,
  ARRAY['top_authors','editorial_policy_link'],
  ARRAY['ItemList'],
  TRUE, TRUE, TRUE,
  'Главная страница B2B-медиа: подборка топовых статей, рубрики, подписка на рассылку.',
  35, 60, 40, 80, 5,
  ARRAY['phone'],
  'NewsMediaOrganization',
  ARRAY['NewsMediaOrganization','WebSite','BreadcrumbList'], 'v3'
),
(
  'b2b_media', 'article', '3.0',
  '{title}', '{title} — {brand}',
  70, 160,
  ARRAY['NewsArticle','Person','NewsMediaOrganization','BreadcrumbList'],
  ARRAY['hero','intro_answer','toc','article_body','author_card','related_articles','newsletter_signup'],
  ARRAY[''],
  1200,
  ARRAY['key_takeaways','citations'],
  ARRAY['Quotation','VideoObject'],
  TRUE, TRUE, TRUE,
  'Аналитическая статья B2B-медиа: TL;DR, оглавление, цитирование экспертов, related articles.',
  35, 60, 40, 80, 5,
  ARRAY['phone'],
  'NewsArticle',
  ARRAY['NewsArticle','Person','BreadcrumbList'], 'v3'
),
(
  'b2b_media', 'category', '3.0',
  '{category_name} — статьи и аналитика', '{category_name} в {brand}: разборы и кейсы',
  70, 160,
  ARRAY['CollectionPage','ItemList','BreadcrumbList'],
  ARRAY['hero','intro_answer','articles_grid','filters','newsletter_signup'],
  ARRAY[''],
  400,
  ARRAY['top_authors_in_category'],
  ARRAY['ItemList'],
  TRUE, TRUE, TRUE,
  'Страница рубрики B2B-медиа: список статей, фильтры, подписка.',
  35, 60, 40, 80, 5,
  ARRAY['phone'],
  'CollectionPage',
  ARRAY['CollectionPage','ItemList','BreadcrumbList'], 'v3'
),
(
  'b2b_media', 'author', '3.0',
  '{author_name} — автор {brand}', '{author_name}: автор и эксперт {brand}',
  70, 160,
  ARRAY['Person','NewsMediaOrganization','ItemList','BreadcrumbList'],
  ARRAY['hero','bio','expertise_topics','author_articles','social_links'],
  ARRAY[''],
  300,
  ARRAY['contact_form','newsletter_signup'],
  ARRAY['Article'],
  TRUE, TRUE, TRUE,
  'Карточка автора B2B-медиа: bio, экспертиза, статьи, соцсети.',
  35, 60, 40, 80, 5,
  ARRAY['phone'],
  'Person',
  ARRAY['Person','BreadcrumbList'], 'v3'
)
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- =================================================================
-- service_b2b — Tier A (was missing in 031)
-- =================================================================
INSERT INTO formula_page_contracts (
  project_type_code, page_type, version,
  required_h1_pattern, required_title_pattern,
  required_meta_desc_min, required_meta_desc_max,
  required_schemas, required_blocks, forbidden_blocks,
  min_word_count, recommended_blocks, recommended_schemas,
  must_be_indexable, must_be_in_sitemap, canonical_required, notes_ru,
  h1_max_chars, title_max_chars,
  intro_answer_words_min, intro_answer_words_max, faq_min_items,
  required_commercial_signals, schema_graph_root, schema_graph_required, engine_version
) VALUES
(
  'service_b2b', 'home', '3.0',
  '{brand} — {value_prop_short}', '{brand}: {service_main} для бизнеса',
  70, 160,
  ARRAY['Organization','WebSite','Service','BreadcrumbList','FAQPage'],
  ARRAY['hero','intro_answer','client_logos','benefits','case_grid','pricing_block','demo_cta','faq'],
  ARRAY[''],
  600,
  ARRAY['team_block','contact_form'],
  ARRAY['Article','VideoObject'],
  TRUE, TRUE, TRUE,
  'Главная B2B-сервиса: УТП, логотипы клиентов, кейсы, тарифы, demo CTA.',
  35, 60, 40, 80, 5,
  ARRAY['price','phone','messengers','reviews'],
  'Organization',
  ARRAY['Organization','WebSite','Service','BreadcrumbList','FAQPage'], 'v3'
),
(
  'service_b2b', 'case', '3.0',
  'Кейс: {client_name}', '{client_name}: {result_short}',
  70, 160,
  ARRAY['Article','Organization','BreadcrumbList'],
  ARRAY['hero','client_intro','problem','solution','metrics_table','testimonial','related_cases','cta'],
  ARRAY[''],
  600,
  ARRAY['video_walkthrough'],
  ARRAY['VideoObject'],
  TRUE, TRUE, TRUE,
  'B2B кейс: бизнес-проблема, решение, измеримые метрики, отзыв.',
  35, 60, 40, 80, 5,
  ARRAY['phone','messengers'],
  'Article',
  ARRAY['Article','Organization','BreadcrumbList'], 'v3'
),
(
  'service_b2b', 'integrations', '3.0',
  'Интеграции {brand}', '{brand} — интеграции и API',
  70, 160,
  ARRAY['CollectionPage','ItemList','BreadcrumbList'],
  ARRAY['hero','intro_answer','integrations_grid','api_docs_link','faq','demo_cta'],
  ARRAY[''],
  400,
  ARRAY['code_snippets'],
  ARRAY['SoftwareApplication'],
  TRUE, TRUE, TRUE,
  'Список интеграций с фильтром, ссылкой на API docs и CTA на demo.',
  35, 60, 40, 80, 5,
  ARRAY['price'],
  'CollectionPage',
  ARRAY['CollectionPage','ItemList','BreadcrumbList'], 'v3'
)
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

COMMIT;
