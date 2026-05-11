/**
 * Vertical variants — recipes mapping a project_type/page_type pair to the
 * required nodes in a Schema.org @graph.
 *
 * The graphBuilder consumes these recipes to assemble the final @graph.
 */
import type { ProjectTypeCodeV3 } from '../../types/formulaV3.js';
import type { VerticalVariant } from './types.js';

export interface GraphRecipe {
  /**
   * Required nodes in graph order. Special tokens:
   *   'org' (Organization), 'website' (WebSite), 'localbusiness'
   *   'webpage' (per-page WebPage node)
   *   'breadcrumb', 'service', 'product', 'faq', 'article', 'event', 'person'
   */
  nodes: string[];
  variant: VerticalVariant;
  rich_eligible_google: boolean;
  rich_eligible_yandex: boolean;
}

const HOME_BASE: GraphRecipe = {
  nodes: ['org', 'website', 'localbusiness'],
  variant: 'default',
  rich_eligible_google: true,
  rich_eligible_yandex: true,
};

const SERVICE_BASE: GraphRecipe = {
  nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb', 'service', 'faq'],
  variant: 'default',
  rich_eligible_google: true,
  rich_eligible_yandex: true,
};

const PRODUCT_BASE: GraphRecipe = {
  nodes: ['org', 'website', 'webpage', 'breadcrumb', 'product', 'faq'],
  variant: 'ecommerce',
  rich_eligible_google: true,
  rich_eligible_yandex: true,
};

const ARTICLE_BASE: GraphRecipe = {
  nodes: ['org', 'website', 'webpage', 'breadcrumb', 'article', 'faq'],
  variant: 'default',
  rich_eligible_google: true,
  rich_eligible_yandex: true,
};

/**
 * recipes[project_code][page_type] → GraphRecipe
 */
