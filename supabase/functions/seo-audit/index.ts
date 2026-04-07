const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AuditIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  recommendation: string;
  category: 'seo' | 'llm';
  details?: string[];
  context?: string;
  priority: 'P1' | 'P2' | 'P3';
  confidence: number;
  source: 'html' | 'headers' | 'dom' | 'heuristic' | 'external';
}

async function checkUrl(url: string, timeout = 5000): Promise<{ ok: boolean; status: number; error?: string }> {
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    const resp = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow', headers: { 'User-Agent': 'OWNDEV-SEO-Auditor/1.0' } });
    clearTimeout(id);
    return { ok: resp.ok, status: resp.status };
  } catch (e: any) {
    return { ok: false, status: 0, error: e.message };
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(JSON.stringify({ error: 'URL is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid URL' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const startTime = Date.now();
    const response = await fetch(parsedUrl.toString(), {
      headers: { 'User-Agent': 'OWNDEV-SEO-Auditor/1.0' },
      redirect: 'follow',
    });
    const loadTime = Date.now() - startTime;
    const html = await response.text();
    const htmlSize = new TextEncoder().encode(html).length;
    const responseHeaders = Object.fromEntries(response.headers.entries());

    const issues: AuditIssue[] = [];
    let seoScore = 100;
    let llmScore = 100;

    const origin = parsedUrl.origin;

    // ===== PARALLEL CHECKS: robots.txt, sitemap.xml, broken links =====
    const robotsPromise = checkUrl(`${origin}/robots.txt`);
    const sitemapPromise = checkUrl(`${origin}/sitemap.xml`);

    // Extract internal links for broken link checking
    const allLinkMatches = [...html.matchAll(/<a[^>]*href=["']([^"'#][^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)];
    const internalLinks: { href: string; anchor: string }[] = [];
    for (const m of allLinkMatches) {
      const href = m[1];
      if (href.startsWith('/') || href.includes(parsedUrl.hostname)) {
        const fullUrl = href.startsWith('/') ? `${origin}${href}` : href;
        const anchor = m[2].replace(/<[^>]+>/g, '').trim().slice(0, 60);
        internalLinks.push({ href: fullUrl, anchor });
      }
    }
    // Check up to 10 unique internal links for broken ones
    const uniqueLinks = [...new Map(internalLinks.map(l => [l.href, l])).values()].slice(0, 10);
    const brokenLinkChecks = uniqueLinks.map(async (link) => {
      const result = await checkUrl(link.href);
      return { ...link, ...result };
    });

    const [robotsResult, sitemapResult, ...brokenResults] = await Promise.all([
      robotsPromise,
      sitemapPromise,
      ...brokenLinkChecks,
    ]);

    // ===== HTTPS CHECK =====
    const isHttps = parsedUrl.protocol === 'https:';
    if (!isHttps) {
      issues.push({ type: 'https', severity: 'critical', message: 'Сайт не использует HTTPS', recommendation: 'Переведите сайт на HTTPS — установите SSL-сертификат', category: 'seo', details: [`Протокол: ${parsedUrl.protocol}`], context: 'HTTPS — обязательный фактор ранжирования Google с 2014 года. Без него браузеры показывают предупреждение «Не защищено».', priority: 'P1', confidence: 95, source: 'headers' });
      seoScore -= 15;
    }

    // ===== ROBOTS.TXT =====
    if (!robotsResult.ok) {
      issues.push({ type: 'robots_txt', severity: 'critical', message: `Файл robots.txt недоступен (${robotsResult.status || 'ошибка'})`, recommendation: 'Создайте robots.txt в корне сайта с правилами для краулеров', category: 'seo', details: [`URL: ${origin}/robots.txt`, `Статус: ${robotsResult.status || robotsResult.error}`], context: 'Без robots.txt поисковики не знают какие страницы индексировать, а какие пропустить.', priority: 'P1', confidence: 90, source: 'external' });
      seoScore -= 10;
    }

    // ===== SITEMAP.XML =====
    if (!sitemapResult.ok) {
      issues.push({ type: 'sitemap_xml', severity: 'warning', message: `Файл sitemap.xml недоступен (${sitemapResult.status || 'ошибка'})`, recommendation: 'Создайте и разместите sitemap.xml — помогает краулерам находить все страницы', category: 'seo', details: [`URL: ${origin}/sitemap.xml`, `Статус: ${sitemapResult.status || sitemapResult.error}`], context: 'Sitemap ускоряет индексацию и помогает поисковикам обнаружить глубокие страницы.', priority: 'P2', confidence: 90, source: 'external' });
      seoScore -= 7;
    }

    // ===== BROKEN LINKS =====
    const brokenLinks = brokenResults.filter(r => !r.ok && r.status !== 0);
    if (brokenLinks.length > 0) {
      issues.push({
        type: 'broken_links', severity: brokenLinks.length >= 3 ? 'critical' : 'warning',
        message: `${brokenLinks.length} битых внутренних ссылок`,
        recommendation: 'Исправьте или удалите нерабочие ссылки',
        category: 'seo',
        details: brokenLinks.slice(0, 5).map(l => `• ${l.href} → ${l.status}${l.anchor ? ` (текст: "${l.anchor}")` : ''}`),
        context: 'Битые ссылки ухудшают краулинг, пользовательский опыт и тратят краулинговый бюджет.',
        priority: brokenLinks.length >= 3 ? 'P1' : 'P2', confidence: 90, source: 'external',
      });
      seoScore -= Math.min(15, brokenLinks.length * 3);
    }

    // ===== META ROBOTS / X-ROBOTS-TAG =====
    const metaRobotsMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
    const xRobotsTag = responseHeaders['x-robots-tag'] || '';
    const robotsContent = metaRobotsMatch ? metaRobotsMatch[1] : '';
    if (robotsContent.includes('noindex') || xRobotsTag.includes('noindex')) {
      issues.push({ type: 'meta_robots', severity: 'critical', message: 'Страница помечена как noindex', recommendation: 'Удалите noindex если страница должна индексироваться', category: 'seo', details: [robotsContent ? `• meta robots: "${robotsContent}"` : '', xRobotsTag ? `• X-Robots-Tag: "${xRobotsTag}"` : ''].filter(Boolean), context: 'Noindex полностью блокирует страницу от появления в поиске.', priority: 'P1', confidence: 95, source: xRobotsTag.includes('noindex') ? 'headers' : 'html' });
      seoScore -= 20;
    }
    if (robotsContent.includes('nofollow') || xRobotsTag.includes('nofollow')) {
      issues.push({ type: 'meta_nofollow', severity: 'warning', message: 'Страница помечена как nofollow', recommendation: 'Убедитесь что nofollow установлен намеренно', category: 'seo', details: [robotsContent ? `• meta robots: "${robotsContent}"` : '', xRobotsTag ? `• X-Robots-Tag: "${xRobotsTag}"` : ''].filter(Boolean), context: 'Nofollow запрещает передачу ссылочного веса с этой страницы.', priority: 'P2', confidence: 95, source: xRobotsTag.includes('nofollow') ? 'headers' : 'html' });
      seoScore -= 5;
    }

    // ===== TITLE =====
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) {
      issues.push({ type: 'title', severity: 'critical', message: 'Тег <title> отсутствует', recommendation: 'Добавьте уникальный title длиной 50-60 символов', category: 'seo', context: 'Title — один из главных факторов ранжирования. Без него страница плохо отображается в поиске.', priority: 'P1', confidence: 95, source: 'html' });
      seoScore -= 15;
    } else if (title.length < 30) {
      issues.push({ type: 'title', severity: 'warning', message: `Title слишком короткий (${title.length} симв.)`, recommendation: 'Увеличьте длину title до 50-60 символов', category: 'seo', details: [`Текущий title: "${title}"`], context: 'Короткий title не раскрывает содержание страницы и теряет потенциальные клики.', priority: 'P2', confidence: 90, source: 'html' });
      seoScore -= 5;
    } else if (title.length > 70) {
      issues.push({ type: 'title', severity: 'warning', message: `Title слишком длинный (${title.length} симв.)`, recommendation: 'Сократите title до 60 символов', category: 'seo', details: [`Текущий title: "${title.slice(0, 80)}…"`], context: 'Длинный title обрезается в поисковой выдаче.', priority: 'P2', confidence: 90, source: 'html' });
      seoScore -= 5;
    }

    // ===== META DESCRIPTION =====
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
      || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : '';
    if (!description) {
      issues.push({ type: 'meta_description', severity: 'critical', message: 'Meta description отсутствует', recommendation: 'Добавьте meta description длиной 150-160 символов', category: 'seo', context: 'Description отображается в сниппете поиска и влияет на CTR.', priority: 'P1', confidence: 95, source: 'html' });
      seoScore -= 15;
    } else if (description.length < 100) {
      issues.push({ type: 'meta_description', severity: 'warning', message: `Meta description короткий (${description.length} симв.)`, recommendation: 'Увеличьте до 150-160 символов', category: 'seo', details: [`Текущий: "${description}"`], context: 'Короткий description не полностью использует место в поисковой выдаче.', priority: 'P2', confidence: 90, source: 'html' });
      seoScore -= 5;
    } else if (description.length > 170) {
      issues.push({ type: 'meta_description', severity: 'info', message: `Meta description длинный (${description.length} симв.)`, recommendation: 'Сократите до 160 символов', category: 'seo', details: [`Текущий: "${description.slice(0, 100)}…"`], priority: 'P3', confidence: 90, source: 'html' });
      seoScore -= 3;
    }

    // ===== TITLE vs DESCRIPTION DUPLICATION =====
    if (title && description && title.toLowerCase().trim() === description.toLowerCase().trim()) {
      issues.push({ type: 'title_desc_duplicate', severity: 'warning', message: 'Title и Description идентичны', recommendation: 'Сделайте Description расширенным описанием, отличным от Title', category: 'seo', details: [`Title: "${title.slice(0, 60)}"`, `Description: "${description.slice(0, 60)}"`], context: 'Дублирование title и description — упущенная возможность привлечь клики.', priority: 'P2', confidence: 95, source: 'html' });
      seoScore -= 5;
    }

    // ===== H1 =====
    const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    const h1Texts = h1Matches.map(m => m.replace(/<[^>]+>/g, '').trim());
    if (h1Matches.length === 0) {
      issues.push({ type: 'h1', severity: 'critical', message: 'Тег H1 отсутствует', recommendation: 'Добавьте один H1 с основным ключевым словом', category: 'seo', context: 'H1 — главный заголовок страницы, сообщает поисковикам основную тему.', priority: 'P1', confidence: 95, source: 'html' });
      seoScore -= 15;
    } else if (h1Matches.length > 1) {
      issues.push({ type: 'h1', severity: 'warning', message: `Несколько H1 на странице (${h1Matches.length})`, recommendation: 'Оставьте только один H1', category: 'seo', details: h1Texts.slice(0, 3).map(t => `• "${t.slice(0, 60)}"`), context: 'Несколько H1 размывают главную тему страницы.', priority: 'P2', confidence: 95, source: 'html' });
      seoScore -= 5;
    }

    // ===== IMAGES WITHOUT ALT =====
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    const imgsWithoutAlt = imgTags.filter((img) => !img.match(/alt=["'][^"']+["']/i));
    const imgsWithoutAltCount = imgsWithoutAlt.length;
    if (imgsWithoutAltCount > 0) {
      const srcExamples = imgsWithoutAlt.slice(0, 5).map(img => {
        const srcMatch = img.match(/src=["']([^"']+)["']/i);
        return srcMatch ? `• ${srcMatch[1].slice(0, 80)} — нет alt` : '• (src не найден)';
      });
      issues.push({
        type: 'images_alt', severity: imgsWithoutAltCount > 5 ? 'critical' : 'warning',
        message: `${imgsWithoutAltCount} из ${imgTags.length} изображений без alt`,
        recommendation: 'Добавьте описательные alt-атрибуты к каждому изображению',
        category: 'seo',
        details: [
          ...srcExamples,
          ...(imgsWithoutAltCount > 5 ? [`…и ещё ${imgsWithoutAltCount - 5}`] : []),
        ],
        context: 'Alt-атрибуты помогают поисковикам и AI-системам понять содержимое изображений. Также важны для доступности.',
        priority: imgsWithoutAltCount > 5 ? 'P1' : 'P2', confidence: 95, source: 'html',
      });
      seoScore -= Math.min(15, imgsWithoutAltCount * 2);
    }

    // ===== PAGE SIZE =====
    const sizeKB = Math.round(htmlSize / 1024);
    if (sizeKB > 500) {
      issues.push({ type: 'page_size', severity: 'critical', message: `HTML слишком тяжёлый (${sizeKB} КБ)`, recommendation: 'Оптимизируйте HTML — удалите лишний код, инлайн-стили', category: 'seo', context: 'Тяжёлый HTML замедляет загрузку и индексацию.', priority: 'P2', confidence: 60, source: 'heuristic' });
      seoScore -= 10;
    } else if (sizeKB > 200) {
      issues.push({ type: 'page_size', severity: 'warning', message: `HTML тяжеловат (${sizeKB} КБ)`, recommendation: 'Рассмотрите минификацию', category: 'seo', priority: 'P3', confidence: 55, source: 'heuristic' });
      seoScore -= 5;
    }

    // ===== LOAD TIME =====
    if (loadTime > 3000) {
      issues.push({ type: 'speed', severity: 'critical', message: `Медленная загрузка (${(loadTime / 1000).toFixed(1)}с)`, recommendation: 'Оптимизируйте серверный ответ', category: 'seo', context: 'Скорость загрузки — фактор ранжирования Google.', priority: 'P2', confidence: 50, source: 'heuristic' });
      seoScore -= 10;
    } else if (loadTime > 1500) {
      issues.push({ type: 'speed', severity: 'warning', message: `Загрузка ${(loadTime / 1000).toFixed(1)}с`, recommendation: 'Можно ускорить', category: 'seo', priority: 'P3', confidence: 50, source: 'heuristic' });
      seoScore -= 3;
    }

    // ===== VIEWPORT =====
    if (!html.match(/<meta[^>]*name=["']viewport["']/i)) {
      issues.push({ type: 'viewport', severity: 'critical', message: 'Нет meta viewport', recommendation: 'Добавьте <meta name="viewport" content="width=device-width, initial-scale=1">', category: 'seo', context: 'Без viewport страница не адаптирована для мобильных устройств.', priority: 'P2', confidence: 95, source: 'html' });
      seoScore -= 10;
    }

    // ===== CANONICAL =====
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    if (!canonicalMatch) {
      issues.push({ type: 'canonical', severity: 'info', message: 'Нет canonical-ссылки', recommendation: 'Добавьте <link rel="canonical"> для предотвращения дублей', category: 'seo', context: 'Canonical указывает поисковикам предпочтительную версию страницы.', priority: 'P3', confidence: 90, source: 'html' });
      seoScore -= 3;
    }

    // ===== HREFLANG =====
    const hreflangMatches = html.match(/<link[^>]*hreflang=["']([^"']+)["']/gi) || [];
    if (hreflangMatches.length > 0) {
      const langs = hreflangMatches.map(m => {
        const lm = m.match(/hreflang=["']([^"']+)["']/i);
        return lm ? lm[1] : '';
      }).filter(Boolean);
      issues.push({ type: 'hreflang', severity: 'info', message: `Найдены hreflang теги (${langs.length})`, recommendation: 'Убедитесь что hreflang настроен корректно', category: 'seo', details: langs.slice(0, 5).map(l => `• ${l}`), priority: 'P3', confidence: 85, source: 'html' });
    }

    // ===== OPEN GRAPH =====
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (!ogTitleMatch) {
      const missingOg = ['og:title', !ogDescMatch && 'og:description', !ogImageMatch && 'og:image'].filter(Boolean);
      issues.push({ type: 'og_tags', severity: 'info', message: 'Open Graph теги неполные', recommendation: 'Добавьте og:title, og:description, og:image для красивого превью в соцсетях', category: 'seo', details: missingOg.map(t => `• Отсутствует: ${t}`), context: 'OG-теги управляют превью при расшаривании ссылки в соцсетях и мессенджерах.', priority: 'P3', confidence: 90, source: 'html' });
      seoScore -= 3;
    }

    // ===== BLOCKING RESOURCES IN HEAD =====
    const headMatch = html.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
    if (headMatch) {
      const headContent = headMatch[1];
      const blockingScripts = (headContent.match(/<script(?![^>]*async)(?![^>]*defer)[^>]*src=["']([^"']+)["']/gi) || []);
      const blockingStyles = (headContent.match(/<link[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/gi) || []);
      const totalBlocking = blockingScripts.length + blockingStyles.length;
      if (totalBlocking > 3) {
        issues.push({
          type: 'blocking_resources', severity: 'warning',
          message: `${totalBlocking} блокирующих ресурсов в <head>`,
          recommendation: 'Добавьте async/defer к скриптам, используйте preload для критических стилей',
          category: 'seo',
          details: [
            ...blockingScripts.slice(0, 3).map(s => { const m = s.match(/src=["']([^"']+)["']/i); return m ? `• JS: ${m[1].slice(0, 60)}` : ''; }).filter(Boolean),
            ...blockingStyles.slice(0, 3).map(s => { const m = s.match(/href=["']([^"']+)["']/i); return m ? `• CSS: ${m[1].slice(0, 60)}` : ''; }).filter(Boolean),
          ],
          context: 'Блокирующие ресурсы замедляют рендеринг страницы и ухудшают Core Web Vitals.',
          priority: 'P2', confidence: 65, source: 'heuristic',
        });
        seoScore -= 5;
      }
    }

    // ===== CORE WEB VITALS (HEURISTIC) =====
    const cwv = { lcpScore: 100, clsScore: 100, inpScore: 100, lcpDetails: [] as string[], clsDetails: [] as string[], inpDetails: [] as string[] };

    // LCP: check for preload/fetchpriority on hero images
    const hasPreloadHero = /<link[^>]*rel=["']preload["'][^>]*as=["']image["']/i.test(html);
    const hasFetchPriority = /<img[^>]*fetchpriority=["']high["']/i.test(html);
    if (!hasPreloadHero && !hasFetchPriority) {
      cwv.lcpScore -= 30;
      cwv.lcpDetails.push('Нет preload или fetchpriority="high" для hero-изображения');
      issues.push({ type: 'cwv_lcp_preload', severity: 'warning', message: 'Нет preload/fetchpriority для hero-изображения', recommendation: 'Добавьте <link rel="preload" as="image" href="..."> или fetchpriority="high" на первый <img>', category: 'seo', context: 'Preload и fetchpriority ускоряют загрузку LCP-элемента — главного видимого контента.', priority: 'P2', confidence: 55, source: 'heuristic' });
      seoScore -= 5;
    }
    // LCP: font-display: swap
    const hasFontDisplaySwap = /font-display\s*:\s*swap/i.test(html);
    const hasExternalFonts = /<link[^>]*href=["'][^"']*fonts/i.test(html);
    if (hasExternalFonts && !hasFontDisplaySwap) {
      cwv.lcpScore -= 20;
      cwv.lcpDetails.push('Внешние шрифты без font-display: swap');
      issues.push({ type: 'cwv_lcp_fonts', severity: 'info', message: 'Внешние шрифты без font-display: swap', recommendation: 'Добавьте font-display: swap к @font-face для предотвращения FOIT', category: 'seo', context: 'Без swap текст невидим до загрузки шрифта — это ухудшает LCP.', priority: 'P3', confidence: 60, source: 'heuristic' });
      seoScore -= 3;
    }
    // LCP: large HTML
    if (sizeKB > 300) { cwv.lcpScore -= 20; cwv.lcpDetails.push(`HTML ${sizeKB} КБ — тяжёлый документ`); }

    // CLS: images without width/height
    const imgsWithoutDimensions = imgTags.filter(img => !(/width=["']\d+/i.test(img) && /height=["']\d+/i.test(img)) && !/aspect-ratio/i.test(img));
    if (imgsWithoutDimensions.length > 0) {
      const penalty = Math.min(40, imgsWithoutDimensions.length * 5);
      cwv.clsScore -= penalty;
      const examples = imgsWithoutDimensions.slice(0, 3).map(img => {
        const src = img.match(/src=["']([^"']+)["']/i);
        return src ? `• ${src[1].slice(0, 60)}` : '• (img без src)';
      });
      cwv.clsDetails.push(`${imgsWithoutDimensions.length} из ${imgTags.length} изображений без width/height`);
      issues.push({ type: 'cwv_cls_dimensions', severity: imgsWithoutDimensions.length > 5 ? 'warning' : 'info', message: `${imgsWithoutDimensions.length} изображений без width/height атрибутов`, recommendation: 'Добавьте width и height к каждому <img> для предотвращения CLS', category: 'seo', details: examples, context: 'Без размеров браузер не может зарезервировать место — это вызывает сдвиг макета (CLS).', priority: 'P2', confidence: 60, source: 'heuristic' });
      seoScore -= Math.min(5, imgsWithoutDimensions.length);
    }
    // CLS: iframes without dimensions
    const iframes = html.match(/<iframe[^>]*>/gi) || [];
    const iframesNoDims = iframes.filter(f => !(/width/i.test(f) && /height/i.test(f)));
    if (iframesNoDims.length > 0) {
      cwv.clsScore -= 15;
      cwv.clsDetails.push(`${iframesNoDims.length} iframe без размеров`);
    }

    // INP: heavy inline scripts in head
    if (headMatch) {
      const inlineScripts = (headMatch[1].match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi) || []);
      const heavyInline = inlineScripts.filter(s => s.length > 1000);
      if (heavyInline.length > 0) {
        cwv.inpScore -= Math.min(30, heavyInline.length * 15);
        cwv.inpDetails.push(`${heavyInline.length} тяжёлых inline-скриптов в <head>`);
        issues.push({ type: 'cwv_inp_inline', severity: 'info', message: `${heavyInline.length} тяжёлых inline-скриптов в <head>`, recommendation: 'Вынесите тяжёлые скрипты в отдельные файлы с async/defer', category: 'seo', context: 'Тяжёлые inline-скрипты блокируют главный поток и ухудшают INP.', priority: 'P3', confidence: 55, source: 'heuristic' });
        seoScore -= 3;
      }
    }
    // INP: scripts without async/defer
    const allScriptsWithSrc = html.match(/<script[^>]*src=["'][^"']+["'][^>]*>/gi) || [];
    const scriptsNoAsync = allScriptsWithSrc.filter(s => !(/async/i.test(s) || /defer/i.test(s) || /type=["']module["']/i.test(s)));
    if (scriptsNoAsync.length > 2) {
      cwv.inpScore -= 20;
      cwv.inpDetails.push(`${scriptsNoAsync.length} скриптов без async/defer`);
    }

    // Lazy loading check
    const hasLazyImages = imgTags.some(img => /loading=["']lazy["']/i.test(img));
    if (imgTags.length > 3 && !hasLazyImages) {
      cwv.lcpScore -= 10;
      cwv.lcpDetails.push('Нет lazy loading для изображений');
      issues.push({ type: 'cwv_lazy', severity: 'info', message: 'Нет loading="lazy" на изображениях', recommendation: 'Добавьте loading="lazy" ко всем изображениям ниже первого экрана', category: 'seo', context: 'Lazy loading экономит ресурсы и ускоряет начальную загрузку.', priority: 'P3', confidence: 60, source: 'heuristic' });
    }

    cwv.lcpScore = Math.max(0, Math.min(100, cwv.lcpScore));
    cwv.clsScore = Math.max(0, Math.min(100, cwv.clsScore));
    cwv.inpScore = Math.max(0, Math.min(100, cwv.inpScore));

    // ===== LLM CHECKS =====

    // JSON-LD structured data
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    const jsonLdTypes: string[] = [];
    jsonLdMatches.forEach(match => {
      const contentMatch = match.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      if (contentMatch) {
        try {
          const parsed = JSON.parse(contentMatch[1]);
          const type = parsed['@type'] || (Array.isArray(parsed['@graph']) ? parsed['@graph'].map((g: any) => g['@type']).join(', ') : 'unknown');
          jsonLdTypes.push(type);
        } catch { /* skip */ }
      }
    });

    if (jsonLdMatches.length === 0) {
      issues.push({ type: 'json_ld', severity: 'critical', message: 'Нет JSON-LD структурированных данных', recommendation: 'Добавьте Schema.org разметку (Article, FAQPage, LocalBusiness)', category: 'llm', context: 'Структурированные данные — критически важны для AI-цитирования и rich snippets в поиске.', priority: 'P1', confidence: 75, source: 'html' });
      llmScore -= 20;
    } else {
      issues.push({ type: 'json_ld_found', severity: 'info', message: `Найдено ${jsonLdMatches.length} блоков JSON-LD`, recommendation: 'Проверьте полноту разметки', category: 'llm', details: jsonLdTypes.map(t => `• Тип: ${t}`), priority: 'P3', confidence: 80, source: 'html' });

      const jsonLdContent = jsonLdMatches.join(' ').toLowerCase();
      if (!jsonLdContent.includes('faqpage')) {
        issues.push({ type: 'json_ld_faq', severity: 'warning', message: 'Нет FAQPage в структурированных данных', recommendation: 'Добавьте FAQPage Schema — FAQ-блоки часто цитируются AI-системами', category: 'llm', context: 'FAQ-разметка позволяет получить расширенный сниппет и увеличивает шансы на AI-цитирование.', priority: 'P2', confidence: 75, source: 'html' });
        llmScore -= 10;
      }
    }

    // FAQ block in HTML
    const hasFaqSection = /faq|часто\s*задаваемые|вопрос.*ответ/i.test(html);
    const hasDetailsSummary = /<details[\s>]/i.test(html);
    const hasFaqHeading = /<h[2-3][^>]*>[^<]*(faq|чзв|вопрос|q&a)/i.test(html);
    if (!hasFaqSection && !hasDetailsSummary && !hasFaqHeading) {
      issues.push({ type: 'faq_block', severity: 'warning', message: 'Нет FAQ-блока на странице', recommendation: 'Добавьте раздел «Вопросы и ответы» — LLM активно цитируют Q&A контент', category: 'llm', context: 'Вопросно-ответный формат — самый цитируемый AI-системами тип контента.', priority: 'P2', confidence: 65, source: 'heuristic' });
      llmScore -= 10;
    }

    // H2 headers as questions (LLM-friendly)
    const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
    const h2Texts = h2Matches.map(m => m.replace(/<[^>]+>/g, '').trim());
    const questionH2 = h2Texts.filter(t => /\?$/.test(t) || /^(как|что|почему|когда|где|зачем|какой|какие|сколько|можно|нужно|стоит|what|how|why|when|where|which|can|should|do|does|is|are)/i.test(t));
    if (h2Texts.length >= 3 && questionH2.length === 0) {
      issues.push({
        type: 'h2_questions', severity: 'warning',
        message: `H2 заголовки не в формате вопросов (0 из ${h2Texts.length})`,
        recommendation: 'Переформулируйте H2 в вопросы: "Какие услуги мы предоставляем?" вместо "Наши услуги"',
        category: 'llm',
        details: h2Texts.slice(0, 4).map(t => `• "${t.slice(0, 50)}" — не вопрос`),
        context: 'LLM-системы чаще цитируют контент в формате вопрос-ответ. Переформулируйте заголовки.',
        priority: 'P2', confidence: 70, source: 'html',
      });
      llmScore -= 10;
    } else if (h2Texts.length >= 3 && questionH2.length < h2Texts.length / 2) {
      issues.push({
        type: 'h2_questions', severity: 'info',
        message: `Только ${questionH2.length} из ${h2Texts.length} H2 в формате вопросов`,
        recommendation: 'Больше H2-вопросов увеличивает шансы на AI-цитирование',
        category: 'llm',
        details: h2Texts.filter(t => !questionH2.includes(t)).slice(0, 3).map(t => `• "${t.slice(0, 50)}" — можно переформулировать`),
        priority: 'P3', confidence: 65, source: 'html',
      });
      llmScore -= 5;
    }

    // Lists (ul/ol)
    const listCount = (html.match(/<(ul|ol)[\s>]/gi) || []).length;
    if (listCount === 0) {
      issues.push({ type: 'lists', severity: 'info', message: 'Нет маркированных или нумерованных списков', recommendation: 'Используйте списки для структурирования контента', category: 'llm', context: 'AI-системы лучше извлекают и цитируют информацию из структурированных списков.', priority: 'P3', confidence: 70, source: 'html' });
      llmScore -= 5;
    }

    // Subheadings
    const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
    const h3Count = (html.match(/<h3[\s>]/gi) || []).length;
    if (h2Count < 2) {
      issues.push({ type: 'subheadings', severity: 'warning', message: `Мало подзаголовков H2 (${h2Count})`, recommendation: 'Добавьте минимум 3-4 H2 для структурирования контента', category: 'llm', context: 'Подзаголовки помогают LLM разбить страницу на тематические секции.', priority: 'P2', confidence: 85, source: 'html' });
      llmScore -= 10;
    }
    if (h3Count === 0 && h2Count > 0) {
      issues.push({ type: 'h3_missing', severity: 'info', message: 'Нет подзаголовков H3', recommendation: 'Используйте H3 для детализации разделов', category: 'llm', priority: 'P3', confidence: 80, source: 'html' });
      llmScore -= 3;
    }

    // Content length
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    const wordCount = bodyText.split(/\s+/).length;
    if (wordCount < 300) {
      issues.push({ type: 'content_length', severity: 'warning', message: `Мало текстового контента (~${wordCount} слов)`, recommendation: 'Увеличьте объём контента до 800+ слов', category: 'llm', context: 'Короткие страницы редко цитируются AI — им не хватает контекста для генерации ответа.', priority: 'P2', confidence: 60, source: 'heuristic' });
      llmScore -= 15;
    } else if (wordCount < 600) {
      issues.push({ type: 'content_length', severity: 'info', message: `Текста маловато (~${wordCount} слов)`, recommendation: 'Рекомендуется 800-2000 слов для лучшего цитирования AI-системами', category: 'llm', priority: 'P3', confidence: 55, source: 'heuristic' });
      llmScore -= 5;
    }

    // Tables
    const tableCount = (html.match(/<table[\s>]/gi) || []).length;
    if (tableCount === 0 && wordCount > 500) {
      issues.push({ type: 'tables', severity: 'info', message: 'Нет таблиц на странице', recommendation: 'Таблицы помогают AI извлекать сравнительную информацию', category: 'llm', priority: 'P3', confidence: 60, source: 'heuristic' });
      llmScore -= 3;
    }

    // Lang attribute
    const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    if (!langMatch) {
      issues.push({ type: 'lang', severity: 'info', message: 'Нет атрибута lang у <html>', recommendation: 'Добавьте lang="ru" (или другой)', category: 'llm', context: 'Атрибут lang помогает AI определить язык контента и корректно его цитировать.', priority: 'P3', confidence: 90, source: 'html' });
      llmScore -= 3;
    }

    seoScore = Math.max(0, Math.min(100, seoScore));
    llmScore = Math.max(0, Math.min(100, llmScore));

    const seoIssues = issues.filter(i => i.category === 'seo');
    const llmIssues = issues.filter(i => i.category === 'llm');

    const seoCritical = seoIssues.filter(i => i.severity === 'critical').length;
    const llmCritical = llmIssues.filter(i => i.severity === 'critical').length;

    let summary = '';
    if (seoScore >= 80 && llmScore >= 80) {
      summary = 'Страница в хорошем состоянии для SEO и AI-поиска.';
    } else if (seoScore < 50 || llmScore < 50) {
      summary = 'Найдены серьёзные проблемы. ';
    } else {
      summary = 'Страница нуждается в доработке. ';
    }
    if (seoCritical) summary += `SEO: ${seoCritical} критических. `;
    if (llmCritical) summary += `LLM: ${llmCritical} критических. `;
    summary += 'Исправьте критические проблемы в первую очередь.';

    // Calculate overall confidence
    const avgConfidence = issues.length > 0
      ? Math.round(issues.reduce((sum, i) => sum + i.confidence, 0) / issues.length)
      : 75;

    return new Response(
      JSON.stringify({
        seoScore,
        llmScore,
        confidence: avgConfidence,
        issues,
        summary,
        meta: {
          url: parsedUrl.toString(),
          title: title || null,
          description: description || null,
          htmlSizeKB: sizeKB,
          loadTimeMs: loadTime,
          totalImages: imgTags.length,
          imagesWithoutAlt: imgsWithoutAltCount,
          wordCount,
          h2Count,
          jsonLdCount: jsonLdMatches.length,
          isHttps,
          hasRobotsTxt: robotsResult.ok,
          hasSitemapXml: sitemapResult.ok,
          brokenLinksCount: brokenLinks.length,
          lang: langMatch ? langMatch[1] : null,
          cwv: {
            lcp: cwv.lcpScore,
            cls: cwv.clsScore,
            inp: cwv.inpScore,
            lcpDetails: cwv.lcpDetails,
            clsDetails: cwv.clsDetails,
            inpDetails: cwv.inpDetails,
          },
          imgsWithoutDimensions: imgsWithoutDimensions.length,
          hasLazyImages,
          hasFontDisplaySwap,
          hasPreloadHero: hasPreloadHero || hasFetchPriority,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: `Не удалось загрузить страницу: ${error.message}` }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
