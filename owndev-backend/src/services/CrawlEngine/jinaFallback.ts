/**
 * Jina Reader fallback — для SPA-сайтов, у которых статический HTML почти
 * пустой (React/Vue/Angular рендерят клиентом).
 *
 * Используем https://r.jina.ai/<url> — публичный сервис, возвращает рендеренный
 * markdown с title/links. Бесплатный лимит ~200 RPM, работает без ключа.
 *
 * Эвристика SPA: word_count < 50 ИЛИ outbound_links < 3 на статической странице.
 */
import * as cheerio from 'cheerio';
import { logger } from '../../utils/logger.js';
import type { CrawlPageRecord } from './types.js';

const JINA_BASE = 'https://r.jina.ai/';

const SPA_HINT_RX = /(react|vue|angular|svelte|next|nuxt|gatsby)/i;

export function looksLikeSpa(html: string, page: { word_count: number | null; outbound_links: number }): boolean {
  if ((page.word_count ?? 0) < 50) return true;
  if (page.outbound_links < 3 && (page.word_count ?? 0) < 200) return true;
  if (html.length < 8_000 && SPA_HINT_RX.test(html)) return true;
  return false;
}

export interface JinaResult {
  title: string | null;
  description: string | null;
  text: string;             // markdown
  word_count: number;
  links: string[];          // url-only, normalized
  raw_size: number;
}

export async function fetchViaJina(
  url: string,
  timeoutMs = 20_000,
): Promise<JinaResult | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const target = JINA_BASE + url;
    const res = await fetch(target, {
      signal: ctrl.signal,
      headers: {
        Accept: 'text/plain',
        'X-Return-Format': 'markdown',
      },
    });
    if (!res.ok) {
      logger.warn('JINA', `status ${res.status} for ${url}`);
      return null;
    }
    const text = await res.text();
    if (!text) return null;

    // Jina возвращает блок: Title: ... \n URL: ... \n Description: ... \n\n <markdown>
    const head: Record<string, string> = {};
    const lines = text.split('\n');
    let bodyStart = 0;
    for (let i = 0; i < Math.min(8, lines.length); i++) {
      const m = lines[i].match(/^([A-Za-z][A-Za-z\s-]+):\s*(.*)$/);
      if (m && lines[i].trim()) {
        head[m[1].trim().toLowerCase()] = m[2].trim();
        bodyStart = i + 1;
      } else if (lines[i].trim() === '' && bodyStart > 0) {
        bodyStart = i + 1;
        break;
      }
    }
    const body = lines.slice(bodyStart).join('\n').trim();
    const word_count = (body.match(/[\p{L}\p{N}]+/gu) || []).length;
    const links = extractLinksFromMarkdown(body);

    return {
      title: head['title'] || null,
      description: head['description'] || null,
      text: body,
      word_count,
      links,
      raw_size: text.length,
    };
  } catch (e: any) {
    logger.warn('JINA', `fetch failed for ${url}: ${e?.message || e}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function extractLinksFromMarkdown(md: string): string[] {
  const out = new Set<string>();
  const rx = /\[[^\]]+\]\((https?:\/\/[^\s)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(md))) out.add(m[1]);
  // also bare URLs
  const bareRx = /(?<![\(\[])https?:\/\/[^\s)\]]+/g;
  while ((m = bareRx.exec(md))) out.add(m[0]);
  return Array.from(out);
}

/**
 * Применяет Jina-результат к существующей CrawlPageRecord, дополняя поля,
 * которых не хватает после статического HTML.
 */
export function mergeJinaIntoRecord(
  record: Omit<CrawlPageRecord, 'page_type_guess'>,
  jina: JinaResult,
): Omit<CrawlPageRecord, 'page_type_guess'> {
  return {
    ...record,
    title: record.title || jina.title,
    meta_description: record.meta_description || jina.description,
    word_count: Math.max(record.word_count ?? 0, jina.word_count),
    notes: { ...record.notes, jina_used: true, jina_size: jina.raw_size },
    raw_html_size: Math.max(record.raw_html_size ?? 0, jina.raw_size),
  };
}
