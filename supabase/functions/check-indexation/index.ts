const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { url } = await req.json();
    if (!url) return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    let parsedUrl: URL;
    try { parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`); } catch { return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }); }

    const response = await fetch(parsedUrl.toString(), {
      headers: { 'User-Agent': 'OWNDEV-IndexChecker/1.0' },
      redirect: 'follow',
    });

    const html = await response.text();
    const headers = Object.fromEntries(response.headers.entries());
    const issues: { type: string; severity: 'error' | 'warning' | 'ok'; message: string; detail: string }[] = [];

    // Status code
    if (response.status !== 200) {
      issues.push({ type: 'status', severity: 'error', message: `HTTP ${response.status}`, detail: `Страница вернула статус ${response.status}. Для индексации нужен 200.` });
    } else {
      issues.push({ type: 'status', severity: 'ok', message: 'HTTP 200', detail: 'Статус ответа в норме.' });
    }

    // X-Robots-Tag header
    const xRobots = headers['x-robots-tag'] || '';
    if (/noindex/i.test(xRobots)) {
      issues.push({ type: 'x-robots-tag', severity: 'error', message: 'X-Robots-Tag: noindex', detail: 'HTTP-заголовок запрещает индексацию.' });
    } else if (xRobots) {
      issues.push({ type: 'x-robots-tag', severity: 'warning', message: `X-Robots-Tag: ${xRobots}`, detail: 'Проверьте директивы в заголовке.' });
    } else {
      issues.push({ type: 'x-robots-tag', severity: 'ok', message: 'X-Robots-Tag не задан', detail: 'Заголовок не ограничивает индексацию.' });
    }

    // Meta robots
    const metaRobotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i)
      || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']robots["']/i);
    const metaRobots = metaRobotsMatch ? metaRobotsMatch[1] : '';
    if (/noindex/i.test(metaRobots)) {
      issues.push({ type: 'meta-robots', severity: 'error', message: 'Meta robots: noindex', detail: `Найдено: <meta name="robots" content="${metaRobots}">` });
    } else if (/nofollow/i.test(metaRobots)) {
      issues.push({ type: 'meta-robots', severity: 'warning', message: 'Meta robots: nofollow', detail: 'Ссылки на странице не передают вес.' });
    } else if (metaRobots) {
      issues.push({ type: 'meta-robots', severity: 'ok', message: `Meta robots: ${metaRobots}`, detail: 'Директивы не запрещают индексацию.' });
    } else {
      issues.push({ type: 'meta-robots', severity: 'ok', message: 'Meta robots не задан', detail: 'По умолчанию индексация разрешена.' });
    }

    // Canonical
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i)
      || html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
    const canonical = canonicalMatch ? canonicalMatch[1] : '';
    if (!canonical) {
      issues.push({ type: 'canonical', severity: 'warning', message: 'Canonical не указан', detail: 'Рекомендуется указать canonical для предотвращения дублей.' });
    } else if (canonical !== parsedUrl.toString() && canonical !== parsedUrl.toString().replace(/\/$/, '')) {
      issues.push({ type: 'canonical', severity: 'warning', message: 'Canonical отличается от URL', detail: `Canonical: ${canonical}. Поисковик будет индексировать canonical-URL.` });
    } else {
      issues.push({ type: 'canonical', severity: 'ok', message: 'Canonical совпадает с URL', detail: `Canonical: ${canonical}` });
    }

    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) {
      issues.push({ type: 'title', severity: 'error', message: 'Title отсутствует', detail: 'Без title страница плохо индексируется.' });
    } else {
      issues.push({ type: 'title', severity: 'ok', message: `Title: ${title.slice(0, 80)}`, detail: `Длина: ${title.length} символов` });
    }

    // Description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i);
    const desc = descMatch ? descMatch[1].trim() : '';
    if (!desc) {
      issues.push({ type: 'description', severity: 'warning', message: 'Meta description отсутствует', detail: 'Описание помогает поисковикам и повышает CTR.' });
    } else {
      issues.push({ type: 'description', severity: 'ok', message: `Description (${desc.length} симв.)`, detail: desc.slice(0, 160) });
    }

    // Nofollow links count
    const nofollowLinks = (html.match(/<a[^>]*rel=["'][^"']*nofollow[^"']*["']/gi) || []).length;
    const totalLinks = (html.match(/<a[^>]*href/gi) || []).length;

    const indexable = !(/noindex/i.test(xRobots) || /noindex/i.test(metaRobots)) && response.status === 200;

    return new Response(JSON.stringify({
      url: parsedUrl.toString(),
      indexable,
      statusCode: response.status,
      issues,
      meta: { title, description: desc, canonical, totalLinks, nofollowLinks },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    return new Response(JSON.stringify({ error: `Ошибка: ${error.message}` }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