export const RECIPES: Record<string, Record<string, GraphRecipe>> = {
  service_geo: {
    home: { ...HOME_BASE, variant: 'default' },
    service: { ...SERVICE_BASE, variant: 'default' },
    'service-geo': { ...SERVICE_BASE, variant: 'default' },
    pricing: SERVICE_BASE,
    contacts: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    article: ARTICLE_BASE,
  },
  service_pro: {
    home: HOME_BASE,
    service: { ...SERVICE_BASE, variant: 'default' },
    pricing: SERVICE_BASE,
    contacts: HOME_BASE,
  },
  service_b2b: {
    home: { nodes: ['org', 'website', 'webpage'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    service: { nodes: ['org', 'website', 'webpage', 'breadcrumb', 'service', 'faq'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  ecommerce: {
    home: { nodes: ['org', 'website', 'webpage'], variant: 'ecommerce', rich_eligible_google: true, rich_eligible_yandex: true },
    category: { nodes: ['org', 'website', 'webpage', 'breadcrumb'], variant: 'ecommerce', rich_eligible_google: true, rich_eligible_yandex: true },
    product: PRODUCT_BASE,
  },
  marketplace: {
    home: { nodes: ['org', 'website', 'webpage'], variant: 'ecommerce', rich_eligible_google: true, rich_eligible_yandex: true },
    category: { nodes: ['org', 'website', 'webpage', 'breadcrumb'], variant: 'ecommerce', rich_eligible_google: true, rich_eligible_yandex: true },
    product: PRODUCT_BASE,
  },
  saas: {
    home: { nodes: ['org', 'website', 'webpage'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    pricing: { nodes: ['org', 'website', 'webpage', 'breadcrumb', 'service', 'faq'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    article: ARTICLE_BASE,
  },
  education: {
    home: { ...HOME_BASE, variant: 'education' },
    course: { nodes: ['org', 'website', 'webpage', 'breadcrumb', 'service', 'faq'], variant: 'education', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  medical: {
    home: { ...HOME_BASE, variant: 'medical' },
    service: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb', 'service', 'faq'], variant: 'medical', rich_eligible_google: true, rich_eligible_yandex: true },
    physician: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb', 'person'], variant: 'medical', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  legal: {
    home: { ...HOME_BASE, variant: 'legal' },
    service: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb', 'service', 'faq'], variant: 'legal', rich_eligible_google: true, rich_eligible_yandex: true },
    attorney: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb', 'person'], variant: 'legal', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  realestate: {
    home: { ...HOME_BASE, variant: 'realestate' },
    listing: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb', 'product', 'faq'], variant: 'realestate', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  // Tier B
  mobile_app: {
    home: { nodes: ['org', 'website', 'webpage', 'mobileapp'], variant: 'mobile_app', rich_eligible_google: true, rich_eligible_yandex: true },
    feature: { nodes: ['org', 'website', 'webpage', 'breadcrumb', 'mobileapp', 'service', 'faq'], variant: 'mobile_app', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  // Tier C
  finance: {
    home: { ...HOME_BASE, variant: 'finance' },
    service: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb', 'service', 'faq'], variant: 'finance', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  hospitality: {
    home: { ...HOME_BASE, variant: 'restaurant' },
    menu: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb', 'service', 'faq'], variant: 'restaurant', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  events: {
    home: { nodes: ['org', 'website', 'webpage'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    event: { nodes: ['org', 'website', 'webpage', 'breadcrumb', 'event', 'faq'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  nonprofit: {
    home: { nodes: ['ngo', 'website', 'webpage'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    about: { nodes: ['ngo', 'website', 'webpage', 'breadcrumb'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    donate: { nodes: ['ngo', 'website', 'webpage', 'breadcrumb', 'faq'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  gov: {
    home: { nodes: ['org', 'website', 'webpage'], variant: 'default', rich_eligible_google: false, rich_eligible_yandex: true },
  },
  portfolio: {
    home: { nodes: ['org', 'website', 'webpage', 'person'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    project: { nodes: ['org', 'website', 'webpage', 'breadcrumb', 'article'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  media: {
    home: { nodes: ['org', 'website', 'webpage'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    article: ARTICLE_BASE,
  },
  blog: {
    home: { nodes: ['org', 'website', 'webpage', 'person'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    article: ARTICLE_BASE,
  },
  // V3-new
  promo_event: {
    home: { nodes: ['org', 'website', 'webpage', 'event', 'faq'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  personal_brand: {
    home: { nodes: ['org', 'website', 'webpage', 'person'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    service: { nodes: ['org', 'website', 'webpage', 'breadcrumb', 'service', 'faq'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    article: ARTICLE_BASE,
  },
  franchise_multi: {
    home: { nodes: ['org', 'website', 'webpage'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    location: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb', 'service', 'faq'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
  },
  b2b_media: {
    home: { nodes: ['org', 'website', 'webpage'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    article: ARTICLE_BASE,
  },
  // PR-10/11: подкатегории локальных услуг — полный блок как у service_geo
  service_pest_control: {
    home: { ...HOME_BASE, variant: 'default' },
    service: { ...SERVICE_BASE, variant: 'default' },
    'service-geo': { ...SERVICE_BASE, variant: 'default' },
    pricing: SERVICE_BASE,
    contacts: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    article: ARTICLE_BASE,
  },
  service_repair_home: {
    home: { ...HOME_BASE, variant: 'default' },
    service: { ...SERVICE_BASE, variant: 'default' },
    'service-geo': { ...SERVICE_BASE, variant: 'default' },
    pricing: SERVICE_BASE,
    contacts: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    article: ARTICLE_BASE,
  },
  service_auto: {
    home: { ...HOME_BASE, variant: 'default' },
    service: { ...SERVICE_BASE, variant: 'default' },
    'service-geo': { ...SERVICE_BASE, variant: 'default' },
    pricing: SERVICE_BASE,
    contacts: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    article: ARTICLE_BASE,
  },
  service_beauty: {
    home: { ...HOME_BASE, variant: 'default' },
    service: { ...SERVICE_BASE, variant: 'default' },
    'service-geo': { ...SERVICE_BASE, variant: 'default' },
    pricing: SERVICE_BASE,
    contacts: { nodes: ['org', 'website', 'localbusiness', 'webpage', 'breadcrumb'], variant: 'default', rich_eligible_google: true, rich_eligible_yandex: true },
    article: ARTICLE_BASE,
  },
};

export function getRecipe(
  projectCode: ProjectTypeCodeV3,
  pageType: string,
): GraphRecipe | null {
  return RECIPES[projectCode]?.[pageType] ?? null;
}

export function listPageTypes(projectCode: ProjectTypeCodeV3): string[] {
  return Object.keys(RECIPES[projectCode] ?? {});
}
