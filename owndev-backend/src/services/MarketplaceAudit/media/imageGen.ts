import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../../../utils/logger.js';
import { withRetry, HttpError } from '../../../utils/retry.js';

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';
const DEFAULT_MODEL = 'dall-e-3';

// Персист сгенерированных картинок:
// OpenAI отдаёт URL, которые живут ~1 час — это ломает отчёты
// и слайдшоу. Качаем байты на диск и отдаём стабильный URL.
const PUBLIC_IMG_DIR =
  process.env.MARKETPLACE_IMAGE_DIR || '/var/www/owndev.ru/public/marketplace-images';
const PUBLIC_IMG_URL_BASE =
  process.env.MARKETPLACE_IMAGE_URL_BASE || 'https://owndev.ru/marketplace-images';

export interface GenerateImagesInput {
  productTitle: string;
  category: string;
  prompts: string[];
  apiKey: string;
  count?: number;
  /** Ид аудита/задачи для именования файлов (опционально). */
  auditId?: string;
}

async function ensurePublicDir(): Promise<boolean> {
  try {
    await fs.mkdir(PUBLIC_IMG_DIR, { recursive: true });
    return true;
  } catch (e) {
    logger.warn('MA_IMG', `mkdir ${PUBLIC_IMG_DIR} failed: ${(e as Error).message}`);
    return false;
  }
}

/**
 * Скачать PNG с временного хоста OpenAI и положить в PUBLIC_IMG_DIR.
 * Возвращает стабильный public-URL или null.
 */
async function persistImage(remoteUrl: string, auditId?: string): Promise<string | null> {
  if (!(await ensurePublicDir())) return null;
  let buf: Buffer;
  try {
    const resp = await fetch(remoteUrl, { signal: AbortSignal.timeout(30_000) });
    if (!resp.ok) {
      logger.warn('MA_IMG', `persist: fetch ${resp.status} for ${remoteUrl}`);
      return null;
    }
    buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 1024) {
      logger.warn('MA_IMG', `persist: too small (${buf.length}B), skip`);
      return null;
    }
  } catch (e) {
    logger.warn('MA_IMG', `persist: fetch failed ${(e as Error).message}`);
    return null;
  }
  const fname =
    `${auditId ? auditId + '-' : ''}` +
    `${Date.now().toString(36)}-${crypto.randomBytes(4).toString('hex')}.png`;
  const dst = path.join(PUBLIC_IMG_DIR, fname);
  try {
    await fs.writeFile(dst, buf);
  } catch (e) {
    logger.warn('MA_IMG', `persist: write failed ${(e as Error).message}`);
    return null;
  }
  return `${PUBLIC_IMG_URL_BASE}/${fname}`;
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
      if (typeof url !== 'string' || !url.startsWith('http')) {
        logger.warn('MA_IMG', 'No url in OpenAI images response');
        continue;
      }
      // Качаем PNG на свой хост — OpenAI URLы живут ~1ч.
      const persisted = await persistImage(url, input.auditId);
      if (persisted) {
        out.push(persisted);
      } else {
        // фолбэк: если персист не получился (права / сеть) — отдаём
        // временный URL OpenAI, чтобы пиплайн не упал. Фронт/слайдшоу справится
        // в ближайший час; в логах видно причину.
        logger.warn('MA_IMG', 'persist failed — returning short-lived OpenAI url');
        out.push(url);
      }
    } catch (e) {
      logger.warn('MA_IMG', `image gen failed: ${(e as Error).message}`);
      // continue with next prompt
    }
  }
  return out;
}
