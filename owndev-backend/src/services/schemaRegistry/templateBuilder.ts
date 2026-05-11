/**
 * Schema templates — V3 individual JSON-LD node builders.
 * Every builder accepts a SchemaContext (or a domain-specific context)
 * and returns a Schema.org-compliant node ready to be placed in a @graph.
 */
import type {
  SchemaContext, ServiceContext, ProductContext,
  FaqItem, BreadcrumbItem, ArticleContext, PersonContext, EventContext,
  MobileApplicationContext, NGOContext,
  VerticalVariant,
} from './types.js';

// ─── Organization / LocalBusiness ───────────────────────────
export function buildOrganization(ctx: SchemaContext): Record<string, any> {
  const out: Record<string, any> = {
    '@type': 'Organization',
    '@id': `${stripTrailingSlash(ctx.url)}/#organization`,
    name: ctx.brand_name,
    legalName: ctx.legal_name ?? ctx.brand_name,
    url: ctx.url,
  };
  if (ctx.logo_url) {
    out.logo = {
      '@type': 'ImageObject',
      '@id': `${stripTrailingSlash(ctx.url)}/#logo`,
      url: ctx.logo_url,
    };
  }
  if (ctx.phone || ctx.email) {
    const cp: Record<string, any> = { '@type': 'ContactPoint' };
    if (ctx.phone) cp.telephone = ctx.phone;
    if (ctx.email) cp.email = ctx.email;
    cp.contactType = 'customer service';
    cp.areaServed = 'RU';
    cp.availableLanguage = ['ru', 'en'];
    out.contactPoint = [cp];
  }
  if (ctx.social_profiles && ctx.social_profiles.length) {
    out.sameAs = ctx.social_profiles;
  }
  if (ctx.inn || ctx.ogrn) {
    out.identifier = [
      ctx.inn ? { '@type': 'PropertyValue', name: 'ИНН', value: ctx.inn } : null,
      ctx.ogrn ? { '@type': 'PropertyValue', name: 'ОГРН', value: ctx.ogrn } : null,
    ].filter(Boolean);
  }
  return out;
}

export function buildLocalBusiness(
  ctx: SchemaContext,
  variant: VerticalVariant = 'default',
): Record<string, any> {
  const typeMap: Partial<Record<VerticalVariant, string>> = {
    medical: 'MedicalBusiness',
    legal: 'LegalService',
    restaurant: 'Restaurant',
    hotel: 'Hotel',
    realestate: 'RealEstateAgent',
    finance: 'FinancialService',
    education: 'EducationalOrganization',
    default: 'LocalBusiness',
  };
  const type = typeMap[variant] ?? 'LocalBusiness';

  const out: Record<string, any> = {
    '@type': type,
    '@id': `${stripTrailingSlash(ctx.url)}/#localbusiness`,
    name: ctx.brand_name,
    url: ctx.url,
  };
  if (ctx.phone) out.telephone = ctx.phone;
  if (ctx.email) out.email = ctx.email;
  if (ctx.logo_url) out.image = ctx.logo_url;
  if (ctx.address) {
    out.address = {
      '@type': 'PostalAddress',
      streetAddress: ctx.address.street,
      addressLocality: ctx.address.city,
      addressRegion: ctx.address.region,
      postalCode: ctx.address.postal_code,
      addressCountry: ctx.address.country ?? 'RU',
    };
  }
  if (ctx.geo) {
    out.geo = {
      '@type': 'GeoCoordinates',
      latitude: ctx.geo.latitude,
      longitude: ctx.geo.longitude,
    };
  }
  if (ctx.opening_hours && ctx.opening_hours.length) {
    out.openingHours = ctx.opening_hours;
  }
  if (ctx.price_range) out.priceRange = ctx.price_range;
  return out;
}

// ─── Service ─────────────────────────────────────────────────
export function buildService(
  ctx: ServiceContext,
  providerOrgId: string,
): Record<string, any> {
  const out: Record<string, any> = {
    '@type': 'Service',
    '@id': ctx.service_url ? `${stripTrailingSlash(ctx.service_url)}/#service` : undefined,
    name: ctx.service_name,
    description: ctx.service_description,
    provider: { '@id': providerOrgId },
    url: ctx.service_url,
  };
  if (ctx.area_served && ctx.area_served.length) {
    out.areaServed = ctx.area_served.map((name) => ({ '@type': 'AdministrativeArea', name }));
  }
  if (ctx.category) out.category = ctx.category;
  if (ctx.price) {
    out.offers = {
      '@type': 'Offer',
      price: ctx.price.value,
      priceCurrency: ctx.price.currency,
      availability: 'https://schema.org/InStock',
    };
  } else if (ctx.price_range) {
    out.priceRange = ctx.price_range;
  }
  return removeUndefined(out);
}

