/**
 * services/technicalPassport — V3 types.
 *
 * Technical passport bundles all "machine-readable" artefacts that the
 * site must ship to be SEO/AI-LLM compliant:
 *   • llms.txt           (LLM ingestion spec)
 *   • robots.txt         (with explicit AI-bot allow/deny)
 *   • .well-known/ai.txt (training opt-in/out, license, contact)
 *   • dataLayer          (window.dataLayer for GA4 / Yandex.Metrika)
 *   • HTTP headers       (Cache-Control, X-Robots-Tag, Content-Security-Policy)
 *   • sitemap.xml skeleton
 */

export interface PassportInputs {
  brand_name: string;
  domain: string;                  // 'example.com' (no scheme)
  base_url: string;                // 'https://example.com' (no trailing slash)
  contact_email: string;
  description_ru: string;
  primary_geo: string;             // 'RU' or 'RU-MOW'
  languages: string[];             // ['ru'] or ['ru','en']

  // LLM policy
  ai_training_policy: 'allow' | 'deny' | 'allow_with_attribution';
  ai_attribution_required?: boolean;
  license?: string;                 // 'CC-BY-4.0' | 'proprietary' | ...

  // Sitemap
  sitemap_pages: Array<{
    url: string;
    priority: number;
    changefreq: string;
    lastmod?: string;
  }>;
}

export interface TechnicalPassportArtifacts {
  llms_txt: string;
  robots_txt: string;
  ai_well_known: string;       // JSON content of .well-known/ai.txt
  sitemap_xml: string;
  data_layer: Record<string, any>;
  required_headers: Record<string, string>;
  ai_bots_allowed: string[];
  ai_bots_blocked: string[];
  csp_recommendation: string;
}
