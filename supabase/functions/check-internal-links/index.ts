const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LinkResult {
  href: string;
  text: string;
  status: number | null;
  ok: boolean;
  isNofollow: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    let parsedUrl: URL;
    try { parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`); } catch { return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }

    const resp = await fetch(parsedUrl.toString(), { headers: { 'User-Agent': 'OWNDEV-LinkChecker/1.0' }, redirect: 'follow' });
    const html = await resp.text();

    // Extract all <a> tags
    const linkRegex = /<a\s[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi;
    const internalLinks: { href: string; text: string; isNofollow: boolean }[] = [];
    const seen = new Set<string>();
    let match;

    while ((match = linkRegex.exec(html)) !== null) {
      const href = match[1];
      const text = match[2].replace(/<[^>]+>/g, '').trim().slice(0, 100);
      const isNofollow = /rel=["'][^"']*nofollow/i.test(match[0]);

      let resolvedUrl: URL;
      try { resolvedUrl = new URL(href, parsedUrl.toString()); } catch { continue; }

      if (resolvedUrl.hostname !== parsedUrl.hostname) continue;
      const normalized = resolvedUrl.origin + resolvedUrl.pathname;
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      internalLinks.push({ href: normalized, text: text || '(без текста)', isNofollow });
    }

    // Check up to 50 links
    const linksToCheck = internalLinks.slice(0, 50);
    const results: LinkResult[] = await Promise.all(
      linksToCheck.map(async (link) => {
        try {
          const r = await fetch(link.href, { method: 'HEAD', headers: { 'User-Agent': 'OWNDEV-LinkChecker/1.0' }, redirect: 'follow' });
          return { ...link, status: r.status, ok: r.status >= 200 && r.status < 400 };
        } catch {
          return { ...link, status: null, ok: false };
        }
      })
    );

    const broken = results.filter(r => !r.ok);
    const working = results.filter(r => r.ok);

    return new Response(JSON.stringify({
      url: parsedUrl.toString(),
      totalFound: internalLinks.length,
      checked: results.length,
      working: working.length,
      broken: broken.length,
      links: results,
      unchecked: internalLinks.length > 50 ? internalLinks.length - 50 : 0,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Ошибка: ${error.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
