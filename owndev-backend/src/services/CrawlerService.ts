import puppeteer from 'puppeteer';
import { logger } from '../utils/logger.js';

export interface CrawlResult {
  html: string;
  title: string;
  meta: Record<string, string>;
  schemas: object[];
  robotsTxt: string;
  headers: Record<string, string>;
  statusCode: number;
}

export class CrawlerService {
  private timeout = Number(process.env.PUPPETEER_TIMEOUT ?? 15000);

  async crawl(url: string): Promise<CrawlResult> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent('OWNDEVBot/1.0');

      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: this.timeout,
      });

      const html = await page.content();
      const title = await page.title();

      const meta = await page.evaluate(() => {
        const metas: Record<string, string> = {};
        document.querySelectorAll('meta[name], meta[property]').forEach((el) => {
          const key = el.getAttribute('name') || el.getAttribute('property') || '';
          metas[key] = el.getAttribute('content') || '';
        });
        return metas;
      });

      const schemas = await page.evaluate(() => {
        const scripts = document.querySelectorAll('script[type="application/ld+json"]');
        return Array.from(scripts).map((s) => {
          try { return JSON.parse(s.textContent || ''); } catch { return null; }
        }).filter(Boolean);
      });

      // Fetch robots.txt
      let robotsTxt = '';
      try {
        const origin = new URL(url).origin;
        const robotsResp = await fetch(`${origin}/robots.txt`);
        if (robotsResp.ok) robotsTxt = await robotsResp.text();
      } catch { /* ignore */ }

      const headers: Record<string, string> = {};
      response?.headers()?.forEach?.((v: string, k: string) => { headers[k] = v; });

      logger.info('CRAWLER', `Crawled ${url} (${response?.status()})`);

      return {
        html,
        title,
        meta,
        schemas,
        robotsTxt,
        headers: response?.headers() as unknown as Record<string, string> ?? {},
        statusCode: response?.status() ?? 0,
      };
    } finally {
      await browser.close();
    }
  }
}
