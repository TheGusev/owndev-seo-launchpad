/**
 * Graph builder — assembles the final JSON-LD @graph for a given page from
 * a recipe (verticalVariants.ts) + per-node contexts (templateBuilder.ts).
 */
import type { ProjectTypeCodeV3 } from '../../types/formulaV3.js';
import { getRecipe } from './verticalVariants.js';
import {
  buildOrganization,
  buildLocalBusiness,
  buildWebSite,
  buildWebPage,
  buildService,
  buildProduct,
  buildFaqPage,
  buildBreadcrumb,
  buildArticle,
  buildPerson,
  buildEvent,
} from './templateBuilder.js';
import type {
  SchemaContext, ServiceContext, ProductContext,
  FaqItem, BreadcrumbItem, ArticleContext, PersonContext, EventContext,
  SchemaGraphV3,
} from './types.js';

export interface GraphBuildInput {
  project_code: ProjectTypeCodeV3;
  page_type: string;
  page_url: string;
  page_name: string;
  page_description: string;
  schema_ctx: SchemaContext;

  // Optional per-page contexts; presence depends on recipe
  service_ctx?: ServiceContext;
  product_ctx?: ProductContext;
  faq_items?: FaqItem[];
  breadcrumb_items?: BreadcrumbItem[];
  article_ctx?: ArticleContext;
  person_ctx?: PersonContext;
  event_ctx?: EventContext;
}

export interface GraphBuildResult {
  graph: SchemaGraphV3;
  recipe_nodes: string[];
  variant: string;
  rich_eligible_google: boolean;
  rich_eligible_yandex: boolean;
  warnings: string[];
}

export function buildGraph(input: GraphBuildInput): GraphBuildResult {
  const recipe = getRecipe(input.project_code, input.page_type);
  const warnings: string[] = [];

  if (!recipe) {
    warnings.push(
      `No recipe for ${input.project_code}/${input.page_type} — falling back to minimal Org+WebSite+WebPage`,
    );
  }

  const nodes = recipe?.nodes ?? ['org', 'website', 'webpage'];
  const variant = recipe?.variant ?? 'default';
  const orgId = `${stripSlash(input.schema_ctx.url)}/#organization`;

  const graph: Array<Record<string, any>> = [];

  for (const node of nodes) {
    switch (node) {
      case 'org':
        graph.push(buildOrganization(input.schema_ctx));
        break;
      case 'website':
        graph.push(buildWebSite(input.schema_ctx));
        break;
      case 'localbusiness':
        graph.push(buildLocalBusiness(input.schema_ctx, variant as any));
        break;
      case 'webpage':
        graph.push(
          buildWebPage(input.schema_ctx, input.page_url, input.page_name, input.page_description),
        );
        break;
      case 'breadcrumb':
        if (input.breadcrumb_items && input.breadcrumb_items.length > 0) {
          graph.push(buildBreadcrumb(input.breadcrumb_items));
        } else {
          warnings.push('breadcrumb requested but no breadcrumb_items provided');
        }
        break;
      case 'service':
        if (input.service_ctx) {
          graph.push(buildService(input.service_ctx, orgId));
        } else {
          warnings.push('service requested but no service_ctx provided');
        }
        break;
      case 'product':
        if (input.product_ctx) {
          graph.push(buildProduct(input.product_ctx));
        } else {
          warnings.push('product requested but no product_ctx provided');
        }
        break;
      case 'faq':
        if (input.faq_items && input.faq_items.length >= 2) {
          graph.push(buildFaqPage(input.faq_items));
        } else {
          warnings.push('FAQ requested but fewer than 2 items provided');
        }
        break;
      case 'article':
        if (input.article_ctx) {
          const t =
            input.project_code === 'media' || input.project_code === 'b2b_media'
              ? 'NewsArticle'
              : input.project_code === 'blog'
                ? 'BlogPosting'
                : 'Article';
          graph.push(buildArticle(input.article_ctx, t));
        } else {
          warnings.push('article requested but no article_ctx provided');
        }
        break;
      case 'person':
        if (input.person_ctx) {
          graph.push(buildPerson(input.person_ctx));
        } else {
          warnings.push('person requested but no person_ctx provided');
        }
        break;
      case 'event':
        if (input.event_ctx) {
          graph.push(buildEvent(input.event_ctx));
        } else {
          warnings.push('event requested but no event_ctx provided');
        }
        break;
      default:
        warnings.push(`Unknown recipe node: ${node}`);
    }
  }

  return {
    graph: { '@context': 'https://schema.org', '@graph': graph },
    recipe_nodes: nodes,
    variant,
    rich_eligible_google: recipe?.rich_eligible_google ?? false,
    rich_eligible_yandex: recipe?.rich_eligible_yandex ?? false,
    warnings,
  };
}

function stripSlash(s: string): string {
  return s.replace(/\/+$/, '');
}

/**
 * Render the graph as a <script type="application/ld+json"> tag string.
 */
export function renderGraphScript(graph: SchemaGraphV3, pretty = true): string {
  const json = JSON.stringify(graph, null, pretty ? 2 : 0);
  return `<script type="application/ld+json">\n${json}\n</script>`;
}
