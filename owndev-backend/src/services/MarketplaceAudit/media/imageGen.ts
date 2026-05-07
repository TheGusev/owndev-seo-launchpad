import { promises as fs } from 'fs';
import path from 'path';
import crypto from 'crypto';
import { logger } from '../../../utils/logger.js';
import { withRetry, HttpError } from '../../../utils/retry.js';

const OPENAI_IMAGES_URL = 'https://api.openai.com/v1/images/generations';
// gpt-image-1 — новый флагман Имиджевого API OpenAI (с 2025).
// Отличия от dall-e-3:
//   • возвращает b64_json (URL больше не поддерживает — response_format не передаются)
//   • quality: low | medium | high | auto (вместо standard|hd у dall-e-3)
//   • size: 1024x1024 | 1024x1536 | 1536x1024 | auto
// По качеству/инструктивности заметно лучше dall-e-3 для карточек товаров.
const DEFAULT_MODEL = 'gpt-image-1';

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
 * Записать байты в PUBLIC_IMG_DIR. Возвращает стабильный public-URL или null.
 */
async function persistImageBytes(buf: Buffer, auditId?: string): Promise<string | null> {
  if (buf.length < 1024) {
    logger.warn('MA_IMG', `persist: too small (${buf.length}B), skip`);
    return null;
  }
  if (!(await ensurePublicDir())) return null;
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
 * Скачать PNG с временного хоста OpenAI и положить в PUBLIC_IMG_DIR.
 * (Используется в фолбэк-ветке на старых моделях, возвращающих url.)
 */
async function persistImageFromUrl(remoteUrl: string, auditId?: string): Promise<string | null> {
  let buf: Buffer;
  try {
    const resp = await fetch(remoteUrl, { signal: AbortSignal.timeout(30_000) });
    if (!resp.ok) {
      logger.warn('MA_IMG', `persist: fetch ${resp.status} for ${remoteUrl}`);
      return null;
    }
    buf = Buffer.from(await resp.arrayBuffer());
  } catch (e) {
    logger.warn('MA_IMG', `persist: fetch failed ${(e as Error).message}`);
    return null;
  }
  return persistImageBytes(buf, auditId);
}

/**
 * Render marketplace-card style images via gpt-image-1 (фолбэком — dall-e-3,
 * если DEFAULT_MODEL передадут через env).
 *
 * Результат всегда персистируется на свой хост (PUBLIC_IMG_DIR), и метод
 * возвращает стабильные public-URLы (https://owndev.ru/marketplace-images/...).
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
            // gpt-image-1: low|medium|high|auto. Берём medium — оптимальный
            // баланс стоимость/качество для карточек маркетплейса.
            quality: 'medium',
            // response_format НЕ передаём — gpt-image-1 всегда возвращает b64_json.
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
      const item = data?.data?.[0];
      // gpt-image-1 → b64_json; dall-e-3 со старым response_format='url' → url.
      // Поддерживаем оба варианта (если DEFAULT_MODEL переключать через env).
      let persisted: string | null = null;
      if (typeof item?.b64_json === 'string' && item.b64_json.length > 100) {
        const buf = Buffer.from(item.b64_json, 'base64');
        persisted = await persistImageBytes(buf, input.auditId);
      } else if (typeof item?.url === 'string' && item.url.startsWith('http')) {
        persisted = await persistImageFromUrl(item.url, input.auditId);
        if (!persisted) {
          logger.warn('MA_IMG', 'persist failed — returning short-lived OpenAI url');
          persisted = item.url;
        }
      } else {
        logger.warn('MA_IMG', 'No b64_json / url in OpenAI images response');
        continue;
      }
      if (persisted) out.push(persisted);
    } catch (e) {
      logger.warn('MA_IMG', `image gen failed: ${(e as Error).message}`);
      // continue with next prompt
    }
  }
  return out;
}
