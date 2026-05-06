-- =============================================================
-- Migration 020a — Seed JSON-LD schema templates.
-- =============================================================
-- Each template is a JSON-LD object with {{placeholder}} tokens
-- that the blueprint builder fills from session answers.
-- =============================================================

-- ─── LocalBusiness ────────────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'LocalBusiness', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": "{{business_name}}",
    "url": "{{site_url}}",
    "telephone": "{{phone}}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "{{street}}",
      "addressLocality": "{{city}}",
      "postalCode": "{{postal_code}}",
      "addressCountry": "{{country}}"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": "{{latitude}}",
      "longitude": "{{longitude}}"
    },
    "openingHoursSpecification": "{{opening_hours}}",
    "priceRange": "{{price_range}}",
    "image": "{{logo_url}}"
  }'::jsonb,
  ARRAY['business_name','site_url','phone','street','city','country'],
  ARRAY['postal_code','latitude','longitude','opening_hours','price_range','logo_url'],
  'Локальный бизнес с физическим адресом'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── Service ──────────────────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'Service', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "Service",
    "serviceType": "{{service_type}}",
    "name": "{{service_name}}",
    "description": "{{service_description}}",
    "provider": {
      "@type": "Organization",
      "name": "{{business_name}}",
      "url": "{{site_url}}"
    },
    "areaServed": "{{area_served}}",
    "offers": {
      "@type": "Offer",
      "price": "{{price}}",
      "priceCurrency": "{{currency}}"
    }
  }'::jsonb,
  ARRAY['service_type','service_name','service_description','business_name','site_url'],
  ARRAY['area_served','price','currency'],
  'Конкретная услуга с описанием и ценой'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── FAQPage ──────────────────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'FAQPage', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": "{{faq_items}}"
  }'::jsonb,
  ARRAY['faq_items'],
  ARRAY[]::TEXT[],
  'FAQ-блок (массив Question/Answer)'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── BreadcrumbList ───────────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'BreadcrumbList', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": "{{breadcrumb_items}}"
  }'::jsonb,
  ARRAY['breadcrumb_items'],
  ARRAY[]::TEXT[],
  'Хлебные крошки (Home > Категория > Страница)'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── Organization ─────────────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'Organization', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "{{business_name}}",
    "url": "{{site_url}}",
    "logo": "{{logo_url}}",
    "sameAs": "{{social_links}}",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": "{{phone}}",
      "contactType": "customer service",
      "email": "{{email}}",
      "availableLanguage": "{{languages}}"
    }
  }'::jsonb,
  ARRAY['business_name','site_url'],
  ARRAY['logo_url','social_links','phone','email','languages'],
  'Базовая Organization для шапки/футера сайта'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── Article ──────────────────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'Article', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "{{title}}",
    "description": "{{description}}",
    "image": "{{image_url}}",
    "author": {
      "@type": "Person",
      "name": "{{author_name}}",
      "url": "{{author_url}}"
    },
    "publisher": {
      "@type": "Organization",
      "name": "{{business_name}}",
      "logo": {
        "@type": "ImageObject",
        "url": "{{logo_url}}"
      }
    },
    "datePublished": "{{date_published}}",
    "dateModified": "{{date_modified}}",
    "mainEntityOfPage": "{{page_url}}"
  }'::jsonb,
  ARRAY['title','description','author_name','business_name','date_published','page_url'],
  ARRAY['image_url','author_url','logo_url','date_modified'],
  'Статья (медиа, блог)'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── Product ──────────────────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'Product', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "{{product_name}}",
    "description": "{{product_description}}",
    "image": "{{image_url}}",
    "sku": "{{sku}}",
    "brand": {
      "@type": "Brand",
      "name": "{{brand}}"
    },
    "offers": {
      "@type": "Offer",
      "url": "{{page_url}}",
      "priceCurrency": "{{currency}}",
      "price": "{{price}}",
      "availability": "{{availability}}",
      "itemCondition": "https://schema.org/NewCondition"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "{{rating}}",
      "reviewCount": "{{review_count}}"
    }
  }'::jsonb,
  ARRAY['product_name','product_description','price','currency','page_url'],
  ARRAY['image_url','sku','brand','availability','rating','review_count'],
  'Товар интернет-магазина'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── ProfessionalService ──────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'ProfessionalService', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    "name": "{{business_name}}",
    "url": "{{site_url}}",
    "telephone": "{{phone}}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "{{street}}",
      "addressLocality": "{{city}}",
      "addressCountry": "{{country}}"
    },
    "priceRange": "{{price_range}}"
  }'::jsonb,
  ARRAY['business_name','site_url','phone','city','country'],
  ARRAY['street','price_range'],
  'Профессиональная услуга (юрист, консультант)'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── MedicalBusiness ──────────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'MedicalBusiness', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "MedicalBusiness",
    "name": "{{business_name}}",
    "url": "{{site_url}}",
    "telephone": "{{phone}}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "{{street}}",
      "addressLocality": "{{city}}",
      "addressCountry": "{{country}}"
    },
    "medicalSpecialty": "{{specialty}}",
    "openingHoursSpecification": "{{opening_hours}}"
  }'::jsonb,
  ARRAY['business_name','site_url','phone','city','country','specialty'],
  ARRAY['street','opening_hours'],
  'Медицинская организация / клиника'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── SoftwareApplication ──────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'SoftwareApplication', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "{{app_name}}",
    "applicationCategory": "{{category}}",
    "operatingSystem": "{{os}}",
    "offers": {
      "@type": "Offer",
      "price": "{{price}}",
      "priceCurrency": "{{currency}}"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "{{rating}}",
      "reviewCount": "{{review_count}}"
    }
  }'::jsonb,
  ARRAY['app_name','category'],
  ARRAY['os','price','currency','rating','review_count'],
  'SaaS / web-приложение'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── Course ───────────────────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'Course', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "Course",
    "name": "{{course_name}}",
    "description": "{{course_description}}",
    "provider": {
      "@type": "EducationalOrganization",
      "name": "{{business_name}}",
      "sameAs": "{{site_url}}"
    },
    "offers": {
      "@type": "Offer",
      "price": "{{price}}",
      "priceCurrency": "{{currency}}"
    }
  }'::jsonb,
  ARRAY['course_name','course_description','business_name','site_url'],
  ARRAY['price','currency'],
  'Образовательный курс'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── Event ────────────────────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'Event', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "Event",
    "name": "{{event_name}}",
    "startDate": "{{start_date}}",
    "endDate": "{{end_date}}",
    "eventStatus": "https://schema.org/EventScheduled",
    "eventAttendanceMode": "{{attendance_mode}}",
    "location": {
      "@type": "Place",
      "name": "{{venue_name}}",
      "address": "{{venue_address}}"
    },
    "offers": {
      "@type": "Offer",
      "url": "{{ticket_url}}",
      "price": "{{price}}",
      "priceCurrency": "{{currency}}",
      "availability": "https://schema.org/InStock"
    }
  }'::jsonb,
  ARRAY['event_name','start_date','venue_name'],
  ARRAY['end_date','attendance_mode','venue_address','ticket_url','price','currency'],
  'Событие / мероприятие'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── Hotel ────────────────────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'Hotel', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "Hotel",
    "name": "{{business_name}}",
    "url": "{{site_url}}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "{{street}}",
      "addressLocality": "{{city}}",
      "addressCountry": "{{country}}"
    },
    "starRating": {
      "@type": "Rating",
      "ratingValue": "{{stars}}"
    },
    "priceRange": "{{price_range}}"
  }'::jsonb,
  ARRAY['business_name','site_url','city','country'],
  ARRAY['street','stars','price_range'],
  'Отель'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── Restaurant ───────────────────────────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'Restaurant', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "name": "{{business_name}}",
    "url": "{{site_url}}",
    "telephone": "{{phone}}",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "{{street}}",
      "addressLocality": "{{city}}",
      "addressCountry": "{{country}}"
    },
    "servesCuisine": "{{cuisine}}",
    "priceRange": "{{price_range}}",
    "acceptsReservations": "{{accepts_reservations}}"
  }'::jsonb,
  ARRAY['business_name','site_url','city','country','cuisine'],
  ARRAY['phone','street','price_range','accepts_reservations'],
  'Ресторан / кафе'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;

-- ─── Person (для авторов / экспертов) ─────────────────────────
INSERT INTO formula_schema_templates (schema_type, variant, version, template_json, required_vars, optional_vars, description_ru)
VALUES (
  'Person', 'default', '2.0.0',
  '{
    "@context": "https://schema.org",
    "@type": "Person",
    "name": "{{full_name}}",
    "url": "{{profile_url}}",
    "jobTitle": "{{job_title}}",
    "worksFor": {
      "@type": "Organization",
      "name": "{{business_name}}"
    },
    "sameAs": "{{social_links}}",
    "knowsAbout": "{{expertise}}"
  }'::jsonb,
  ARRAY['full_name','profile_url'],
  ARRAY['job_title','business_name','social_links','expertise'],
  'Персона / автор / эксперт (E-E-A-T)'
) ON CONFLICT (schema_type, variant, version) DO NOTHING;
