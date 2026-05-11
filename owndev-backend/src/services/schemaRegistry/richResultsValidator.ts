/**
 * Rich results validator.
 *
 * Validates a JSON-LD graph against Google Rich Results / Yandex eligibility
 * heuristics. Per-type rules are encoded as data; we do NOT call Google's
 * external API — this is a static, deterministic gate to fail fast.
 *
 * References:
 *   • https://developers.google.com/search/docs/appearance/structured-data
 *   • https://yandex.ru/support/webmaster/schema-org/intro-schema.html
 */
import type {
  SchemaGraphV3,
  SchemaValidationResult,
  GraphValidationResult,
  SchemaValidationError,
} from './types.js';

interface FieldRule {
  path: string;          // dot-notation
  required: boolean;
  type?: 'string' | 'number' | 'array' | 'object';
  min_length?: number;
  max_length?: number;
  // arrays only
  min_items?: number;
  max_items?: number;
  // string format
  url?: boolean;
  iso_date?: boolean;
}

interface TypeRule {
  required_fields: FieldRule[];
  google_rich_required: string[];   // subset of required_fields paths
  yandex_rich_required: string[];
  notes?: string[];
}

const RULES: Record<string, TypeRule> = {
  Organization: {
    required_fields: [
      { path: 'name', required: true, type: 'string', min_length: 2 },
      { path: 'url', required: true, url: true },
    ],
    google_rich_required: ['name', 'url'],
    yandex_rich_required: ['name', 'url'],
  },
  LocalBusiness: {
    required_fields: [
      { path: 'name', required: true, type: 'string', min_length: 2 },
      { path: 'address', required: true, type: 'object' },
      { path: 'telephone', required: false, type: 'string' },
    ],
    google_rich_required: ['name', 'address'],
    yandex_rich_required: ['name', 'address'],
    notes: ['address must contain streetAddress + addressLocality + addressCountry'],
  },
  Service: {
    required_fields: [
      { path: 'name', required: true, type: 'string', min_length: 2 },
      { path: 'provider', required: true, type: 'object' },
    ],
    google_rich_required: ['name', 'provider'],
    yandex_rich_required: ['name'],
  },
  Product: {
    required_fields: [
      { path: 'name', required: true, type: 'string' },
      { path: 'image', required: true },
      { path: 'offers', required: true, type: 'object' },
    ],
    google_rich_required: ['name', 'image', 'offers'],
    yandex_rich_required: ['name', 'offers'],
    notes: ['offers must include price + priceCurrency'],
  },
  FAQPage: {
    required_fields: [
      { path: 'mainEntity', required: true, type: 'array', min_items: 2 },
    ],
    google_rich_required: ['mainEntity'],
    yandex_rich_required: ['mainEntity'],
    notes: ['Each Question must have name + acceptedAnswer.text'],
  },
  BreadcrumbList: {
    required_fields: [
      { path: 'itemListElement', required: true, type: 'array', min_items: 2 },
    ],
    google_rich_required: ['itemListElement'],
    yandex_rich_required: ['itemListElement'],
  },
  Article: {
    required_fields: [
      { path: 'headline', required: true, type: 'string', max_length: 110 },
      { path: 'datePublished', required: true, iso_date: true },
      { path: 'author', required: true, type: 'object' },
      { path: 'publisher', required: true, type: 'object' },
    ],
    google_rich_required: ['headline', 'datePublished', 'author', 'publisher'],
    yandex_rich_required: ['headline', 'datePublished'],
  },
  NewsArticle: {
    required_fields: [
      { path: 'headline', required: true, type: 'string', max_length: 110 },
      { path: 'datePublished', required: true, iso_date: true },
      { path: 'author', required: true },
      { path: 'image', required: true },
    ],
    google_rich_required: ['headline', 'datePublished', 'author', 'image'],
    yandex_rich_required: ['headline', 'datePublished'],
  },
  BlogPosting: {
    required_fields: [
      { path: 'headline', required: true, type: 'string' },
      { path: 'datePublished', required: true, iso_date: true },
      { path: 'author', required: true },
    ],
    google_rich_required: ['headline', 'datePublished', 'author'],
    yandex_rich_required: ['headline', 'datePublished'],
  },
  Event: {
    required_fields: [
      { path: 'name', required: true },
      { path: 'startDate', required: true, iso_date: true },
      { path: 'location', required: true, type: 'object' },
    ],
    google_rich_required: ['name', 'startDate', 'location'],
    yandex_rich_required: ['name', 'startDate'],
  },
  Person: {
    required_fields: [
      { path: 'name', required: true, type: 'string' },
    ],
    google_rich_required: ['name'],
    yandex_rich_required: ['name'],
  },
  WebSite: {
    required_fields: [
      { path: 'name', required: true },
      { path: 'url', required: true, url: true },
    ],
    google_rich_required: ['name', 'url'],
    yandex_rich_required: ['name', 'url'],
  },
  WebPage: {
    required_fields: [
      { path: 'url', required: true, url: true },
      { path: 'name', required: true },
    ],
    google_rich_required: ['url', 'name'],
    yandex_rich_required: ['url', 'name'],
  },
  MobileApplication: {
    required_fields: [
      { path: 'name', required: true, type: 'string', min_length: 2 },
      { path: 'operatingSystem', required: false, type: 'string' },
      { path: 'applicationCategory', required: false, type: 'string' },
    ],
    google_rich_required: ['name'],
    yandex_rich_required: ['name'],
    notes: ['MobileApplication should declare operatingSystem and applicationCategory when available'],
  },
};

