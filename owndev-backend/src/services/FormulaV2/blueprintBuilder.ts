/**
 * BlueprintBuilder v2 — orchestrates build of a complete site blueprint.
 *
 * Pipeline:
 *   1. classifyProjectType()   — pick one of 19 verticals
 *   2. listPageContracts()     — load contract set for that vertical
 *   3. for each contract:
 *        - render H1/Title/Meta templates
 *        - render required JSON-LD schemas
 *        - assemble BlueprintPagePlan
 *   4. generate llms.txt, robots.txt, sitemap.xml
 *   5. runPreflight() — gate at score >= 90
 */
import type {
  IntakeAnswers,
} from './intake.js';
import type {
  BlueprintV2,
  BlueprintPagePlan,
  PageContract,
  ProjectType,
} from '../../types/formulaV2.js';
import { classifyProjectType } from './intake.js';
import { listPageContracts } from './repository.js';
import { renderManySchemas } from './schemaRegistry.js';
import {
  generateLlmsTxt,
  generateRobotsTxt,
  generateSitemapXml,
  pagePlanToLlmsTxtPages,
} from './llmsGenerator.js';
import { runPreflight } from './preflight.js';

export const ENGINE_VERSION = '2.0.0';

export interface BuildContext extends IntakeAnswers {
  // Required for templates
  business_name: string;
  site_url: string;
  short_description: string;
  // Optional — used to fill schema templates
  long_description?: string;
  phone?: string;
  email?: string;
  street?: string;
  city?: string;
  postal_code?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  opening_hours?: string;
  price_range?: string;
  logo_url?: string;
  social_links?: string[];
  languages?: string[];
  ai_bots_policy?: 'allow' | 'disallow' | 'mixed';
}

// ─── H1 / Title / Meta defaults per page_type ─────────────────
const TEMPLATE_DEFAULTS: Record<
  string,
  { h1: string; title: string; meta: string; url: string }
