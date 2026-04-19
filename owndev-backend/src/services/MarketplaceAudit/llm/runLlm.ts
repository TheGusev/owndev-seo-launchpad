import { logger } from '../../../utils/logger.js';

const GATEWAY_URL = 'https://ai.gateway.lovable.dev/v1/chat/completions';
const DEFAULT_MODEL = 'google/gemini-3-flash-preview';

export interface LlmCallOptions {
  messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
  tool: any;
  toolName: string;
  model?: string;
  apiKey: string;
}

/**
 * Strict-JSON LLM call via Lovable AI Gateway, using tool_choice.
 * Returns parsed args of the tool call, or null on any failure (caller decides fallback).
 */
export async function callJsonLlm<T = any>(opts: LlmCallOptions): Promise<T | null> {
  if (!opts.apiKey) {
    logger.warn('MA_LLM', 'No API key — skipping LLM call');
    return null;
  }
  try {
    const r = await fetch(GATEWAY_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${opts.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: opts.model ?? DEFAULT_MODEL,
        messages: opts.messages,
        tools: [opts.tool],
        tool_choice: { type: 'function', function: { name: opts.toolName } },
      }),
    });
    if (!r.ok) {
      logger.warn('MA_LLM', `Gateway returned ${r.status}`);
      return null;
    }
    const data = await r.json();
    const tcalls = data?.choices?.[0]?.message?.tool_calls;
    const args = tcalls?.[0]?.function?.arguments;
    if (!args) {
      logger.warn('MA_LLM', 'No tool call in response');
      return null;
    }
    return JSON.parse(args) as T;
  } catch (e) {
    logger.warn('MA_LLM', `LLM call failed: ${(e as Error).message}`);
    return null;
  }
}
