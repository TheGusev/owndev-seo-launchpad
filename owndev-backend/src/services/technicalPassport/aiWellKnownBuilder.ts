/**
 * .well-known/ai.txt builder — V3.
 *
 * No formal IETF RFC yet, but de-facto convention:
 *   https://www.well-known.dev/sites/ai.txt/
 *   https://github.com/AI-PCD/ai-txt
 *
 * We emit JSON (most parser-friendly) with declared training policy,
 * license, attribution requirement and operator contact.
 */

import type { PassportInputs } from './types.js';

export interface AiWellKnown {
  version: string;
  site: string;
  operator: {
    name: string;
    contact: string;
  };
  policy: {
    training: 'allow' | 'deny' | 'allow_with_attribution';
    inference: 'allow' | 'deny';
    quotation: 'allow_with_attribution';
    attribution_required: boolean;
  };
  license?: string;
  primary_geo: string;
  languages: string[];
  references: {
    llms_txt: string;
    sitemap_xml: string;
    robots_txt: string;
  };
  generated_at: string;
}

export function buildAiWellKnown(inputs: PassportInputs): { content: string; data: AiWellKnown } {
  const data: AiWellKnown = {
    version: '1.0',
    site: inputs.base_url,
    operator: {
      name: inputs.brand_name,
      contact: inputs.contact_email,
    },
    policy: {
      training: inputs.ai_training_policy,
      inference: inputs.ai_training_policy === 'deny' ? 'deny' : 'allow',
      quotation: 'allow_with_attribution',
      attribution_required:
        inputs.ai_attribution_required ?? inputs.ai_training_policy === 'allow_with_attribution',
    },
    license: inputs.license,
    primary_geo: inputs.primary_geo,
    languages: inputs.languages,
    references: {
      llms_txt: `${inputs.base_url}/llms.txt`,
      sitemap_xml: `${inputs.base_url}/sitemap.xml`,
      robots_txt: `${inputs.base_url}/robots.txt`,
    },
    generated_at: new Date().toISOString(),
  };

  return {
    content: JSON.stringify(data, null, 2),
    data,
  };
}
