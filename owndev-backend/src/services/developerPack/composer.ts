/**
 * services/developerPack — composer.
 *
 * Builds a SuperPromptPack from V3 services outputs:
 *   • strategy (SiteStrategy)
 *   • pageContracts (GeneratedPageContract[])
 *   • schemaRegistry graphs
 *   • technicalPassport artifacts
 *   • preflight rules
 */

import type {
  SuperPromptPack,
  PackPageContract,
  RouteEntry,
  AcceptanceCriteria,
  AgentRole,
  Mission,
  NonNegotiableRule,
  TechStack,
  BusinessContext,
  UiComponentRules,
  SeoGeoSchemaContract,
} from './types.js';
import type { SiteStrategy } from '../strategy/types.js';
import type { TechnicalPassportArtifacts } from '../technicalPassport/types.js';
import type { PreflightRule } from '../preflight/types.js';

export interface ComposeInput {
  strategy: SiteStrategy;
  passport: TechnicalPassportArtifacts;
  preflight_rules: PreflightRule[];
  schema_global?: Array<{ schema_type: string; rendered_json: Record<string, any> }>;
  schema_per_page?: Array<{ page_type: string; graph: { '@context': string; '@graph': any[] } }>;
  brand: {
    name: string;
    industry: string;
    target_audience: string;
    competitive_position?: string;
    geo?: { country?: string; regions?: string[]; primary_city?: string };
    languages?: string[];
  };
  tech?: Partial<TechStack>;
  ui_tokens?: Record<string, string>;
}

const DEFAULT_TECH_STACK: TechStack = {
  framework: 'Next.js 14',
  styling: 'Tailwind CSS',
  ui_kit: 'shadcn/ui',
  state_management: 'React Server Components + zustand',
  deployment: 'self-hosted PM2 + Nginx',
  constraints: [
    'no Supabase',
    'no client-side puppeteer',
    'no Tailwind v4',
    'fetch only via server actions or route handlers',
  ],
};

const DEFAULT_AGENT_ROLE: AgentRole = {
  title: 'Senior Full-Stack Developer specialised in SEO/GEO/CRO websites',
  expertise: [
    'SEO технического и контентного качества',
    'GEO-разметка и структурированные данные (Schema.org @graph)',
    'CRO: CTA, формы, trust-сигналы',
    'AI-LLM-ready контент (llms.txt, intro_answer, FAQ)',
    'Производительность Core Web Vitals',
  ],
  tone: 'professional',
};

