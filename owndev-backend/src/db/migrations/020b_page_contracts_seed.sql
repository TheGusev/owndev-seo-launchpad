-- =============================================================
-- Migration 020b — Seed page contracts for all 19 project types.
-- =============================================================
-- For each project type we define 4 base page contracts:
--   home, listing/category, leaf (service|product|article), contacts.
-- A fifth (about) is added where E-E-A-T matters.
--
-- These are inviolable invariants checked by Preflight Audit. Soft-only
-- requirements live in formula_rules (rules.v2.json) — NOT here.
-- =============================================================

-- ─── service_geo ──────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('service_geo','home',     '^[А-ЯA-Z][^|]{15,80}$', '^.{30,60}$', '{Organization,LocalBusiness}', '{hero,services_list,cta,trust,contacts}', '{reviews,faq}', '{FAQPage}', 500, 'Главная: чёткое предложение + город + телефон выше первого экрана'),
  ('service_geo','category', '^[А-ЯA-Z][^|]{10,80}( в [А-Я][а-я]+)?$', '^.{30,60}$', '{BreadcrumbList,LocalBusiness}', '{hero,services_grid,cta,faq}', '{reviews,price_table}', '{FAQPage}', 600, 'Категория услуг: гео в H1, минимум 6 услуг'),
  ('service_geo','service',  '^[А-ЯA-Z][^|]{15,80}( в [А-Я][а-я]+)?$', '^.{30,60}$', '{Service,BreadcrumbList,LocalBusiness}', '{hero,description,price,cta,faq,contacts}', '{reviews,cases,gallery}', '{FAQPage,Review}', 700, 'Услуга: H1 = название + город, цена обязательна, FAQ ≥ 4 вопроса'),
  ('service_geo','contacts', '^Контакты.*$', '^Контакты.{0,40}$', '{LocalBusiness,Organization}', '{address,phone,email,map,working_hours,form}', '{messengers,parking}', NULL, 200, 'Контакты: адрес, телефон, карта, форма обязательны')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── service_pro ──────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('service_pro','home',     NULL, '^.{30,60}$', '{Organization,ProfessionalService}', '{hero,services_list,cases,cta,trust}', '{team,reviews,faq}', '{FAQPage,Person}', 600, 'Профуслуги: фокус на компетенции и кейсы'),
  ('service_pro','service',  NULL, '^.{30,60}$', '{Service,BreadcrumbList,ProfessionalService}', '{hero,description,process,price,cta,faq}', '{cases,team,reviews}', '{FAQPage,Review}', 800, 'Описание услуги + процесс работы + цена'),
  ('service_pro','about',    '^О компании.*|^О нас.*', NULL, '{Organization,Person}', '{team,history,values,licenses,cta}', '{awards,clients}', NULL, 500, 'Команда + лицензии (E-E-A-T)'),
  ('service_pro','contacts', '^Контакты.*$', NULL, '{Organization,ProfessionalService}', '{address,phone,email,form}', '{map,working_hours}', NULL, 150, 'Стандартные контакты')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── service_b2b ──────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('service_b2b','home',     NULL, '^.{30,60}$', '{Organization}', '{hero,problem_solution,features,cases,cta,clients}', '{integrations,pricing_teaser}', '{FAQPage}', 700, 'B2B: проблема→решение, кейсы, логотипы клиентов'),
  ('service_b2b','service',  NULL, '^.{30,60}$', '{Service,Organization}', '{hero,benefits,how_it_works,price_or_request,cta,cases}', '{integrations,faq}', '{FAQPage}', 800, 'Услуга B2B: benefits, процесс, CTA на демо/расчёт'),
  ('service_b2b','cases',    '^(Кейсы|Истории успеха).*', NULL, '{Article}', '{client_intro,challenge,solution,results,quote}', '{related_cases}', NULL, 500, 'Кейс: проблема→решение→цифры'),
  ('service_b2b','contacts', '^Контакты.*$', NULL, '{Organization}', '{address,phone,email,form}', '{managers}', NULL, 150, 'B2B-контакты с менеджерами')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── ecommerce ────────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('ecommerce','home',     NULL, '^.{30,60}$', '{Organization,WebSite}', '{hero,categories,featured_products,promo,trust}', '{reviews,blog_teaser}', NULL, 300, 'Главная магазина: категории + хиты + доверие'),
  ('ecommerce','category', '^[А-ЯA-Z].{5,80}$', '^.{30,60}$', '{BreadcrumbList,CollectionPage}', '{filters,products_grid,seo_text,pagination}', '{popular_brands,faq}', '{FAQPage}', 400, 'Категория: фильтры + сетка ≥ 12 товаров + SEO-текст внизу'),
  ('ecommerce','product',  NULL, '^.{30,60}$', '{Product,Offer,BreadcrumbList}', '{gallery,price,buy_button,description,characteristics,delivery}', '{reviews,related,questions}', '{Review,AggregateRating}', 300, 'Товар: галерея, цена, наличие, кнопка купить, характеристики'),
  ('ecommerce','contacts', '^(Контакты|О магазине).*', NULL, '{Organization}', '{address,phone,email,working_hours,delivery_info,form}', '{requisites,offices}', NULL, 200, 'Контакты магазина с реквизитами')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── marketplace ──────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('marketplace','home',     NULL, '^.{30,60}$', '{Organization,WebSite}', '{search,categories,featured,top_sellers,trust}', '{ad_banners,reviews}', NULL, 300, 'Маркетплейс: поиск + категории + ТОП'),
  ('marketplace','category', NULL, '^.{30,60}$', '{BreadcrumbList,CollectionPage}', '{filters,products_grid,sellers,pagination}', '{seo_text}', NULL, 200, 'Категория с фильтрами и продавцами'),
  ('marketplace','product',  NULL, '^.{30,60}$', '{Product,Offer,BreadcrumbList}', '{gallery,price,seller_block,buy_button,description,characteristics,reviews}', '{related,questions}', '{Review,AggregateRating}', 250, 'Товар маркетплейса: блок продавца обязателен'),
  ('marketplace','seller',   NULL, NULL, '{Organization}', '{seller_info,rating,products_grid,reviews,policies}', '{contacts}', NULL, 200, 'Карточка продавца')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── saas ─────────────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('saas','home',     NULL, '^.{30,60}$', '{Organization,SoftwareApplication}', '{hero,problem_solution,features,demo_cta,pricing_teaser,clients}', '{integrations,reviews,faq}', '{FAQPage}', 600, 'SaaS-главная: hero, фичи, demo CTA'),
  ('saas','features', '^(Возможности|Функции).*', NULL, '{SoftwareApplication}', '{feature_grid,details,cta}', '{comparison,faq}', '{FAQPage}', 500, 'Фичи: сетка + детали по каждой'),
  ('saas','pricing',  '^(Цены|Тарифы).*', NULL, '{Offer,SoftwareApplication}', '{pricing_table,features_compare,cta,faq}', '{enterprise_cta,money_back}', '{FAQPage}', 400, 'Тарифы: сравнение, FAQ обязательно'),
  ('saas','docs',     NULL, NULL, '{TechArticle}', '{toc,article_body,code_examples}', '{related,feedback}', NULL, 400, 'Документация'),
  ('saas','contacts', '^(Контакты|Поддержка).*', NULL, '{Organization}', '{email,form,response_time}', '{address,phone,knowledge_base}', NULL, 150, 'Поддержка SaaS')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── mobile_app ───────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('mobile_app','home',     NULL, '^.{30,60}$', '{MobileApplication,Organization}', '{hero,store_badges,features,screenshots,reviews}', '{video,faq}', '{FAQPage,AggregateRating}', 400, 'Лендинг приложения: store-кнопки выше первого экрана'),
  ('mobile_app','features', NULL, NULL, '{MobileApplication}', '{feature_grid,screenshots,store_cta}', '{video}', NULL, 400, 'Фичи приложения'),
  ('mobile_app','support',  '^(Поддержка|FAQ).*', NULL, '{FAQPage}', '{faq,contact_form}', '{knowledge_base}', NULL, 300, 'FAQ + форма для поддержки'),
  ('mobile_app','contacts', NULL, NULL, '{Organization}', '{email,form}', '{social_links}', NULL, 100, 'Контакты разработчика')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── media ────────────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('media','home',     NULL, '^.{30,60}$', '{Organization,WebSite}', '{top_stories,sections_grid,trending,newsletter}', '{ads,videos}', NULL, 200, 'Главная медиа: топ-истории + рубрики'),
  ('media','section',  NULL, '^.{30,60}$', '{BreadcrumbList,CollectionPage}', '{section_intro,articles_list,pagination}', '{popular_in_section}', NULL, 200, 'Раздел / рубрика'),
  ('media','article',  NULL, '^.{30,60}$', '{Article,Person,Organization}', '{title,author_byline,date,article_body,share}', '{related,comments,newsletter}', NULL, 800, 'Статья: автор + дата + body ≥ 800 слов'),
  ('media','author',   NULL, NULL, '{Person}', '{bio,credentials,articles_list,social_links}', '{contacts}', NULL, 300, 'Профиль автора (E-E-A-T)'),
  ('media','contacts', '^(Контакты|Редакция).*', NULL, '{Organization}', '{address,phone,email,team}', '{advertising,careers}', NULL, 200, 'Редакция + реклама')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── blog ─────────────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('blog','home',     NULL, '^.{30,60}$', '{Person,Blog}', '{author_intro,recent_posts,subscribe}', '{categories,featured}', NULL, 200, 'Блог: автор + последние посты'),
  ('blog','article',  NULL, '^.{30,60}$', '{BlogPosting,Person}', '{title,author,date,article_body,share,subscribe}', '{related,comments}', NULL, 800, 'Пост: ≥ 800 слов, автор, дата'),
  ('blog','about',    '^Об авторе.*|^Обо мне.*', NULL, '{Person}', '{bio,credentials,projects,contacts}', '{social_links}', NULL, 400, 'Об авторе (E-E-A-T)'),
  ('blog','contacts', NULL, NULL, '{Person}', '{email,form}', '{social_links}', NULL, 100, 'Контакты автора')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── education ────────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('education','home',     NULL, '^.{30,60}$', '{Organization,EducationalOrganization}', '{hero,courses_grid,why_us,reviews,cta}', '{teachers,faq}', '{FAQPage,Review}', 600, 'Школа/курсы: hero + сетка курсов + соцдоказательство'),
  ('education','course',   NULL, '^.{30,60}$', '{Course,Offer,BreadcrumbList,EducationalOrganization}', '{hero,program,teacher,price,cta,faq,reviews}', '{schedule,certificates}', '{FAQPage,Review}', 1000, 'Курс: программа, преподаватель, цена, FAQ обязательны'),
  ('education','teachers', '^(Преподаватели|Команда).*', NULL, '{Person}', '{teachers_grid,bios,credentials}', '{schedule}', NULL, 400, 'Преподаватели (E-E-A-T)'),
  ('education','about',    NULL, NULL, '{EducationalOrganization}', '{history,licenses,achievements,team}', '{partners}', NULL, 500, 'О школе + лицензии'),
  ('education','contacts', '^Контакты.*$', NULL, '{Organization,EducationalOrganization}', '{address,phone,email,form}', '{map,working_hours}', NULL, 200, 'Контакты школы')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── medical ──────────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('medical','home',     NULL, '^.{30,60}$', '{MedicalBusiness,Organization,LocalBusiness}', '{hero,services,doctors,licenses,trust,cta,contacts}', '{reviews,prices_teaser,faq}', '{FAQPage,Review}', 700, 'Клиника: услуги + врачи + лицензии (E-E-A-T критичен)'),
  ('medical','service',  NULL, '^.{30,60}$', '{MedicalProcedure,MedicalBusiness,BreadcrumbList}', '{hero,description,doctors,price,cta,faq}', '{contraindications,prep,reviews}', '{FAQPage}', 800, 'Медуслуга: показания, противопоказания, врачи'),
  ('medical','doctors',  '^(Врачи|Специалисты|Команда).*', NULL, '{Physician}', '{doctors_grid,credentials,specialties}', '{schedule}', NULL, 300, 'Врачи (E-E-A-T)'),
  ('medical','doctor',   NULL, NULL, '{Physician,Person}', '{photo,bio,specialty,credentials,experience,cta}', '{schedule,reviews}', '{Review}', 400, 'Карточка врача'),
  ('medical','contacts', '^Контакты.*$', NULL, '{MedicalBusiness,LocalBusiness}', '{address,phone,email,working_hours,map,form}', '{licenses,parking}', NULL, 250, 'Контакты клиники + лицензии')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── legal ────────────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('legal','home',     NULL, '^.{30,60}$', '{LegalService,Organization,LocalBusiness}', '{hero,services,team,cases,cta,contacts}', '{reviews,faq}', '{FAQPage}', 700, 'Юрфирма: услуги + команда + кейсы (E-E-A-T критичен)'),
  ('legal','service',  NULL, '^.{30,60}$', '{LegalService,Service,BreadcrumbList}', '{hero,description,process,price,cta,cases,faq}', '{reviews,team}', '{FAQPage,Review}', 900, 'Юруслуга: процесс работы, цена, кейсы'),
  ('legal','team',     '^(Команда|Юристы|Адвокаты).*', NULL, '{Attorney,Person}', '{team_grid,credentials,bar_membership}', '{achievements}', NULL, 400, 'Команда юристов (E-E-A-T)'),
  ('legal','cases',    '^(Кейсы|Дела).*', NULL, '{Article}', '{cases_list,filters}', NULL, NULL, 300, 'Кейсы фирмы'),
  ('legal','contacts', '^Контакты.*$', NULL, '{LegalService,LocalBusiness}', '{address,phone,email,working_hours,map,form}', '{requisites,office_photos}', NULL, 250, 'Контакты + реквизиты')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── finance ──────────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('finance','home',     NULL, '^.{30,60}$', '{FinancialService,Organization}', '{hero,products,licenses,trust,cta}', '{reviews,calculators}', '{FAQPage}', 600, 'Финуслуги: продукты + лицензии + доверие'),
  ('finance','product',  NULL, '^.{30,60}$', '{FinancialProduct,Offer,BreadcrumbList}', '{hero,terms,calculator,price,cta,risks,faq}', '{reviews,documents}', '{FAQPage}', 900, 'Финпродукт: условия, калькулятор, риски обязательны'),
  ('finance','about',    NULL, NULL, '{FinancialService,Organization}', '{history,licenses,team,reports}', '{partners,awards}', NULL, 500, 'О компании + лицензии'),
  ('finance','contacts', NULL, NULL, '{FinancialService,Organization}', '{address,phone,email,offices,form}', '{map,working_hours}', NULL, 200, 'Контакты + офисы')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── realestate ───────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('realestate','home',     NULL, '^.{30,60}$', '{RealEstateAgent,Organization,LocalBusiness}', '{search,featured_listings,categories,cta}', '{about,reviews}', NULL, 300, 'Недвижимость: поиск + ТОП-объекты'),
  ('realestate','category', NULL, '^.{30,60}$', '{BreadcrumbList,CollectionPage}', '{filters,listings_grid,map,pagination}', '{seo_text}', NULL, 300, 'Категория: фильтры + карта + сетка'),
  ('realestate','listing',  NULL, '^.{30,60}$', '{Residence,Offer,BreadcrumbList}', '{gallery,price,characteristics,description,location_map,cta}', '{similar,agent_card}', NULL, 400, 'Объект: галерея, цена, характеристики, карта'),
  ('realestate','contacts', '^Контакты.*$', NULL, '{RealEstateAgent,LocalBusiness}', '{address,phone,email,offices,form}', '{agents}', NULL, 200, 'Контакты агентства')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── hospitality ──────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('hospitality','home',     NULL, '^.{30,60}$', '{Hotel,Restaurant,LocalBusiness}', '{hero,gallery,offers,booking_cta,location,trust}', '{reviews,events}', '{Review,AggregateRating}', 500, 'Отель/ресторан: hero + бронь выше первого экрана'),
  ('hospitality','rooms',    '^(Номера|Меню).*', NULL, '{Hotel,Menu}', '{items_grid,prices,booking_cta}', '{filters}', NULL, 300, 'Номера / меню'),
  ('hospitality','room',     NULL, '^.{30,60}$', '{HotelRoom,Offer,BreadcrumbList}', '{gallery,description,amenities,price,booking_cta}', '{nearby}', NULL, 250, 'Карточка номера/блюда'),
  ('hospitality','contacts', '^(Контакты|Бронирование).*', NULL, '{Hotel,LocalBusiness,Restaurant}', '{address,phone,email,booking_form,map,working_hours}', '{transfer}', NULL, 200, 'Контакты + бронь')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── events ───────────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('events','home',     NULL, '^.{30,60}$', '{Organization,WebSite}', '{hero,upcoming_events,categories,cta}', '{popular,past_events}', NULL, 200, 'Главная событий'),
  ('events','category', NULL, '^.{30,60}$', '{BreadcrumbList,CollectionPage}', '{filters,events_list,date_picker}', '{seo_text}', NULL, 200, 'Категория событий'),
  ('events','event',    NULL, '^.{30,60}$', '{Event,Offer,EventVenue,BreadcrumbList}', '{hero,date_time,venue,description,price,buy_cta}', '{lineup,similar}', NULL, 400, 'Событие: дата, место, цена, кнопка купить'),
  ('events','contacts', NULL, NULL, '{Organization}', '{email,form,phone}', '{partners}', NULL, 150, 'Контакты организаторов')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── nonprofit ────────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('nonprofit','home',     NULL, '^.{30,60}$', '{NGO,Organization,DonateAction}', '{mission,impact_numbers,projects,donate_cta,trust}', '{news,partners}', NULL, 500, 'НКО: миссия + impact + кнопка пожертвовать'),
  ('nonprofit','projects', '^(Проекты|Программы).*', NULL, '{Article,Project}', '{projects_list,filters}', '{donate_cta}', NULL, 300, 'Проекты'),
  ('nonprofit','reports',  '^(Отчёты|Документы).*', NULL, '{Organization}', '{reports_list,download_links}', NULL, NULL, 200, 'Отчётность (transparency)'),
  ('nonprofit','contacts', NULL, NULL, '{Organization,NGO}', '{address,phone,email,form,requisites}', '{volunteers}', NULL, 200, 'Контакты + реквизиты')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── gov ──────────────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('gov','home',     NULL, '^.{30,60}$', '{GovernmentOrganization,Organization}', '{hero,services_grid,news,announcements,contacts}', '{documents,events}', NULL, 400, 'Госсайт: услуги + новости + объявления'),
  ('gov','service',  NULL, '^.{30,60}$', '{Service,GovernmentService,BreadcrumbList}', '{description,who_can_apply,how_to_apply,documents,deadlines,faq}', '{related,contacts}', '{FAQPage}', 600, 'Госуслуга: описание + порядок + документы'),
  ('gov','documents','^(Документы|Нормативные акты).*', NULL, '{Organization}', '{documents_list,filters,search}', NULL, NULL, 200, 'Реестр документов'),
  ('gov','contacts', NULL, NULL, '{GovernmentOrganization}', '{address,phone,email,working_hours,reception_schedule,map}', '{officials}', NULL, 200, 'Контакты + приёмные часы')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;

-- ─── portfolio ────────────────────────────────────────────────
INSERT INTO formula_page_contracts (project_type_code, page_type, required_h1_pattern, required_title_pattern, required_schemas, required_blocks, recommended_blocks, recommended_schemas, min_word_count, notes_ru)
VALUES
  ('portfolio','home',     NULL, '^.{30,60}$', '{Person,Organization}', '{hero,featured_works,about,cta}', '{services,clients,testimonials}', NULL, 300, 'Портфолио: визитка + лучшие работы'),
  ('portfolio','works',    '^(Работы|Портфолио).*', NULL, '{CreativeWork}', '{works_grid,filters}', NULL, NULL, 200, 'Сетка работ'),
  ('portfolio','work',     NULL, '^.{30,60}$', '{CreativeWork,BreadcrumbList}', '{hero,description,gallery,role,client,year}', '{similar,cta}', NULL, 300, 'Кейс портфолио'),
  ('portfolio','contacts', NULL, NULL, '{Person,Organization}', '{email,form,social_links}', '{phone,location}', NULL, 100, 'Контакты автора/студии')
ON CONFLICT (project_type_code, page_type, version) DO NOTHING;
