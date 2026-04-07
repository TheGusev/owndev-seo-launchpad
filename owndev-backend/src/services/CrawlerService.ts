import puppeteer from 'puppeteer';
import { logger } from '../utils/logger.js';
import type { CrawlData } from '../types/audit.js';

export class CrawlerService {
  private timeout = Number(process.env.PUPPETEER_TIMEOUT ?? 15000);

  async crawl(url: string): Promise<CrawlData> {
    const startMs = Date.now();
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('OWNDEV-Crawler/1.0 (+https://owndev.ru)');

      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.timeout,
      });

      const finalUrl = page.url();
      const statusCode = response?.status() ?? 0;

      // Headers
      const headers: Record<string, string> = {};
      if (response) {
        const raw = response.headers();
        for (const [k, v] of Object.entries(raw)) {
          headers[k] = String(v);
        }
      }

      const html = await page.content();
      const title = await page.title();

      // Meta tags
      const metaTags = await page.evaluate(() => {
        const m: Record<string, string> = {};
        document.querySelectorAll('meta[name], meta[property]').forEach((el) => {
          const key = el.getAttribute('name') || el.getAttribute('property') || '';
          if (key) m[key] = el.getAttribute('content') || '';
        });
        return m;
      });

      // Links
      const links = await page.evaluate(() =>
        Array.from(document.querySelectorAll('a[href]')).slice(0, 200).map((a) => ({
          href: a.getAttribute('href') || '',
          rel: a.getAttribute('rel') || undefined,
          text: (a.textContent || '').trim().slice(0, 120) || undefined,
        }))
      );

      // Scripts src
      const scripts = await page.evaluate(() =>
        Array.from(document.querySelectorAll('script[src]')).map((s) => s.getAttribute('src') || '')
      );

      // JSON-LD schemas
      const schemas = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
          .map((s) => { try { return JSON.parse(s.textContent || ''); } catch { return null; } })
          .filter(Boolean);
      });

      // Rendered HTML (after JS execution)
      const renderedHtml = await page.evaluate(() => document.documentElement.outerHTML);

      const origin = new URL(url).origin;

      // Robots.txt
      const robots = await this.fetchRobots(origin);

      // llms.txt
      const llmsTxt = await this.fetchLlmsTxt(origin);

      const duration_ms = Date.now() - startMs;
      logger.info('CRAWLER', `Crawled ${url} → ${statusCode} in ${duration_ms}ms`);

      return {
        url, finalUrl, statusCode, headers, html, renderedHtml,
        title, metaTags, links, scripts, schemas, robots, llmsTxt, duration_ms,
      };
    } catch (err: any) {
      const duration_ms = Date.now() - startMs;
      logger.error('CRAWLER', `Failed to crawl ${url}: ${err.message}`);
      return {
        url, finalUrl: url, statusCode: 0, headers: {}, html: '', renderedHtml: '',
        title: '', metaTags: {}, links: [], scripts: [], schemas: [],
        robots: { index: true, follow: true },
        llmsTxt: { found: false },
        duration_ms, error: err.message,
      };
    } finally {
      await browser.close();
    }
  }

  private async fetchRobots(origin: string): Promise<CrawlData['robots']> {
    try {
      const resp = await fetch(`${origin}/robots.txt`);
      if (!resp.ok) return { index: true, follow: true };
      const raw = await resp.text();
      const lower = raw.toLowerCase();
      const inUserAgentAll = this.extractUserAgentBlock(lower, '*');
      return {
        index: !inUserAgentAll.includes('noindex'),
        follow: !inUserAgentAll.includes('nofollow'),
        rawContent: raw,
      };
    } catch {
      return { index: true, follow: true };
    }
  }

  private extractUserAgentBlock(robotsTxt: string, agent: string): string {
    const lines = robotsTxt.split('\n');
    let inBlock = false;
    const blockLines: string[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('user-agent:')) {
        const val = trimmed.slice('user-agent:'.length).trim();
        inBlock = val === agent || val === agent.toLowerCase();
      } else if (inBlock) {
        if (trimmed === '' && blockLines.length > 0) break;
        blockLines.push(trimmed);
      }
    }
    return blockLines.join('\n');
  }

  private async fetchLlmsTxt(origin: string): Promise<CrawlData['llmsTxt']> {
    try {
      const llmsUrl = `${origin}/llms.txt`;
      const resp = await fetch(llmsUrl);
      if (resp.ok) {
        const content = await resp.text();
        return { found: true, content, url: llmsUrl };
      }
      return { found: false };
    } catch {
      return { found: false };
    }
  }
}