// ─── Product ─────────────────────────────────────────────────
export function buildProduct(ctx: ProductContext): Record<string, any> {
  const out: Record<string, any> = {
    '@type': 'Product',
    name: ctx.name,
    description: ctx.description,
    image: ctx.image,
    sku: ctx.sku,
    brand: ctx.brand ? { '@type': 'Brand', name: ctx.brand } : undefined,
  };
  if (ctx.offers.length === 1) {
    const o = ctx.offers[0];
    out.offers = {
      '@type': 'Offer',
      price: o.price,
      priceCurrency: o.currency,
      availability: `https://schema.org/${o.availability ?? 'InStock'}`,
      url: o.url,
    };
  } else if (ctx.offers.length > 1) {
    const prices = ctx.offers.map((o) => o.price);
    out.offers = {
      '@type': 'AggregateOffer',
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      priceCurrency: ctx.offers[0].currency,
      offerCount: ctx.offers.length,
    };
  }
  if (ctx.aggregate_rating) {
    out.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ctx.aggregate_rating.rating_value,
      reviewCount: ctx.aggregate_rating.review_count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return removeUndefined(out);
}

// ─── FAQPage ─────────────────────────────────────────────────
export function buildFaqPage(items: FaqItem[]): Record<string, any> {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((it) => ({
      '@type': 'Question',
      name: it.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: it.answer,
      },
    })),
  };
}

// ─── BreadcrumbList ──────────────────────────────────────────
export function buildBreadcrumb(items: BreadcrumbItem[]): Record<string, any> {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

// ─── Article / NewsArticle / BlogPosting ─────────────────────
export function buildArticle(
  ctx: ArticleContext,
  type: 'Article' | 'NewsArticle' | 'BlogPosting' = 'Article',
): Record<string, any> {
  return removeUndefined({
    '@type': type,
    headline: ctx.headline,
    description: ctx.description,
    image: ctx.image,
    datePublished: ctx.date_published,
    dateModified: ctx.date_modified ?? ctx.date_published,
    author: {
      '@type': 'Person',
      name: ctx.author_name,
      url: ctx.author_url,
    },
    publisher: {
      '@type': 'Organization',
      name: ctx.publisher_name,
      logo: ctx.publisher_logo
        ? { '@type': 'ImageObject', url: ctx.publisher_logo }
        : undefined,
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': ctx.url },
    url: ctx.url,
  });
}

// ─── Person ──────────────────────────────────────────────────
export function buildPerson(ctx: PersonContext): Record<string, any> {
  return removeUndefined({
    '@type': 'Person',
    name: ctx.name,
    jobTitle: ctx.job_title,
    description: ctx.description,
    image: ctx.image,
    url: ctx.url,
    sameAs: ctx.social_profiles && ctx.social_profiles.length ? ctx.social_profiles : undefined,
    worksFor: ctx.works_for ? { '@type': 'Organization', name: ctx.works_for } : undefined,
  });
}

// ─── Event ───────────────────────────────────────────────────
export function buildEvent(ctx: EventContext): Record<string, any> {
  const out: Record<string, any> = {
    '@type': 'Event',
    name: ctx.name,
    startDate: ctx.start_date,
    endDate: ctx.end_date,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: ctx.location_name,
      address: ctx.location_address,
    },
    url: ctx.url,
    description: ctx.description,
  };
  if (ctx.organizer_name) {
    out.organizer = { '@type': 'Organization', name: ctx.organizer_name };
  }
  if (ctx.offer_price !== undefined) {
    out.offers = {
      '@type': 'Offer',
      price: ctx.offer_price,
      priceCurrency: ctx.offer_currency ?? 'RUB',
      availability: 'https://schema.org/InStock',
      url: ctx.url,
    };
  }
  return removeUndefined(out);
}

// ─── MobileApplication ───────────────────────────────────────
export function buildMobileApplication(
  ctx: MobileApplicationContext,
  schemaCtx: SchemaContext,
): Record<string, any> {
  const idBase = stripTrailingSlash(schemaCtx.url);
  const out: Record<string, any> = {
    '@type': 'MobileApplication',
    '@id': `${idBase}/#mobileapp`,
    name: ctx.name,
    description: ctx.description,
    operatingSystem: ctx.operating_system,
    applicationCategory: ctx.application_category,
    applicationSubCategory: ctx.application_sub_category,
    downloadUrl: ctx.download_url,
    installUrl: ctx.install_url,
    screenshot: ctx.screenshot,
    fileSize: ctx.file_size,
    softwareVersion: ctx.software_version,
    inLanguage: ctx.in_languages && ctx.in_languages.length ? ctx.in_languages : undefined,
    publisher: { '@id': `${idBase}/#organization` },
  };
  if (ctx.price) {
    out.offers = {
      '@type': 'Offer',
      price: ctx.price.value,
      priceCurrency: ctx.price.currency,
      availability: 'https://schema.org/InStock',
    };
  }
  if (ctx.aggregate_rating) {
    out.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: ctx.aggregate_rating.rating_value,
      reviewCount: ctx.aggregate_rating.review_count,
      bestRating: 5,
      worstRating: 1,
    };
  }
  return removeUndefined(out);
}

