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

    const issues: AuditIssue[] = [];
    let seoScore = 100;
    let llmScore = 100;

    // ===== SEO CHECKS =====

    // Title
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : '';
    if (!title) {
      issues.push({ type: 'title', severity: 'critical', message: 'Тег <title> отсутствует', recommendation: 'Добавьте уникальный title длиной 50-60 символов', category: 'seo' });
      seoScore -= 15;
    } else if (title.length < 30) {
      issues.push({ type: 'title', severity: 'warning', message: `Title слишком короткий (${title.length} симв.)`, recommendation: 'Увеличьте длину title до 50-60 символов', category: 'seo' });
      seoScore -= 5;
    } else if (title.length > 70) {
      issues.push({ type: 'title', severity: 'warning', message: `Title слишком длинный (${title.length} симв.)`, recommendation: 'Сократите title до 60 символов', category: 'seo' });
      seoScore -= 5;
    }

    // Meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
      || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : '';
    if (!description) {
      issues.push({ type: 'meta_description', severity: 'critical', message: 'Meta description отсутствует', recommendation: 'Добавьте meta description длиной 150-160 символов', category: 'seo' });
      seoScore -= 15;
    } else if (description.length < 100) {
      issues.push({ type: 'meta_description', severity: 'warning', message: `Meta description короткий (${description.length} симв.)`, recommendation: 'Увеличьте до 150-160 символов', category: 'seo' });
      seoScore -= 5;
    } else if (description.length > 170) {
      issues.push({ type: 'meta_description', severity: 'info', message: `Meta description длинный (${description.length} симв.)`, recommendation: 'Сократите до 160 символов', category: 'seo' });
      seoScore -= 3;
    }

    // H1
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    if (!h1Match) {
      issues.push({ type: 'h1', severity: 'critical', message: 'Тег H1 отсутствует', recommendation: 'Добавьте один H1 с основным ключевым словом', category: 'seo' });
      seoScore -= 15;
    } else {
      const h1Count = (html.match(/<h1[^>]*>/gi) || []).length;
      if (h1Count > 1) {
        issues.push({ type: 'h1', severity: 'warning', message: `Несколько H1 на странице (${h1Count})`, recommendation: 'Оставьте только один H1', category: 'seo' });
        seoScore -= 5;
      }
    }

    // Images without alt
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    const imgsWithoutAlt = imgTags.filter((img) => !img.match(/alt=["'][^"']+["']/i)).length;
    if (imgsWithoutAlt > 0) {
      issues.push({ type: 'images_alt', severity: imgsWithoutAlt > 5 ? 'critical' : 'warning', message: `${imgsWithoutAlt} из ${imgTags.length} изображений без alt`, recommendation: 'Добавьте описательные alt-атрибуты', category: 'seo' });
      seoScore -= Math.min(15, imgsWithoutAlt * 2);
    }

    // Page size
    const sizeKB = Math.round(htmlSize / 1024);
    if (sizeKB > 500) {
      issues.push({ type: 'page_size', severity: 'critical', message: `HTML слишком тяжёлый (${sizeKB} КБ)`, recommendation: 'Оптимизируйте HTML', category: 'seo' });
      seoScore -= 10;
    } else if (sizeKB > 200) {
      issues.push({ type: 'page_size', severity: 'warning', message: `HTML тяжеловат (${sizeKB} КБ)`, recommendation: 'Рассмотрите минификацию', category: 'seo' });
      seoScore -= 5;
    }

    // Load time
    if (loadTime > 3000) {
      issues.push({ type: 'speed', severity: 'critical', message: `Медленная загрузка (${(loadTime / 1000).toFixed(1)}с)`, recommendation: 'Оптимизируйте серверный ответ', category: 'seo' });
      seoScore -= 10;
    } else if (loadTime > 1500) {
      issues.push({ type: 'speed', severity: 'warning', message: `Загрузка ${(loadTime / 1000).toFixed(1)}с`, recommendation: 'Можно ускорить', category: 'seo' });
      seoScore -= 3;
    }

    // Viewport
    if (!html.match(/<meta[^>]*name=["']viewport["']/i)) {
      issues.push({ type: 'viewport', severity: 'critical', message: 'Нет meta viewport', recommendation: 'Добавьте meta viewport', category: 'seo' });
      seoScore -= 10;
    }

    // Canonical
    if (!html.match(/<link[^>]*rel=["']canonical["']/i)) {
      issues.push({ type: 'canonical', severity: 'info', message: 'Нет canonical-ссылки', recommendation: 'Добавьте canonical для предотвращения дублей', category: 'seo' });
      seoScore -= 3;
    }

    // Open Graph
    if (!html.match(/<meta[^>]*property=["']og:title["']/i)) {
      issues.push({ type: 'og_tags', severity: 'info', message: 'Open Graph теги отсутствуют', recommendation: 'Добавьте og:title, og:description, og:image', category: 'seo' });
      seoScore -= 3;
    }

    // ===== LLM CHECKS =====

    // JSON-LD structured data
    const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
    if (jsonLdMatches.length === 0) {
      issues.push({ type: 'json_ld', severity: 'critical', message: 'Нет JSON-LD структурированных данных', recommendation: 'Добавьте Schema.org разметку (Article, FAQPage, LocalBusiness) — критично для AI‑цитирования', category: 'llm' });
      llmScore -= 20;
    } else {
      const jsonLdContent = jsonLdMatches.join(' ').toLowerCase();
      if (!jsonLdContent.includes('faqpage')) {
        issues.push({ type: 'json_ld_faq', severity: 'warning', message: 'Нет FAQPage в структурированных данных', recommendation: 'Добавьте FAQPage Schema — FAQ‑блоки часто цитируются AI‑системами', category: 'llm' });
        llmScore -= 10;
      }
    }

    // FAQ block in HTML
    const hasFaqSection = /faq|часто\s*задаваемые|вопрос.*ответ/i.test(html);
    const hasDetailsSummary = /<details[\s>]/i.test(html);
    const hasFaqHeading = /<h[2-3][^>]*>[^<]*(faq|чзв|вопрос|q&a)/i.test(html);
    if (!hasFaqSection && !hasDetailsSummary && !hasFaqHeading) {
      issues.push({ type: 'faq_block', severity: 'warning', message: 'Нет FAQ‑блока на странице', recommendation: 'Добавьте раздел «Вопросы и ответы» — LLM активно цитируют Q&A контент', category: 'llm' });
      llmScore -= 10;
    }

    // Lists (ul/ol) — good for LLM extraction
    const listCount = (html.match(/<(ul|ol)[\s>]/gi) || []).length;
    if (listCount === 0) {
      issues.push({ type: 'lists', severity: 'info', message: 'Нет маркированных или нумерованных списков', recommendation: 'Используйте списки для структурирования контента — AI‑системы лучше извлекают информацию из списков', category: 'llm' });
      llmScore -= 5;
    }

    // Subheadings (H2, H3)
    const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
    const h3Count = (html.match(/<h3[\s>]/gi) || []).length;
    if (h2Count < 2) {
      issues.push({ type: 'subheadings', severity: 'warning', message: `Мало подзаголовков H2 (${h2Count})`, recommendation: 'Добавьте минимум 3-4 H2 для структурирования контента — помогает LLM понять тематику', category: 'llm' });
      llmScore -= 10;
    }
    if (h3Count === 0 && h2Count > 0) {
      issues.push({ type: 'h3_missing', severity: 'info', message: 'Нет подзаголовков H3', recommendation: 'Используйте H3 для детализации разделов', category: 'llm' });
      llmScore -= 3;
    }

    // Content length (body text approximation)
    const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
    const wordCount = bodyText.split(/\s+/).length;
    if (wordCount < 300) {
      issues.push({ type: 'content_length', severity: 'warning', message: `Мало текстового контента (~${wordCount} слов)`, recommendation: 'Увеличьте объём контента до 800+ слов — короткие страницы редко цитируются AI', category: 'llm' });
      llmScore -= 15;
    } else if (wordCount < 600) {
      issues.push({ type: 'content_length', severity: 'info', message: `Текста маловато (~${wordCount} слов)`, recommendation: 'Рекомендуется 800-2000 слов для лучшего цитирования AI‑системами', category: 'llm' });
      llmScore -= 5;
    }

    // Tables
    const tableCount = (html.match(/<table[\s>]/gi) || []).length;
    if (tableCount === 0 && wordCount > 500) {
      issues.push({ type: 'tables', severity: 'info', message: 'Нет таблиц на странице', recommendation: 'Таблицы помогают AI извлекать сравнительную информацию', category: 'llm' });
      llmScore -= 3;
    }

    // Lang attribute
    if (!html.match(/<html[^>]*lang=["'][^"']+["']/i)) {
      issues.push({ type: 'lang', severity: 'info', message: 'Нет атрибута lang у <html>', recommendation: 'Добавьте lang="ru" (или другой) — помогает AI определить язык контента', category: 'llm' });
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
      summary = 'Страница в хорошем состоянии для SEO и AI‑поиска.';
    } else if (seoScore < 50 || llmScore < 50) {
      summary = 'Найдены серьёзные проблемы. ';
    } else {
      summary = 'Страница нуждается в доработке. ';
    }
    if (seoCritical) summary += `SEO: ${seoCritical} критических. `;
    if (llmCritical) summary += `LLM: ${llmCritical} критических. `;
    summary += 'Исправьте критические проблемы в первую очередь.';

    return new Response(
      JSON.stringify({
        seoScore,
        llmScore,
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
          wordCount,
          h2Count,
          jsonLdCount: jsonLdMatches.length,
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
