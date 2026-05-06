/**
 * services/schemaRegistry — V3 types.
 *
 * Schema Registry is the single source of truth for JSON-LD generation:
 *   • templates (per schema_type + vertical_variant)
 *   • graph builder (assembles @graph from a vertical recipe)
 *   • rich-results validator (Google + Yandex eligibility)
 */

export interface SchemaContext {
  brand_name: string;
  legal_name?: string;
  url: string;
  logo_url?: string;
  phone?: string;
  email?: string;
  address?: {
    street: string;
    city: string;
    region?: string;
    postal_code?: string;
    country?: string;
  };
  geo?: {
    latitude: number;
    longitude: number;
  };
  social_profiles?: string[];
  inn?: string;
  ogrn?: string;
  opening_hours?: string[];     // ['Mo-Fr 09:00-18:00']
  price_range?: string;         // '$$' | '$$$'
}

export interface ServiceContext {
  service_name: string;
  service_description?: string;
  service_url?: string;
  area_served?: string[];       // ['Москва','МО']
  price?: { value: number; currency: string };
  price_range?: string;
  category?: string;
}

export interface ProductContext {
  name: string;
  description?: string;
  image?: string;
  sku?: string;
  brand?: string;
  offers: Array<{
    price: number;
    currency: string;
    availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
    url?: string;
  }>;
  aggregate_rating?: { rating_value: number; review_count: number };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface ArticleContext {
  headline: string;
  description?: string;
  image?: string;
  date_published: string;
  date_modified?: string;
  author_name: string;
  author_url?: string;
  publisher_name: string;
  publisher_logo?: string;
  url: string;
}

export interface PersonContext {
  name: string;
  job_title?: string;
  description?: string;
  image?: string;
  url?: string;
  social_profiles?: string[];
  works_for?: string;
}

export interface EventContext {
  name: string;
  start_date: string;       // ISO
  end_date?: string;
  location_name: string;
  location_address?: string;
  url?: string;
  description?: string;
  organizer_name?: string;
  offer_price?: number;
  offer_currency?: string;
}

// ─── Schema graph ────────────────────────────────────────────

export type SchemaTypeName =
  | 'Organization' | 'LocalBusiness' | 'ProfessionalService'
  | 'MedicalBusiness' | 'LegalService' | 'FinancialService'
  | 'RealEstateAgent' | 'Hotel' | 'Restaurant'
  | 'EducationalOrganization' | 'GovernmentOrganization' | 'NGO'
  | 'Service' | 'Product' | 'Offer' | 'AggregateOffer'
  | 'Article' | 'NewsArticle' | 'BlogPosting'
  | 'FAQPage' | 'BreadcrumbList'
  | 'Person' | 'SoftwareApplication' | 'MobileApplication'
  | 'Course' | 'Event' | 'EventVenue' | 'Physician'
  | 'Attorney' | 'WebSite' | 'WebPage' | 'CreativeWork' | 'Menu' | 'Residence';

export interface SchemaGraphV3 {
  '@context': 'https://schema.org';
  '@graph': Array<Record<string, any>>;
}

export type VerticalVariant =
  | 'default'
  | 'medical'
  | 'legal'
  | 'restaurant'
  | 'hotel'
  | 'realestate'
  | 'education'
  | 'finance'
  | 'ecommerce'
  | 'mobile_app';

// ─── Validation ──────────────────────────────────────────────

export interface SchemaValidationError {
  path: string;          // dot-notation
  message: string;
  severity: 'error' | 'warning';
  code: string;
}

export interface SchemaValidationResult {
  schema_type: string;
  is_valid: boolean;
  errors: SchemaValidationError[];
  google_rich_eligible: boolean;
  yandex_rich_eligible: boolean;
  notes: string[];
}

export interface GraphValidationResult {
  is_valid: boolean;
  per_node: SchemaValidationResult[];
  global_errors: SchemaValidationError[];
}
