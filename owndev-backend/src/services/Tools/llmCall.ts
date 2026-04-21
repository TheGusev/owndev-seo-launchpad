/**
 * Универсальная обёртка над llm-proxy Edge Function для tools-эндпоинтов.
 * Использует tool-calling, чтобы получить строго-типизированный JSON.
 *
 * Возвращает уже распарсенный объект (не markdown) или null при сбое.
 */
import { logger } from '../../utils/logger.js';

const PROXY_URL =
  process.env.LLM_PROXY_URL ||
  'https://chrsibijgyihualqlabm.supabase.co/functions/v1/llm-proxy';
const DEFAULT_MODEL = process.env.TOOLS_DEFAULT_MODEL || 'google/gemini-3-flash-preview';

export interface ToolJsonSchema {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface CallJsonLlmOptions {
  systemPrompt: string;
  userPrompt: string;
  schema: ToolJsonSchema;
  model?: string;
  /** Опционально — замена SUPABASE anon (Edge Function принимает x-proxy-secret) */
  proxySecret?: string;
}

export async function callJsonLlm<T = unknown>(opts: CallJsonLlmOptions): Promise<T | null> {
  const proxySecret = opts.proxySecret ?? process.env.EDGE_FUNCTION_SECRET ?? '';
  if (!proxySecret) {
    logger.warn('TOOLS_LLM', 'EDGE_FUNCTION_SECRET is not set — cannot call llm-proxy');
    return null;
  }

  const body = {
    model: opts.model ?? DEFAULT_MODEL,
    messages: [
      { role: 'system', content: opts.systemPrompt },
      { role: 'user', content: opts.userPrompt },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: opts.schema.name,
          description: opts.schema.description,
          parameters: opts.schema.parameters,
        },
      },
    ],
    tool_choice: { type: 'function', function: { name: opts.schema.name } },
  };

  try {
    const r = await fetch(PROXY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-proxy-secret': proxySecret,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(45_000),
    });
    if (!r.ok) {
      const text = await r.text().catch(() => '');
      logger.warn('TOOLS_LLM', `llm-proxy returned ${r.status}: ${text.slice(0, 200)}`);
      return null;
    }
    const data = await r.json();
    const tcalls = data?.choices?.[0]?.message?.tool_calls;
    const args = tcalls?.[0]?.function?.arguments;
    if (!args) {
      logger.warn('TOOLS_LLM', `No tool_calls in proxy response (model=${body.model})`);
      return null;
    }
    return typeof args === 'string' ? (JSON.parse(args) as T) : (args as T);
  } catch (e) {
    logger.warn('TOOLS_LLM', `LLM call failed: ${(e as Error).message}`);
    return null;
  }
}