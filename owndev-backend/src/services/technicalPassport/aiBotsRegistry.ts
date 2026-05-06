/**
 * AI bots registry — known LLM crawlers / training bots.
 *
 * Sources:
 *   • https://platform.openai.com/docs/bots
 *   • https://docs.anthropic.com/claude/docs/claude-bot
 *   • https://developers.google.com/search/docs/crawling-indexing/google-extended
 *   • https://yandex.ru/support/webmaster/yandex-indexing/yandexgpt.html
 *   • https://docs.perplexity.ai/docs/perplexitybot
 *   • https://commoncrawl.org/faq
 */

export interface AiBot {
  user_agent: string;
  vendor: string;
  purpose: 'training' | 'inference' | 'search' | 'mixed';
  blocking_recommended: 'allow' | 'deny' | 'optional';
  doc_url?: string;
}

export const AI_BOTS: AiBot[] = [
  // OpenAI
  { user_agent: 'GPTBot',         vendor: 'OpenAI',     purpose: 'training',  blocking_recommended: 'optional',
    doc_url: 'https://platform.openai.com/docs/gptbot' },
  { user_agent: 'OAI-SearchBot',  vendor: 'OpenAI',     purpose: 'search',    blocking_recommended: 'allow' },
  { user_agent: 'ChatGPT-User',   vendor: 'OpenAI',     purpose: 'inference', blocking_recommended: 'allow' },

  // Anthropic
  { user_agent: 'ClaudeBot',      vendor: 'Anthropic',  purpose: 'training',  blocking_recommended: 'optional' },
  { user_agent: 'anthropic-ai',   vendor: 'Anthropic',  purpose: 'training',  blocking_recommended: 'optional' },
  { user_agent: 'Claude-Web',     vendor: 'Anthropic',  purpose: 'inference', blocking_recommended: 'allow' },

  // Google
  { user_agent: 'Google-Extended',vendor: 'Google',     purpose: 'training',  blocking_recommended: 'optional',
    doc_url: 'https://developers.google.com/search/docs/crawling-indexing/google-extended' },

  // Perplexity
  { user_agent: 'PerplexityBot',  vendor: 'Perplexity', purpose: 'search',    blocking_recommended: 'allow' },

  // CommonCrawl (training data harvester)
  { user_agent: 'CCBot',          vendor: 'CommonCrawl', purpose: 'training', blocking_recommended: 'optional' },

  // Yandex
  { user_agent: 'YandexGPT',      vendor: 'Yandex',     purpose: 'training',  blocking_recommended: 'optional' },

  // Meta / Bytedance / Apple
  { user_agent: 'FacebookBot',    vendor: 'Meta',       purpose: 'training',  blocking_recommended: 'optional' },
  { user_agent: 'Meta-ExternalAgent', vendor: 'Meta',   purpose: 'mixed',     blocking_recommended: 'optional' },
  { user_agent: 'Bytespider',     vendor: 'ByteDance',  purpose: 'training',  blocking_recommended: 'optional' },
  { user_agent: 'Applebot-Extended', vendor: 'Apple',   purpose: 'training',  blocking_recommended: 'optional' },

  // Cohere / DiffBot / Mistral / Amazon
  { user_agent: 'cohere-ai',      vendor: 'Cohere',     purpose: 'training',  blocking_recommended: 'optional' },
  { user_agent: 'Diffbot',        vendor: 'Diffbot',    purpose: 'mixed',     blocking_recommended: 'optional' },
  { user_agent: 'Amazonbot',      vendor: 'Amazon',     purpose: 'mixed',     blocking_recommended: 'optional' },
];

export function aiBotsForPolicy(
  policy: 'allow' | 'deny' | 'allow_with_attribution',
): { allowed: string[]; blocked: string[] } {
  if (policy === 'allow' || policy === 'allow_with_attribution') {
    return {
      allowed: AI_BOTS.map((b) => b.user_agent),
      blocked: [],
    };
  }
  // deny → block all training-purpose bots; keep inference/search bots that respect Q&A traffic
  return {
    allowed: AI_BOTS.filter((b) => b.purpose !== 'training').map((b) => b.user_agent),
    blocked: AI_BOTS.filter((b) => b.purpose === 'training').map((b) => b.user_agent),
  };
}
