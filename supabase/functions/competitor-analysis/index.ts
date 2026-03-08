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
  hasFaq: boolean;
  hasViewport: boolean;
  hasCanonical: boolean;
  hasOg: boolean;
  loadTimeMs: number;
  htmlSizeKB: number;
  internalLinks: number;
  externalLinks: number;
}

async function analyzeUrl(url: string): Promise<PageMetrics> {
  const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  const start = Date.now();
  const resp = await fetch(parsedUrl.toString(), { headers: { 'User-Agent': 'OWNDEV-CompetitorAnalysis/1.0' }, redirect: 'follow' });
  const loadTimeMs = Date.now() - start;
  const html = await resp.text();
  const htmlSizeKB = Math.round(new TextEncoder().encode(html).length / 1024);

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1Text = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';

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
  for (const link of allLinks) {
    const hrefMatch = link.match(/href=["']([^"']*)["']/i);
    if (hrefMatch) {
      const href = hrefMatch[1];
      if (href.startsWith('/') || href.startsWith('#') || href.includes(parsedUrl.hostname)) internalLinks++;
      else if (href.startsWith('http')) externalLinks++;
    }
  }

  return {
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
    hasFaq: /faq|часто\s*задаваемые|вопрос.*ответ/i.test(html) || /<details[\s>]/i.test(html),
    hasViewport: /<meta[^>]*name=["']viewport["']/i.test(html),
    hasCanonical: /<link[^>]*rel=["']canonical["']/i.test(html),
    hasOg: /<meta[^>]*property=["']og:title["']/i.test(html),
    loadTimeMs,
    htmlSizeKB,
    internalLinks,
    externalLinks,
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { url1, url2 } = await req.json();
    if (!url1 || !url2) return new Response(JSON.stringify({ error: 'Both url1 and url2 are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const [metrics1, metrics2] = await Promise.all([analyzeUrl(url1), analyzeUrl(url2)]);

    return new Response(JSON.stringify({ page1: metrics1, page2: metrics2 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Ошибка: ${error.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