export function composePack(input: ComposeInput): SuperPromptPack {
  const { strategy, passport, preflight_rules, brand } = input;

  const tech_stack: TechStack = { ...DEFAULT_TECH_STACK, ...(input.tech ?? {}) };

  const mission: Mission = {
    primary_goal: `Построить SEO/AI-LLM-ready сайт «${brand.name}» (${brand.industry}) с прохождением V3 Preflight Gate (≥90).`,
    success_criteria: [
      'Все страницы имеют H1 ≤ 35, Title ≤ 60, intro_answer 40-80 слов',
      'Schema.org @graph валиден на 100% и проходит Rich Results Test',
      'llms.txt, robots.txt с AI-bot правилами и .well-known/ai.txt опубликованы',
      'Primary CTA above-the-fold, телефон кликабельный (tel:)',
      'Lead-форма с 152-ФЗ согласием и dataLayer.push на сабмит',
      'Preflight: SEO ≥ 85, Direct ≥ 90, Schema = 100, AI/LLM ≥ 85, Total ≥ 90',
    ],
    out_of_scope: [
      'CMS-админка',
      'Платежные интеграции (если не в scope)',
      'Многоязычность сверх ru (если не указана)',
    ],
  };

  const non_negotiable_rules: NonNegotiableRule[] = [
    {
      rule: 'H1 ≤ 35 символов, Title ≤ 60 символов на всех страницах',
      rationale: 'Жёсткие лимиты обеспечивают корректное отображение в SERP и AI-выдаче',
      violation_consequence: 'fail_acceptance',
    },
    {
      rule: 'Каждая страница содержит intro_answer 40-80 слов в первом параграфе',
      rationale: 'AI-движки извлекают именно первый прямой ответ',
      violation_consequence: 'fail_acceptance',
    },
    {
      rule: 'JSON-LD оформлен через @graph с корневыми @id',
      rationale: 'Без @graph поисковики не связывают сущности',
      violation_consequence: 'fail_acceptance',
    },
    {
      rule: 'FAQ ≥ 5 вопросов на каждой контентной странице',
      rationale: 'Минимум для FAQPage rich result + покрытие long-tail',
      violation_consequence: 'fail_acceptance',
    },
    {
      rule: 'robots.txt содержит правила для AI-ботов (GPTBot/ClaudeBot/Google-Extended/PerplexityBot)',
      rationale: 'Без явных правил AI-движки могут проигнорировать сайт',
      violation_consequence: 'fail_acceptance',
    },
    {
      rule: 'Не использовать Supabase / client-side puppeteer / Tailwind v4',
      rationale: 'Нарушает архитектурный стек проекта',
      violation_consequence: 'rework',
    },
  ];

  const business_context: BusinessContext = {
    brand: brand.name,
    industry: brand.industry,
    project_type_code: strategy.project_code,
    target_audience: brand.target_audience,
    geo: brand.geo,
    languages: brand.languages ?? ['ru'],
    competitive_position: brand.competitive_position,
  };

  const routes: RouteEntry[] = strategy.pages.map((p) => ({
    page_type: p.page_type,
    pattern: p.url_pattern,
    priority: p.priority >= 0.8 ? 'MUST' : p.priority >= 0.5 ? 'SHOULD' : 'COULD',
    indexable: true,
    in_sitemap: true,
  }));

  const contracts: PackPageContract[] = strategy.pages.map((p) => ({
    page_type: p.page_type,
    h1: { template: p.contract.h1_template, max_chars: 35 },
    title: { template: p.contract.title_template, max_chars: 60 },
    meta_description: { template: p.contract.meta_description_template, min_chars: 70, max_chars: 160 },
    intro_answer: {
      min_words: 40,
      max_words: 80,
      guidance: p.contract.intro_answer_template,
    },
    faq: {
      min_items: 5,
      questions: p.contract.faq_questions.map((q) => ({ question: q, answer: '' })),
    },
    required_schemas: p.contract.required_schema_graph,
    required_blocks: p.contract.required_blocks,
    commercial_signals: p.contract.required_commercial_signals as any,
    min_word_count: 400,
    canonical_required: true,
  }));

  const seo_geo_schema_contract: SeoGeoSchemaContract = {
    global_schemas: input.schema_global ?? [],
    page_schemas: input.schema_per_page ?? [],
    llms_txt: passport.llms_txt,
    robots_txt: passport.robots_txt,
    sitemap_xml: passport.sitemap_xml,
    well_known_ai: passport.ai_well_known,
    data_layer_events: (passport.data_layer.events ?? []).map((e: any) => ({
      event: e.ga4_event,
      trigger: `cta_click on ${e.page_type}`,
      payload: { primary_cta: e.primary_cta, yandex_goal: e.yandex_goal },
    })),
  };

  const ui_component_rules: UiComponentRules = {
    design_tokens: input.ui_tokens ?? {
      primary_color: '#0F62FE',
      secondary_color: '#F5F5F5',
      font_heading: 'Inter',
      font_body: 'Inter',
      border_radius: '12px',
    },
    required_components: [
      'Header',
      'Footer',
      'Breadcrumbs',
      'FAQ',
      'CTA',
      'ContactForm',
      'Hero',
      'TrustBlock',
      'PricingTable',
      'Reviews',
    ],
    accessibility: 'WCAG AA',
    performance_budgets: { lcp_ms: 2500, cls: 0.1, inp_ms: 200, page_weight_kb: 1500 },
  };

  // Map preflight rules → acceptance checks
  const toCheck = (r: PreflightRule) => ({
    id: r.rule_code,
    rule: r.description_ru,
    axis: r.axis.toLowerCase() as 'seo' | 'direct' | 'schema' | 'ai_llm',
    human_message_ru: r.remediation_ru,
  });
  const acceptance_criteria: AcceptanceCriteria = {
    preflight_targets: { seo: 85, direct: 90, schema: 100, ai_llm: 85, total: 90 },
    p0_checks: preflight_rules.filter((r) => r.severity === 'P0').map(toCheck),
    p1_checks: preflight_rules.filter((r) => r.severity === 'P1').map(toCheck),
    p2_checks: preflight_rules.filter((r) => r.severity === 'P2').map(toCheck),
    verification_steps: [
      'Прогон через Google Rich Results Test для всех page_types',
      'Lighthouse SEO ≥ 90 на всех ключевых страницах',
      'pa11y без AA-ошибок',
      'curl /llms.txt /robots.txt /.well-known/ai.txt /sitemap.xml — все 200',
      'Owndev Preflight V3 — passed=true',
    ],
    ready_signal: 'READY',
  };

  return {
    version: '1.0',
    engine_version: 'v3',
    generated_at: new Date().toISOString(),
    agent_role: DEFAULT_AGENT_ROLE,
    mission,
    non_negotiable_rules,
    tech_stack,
    business_context,
    route_map: { routes },
    page_contracts: { contracts },
    seo_geo_schema_contract,
    ui_component_rules,
    acceptance_criteria,
  };
}
