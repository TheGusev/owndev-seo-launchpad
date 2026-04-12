const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PageMetrics {
  url: string;
  title: string;
  description: string;
  h1: string;
  h2Count: number;
  h3Count: number;
  wordCount: number;
  imageCount: number;
  imagesWithoutAlt: number;
  hasJsonLd: boolean;
  jsonLdTypes: string[];
  jsonLdCount: number;
  hasFaq: boolean;
  hasViewport: boolean;
  hasCanonical: boolean;
  hasOg: boolean;
  loadTimeMs: number;
  htmlSizeKB: number;
  internalLinks: number;
  externalLinks: number;
  // New metrics
  isHttps: boolean;
  hasRobotsTxt: boolean;
  hasSitemapXml: boolean;
  lang: string;
  listCount: number;
  tableCount: number;
  brokenLinks: string[];
  seoScore: number;
  imgsWithoutDimensions: number;
  hasLazyImages: boolean;
  hasFontDisplaySwap: boolean;
  hasPreloadHero: boolean;
}

async function checkUrlExists(url: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow', headers: { 'User-Agent': 'OWNDEV-CompetitorAnalysis/1.0' } });
    clearTimeout(id);
    return resp.ok;
  } catch {
    return false;
  }
}

async function checkLink(url: string): Promise<{ url: string; status: number }> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 4000);
    const resp = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow', headers: { 'User-Agent': 'OWNDEV-CompetitorAnalysis/1.0' } });
    clearTimeout(id);
    return { url, status: resp.status };
  } catch {
    return { url, status: 0 };
  }
}

function calculateSeoScore(m: Omit<PageMetrics, 'seoScore'>): number {
  let score = 100;
  if (!m.title) score -= 15;
  else if (m.title.length < 30 || m.title.length > 70) score -= 5;
  if (!m.description) score -= 15;
  else if (m.description.length < 100) score -= 5;
  if (!m.h1) score -= 15;
  if (m.imagesWithoutAlt > 0) score -= Math.min(15, m.imagesWithoutAlt * 2);
  if (!m.hasJsonLd) score -= 10;
  if (!m.hasCanonical) score -= 3;
  if (!m.hasOg) score -= 3;
  if (!m.hasViewport) score -= 10;
  if (!m.isHttps) score -= 15;
  if (!m.hasRobotsTxt) score -= 7;
  if (!m.hasSitemapXml) score -= 5;
  if (m.brokenLinks.length > 0) score -= Math.min(10, m.brokenLinks.length * 3);
  if (m.wordCount < 300) score -= 10;
  if (m.htmlSizeKB > 500) score -= 10;
  return Math.max(0, Math.min(100, score));
}

async function analyzeUrl(url: string): Promise<PageMetrics> {
  const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  const origin = parsedUrl.origin;
  const start = Date.now();
  const resp = await fetch(parsedUrl.toString(), { headers: { 'User-Agent': 'OWNDEV-CompetitorAnalysis/1.0' }, redirect: 'follow' });
  const loadTimeMs = Date.now() - start;
  const html = await resp.text();
  const htmlSizeKB = Math.round(new TextEncoder().encode(html).length / 1024);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
    || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1Text = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);

  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imagesWithoutAlt = imgTags.filter((img) => !img.match(/alt=["'][^"']+["']/i)).length;

  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const jsonLdTypes: string[] = [];
  for (const m of jsonLdMatches) {
    try {
      const content = m.replace(/<\/?script[^>]*>/gi, '');
      const parsed = JSON.parse(content);
      if (parsed['@type']) jsonLdTypes.push(parsed['@type']);
    } catch {}
  }

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';

  const allLinks = html.match(/<a[^>]*href=["']([^"']*)["']/gi) || [];
  let internalLinks = 0, externalLinks = 0;
  const internalHrefs: string[] = [];
  for (const link of allLinks) {
    const hrefMatch = link.match(/href=["']([^"']*)["']/i);
    if (hrefMatch) {
      const href = hrefMatch[1];
      if (href.startsWith('/') || href.startsWith('#') || href.includes(parsedUrl.hostname)) {
        internalLinks++;
        if (href.startsWith('/') && !href.startsWith('#')) {
          internalHrefs.push(`${origin}${href}`);
        }
      }
      else if (href.startsWith('http')) externalLinks++;
    }
  }

  // Parallel checks: robots.txt, sitemap.xml, broken links (up to 5)
  const uniqueInternalHrefs = [...new Set(internalHrefs)].slice(0, 5);
  const [hasRobotsTxt, hasSitemapXml, ...linkResults] = await Promise.all([
    checkUrlExists(`${origin}/robots.txt`),
    checkUrlExists(`${origin}/sitemap.xml`),
    ...uniqueInternalHrefs.map(h => checkLink(h)),
  ]);

  const brokenLinks = linkResults.filter(r => !([200, 301, 302, 0].includes(r.status))).map(r => `${r.url} (${r.status})`);

  const listCount = (html.match(/<(ul|ol)[\s>]/gi) || []).length;
  const tableCount = (html.match(/<table[\s>]/gi) || []).length;

  // CWV heuristics
  const imgsWithoutDimensions = imgTags.filter((img: string) => !(/width=["']\d+/i.test(img) && /height=["']\d+/i.test(img))).length;
  const hasLazyImages = imgTags.some((img: string) => /loading=["']lazy["']/i.test(img));
  const hasFontDisplaySwap = /font-display\s*:\s*swap/i.test(html);
  const hasPreloadHero = /<link[^>]*rel=["']preload["'][^>]*as=["']image["']/i.test(html) || /<img[^>]*fetchpriority=["']high["']/i.test(html);

  const partial = {
    url: parsedUrl.toString(),
    title: titleMatch ? titleMatch[1].trim() : '',
    description: descMatch ? descMatch[1].trim() : '',
    h1: h1Text,
    h2Count: (html.match(/<h2[\s>]/gi) || []).length,
    h3Count: (html.match(/<h3[\s>]/gi) || []).length,
    wordCount: bodyText.split(/\s+/).length,
    imageCount: imgTags.length,
    imagesWithoutAlt,
    hasJsonLd: jsonLdMatches.length > 0,
    jsonLdTypes,
    jsonLdCount: jsonLdMatches.length,
    hasFaq: /faq|часто\s*задаваемые|вопрос.*ответ/i.test(html) || /<details[\s>]/i.test(html),
    hasViewport: /<meta[^>]*name=["']viewport["']/i.test(html),
    hasCanonical: /<link[^>]*rel=["']canonical["']/i.test(html),
    hasOg: /<meta[^>]*property=["']og:title["']/i.test(html),
    loadTimeMs,
    htmlSizeKB,
    internalLinks,
    externalLinks,
    isHttps: parsedUrl.protocol === 'https:',
    hasRobotsTxt,
    hasSitemapXml,
    lang: langMatch ? langMatch[1] : '',
    listCount,
    tableCount,
    brokenLinks,
    imgsWithoutDimensions,
    hasLazyImages,
    hasFontDisplaySwap,
    hasPreloadHero,
  };

  return { ...partial, seoScore: calculateSeoScore(partial) };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { url1, url2 } = await req.json();
    if (!url1 || !url2) return new Response(JSON.stringify({ error: 'Both url1 and url2 are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const [metrics1, metrics2] = await Promise.all([analyzeUrl(url1), analyzeUrl(url2)]);

    return new Response(JSON.stringify({ page1: metrics1, page2: metrics2 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Ошибка: ${(error as Error).message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