> = {
  home:      { h1: '{{business_name}} — {{short_description}}', title: '{{business_name}} — {{short_description}}', meta: '{{short_description}}. {{long_description}} Звоните {{phone}}.', url: '/' },
  category:  { h1: '{{category_name}}', title: '{{category_name}} — {{business_name}}', meta: '{{category_name}}: {{short_description}}. Цены, описание, отзывы. {{phone}}.', url: '/{{category_slug}}' },
  service:   { h1: '{{service_name}} в {{city}}', title: '{{service_name}} в {{city}} — {{business_name}}', meta: '{{service_name}} в {{city}}. {{short_description}}. Звоните {{phone}}.', url: '/{{service_slug}}' },
  product:   { h1: '{{product_name}}', title: '{{product_name}} — купить в {{business_name}}', meta: 'Купить {{product_name}} в {{business_name}}. Доставка {{city}}. {{phone}}.', url: '/product/{{product_slug}}' },
  article:   { h1: '{{title}}', title: '{{title}} — {{business_name}}', meta: '{{description}}', url: '/blog/{{slug}}' },
  about:     { h1: 'О компании {{business_name}}', title: 'О компании {{business_name}} — история, команда', meta: 'О компании {{business_name}}: история, команда, ценности, лицензии.', url: '/about' },
  contacts:  { h1: 'Контакты {{business_name}}', title: 'Контакты {{business_name}} — адрес, телефон', meta: 'Контакты {{business_name}}: адрес {{street}}, {{city}}. Телефон {{phone}}.', url: '/contacts' },
  team:      { h1: 'Команда {{business_name}}', title: 'Команда {{business_name}} — наши специалисты', meta: 'Специалисты {{business_name}}: команда экспертов, опыт работы, квалификация.', url: '/team' },
  doctors:   { h1: 'Наши врачи', title: 'Врачи {{business_name}} — квалифицированные специалисты', meta: 'Врачи клиники {{business_name}}: квалификация, опыт, специализация. Запись по {{phone}}.', url: '/doctors' },
  doctor:    { h1: '{{doctor_name}}, {{specialty}}', title: '{{doctor_name}} — {{specialty}} | {{business_name}}', meta: '{{doctor_name}} — {{specialty}} клиники {{business_name}}. Опыт {{experience}}. Запись {{phone}}.', url: '/doctors/{{doctor_slug}}' },
  cases:     { h1: 'Кейсы {{business_name}}', title: 'Кейсы и истории успеха {{business_name}}', meta: 'Реальные кейсы {{business_name}}: проблемы клиентов и наши решения с цифрами.', url: '/cases' },
  features:  { h1: 'Возможности {{business_name}}', title: 'Возможности {{business_name}} — все функции', meta: 'Все возможности {{business_name}}. Подробное описание функций и преимуществ.', url: '/features' },
  pricing:   { h1: 'Тарифы и цены', title: 'Тарифы {{business_name}} — выберите подходящий план', meta: 'Тарифы {{business_name}}. Сравнение планов, цены, скидки.', url: '/pricing' },
  docs:      { h1: 'Документация', title: 'Документация {{business_name}} — руководство для разработчиков', meta: 'Полная документация {{business_name}}. API, гайды, примеры кода.', url: '/docs' },
  support:   { h1: 'Поддержка и FAQ', title: 'Поддержка {{business_name}} — FAQ и помощь', meta: 'Ответы на частые вопросы и форма для связи с поддержкой {{business_name}}.', url: '/support' },
  section:   { h1: '{{section_name}}', title: '{{section_name}} — {{business_name}}', meta: 'Все материалы раздела «{{section_name}}» на {{business_name}}.', url: '/section/{{section_slug}}' },
  rooms:     { h1: 'Номера и цены', title: 'Номера {{business_name}} — забронировать', meta: 'Номера в {{business_name}}: типы, цены, удобства. Бронирование онлайн.', url: '/rooms' },
  room:      { h1: '{{room_name}}', title: '{{room_name}} — {{business_name}}', meta: '{{room_name}} в {{business_name}}: описание, удобства, цена. Бронирование.', url: '/rooms/{{room_slug}}' },
  event:     { h1: '{{event_name}}', title: '{{event_name}} — купить билеты', meta: '{{event_name}} в {{city}} — {{date}}. Купить билеты онлайн.', url: '/events/{{event_slug}}' },
  listing:   { h1: '{{listing_title}}', title: '{{listing_title}} — {{business_name}}', meta: '{{listing_title}}: характеристики, фото, цена. {{phone}}.', url: '/listing/{{listing_slug}}' },
  seller:    { h1: '{{seller_name}}', title: '{{seller_name}} — {{business_name}}', meta: 'Профиль продавца {{seller_name}}: рейтинг, товары, отзывы.', url: '/sellers/{{seller_slug}}' },
  works:     { h1: 'Портфолио работ', title: 'Портфолио {{business_name}} — наши работы', meta: 'Портфолио {{business_name}}: реализованные проекты с описанием.', url: '/works' },
  work:      { h1: '{{work_title}}', title: '{{work_title}} — {{business_name}}', meta: '{{work_title}}: описание проекта, роль, клиент, год.', url: '/works/{{work_slug}}' },
  projects:  { h1: 'Проекты {{business_name}}', title: 'Проекты {{business_name}} — программы и активности', meta: 'Все проекты и программы {{business_name}}. Помогите вместе с нами.', url: '/projects' },
  reports:   { h1: 'Отчёты {{business_name}}', title: 'Отчёты {{business_name}} — финансовая прозрачность', meta: 'Финансовые отчёты {{business_name}}: годовые отчёты, использование средств.', url: '/reports' },
  documents: { h1: 'Документы', title: 'Документы и нормативные акты — {{business_name}}', meta: 'Реестр документов {{business_name}}: нормативные акты, регламенты.', url: '/documents' },
};

function getTemplate(pageType: string) {
  return TEMPLATE_DEFAULTS[pageType] ?? {
    h1: `{{${pageType}_title}}`,
    title: `{{${pageType}_title}} — {{business_name}}`,
    meta: `Страница «${pageType}» сайта {{business_name}}.`,
    url: `/${pageType}`,
  };
}

