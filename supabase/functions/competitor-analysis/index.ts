const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface CompetitorData {
  url: string;
  title: string;
  description: string;
  h1: string;
  wordCount: number;
  imageCount: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  htmlSize: number;
  error?: string;
}

function extractText(html: string, tagOpen: string, tagClose: string): string {
  const start = html.indexOf(tagOpen);
  if (start === -1) return '';
  const contentStart = html.indexOf('>', start) + 1;
  const end = html.indexOf(tagClose, contentStart);
  if (end === -1) return '';
  return html.slice(contentStart, end).replace(/<[^>]*>/g, '').trim();
}

function getMetaContent(html: string, name: string): string {
  const patterns = [
    new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, 'i'),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1];
  }
  return '';
}

function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function analyzeHtml(html: string, url: string): Omit<CompetitorData, 'error'> {
  const title = extractText(html, '<title', '</title>');
  const description = getMetaContent(html, 'description');

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]*>/g, '').trim() : '';

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]*>/g, ' ').trim() : '';
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length;

  const images = html.match(/<img[^>]*>/gi) || [];
  const imageCount = images.length;
  const imagesWithoutAlt = images.filter(img => !img.match(/alt=["'][^"']+["']/i)).length;

  const hostname = getHostname(url);
  const links = html.match(/<a[^>]*href=["']([^"'#]*)["'][^>]*>/gi) || [];
  let internalLinks = 0;
  let externalLinks = 0;
  for (const link of links) {
    const hrefMatch = link.match(/href=["']([^"'#]*)["']/i);
    if (!hrefMatch) continue;
    const href = hrefMatch[1];
    if (href.startsWith('/') || href.includes(hostname)) {
      internalLinks++;
    } else if (href.startsWith('http')) {
      externalLinks++;
    }
  }

  return { url, title, description, h1, wordCount, imageCount, imagesWithoutAlt, internalLinks, externalLinks, htmlSize: html.length };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { urls } = await req.json();

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return new Response(JSON.stringify({ error: 'Укажите хотя бы один URL' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (urls.length > 5) {
      return new Response(JSON.stringify({ error: 'Максимум 5 URL' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: CompetitorData[] = await Promise.all(
      urls.map(async (rawUrl: string) => {
        let url = rawUrl.trim();
        if (!url.startsWith('http')) url = `https://${url}`;
        try {
          const res = await fetch(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OwndevBot/1.0)' },
            redirect: 'follow',
          });
          const html = await res.text();
          return analyzeHtml(html, url);
        } catch (e) {
          return { url, title: '', description: '', h1: '', wordCount: 0, imageCount: 0, imagesWithoutAlt: 0, internalLinks: 0, externalLinks: 0, htmlSize: 0, error: e instanceof Error ? e.message : 'Ошибка загрузки' };
        }
      })
    );

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Ошибка сервера' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
