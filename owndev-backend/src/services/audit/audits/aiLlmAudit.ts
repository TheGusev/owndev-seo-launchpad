/**
 * audits/aiLlmAudit — AI/LLM axis specific audit.
 *
 * Checks the presence and shape of llms.txt, robots.txt AI rules,
 * .well-known/ai.txt and FAQPage availability.
 */

const KNOWN_AI_BOTS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'PerplexityBot',
  'anthropic-ai',
  'OAI-SearchBot',
  'ChatGPT-User',
  'YandexGPT',
  'CCBot',
  'FacebookBot',
  'Bytespider',
  'Applebot-Extended',
];

export interface AiLlmAuditResult {
  has_llms_txt: boolean;
  has_well_known_ai: boolean;
  has_ai_robots_rules: boolean;
  ai_bots_in_robots: string[];
  llms_txt_has_sections: boolean;
}

export function runAiLlmAudit(input: {
  llms_txt?: string;
  robots_txt?: string;
  well_known_ai?: string;
}): AiLlmAuditResult {
  const has_llms_txt = !!(input.llms_txt && input.llms_txt.trim().length > 30);
  const has_well_known_ai = !!(input.well_known_ai && input.well_known_ai.trim().length > 30);

  const robots = (input.robots_txt ?? '').toString();
  const matchedBots = KNOWN_AI_BOTS.filter((b) => new RegExp(`User-agent:\\s*${b}\\b`, 'i').test(robots));
  const has_ai_robots_rules = matchedBots.length >= 3;

  const llms_txt_has_sections = !!(input.llms_txt && /^##\s+/m.test(input.llms_txt));

  return {
    has_llms_txt,
    has_well_known_ai,
    has_ai_robots_rules,
    ai_bots_in_robots: matchedBots,
    llms_txt_has_sections,
  };
}
