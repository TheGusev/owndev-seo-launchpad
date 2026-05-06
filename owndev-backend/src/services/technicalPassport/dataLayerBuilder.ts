/**
 * dataLayer builder — V3.
 *
 * Produces window.dataLayer template for GA4 + Yandex.Metrika.
 *
 * The template defines:
 *   • page_meta event (project_code, page_type, primary_cta)
 *   • generate_lead / sign_up / purchase / contact (per primary_cta mapping)
 *   • Yandex.Metrika goals (reachGoal codes)
 */

import type { SiteStrategy, CtaPrimary } from '../strategy/types.js';

export interface DataLayerTemplate {
  init_snippet: string;        // raw <script> block to drop in <head>
  events: Array<{
    event: string;
    page_type: string;
    primary_cta: CtaPrimary;
    yandex_goal: string;
    ga4_event: string;
  }>;
  ga4_event_map: Record<string, string>;
  yandex_goals: string[];
}

const CTA_TO_GA4: Record<CtaPrimary, string> = {
  phone_call: 'generate_lead',
  lead_form: 'generate_lead',
  demo_request: 'generate_lead',
  free_trial: 'sign_up',
  buy_now: 'purchase',
  subscribe: 'sign_up',
  install_app: 'app_install',
  donate: 'purchase',
  register: 'sign_up',
  consultation_book: 'generate_lead',
};

const CTA_TO_YANDEX: Record<CtaPrimary, string> = {
  phone_call: 'phone_call',
  lead_form: 'lead_form',
  demo_request: 'demo_request',
  free_trial: 'free_trial',
  buy_now: 'purchase',
  subscribe: 'subscribe',
  install_app: 'install_app',
  donate: 'donate',
  register: 'register',
  consultation_book: 'consultation',
};

export function buildDataLayer(strategy: SiteStrategy): DataLayerTemplate {
  const events = strategy.pages.map((p) => ({
    event: 'cta_click',
    page_type: p.page_type,
    primary_cta: p.primary_cta,
    yandex_goal: CTA_TO_YANDEX[p.primary_cta],
    ga4_event: CTA_TO_GA4[p.primary_cta],
  }));

  const ga4_event_map: Record<string, string> = {};
  const yandex_goals = new Set<string>();
  for (const e of events) {
    ga4_event_map[e.page_type] = e.ga4_event;
    yandex_goals.add(e.yandex_goal);
  }

  const init_snippet = [
    '<!-- owndev V3 dataLayer init -->',
    '<script>',
    '  window.dataLayer = window.dataLayer || [];',
    '  function gtag(){dataLayer.push(arguments);}',
    '  gtag("js", new Date());',
    `  gtag("event", "page_meta", {`,
    `    project_code: ${JSON.stringify(strategy.project_code)},`,
    `    primary_cta: ${JSON.stringify(strategy.primary_cta)}`,
    '  });',
    '</script>',
    '<!-- /owndev V3 dataLayer init -->',
  ].join('\n');

  return {
    init_snippet,
    events,
    ga4_event_map,
    yandex_goals: Array.from(yandex_goals),
  };
}
