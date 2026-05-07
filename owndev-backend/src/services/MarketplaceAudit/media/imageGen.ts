import { logger } from '../../../utils/logger.js';
import { withRetry, HttpError } from '../../../utils/retry.js';

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';
const DEFAULT_MODEL = 'dall-e-3';

export interface GenerateImagesInput {
  productTitle: string;
  category: string;
  prompts: string[];
  apiKey: string;
  count?: number;
}

/**
 * Render a marketplace-card style image via DALL-E 3.
 * Returns array of CDN URLs (DALL-E hosts the resulting PNG; URLs expire after 1h
 * but we surface them as-is for the frontend — caller may persist if needed).
 *
 * Returns [] on any failure (caller decides fallback). Never throws.
 */
export async function generateProductImages(input: GenerateImagesInput): Promise<string[]> {
  const apiKey = input.apiKey;
  if (!apiKey) {
    logger.warn('MA_IMG', 'No OPENAI_API_KEY — skipping image generation');
    return [];
  }
  const promptsCount = Math.max(1, Math.min(input.count ?? 2, 3));
  const safePrompts = input.prompts.filter((p) => typeof p === 'string' && p.trim().length > 0).slice(0, promptsCount);
  if (safePrompts.length === 0) {
    safePrompts.push(`Premium product photo of "${input.productTitle}" for marketplace listing`);
  }

  const out: string[] = [];
  for (const baseHint of safePrompts) {
    const fullPrompt = [
      `Marketplace product card image. Category: ${input.category || 'general'}.`,
      `Product: ${input.productTitle}.`,
      `Composition hint: ${baseHint}.`,
      'Clean white seamless background, soft studio lighting, sharp focus, ',
      'centred subject, photorealistic, no text overlays, no watermarks.',
    ].join(' ');
    try {
      const r = await withRetry(async () => {
        const resp = await fetch(OPENAI_IMAGES_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: DEFAULT_MODEL,
            prompt: fullPrompt.slice(0, 3900),
            n: 1,
            size: '1024x1024',
            quality: 'standard',
            response_format: 'url',
          }),
          signal: AbortSignal.timeout(60_000),
        });
        if (!resp.ok && [429, 500, 502, 503, 504].includes(resp.status)) {
          throw new HttpError(resp.status, `images ${resp.status}`);
        }
        return resp;
      }, { label: 'MA_IMG' });
      if (!r.ok) {
        const txt = await r.text().catch(() => '');
        logger.warn('MA_IMG', `images endpoint ${r.status}: ${txt.slice(0, 180)}`);
        continue;
      }
      const data = await r.json();
      const url = data?.data?.[0]?.url;
      if (typeof url === 'string' && url.startsWith('http')) {
        out.push(url);
      } else {
        logger.warn('MA_IMG', 'No url in OpenAI images response');
      }
    } catch (e) {
      logger.warn('MA_IMG', `image gen failed: ${(e as Error).message}`);
      // continue with next prompt
    }
  }
  return out;
}