// ─── NGO (NonprofitOrganization) ─────────────────────────────
export function buildNGO(
  schemaCtx: SchemaContext,
  ngoCtx: NGOContext = {},
): Record<string, any> {
  const idBase = stripTrailingSlash(schemaCtx.url);
  const out: Record<string, any> = {
    '@type': 'NGO',
    '@id': `${idBase}/#ngo`,
    name: ngoCtx.name ?? schemaCtx.brand_name,
    legalName: ngoCtx.legal_name ?? schemaCtx.legal_name ?? schemaCtx.brand_name,
    description: ngoCtx.description,
    url: schemaCtx.url,
  };
  if (schemaCtx.logo_url) {
    out.logo = {
      '@type': 'ImageObject',
      url: schemaCtx.logo_url,
    };
  }
  if (schemaCtx.address) {
    out.address = {
      '@type': 'PostalAddress',
      streetAddress: schemaCtx.address.street,
      addressLocality: schemaCtx.address.city,
      addressRegion: schemaCtx.address.region,
      postalCode: schemaCtx.address.postal_code,
      addressCountry: schemaCtx.address.country ?? 'RU',
    };
  }
  if (schemaCtx.phone || schemaCtx.email) {
    const cp: Record<string, any> = { '@type': 'ContactPoint', contactType: 'customer service' };
    if (schemaCtx.phone) cp.telephone = schemaCtx.phone;
    if (schemaCtx.email) cp.email = schemaCtx.email;
    cp.areaServed = 'RU';
    cp.availableLanguage = ['ru', 'en'];
    out.contactPoint = [cp];
  }
  if (schemaCtx.social_profiles && schemaCtx.social_profiles.length) {
    out.sameAs = schemaCtx.social_profiles;
  }
  if (ngoCtx.tax_id || schemaCtx.inn || schemaCtx.ogrn) {
    out.identifier = [
      ngoCtx.tax_id ? { '@type': 'PropertyValue', name: 'taxID', value: ngoCtx.tax_id } : null,
      schemaCtx.inn ? { '@type': 'PropertyValue', name: 'ИНН', value: schemaCtx.inn } : null,
      schemaCtx.ogrn ? { '@type': 'PropertyValue', name: 'ОГРН', value: schemaCtx.ogrn } : null,
    ].filter(Boolean);
  }
  if (ngoCtx.nonprofit_status) out.nonprofitStatus = ngoCtx.nonprofit_status;
  if (ngoCtx.founder) out.founder = { '@type': 'Person', name: ngoCtx.founder };
  if (ngoCtx.founding_date) out.foundingDate = ngoCtx.founding_date;
  if (ngoCtx.funder && ngoCtx.funder.length) {
    out.funder = ngoCtx.funder.map((name) => ({ '@type': 'Organization', name }));
  }
  if (ngoCtx.area_served && ngoCtx.area_served.length) {
    out.areaServed = ngoCtx.area_served.map((name) => ({ '@type': 'AdministrativeArea', name }));
  }
  if (ngoCtx.knows_about && ngoCtx.knows_about.length) {
    out.knowsAbout = ngoCtx.knows_about;
  }
  return removeUndefined(out);
}

// ─── WebSite (sitelinks search box) ──────────────────────────
export function buildWebSite(ctx: SchemaContext): Record<string, any> {
  const idBase = stripTrailingSlash(ctx.url);
  return {
    '@type': 'WebSite',
    '@id': `${idBase}/#website`,
    url: ctx.url,
    name: ctx.brand_name,
    publisher: { '@id': `${idBase}/#organization` },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${idBase}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
    inLanguage: 'ru',
  };
}

export function buildWebPage(
  ctx: SchemaContext,
  pageUrl: string,
  pageName: string,
  description: string,
): Record<string, any> {
  const idBase = stripTrailingSlash(ctx.url);
  return {
    '@type': 'WebPage',
    '@id': `${pageUrl}#webpage`,
    url: pageUrl,
    name: pageName,
    description,
    isPartOf: { '@id': `${idBase}/#website` },
    inLanguage: 'ru',
  };
}

// ─── Helpers ─────────────────────────────────────────────────
function stripTrailingSlash(url: string): string {
  return url.replace(/\/+$/, '');
}

function removeUndefined<T extends Record<string, any>>(o: T): T {
  const out: any = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === undefined) continue;
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const cleaned = removeUndefined(v);
      if (Object.keys(cleaned).length > 0) out[k] = cleaned;
    } else {
      out[k] = v;
    }
  }
  return out;
}