// Add aliases for vertical types
RULES.MedicalBusiness = RULES.LocalBusiness;
RULES.LegalService = RULES.LocalBusiness;
RULES.FinancialService = RULES.LocalBusiness;
RULES.Restaurant = RULES.LocalBusiness;
RULES.Hotel = RULES.LocalBusiness;
RULES.RealEstateAgent = RULES.LocalBusiness;
RULES.EducationalOrganization = RULES.Organization;
RULES.GovernmentOrganization = RULES.Organization;
RULES.NGO = RULES.Organization;
RULES.NonprofitOrganization = RULES.Organization;
RULES.SoftwareApplication = RULES.MobileApplication;
RULES.ProfessionalService = RULES.LocalBusiness;
RULES.Physician = RULES.Person;
RULES.Attorney = RULES.Person;

function getByPath(obj: any, path: string): any {
  return path.split('.').reduce((acc, k) => (acc == null ? acc : acc[k]), obj);
}

function isUrl(v: any): boolean {
  if (typeof v !== 'string') return false;
  try { new URL(v); return true; } catch { return false; }
}

function isIsoDate(v: any): boolean {
  if (typeof v !== 'string') return false;
  return /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?(Z|[+-]\d{2}:\d{2})?)?$/.test(v);
}

function validateNode(node: Record<string, any>): SchemaValidationResult {
  const type = node['@type'];
  const errors: SchemaValidationError[] = [];
  const notes: string[] = [];
  const rule = RULES[type];

  if (!rule) {
    return {
      schema_type: type ?? 'Unknown',
      is_valid: true,
      errors: [],
      google_rich_eligible: false,
      yandex_rich_eligible: false,
      notes: [`No validation rule for @type=${type}`],
    };
  }

  for (const f of rule.required_fields) {
    const v = getByPath(node, f.path);
    if (f.required && (v === undefined || v === null || v === '')) {
      errors.push({
        path: f.path,
        message: `Required field "${f.path}" is missing`,
        severity: 'error',
        code: 'required_missing',
      });
      continue;
    }
    if (v === undefined || v === null) continue;
    if (f.type === 'string' && typeof v !== 'string') {
      errors.push({ path: f.path, message: 'Expected string', severity: 'error', code: 'type_mismatch' });
    }
    if (f.type === 'number' && typeof v !== 'number') {
      errors.push({ path: f.path, message: 'Expected number', severity: 'error', code: 'type_mismatch' });
    }
    if (f.type === 'object' && (typeof v !== 'object' || Array.isArray(v))) {
      errors.push({ path: f.path, message: 'Expected object', severity: 'error', code: 'type_mismatch' });
    }
    if (f.type === 'array' && !Array.isArray(v)) {
      errors.push({ path: f.path, message: 'Expected array', severity: 'error', code: 'type_mismatch' });
    }
    if (f.min_length && typeof v === 'string' && v.length < f.min_length) {
      errors.push({ path: f.path, message: `Min length ${f.min_length}`, severity: 'error', code: 'min_length' });
    }
    if (f.max_length && typeof v === 'string' && v.length > f.max_length) {
      errors.push({ path: f.path, message: `Max length ${f.max_length}`, severity: 'warning', code: 'max_length' });
    }
    if (f.min_items && Array.isArray(v) && v.length < f.min_items) {
      errors.push({ path: f.path, message: `Min items ${f.min_items}`, severity: 'error', code: 'min_items' });
    }
    if (f.url && !isUrl(v)) {
      errors.push({ path: f.path, message: 'Invalid URL', severity: 'error', code: 'invalid_url' });
    }
    if (f.iso_date && !isIsoDate(v)) {
      errors.push({ path: f.path, message: 'Invalid ISO date', severity: 'error', code: 'invalid_date' });
    }
  }

  const hasErrors = errors.some((e) => e.severity === 'error');
  const googleOk =
    !hasErrors &&
    rule.google_rich_required.every((p) => getByPath(node, p) != null);
  const yandexOk =
    !hasErrors &&
    rule.yandex_rich_required.every((p) => getByPath(node, p) != null);

  if (rule.notes) notes.push(...rule.notes);

  return {
    schema_type: type,
    is_valid: !hasErrors,
    errors,
    google_rich_eligible: googleOk,
    yandex_rich_eligible: yandexOk,
    notes,
  };
}

export function validateGraph(graph: SchemaGraphV3): GraphValidationResult {
  const per_node = (graph['@graph'] ?? []).map(validateNode);
  const global_errors: SchemaValidationError[] = [];

  if (graph['@context'] !== 'https://schema.org') {
    global_errors.push({
      path: '@context',
      message: '@context must be "https://schema.org"',
      severity: 'error',
      code: 'invalid_context',
    });
  }
  if (!Array.isArray(graph['@graph']) || graph['@graph'].length === 0) {
    global_errors.push({
      path: '@graph',
      message: '@graph must be a non-empty array',
      severity: 'error',
      code: 'empty_graph',
    });
  }

  const is_valid =
    global_errors.length === 0 &&
    per_node.every((r) => r.is_valid);

  return { is_valid, per_node, global_errors };
}

export function validateNodeStandalone(node: Record<string, any>): SchemaValidationResult {
  return validateNode(node);
}
