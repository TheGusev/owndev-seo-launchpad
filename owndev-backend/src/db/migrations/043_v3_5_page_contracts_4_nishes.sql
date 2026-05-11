-- =============================================================
-- Migration 043 (V3) — Page contracts: добор до 5 страниц для 4 ниш (PR-22)
-- =============================================================
-- Закрывает H10 из ASI-вердикта PR-14: «глубина роли страниц» для 4 ниш,
-- у которых на версии '3.0.0' было меньше 5 контрактов:
--
--   nonprofit       — было 1 (home),           добавляем 4: about, donate, programs, report
--   promo_event     — было 1 (home),           добавляем 4: agenda, speakers, tickets, venue
--   personal_brand  — было 2 (home, article),  добавляем 3: about, services, contact
--   b2b_media       — было 2 (home, article),  добавляем 3: category, author, newsletter
--
-- Существующие контракты НЕ трогаем (миграции 031/035), только добавляем.
-- Все INSERT идут с version='3.0.0', потому что pageContracts/repository.ts
-- фильтрует именно по '3.0.0'. Контракты из 035 на version='3.0' видны
-- параллельно как «расширенные», но при подсчёте глубины ASI-аудит и
-- v3-движок учитывают только '3.0.0'.
--
-- Schema.org-ноды:
--   * nonprofit — NGO (доступен после PR-20).
--   * promo_event — Event + Offer + Person.
--   * personal_brand — Person + ProfessionalService.
--   * b2b_media — NewsMediaOrganization + CollectionPage + Person.
--
-- ON CONFLICT (project_type_code, page_type, version) DO NOTHING —
-- миграцию безопасно перезапускать.
-- =============================================================

