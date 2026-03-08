const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface AuditIssue {
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  recommendation: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const startTime = Date.now();
    const response = await fetch(parsedUrl.toString(), {
      headers: { 'User-Agent': 'OWNDEV-SEO-Auditor/1.0' },
      redirect: 'follow',
    });
    const loadTime = Date.now() - startTime;
    const html = await response.text();
    const htmlSize = new TextEncoder().encode(html).length;

    const issues: AuditIssue[] = [];
    let score = 100;

    // Title check
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) {
      issues.push({ type: 'title', severity: 'critical', message: 'Тег <title> отсутствует', recommendation: 'Добавьте уникальный title длиной 50-60 символов' });
      score -= 15;
    } else if (title.length < 30) {
      issues.push({ type: 'title', severity: 'warning', message: `Title слишком короткий (${title.length} симв.)`, recommendation: 'Увеличьте длину title до 50-60 символов' });
      score -= 5;
    } else if (title.length > 70) {
      issues.push({ type: 'title', severity: 'warning', message: `Title слишком длинный (${title.length} симв.)`, recommendation: 'Сократите title до 60 символов, чтобы он не обрезался в выдаче' });
      score -= 5;
    }

    // Meta description check
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
      || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : '';
    if (!description) {
      issues.push({ type: 'meta_description', severity: 'critical', message: 'Meta description отсутствует', recommendation: 'Добавьте meta description длиной 150-160 символов' });
      score -= 15;
    } else if (description.length < 100) {
      issues.push({ type: 'meta_description', severity: 'warning', message: `Meta description короткий (${description.length} симв.)`, recommendation: 'Увеличьте до 150-160 символов' });
      score -= 5;
    } else if (description.length > 170) {
      issues.push({ type: 'meta_description', severity: 'info', message: `Meta description длинный (${description.length} симв.)`, recommendation: 'Сократите до 160 символов' });
      score -= 3;
    }

    // H1 check
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (!h1Match) {
      issues.push({ type: 'h1', severity: 'critical', message: 'Тег H1 отсутствует', recommendation: 'Добавьте один H1 с основным ключевым словом' });
      score -= 15;
    } else {
      const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
      if (h1Count > 1) {
        issues.push({ type: 'h1', severity: 'warning', message: `Несколько H1 на странице (${h1Count})`, recommendation: 'Оставьте только один H1' });
        score -= 5;
      }
    }

    // Images without alt
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    const imgsWithoutAlt = imgTags.filter(
      (img) => !img.match(/alt=["'][^"']+["']/i)
    ).length;
    if (imgsWithoutAlt > 0) {
      const sev = imgsWithoutAlt > 5 ? 'critical' : 'warning';
      issues.push({ type: 'images_alt', severity: sev, message: `${imgsWithoutAlt} из ${imgTags.length} изображений без alt`, recommendation: 'Добавьте описательные alt-атрибуты ко всем изображениям' });
      score -= Math.min(15, imgsWithoutAlt * 2);
    }

    // Page size
    const sizeKB = Math.round(htmlSize / 1024);
    if (sizeKB > 500) {
      issues.push({ type: 'page_size', severity: 'critical', message: `HTML-документ слишком тяжёлый (${sizeKB} КБ)`, recommendation: 'Оптимизируйте HTML, уберите inline-стили и скрипты' });
      score -= 10;
    } else if (sizeKB > 200) {
      issues.push({ type: 'page_size', severity: 'warning', message: `HTML-документ тяжеловат (${sizeKB} КБ)`, recommendation: 'Рассмотрите минификацию HTML' });
      score -= 5;
    }

    // Load time
    if (loadTime > 3000) {
      issues.push({ type: 'speed', severity: 'critical', message: `Медленная загрузка (${(loadTime / 1000).toFixed(1)} сек)`, recommendation: 'Оптимизируйте серверный ответ, включите кэширование' });
      score -= 10;
    } else if (loadTime > 1500) {
      issues.push({ type: 'speed', severity: 'warning', message: `Загрузка ${(loadTime / 1000).toFixed(1)} сек`, recommendation: 'Хорошо, но можно ускорить' });
      score -= 3;
    }

    // Viewport meta
    if (!html.match(/<meta[^>]*name=["']viewport["']/i)) {
      issues.push({ type: 'viewport', severity: 'critical', message: 'Нет meta viewport', recommendation: 'Добавьте <meta name="viewport" content="width=device-width, initial-scale=1">' });
      score -= 10;
    }

    // Canonical
    if (!html.match(/<link[^>]*rel=["']canonical["']/i)) {
      issues.push({ type: 'canonical', severity: 'info', message: 'Нет canonical-ссылки', recommendation: 'Добавьте <link rel="canonical"> для предотвращения дублей' });
      score -= 3;
    }

    // Open Graph
    if (!html.match(/<meta[^>]*property=["']og:title["']/i)) {
      issues.push({ type: 'og_tags', severity: 'info', message: 'Open Graph теги отсутствуют', recommendation: 'Добавьте og:title, og:description, og:image для лучшего отображения в соцсетях' });
      score -= 3;
    }

    score = Math.max(0, Math.min(100, score));

    const criticalCount = issues.filter((i) => i.severity === 'critical').length;
    const warningCount = issues.filter((i) => i.severity === 'warning').length;

    let summary: string;
    if (score >= 80) {
      summary = `Страница в хорошем состоянии (${score}/100). `;
    } else if (score >= 50) {
      summary = `Страница нуждается в доработке (${score}/100). `;
    } else {
      summary = `Критические проблемы с SEO (${score}/100). `;
    }
    if (criticalCount) summary += `Найдено ${criticalCount} критических проблем. `;
    if (warningCount) summary += `${warningCount} предупреждений. `;
    summary += 'Исправьте критические проблемы в первую очередь.';

    return new Response(
      JSON.stringify({
        score,
        issues,
        summary,
        meta: {
          url: parsedUrl.toString(),
          title: title || null,
          description: description || null,
          htmlSizeKB: sizeKB,
          loadTimeMs: loadTime,
          totalImages: imgTags.length,
          imagesWithoutAlt: imgsWithoutAlt,
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
