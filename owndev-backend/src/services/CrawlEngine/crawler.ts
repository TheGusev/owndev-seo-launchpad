/**
 * Cheerio-based crawler. Statically следует ссылкам, без headless-браузера.
 *  - максимум maxPages (по умолчанию 50)
 *  - конкурентность 3
 *  - уважает robots.txt (если respectRobots=true)
 *  - таймаут 12s на запрос
 *  - сохраняет crawl_sessions + crawl_pages
 */
import { sql } from '../../db/client.js';
import { logger } from '../../utils/logger.js';
import type {
  CrawlOptions,
  CrawlPageRecord,
  CrawlSessionResult,
} from './types.js';
import { extractFromHtml, extractInternalLinks } from './extractor.js';
import { classifyPage } from './pageClassifier.js';
import { parseRobotsTxt, isAllowed, type RobotsRules } from './robots.js';

const DEFAULT_UA = 'OwndevBot/2.0 (+https://owndev.ru)';

async function fetchWithTimeout(
  url: string,
  ua: string,
  timeoutMs: number,
): Promise<{ status: number; contentType: string | null; html: string; ms: number }> {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { 'User-Agent': ua, Accept: 'text/html,*/*;q=0.8' },
      redirect: 'follow',
    });
    const ct = res.headers.get('content-type');
    const html = ct && ct.includes('text/html') ? await res.text() : '';
    return { status: res.status, contentType: ct, html, ms: Date.now() - t0 };
  } finally {
    clearTimeout(timer);
  }
}

async function fetchRobots(rootUrl: string, ua: string): Promise<RobotsRules> {
  try {
    const u = new URL('/robots.txt', rootUrl).toString();
    const res = await fetchWithTimeout(u, ua, 6000);
    if (res.status >= 200 && res.status < 300) return parseRobotsTxt(res.html, ua);
  } catch (e: any) {
    logger.warn('CRAWL', `robots.txt fetch failed: ${e?.message || e}`);
  }
  return { disallow: [], allow: [], crawlDelayMs: 0 };
}

async function insertSession(opts: CrawlOptions, ua: string): Promise<string> {
  const [row] = await sql<{ id: string }[]>`
    INSERT INTO crawl_sessions (
      session_id, root_url, max_pages, status, user_agent, respect_robots, started_at
    ) VALUES (
      ${opts.sessionId ?? null}, ${opts.rootUrl}, ${opts.maxPages ?? 50},
      'running', ${ua}, ${opts.respectRobots !== false}, NOW()
    )
    RETURNING id
  `;
  return row.id;
}

async function savePage(crawlSessionId: string, rec: CrawlPageRecord): Promise<void> {
  try {
    await sql`
      INSERT INTO crawl_pages (
        crawl_session_id, url, http_status, content_type,
        title, h1, meta_description, canonical, robots_meta,
        word_count, schemas_found, blocks_detected, page_type_guess,
        raw_html_size, fetch_ms, outbound_links, notes
      ) VALUES (
        ${crawlSessionId}, ${rec.url}, ${rec.http_status}, ${rec.content_type},
        ${rec.title}, ${rec.h1}, ${rec.meta_description}, ${rec.canonical}, ${rec.robots_meta},
        ${rec.word_count}, ${rec.schemas_found}, ${rec.blocks_detected}, ${rec.page_type_guess},
        ${rec.raw_html_size}, ${rec.fetch_ms}, ${rec.outbound_links}, ${sql.json(rec.notes)}
      )
      ON CONFLICT (crawl_session_id, url) DO NOTHING
    `;
  } catch (e: any) {
    logger.warn('CRAWL', `savePage failed for ${rec.url}: ${e?.message || e}`);
  }
}

async function finalizeSession(
  id: string,
  pagesCrawled: number,
  errors: number,
  status: 'done' | 'failed',
): Promise<void> {
  await sql`
    UPDATE crawl_sessions
    SET pages_crawled = ${pagesCrawled},
        errors_count  = ${errors},
        status        = ${status},
        finished_at   = NOW()
    WHERE id = ${id}
  `;
}

export async function crawlSite(opts: CrawlOptions): Promise<CrawlSessionResult> {
  const ua = opts.userAgent || DEFAULT_UA;
  const maxPages = opts.maxPages ?? 50;
  const concurrency = Math.max(1, Math.min(5, opts.concurrency ?? 3));
  const timeoutMs = opts.timeoutMs ?? 12_000;
  const respectRobots = opts.respectRobots !== false;

  const root = new URL(opts.rootUrl);
  const startedAt = new Date().toISOString();
  const crawlSessionId = await insertSession(opts, ua);

  const robots = respectRobots ? await fetchRobots(root.toString(), ua) : { disallow: [], allow: [], crawlDelayMs: 0 };

  const queue: string[] = [root.toString().replace(/\/$/, '') || root.toString()];
  const visited = new Set<string>();
  const pages: CrawlPageRecord[] = [];
  let errors = 0;

  async function processOne(url: string): Promise<void> {
    if (visited.has(url) || pages.length >= maxPages) return;
    visited.add(url);

    if (respectRobots) {
      try {
        const path = new URL(url).pathname;
        if (!isAllowed(robots, path)) return;
      } catch {
        return;
      }
    }

    try {
      const r = await fetchWithTimeout(url, ua, timeoutMs);
      if (!r.html) {
        return;
      }
      const ext = extractFromHtml(url, r.html, r.status, r.contentType, r.ms);
      const page_type_guess = classifyPage({
        url,
        rootUrl: root.toString(),
        title: ext.title,
        h1: ext.h1,
        schemas: ext.schemas_found,
        blocks: ext.blocks_detected,
      });
      const rec: CrawlPageRecord = { ...ext, page_type_guess };
      pages.push(rec);
      await savePage(crawlSessionId, rec);

      // discover links (only on 2xx, max 100 per page to keep BFS bounded)
      if (r.status >= 200 && r.status < 300) {
        const links = extractInternalLinks(url, r.html).slice(0, 100);
        for (const l of links) {
          if (!visited.has(l) && pages.length + queue.length < maxPages * 3) {
            queue.push(l);
          }
        }
      }
    } catch (e: any) {
      errors += 1;
      logger.warn('CRAWL', `fetch ${url} failed: ${e?.message || e}`);
    }
  }

  // simple BFS with concurrency
  while (queue.length > 0 && pages.length < maxPages) {
    const batch = queue.splice(0, concurrency);
    await Promise.all(batch.map(processOne));
    if (robots.crawlDelayMs > 0) {
      await new Promise((r) => setTimeout(r, robots.crawlDelayMs));
    }
  }

  await finalizeSession(crawlSessionId, pages.length, errors, 'done');

  return {
    id: crawlSessionId,
    root_url: opts.rootUrl,
    pages_crawled: pages.length,
    errors_count: errors,
    status: 'done',
    pages,
    started_at: startedAt,
    finished_at: new Date().toISOString(),
  };
}