-- ─── nonprofit (4 новых страницы) ────────────────────────────
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
  ('nonprofit','about','3.0.0',
    '.*(о фонд|о нас|миссия).*', '.*(о фонде|о нас).*',
    120, 160,
    ARRAY['NGO','Organization','WebPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','mission','founders','team','timeline','documents','contacts']::TEXT[], ARRAY[]::TEXT[],
    600, ARRAY['video_about','partners','awards']::TEXT[], ARRAY['FAQPage']::TEXT[],
    TRUE, TRUE, TRUE,
    'О фонде: legalName, дата регистрации, ИНН/ОГРН, учредители, миссия, попечительский совет',
    35, 60, 40, 80, 3,
    ARRAY['reports_link','trust_signals_regulator','team_credentials']::TEXT[],
    'NGO', ARRAY['Organization','NGO','WebPage','BreadcrumbList']::TEXT[], '3.0.0'),

  ('nonprofit','donate','3.0.0',
    '.*(пожертвовать|помочь|поддержать).*', '.*(пожертвовать|помочь|donate).*',
    120, 160,
    ARRAY['NGO','Organization','WebPage','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['hero','donate_options','recurring_donation','payment_methods','impact_examples','trust','faq']::TEXT[], ARRAY[]::TEXT[],
    500, ARRAY['donor_testimonials','transparency_block']::TEXT[], ARRAY['MonetaryGrant']::TEXT[],
    TRUE, TRUE, TRUE,
    'Пожертвования: формы (разовое/регулярное), варианты сумм, способы оплаты, договор-оферта, отчёт о расходах',
    35, 60, 40, 80, 5,
    ARRAY['donate_cta','payment_methods','reports_link','trust_signals_regulator']::TEXT[],
    'NGO', ARRAY['Organization','NGO','WebPage','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('nonprofit','programs','3.0.0',
    '.*(программ|проект|направлен).*', '.*(программы|проекты|направления).*',
    120, 160,
    ARRAY['NGO','Organization','ItemList','WebPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','programs_grid','filters','impact_metrics','cta','contacts']::TEXT[], ARRAY[]::TEXT[],
    500, ARRAY['program_cards','beneficiary_stories','partners']::TEXT[], ARRAY['Article']::TEXT[],
    TRUE, TRUE, TRUE,
    'Программы фонда: каталог проектов с целями, бюджетом, статусом и результатами по каждому',
    35, 60, 40, 80, 3,
    ARRAY['donate_cta','case_studies','reports_link']::TEXT[],
    'NGO', ARRAY['Organization','NGO','ItemList','WebPage','BreadcrumbList']::TEXT[], '3.0.0'),

  ('nonprofit','report','3.0.0',
    '.*(отчёт|отчет|годовой отчёт|документ).*', '.*(отчёты|отчётность|документы).*',
    120, 160,
    ARRAY['NGO','Organization','WebPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','reports_list','financial_summary','download_links','auditor_info','contacts']::TEXT[], ARRAY[]::TEXT[],
    300, ARRAY['previous_years','audit_letters']::TEXT[], ARRAY[]::TEXT[],
    TRUE, TRUE, TRUE,
    'Отчётность фонда: годовые отчёты PDF, финансовые отчёты, аудиторские заключения, прозрачность',
    35, 60, 40, 80, 3,
    ARRAY['reports_link','trust_signals_regulator','documents_download']::TEXT[],
    'NGO', ARRAY['Organization','NGO','WebPage','BreadcrumbList']::TEXT[], '3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── promo_event (4 новых страницы) ──────────────────────────
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
  ('promo_event','agenda','3.0.0',
    '.*(программ|расписан|agenda).*', '.*(программа|расписание).*',
    120, 160,
    ARRAY['Event','ItemList','WebPage','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['hero','schedule_table','tracks_filter','speakers_grid','networking_block','registration_cta','faq']::TEXT[], ARRAY[]::TEXT[],
    500, ARRAY['workshops','side_events']::TEXT[], ARRAY['Person','Place']::TEXT[],
    TRUE, TRUE, TRUE,
    'Программа мероприятия: расписание сессий с startDate/endDate, треки, спикеры по слотам',
    35, 60, 40, 80, 5,
    ARRAY['date','location','booking_cta']::TEXT[],
    'Event', ARRAY['Organization','WebSite','WebPage','Event','ItemList','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('promo_event','speakers','3.0.0',
    '.*(спикер|эксперт|выступающ).*', '.*(спикеры|эксперты).*',
    120, 160,
    ARRAY['Event','ItemList','WebPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','speakers_grid','filters','featured_speaker','cta','contacts']::TEXT[], ARRAY[]::TEXT[],
    400, ARRAY['speaker_bio','past_talks','video_intros']::TEXT[], ARRAY['Person','VideoObject']::TEXT[],
    TRUE, TRUE, TRUE,
    'Спикеры события: карточки с фото, должностью, темой выступления и временем',
    35, 60, 40, 80, 3,
    ARRAY['date','booking_cta','team_credentials']::TEXT[],
    'Event', ARRAY['Organization','WebSite','WebPage','Event','Person','ItemList','BreadcrumbList']::TEXT[], '3.0.0'),

  ('promo_event','tickets','3.0.0',
    '.*(билет|регистрац|участи|tickets).*', '.*(билеты|регистрация|стоимость).*',
    120, 160,
    ARRAY['Event','Offer','WebPage','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['hero','ticket_types','price_table','what_included','early_bird','registration_form','faq','contacts']::TEXT[], ARRAY[]::TEXT[],
    500, ARRAY['group_discounts','partner_offers']::TEXT[], ARRAY['AggregateOffer']::TEXT[],
    TRUE, TRUE, TRUE,
    'Билеты события: типы тарифов, цены с availability, early bird, что входит, оплата, оферта',
    35, 60, 40, 80, 5,
    ARRAY['price','offer_terms','booking_cta','countdown']::TEXT[],
    'Event', ARRAY['Organization','WebSite','WebPage','Event','Offer','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('promo_event','venue','3.0.0',
    '.*(место провед|площадк|venue|как добраться).*', '.*(место|площадка|как добраться).*',
    120, 160,
    ARRAY['Event','Place','WebPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','address_map','how_to_get_there','parking_info','accommodation','contacts']::TEXT[], ARRAY[]::TEXT[],
    300, ARRAY['photos_venue','hotel_partners']::TEXT[], ARRAY['PostalAddress','GeoCoordinates']::TEXT[],
    TRUE, TRUE, TRUE,
    'Место проведения: адрес, карта, схема залов, как добраться (метро/такси/машина), парковка, отели рядом',
    35, 60, 40, 80, 3,
    ARRAY['address','date','location','working_hours']::TEXT[],
    'Event', ARRAY['Organization','WebSite','WebPage','Event','Place','BreadcrumbList']::TEXT[], '3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── personal_brand (3 новых страницы) ───────────────────────
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
  ('personal_brand','about','3.0.0',
    '.*(о себе|обо мне|биография|about).*', '.*(обо мне|биография).*',
    120, 160,
    ARRAY['Person','ProfessionalService','WebPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','biography','education','experience_timeline','credentials','press_quotes','cta']::TEXT[], ARRAY[]::TEXT[],
    600, ARRAY['video_intro','awards','memberships']::TEXT[], ARRAY['EducationalOccupationalCredential']::TEXT[],
    TRUE, TRUE, TRUE,
    'О себе: биография, образование, опыт, регалии, награды, упоминания в прессе, фото',
    35, 60, 40, 80, 3,
    ARRAY['team_credentials','media_press_logos','case_studies']::TEXT[],
    'Person', ARRAY['Organization','WebSite','WebPage','Person','BreadcrumbList']::TEXT[], '3.0.0'),

  ('personal_brand','services','3.0.0',
    '.*(услуг|консультац|программ|services).*', '.*(услуги|консультации|программы).*',
    120, 160,
    ARRAY['Person','Service','ItemList','WebPage','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['hero','services_grid','price_table','how_it_works','cases_block','cta','faq','contacts']::TEXT[], ARRAY[]::TEXT[],
    700, ARRAY['testimonials','calendar_widget']::TEXT[], ARRAY['Offer']::TEXT[],
    TRUE, TRUE, TRUE,
    'Услуги эксперта: форматы работы (1:1, групповые, корпоративные), длительность, цена, что входит, как записаться',
    35, 60, 40, 80, 5,
    ARRAY['price','phone_or_email','case_studies','team_credentials']::TEXT[],
    'Person', ARRAY['Organization','WebSite','WebPage','Person','Service','BreadcrumbList','FAQPage']::TEXT[], '3.0.0'),

  ('personal_brand','contact','3.0.0',
    '.*(контакт|связаться|записаться|contact).*', '.*(контакты|связаться).*',
    120, 160,
    ARRAY['Person','ContactPoint','WebPage','BreadcrumbList']::TEXT[],
    ARRAY['hero','contact_form','contact_methods','messengers','social_links','calendar_link','availability']::TEXT[], ARRAY[]::TEXT[],
    250, ARRAY['working_hours','timezone_note']::TEXT[], ARRAY[]::TEXT[],
    TRUE, TRUE, TRUE,
    'Контакты эксперта: форма заявки, телефон/email, мессенджеры, ссылка на бронирование слота, соцсети',
    35, 60, 40, 80, 3,
    ARRAY['phone_or_email','messengers','working_hours']::TEXT[],
    'Person', ARRAY['Organization','WebSite','WebPage','Person','BreadcrumbList']::TEXT[], '3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── b2b_media (3 новых страницы) ────────────────────────────
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
  ('b2b_media','category','3.0.0',
    '.*(рубрик|категори|тематик|раздел).*', '.*(рубрика|категория|раздел).*',
    120, 160,
    ARRAY['CollectionPage','ItemList','BreadcrumbList','WebPage']::TEXT[],
    ARRAY['hero','intro_answer','articles_grid','filters','pagination','newsletter_signup','related_categories']::TEXT[], ARRAY[]::TEXT[],
    400, ARRAY['top_authors_in_category','featured_article']::TEXT[], ARRAY['NewsMediaOrganization']::TEXT[],
    TRUE, TRUE, TRUE,
    'Рубрика B2B-медиа: введение в тематику, список статей с фильтрами, подписка, ссылки на смежные рубрики',
    35, 60, 40, 80, 3,
    ARRAY['subscribe_form','featured_authors']::TEXT[],
    'CollectionPage', ARRAY['Organization','WebSite','WebPage','CollectionPage','ItemList','BreadcrumbList']::TEXT[], '3.0.0'),

  ('b2b_media','author','3.0.0',
    '.*(автор|редактор|колумнист).*', '.*(автор|эксперт|колумнист).*',
    120, 160,
    ARRAY['Person','NewsMediaOrganization','ItemList','BreadcrumbList','WebPage']::TEXT[],
    ARRAY['hero','bio','expertise_topics','author_articles','social_links','contact_form']::TEXT[], ARRAY[]::TEXT[],
    300, ARRAY['newsletter_signup','external_publications']::TEXT[], ARRAY['Article']::TEXT[],
    TRUE, TRUE, TRUE,
    'Страница автора B2B-медиа: bio, экспертиза, isPartOf NewsMediaOrganization, список статей, соцсети',
    35, 60, 40, 80, 3,
    ARRAY['featured_authors','author_byline']::TEXT[],
    'Person', ARRAY['Organization','NewsMediaOrganization','WebSite','WebPage','Person','BreadcrumbList']::TEXT[], '3.0.0'),

  ('b2b_media','newsletter','3.0.0',
    '.*(рассылк|подписк|newsletter).*', '.*(рассылка|подписка|newsletter).*',
    120, 160,
    ARRAY['NewsMediaOrganization','WebPage','BreadcrumbList','FAQPage']::TEXT[],
    ARRAY['hero','value_prop','frequency_info','subscribe_form','past_issues','testimonials','faq']::TEXT[], ARRAY[]::TEXT[],
    300, ARRAY['authors_block','sample_issue_preview']::TEXT[], ARRAY['SubscribeAction']::TEXT[],
    TRUE, TRUE, TRUE,
    'Подписка на рассылку: ценность подписки, частота, форма (email + согласие), архив выпусков',
    35, 60, 40, 80, 3,
    ARRAY['subscribe_form','featured_authors']::TEXT[],
    'NewsMediaOrganization', ARRAY['Organization','NewsMediaOrganization','WebSite','WebPage','BreadcrumbList','FAQPage']::TEXT[], '3.0.0')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- =============================================================
-- Down (для ручного отката, не выполняется автоматически):
--
-- DELETE FROM formula_page_contracts
-- WHERE version = '3.0.0' AND (
--   (project_type_code = 'nonprofit'      AND page_type IN ('about','donate','programs','report')) OR
--   (project_type_code = 'promo_event'    AND page_type IN ('agenda','speakers','tickets','venue')) OR
--   (project_type_code = 'personal_brand' AND page_type IN ('about','services','contact')) OR
--   (project_type_code = 'b2b_media'      AND page_type IN ('category','author','newsletter'))
-- );
--
-- Sanity-check после миграции:
--   SELECT project_type_code, COUNT(*)
--   FROM formula_page_contracts
--   WHERE version = '3.0.0' AND is_active = TRUE
--     AND project_type_code IN ('nonprofit','promo_event','personal_brand','b2b_media')
--   GROUP BY project_type_code;
--   -- ожидаем 5 строк для каждой ниши.
-- =============================================================
