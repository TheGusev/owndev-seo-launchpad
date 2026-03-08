const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface UrlCheckResult {
  url: string;
  statusCode: number;
  status: 'ok' | 'redirect' | 'error' | 'noindex';
  noindex: boolean;
  redirectTo?: string;
  error?: string;
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

    if (urls.length > 50) {
      return new Response(JSON.stringify({ error: 'Максимум 50 URL за запрос' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const results: UrlCheckResult[] = await Promise.all(
      urls.map(async (rawUrl: string) => {
        let url = rawUrl.trim();
        if (!url.startsWith('http')) url = `https://${url}`;

        try {
          const res = await fetch(url, {
            method: 'HEAD',
            headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OwndevBot/1.0)' },
            redirect: 'manual',
          });

          const statusCode = res.status;
          const xRobotsTag = res.headers.get('x-robots-tag') || '';
          const noindex = xRobotsTag.toLowerCase().includes('noindex');
          const location = res.headers.get('location') || undefined;

          let status: UrlCheckResult['status'] = 'ok';
          if (noindex) status = 'noindex';
          else if (statusCode >= 300 && statusCode < 400) status = 'redirect';
          else if (statusCode >= 400) status = 'error';

          // If HEAD fails or returns wrong data, try GET for noindex in HTML
          if (status === 'ok' && statusCode === 200) {
            try {
              const getRes = await fetch(url, {
                headers: { 'User-Agent': 'Mozilla/5.0 (compatible; OwndevBot/1.0)' },
                redirect: 'follow',
              });
              const html = await getRes.text();
              if (html.match(/<meta[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex[^"']*["']/i) ||
                  html.match(/<meta[^>]*content=["'][^"']*noindex[^"']*["'][^>]*name=["']robots["']/i)) {
                return { url, statusCode, status: 'noindex' as const, noindex: true };
              }
            } catch { /* ignore GET errors */ }
          }

          return { url, statusCode, status, noindex, redirectTo: location };
        } catch (e) {
          return { url, statusCode: 0, status: 'error' as const, noindex: false, error: e instanceof Error ? e.message : 'Ошибка' };
        }
      })
    );

    return new Response(JSON.stringify({ results }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Ошибка сервера' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