function buildPagePlan(contract: PageContract): BlueprintPagePlan {
  const tpl = getTemplate(contract.page_type);
  return {
    page_type: contract.page_type,
    url_pattern: tpl.url,
    examples: [tpl.url.replace(/\{\{[^}]+\}\}/g, 'example')],
    contract_id: contract.id,
    h1_template: tpl.h1,
    title_template: tpl.title,
    meta_description_template: tpl.meta,
    required_schemas: [...contract.required_schemas],
    required_blocks: [...contract.required_blocks],
    recommended_blocks: [...contract.recommended_blocks],
    notes_ru: contract.notes_ru,
  };
}

export async function buildBlueprintV2(ctx: BuildContext): Promise<BlueprintV2> {
  // 1. Classify
  const classification = await classifyProjectType(ctx);
  const projectType: ProjectType = classification.project_type;

  // 2. Load contracts
  const contracts = await listPageContracts(projectType.code);
  if (contracts.length === 0) {
    throw new Error(
      `No page contracts seeded for project_type=${projectType.code}. Run migrate.`,
    );
  }

  // 3. Page plans
  const pages = contracts.map(buildPagePlan);

  // 4. Global schemas (Organization is always rendered, plus type-required)
  const globalSchemaTypes = Array.from(
    new Set([
      'Organization',
      ...projectType.required_schemas.filter((t) =>
        ['Organization', 'LocalBusiness', 'ProfessionalService', 'MedicalBusiness', 'LegalService', 'FinancialService', 'EducationalOrganization', 'NGO', 'GovernmentOrganization'].includes(t),
      ),
    ]),
  );

  const schemaVars: Record<string, any> = {
    business_name: ctx.business_name,
    site_url: ctx.site_url,
    phone: ctx.phone ?? '',
    email: ctx.email ?? '',
    street: ctx.street ?? '',
    city: ctx.city ?? '',
    postal_code: ctx.postal_code ?? '',
    country: ctx.country ?? 'RU',
    latitude: ctx.latitude ?? '',
    longitude: ctx.longitude ?? '',
    opening_hours: ctx.opening_hours ?? '',
    price_range: ctx.price_range ?? '',
    logo_url: ctx.logo_url ?? '',
    social_links: ctx.social_links ?? [],
    languages: ctx.languages ?? ['ru'],
  };

  const renderedGlobals = await renderManySchemas(globalSchemaTypes, schemaVars);
  const global_schemas = renderedGlobals
    .filter((r) => r.rendered !== null)
    .map((r) => ({ schema_type: r.schema_type, rendered_json: r.rendered as Record<string, any> }));

  // 5. Llms.txt + robots.txt + sitemap
  const llmsPages = pagePlanToLlmsTxtPages(pages, projectType);
  const llms_txt = generateLlmsTxt({
    business_name: ctx.business_name,
    site_url: ctx.site_url,
    short_description: ctx.short_description,
    long_description: ctx.long_description,
    pages: llmsPages,
  });

  const robots_txt = generateRobotsTxt({
    site_url: ctx.site_url,
    sitemap_url: `${ctx.site_url.replace(/\/$/, '')}/sitemap.xml`,
    disallow_paths: ['/admin', '/api/', '/cart', '/checkout', '/account'],
    ai_bots_policy: ctx.ai_bots_policy ?? 'allow',
  });

  const sitemap_skeleton = generateSitemapXml({
    site_url: ctx.site_url,
    pages: pages.map((p) => ({ url: p.examples[0] ?? p.url_pattern, priority: p.page_type === 'home' ? 1.0 : 0.7 })),
  });

  // 6. Preflight
  const draft: BlueprintV2 = {
    project_type_code: projectType.code,
    engine_version: ENGINE_VERSION,
    pages,
    global_schemas,
    llms_txt,
    robots_txt,
    sitemap_skeleton,
    preflight: {
      project_type_code: projectType.code,
      contracts_checked: 0,
      contracts_passed: 0,
      violations: [],
      score: 0,
      publishable: false,
      generated_at: new Date().toISOString(),
    },
    generated_at: new Date().toISOString(),
  };

  draft.preflight = await runPreflight(draft);
  return draft;
}
