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
      issues.push({ type: 'title', severity: 'critical', message: 'Тег <title> отсутствует', recommendation: 'Добавьте уникальный title длиной 50-60 символов', category: 'seo', context: 'Title — один из главных факторов ранжирования. Без него страница плохо отображается в поиске.' });
      seoScore -= 15;
    } else if (title.length < 30) {
      issues.push({ type: 'title', severity: 'warning', message: `Title слишком короткий (${title.length} симв.)`, recommendation: 'Увеличьте длину title до 50-60 символов', category: 'seo', details: [`Текущий title: "${title}"`], context: 'Короткий title не раскрывает содержание страницы и теряет потенциальные клики.' });
      seoScore -= 5;
    } else if (title.length > 70) {
      issues.push({ type: 'title', severity: 'warning', message: `Title слишком длинный (${title.length} симв.)`, recommendation: 'Сократите title до 60 символов', category: 'seo', details: [`Текущий title: "${title.slice(0, 80)}…"`], context: 'Длинный title обрезается в поисковой выдаче.' });
      seoScore -= 5;
    }

    // Meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
      || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
    const description = descMatch ? descMatch[1].trim() : '';
    if (!description) {
      issues.push({ type: 'meta_description', severity: 'critical', message: 'Meta description отсутствует', recommendation: 'Добавьте meta description длиной 150-160 символов', category: 'seo', context: 'Description отображается в сниппете поиска и влияет на CTR.' });
      seoScore -= 15;
    } else if (description.length < 100) {
      issues.push({ type: 'meta_description', severity: 'warning', message: `Meta description короткий (${description.length} симв.)`, recommendation: 'Увеличьте до 150-160 символов', category: 'seo', details: [`Текущий: "${description}"`], context: 'Короткий description не полностью использует место в поисковой выдаче.' });
      seoScore -= 5;
    } else if (description.length > 170) {
      issues.push({ type: 'meta_description', severity: 'info', message: `Meta description длинный (${description.length} симв.)`, recommendation: 'Сократите до 160 символов', category: 'seo', details: [`Текущий: "${description.slice(0, 100)}…"`] });
      seoScore -= 3;
    }

    // H1
    const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
    const h1Texts = h1Matches.map(m => m.replace(/<[^>]+>/g, '').trim());
    if (h1Matches.length === 0) {
      issues.push({ type: 'h1', severity: 'critical', message: 'Тег H1 отсутствует', recommendation: 'Добавьте один H1 с основным ключевым словом', category: 'seo', context: 'H1 — главный заголовок страницы, сообщает поисковикам основную тему.' });
      seoScore -= 15;
    } else if (h1Matches.length > 1) {
      issues.push({ type: 'h1', severity: 'warning', message: `Несколько H1 на странице (${h1Matches.length})`, recommendation: 'Оставьте только один H1', category: 'seo', details: h1Texts.slice(0, 3).map(t => `• "${t.slice(0, 60)}"`), context: 'Несколько H1 размывают главную тему страницы.' });
      seoScore -= 5;
    }

    // Images without alt
    const imgTags = html.match(/<img[^>]*>/gi) || [];
    const imgsWithoutAlt = imgTags.filter((img) => !img.match(/alt=["'][^"']+["']/i));
    const imgsWithoutAltCount = imgsWithoutAlt.length;
    if (imgsWithoutAltCount > 0) {
      const srcExamples = imgsWithoutAlt.slice(0, 5).map(img => {
        const srcMatch = img.match(/src=["']([^"']+)["']/i);
        return srcMatch ? `• ${srcMatch[1].slice(0, 80)}` : '• (src не найден)';
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
      });
      seoScore -= Math.min(15, imgsWithoutAltCount * 2);
    }

    // Page size
    const sizeKB = Math.round(htmlSize / 1024);
    if (sizeKB > 500) {
      issues.push({ type: 'page_size', severity: 'critical', message: `HTML слишком тяжёлый (${sizeKB} КБ)`, recommendation: 'Оптимизируйте HTML — удалите лишний код, инлайн-стили', category: 'seo', context: 'Тяжёлый HTML замедляет загрузку и индексацию.' });
      seoScore -= 10;
    } else if (sizeKB > 200) {
      issues.push({ type: 'page_size', severity: 'warning', message: `HTML тяжеловат (${sizeKB} КБ)`, recommendation: 'Рассмотрите минификацию', category: 'seo' });
      seoScore -= 5;
    }

    // Load time
    if (loadTime > 3000) {
      issues.push({ type: 'speed', severity: 'critical', message: `Медленная загрузка (${(loadTime / 1000).toFixed(1)}с)`, recommendation: 'Оптимизируйте серверный ответ', category: 'seo', context: 'Скорость загрузки — фактор ранжирования Google.' });
      seoScore -= 10;
    } else if (loadTime > 1500) {
      issues.push({ type: 'speed', severity: 'warning', message: `Загрузка ${(loadTime / 1000).toFixed(1)}с`, recommendation: 'Можно ускорить', category: 'seo' });
      seoScore -= 3;
    }

    // Viewport
    if (!html.match(/<meta[^>]*name=["']viewport["']/i)) {
      issues.push({ type: 'viewport', severity: 'critical', message: 'Нет meta viewport', recommendation: 'Добавьте <meta name="viewport" content="width=device-width, initial-scale=1">', category: 'seo', context: 'Без viewport страница не адаптирована для мобильных устройств.' });
      seoScore -= 10;
    }

    // Canonical
    const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
    if (!canonicalMatch) {
      issues.push({ type: 'canonical', severity: 'info', message: 'Нет canonical-ссылки', recommendation: 'Добавьте <link rel="canonical"> для предотвращения дублей', category: 'seo', context: 'Canonical указывает поисковикам предпочтительную версию страницы.' });
      seoScore -= 3;
    }

    // Open Graph
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
    const ogImageMatch = html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']+)["']/i);
    if (!ogTitleMatch) {
      const missingOg = ['og:title', !ogDescMatch && 'og:description', !ogImageMatch && 'og:image'].filter(Boolean);
      issues.push({ type: 'og_tags', severity: 'info', message: 'Open Graph теги неполные', recommendation: 'Добавьте og:title, og:description, og:image для красивого превью в соцсетях', category: 'seo', details: missingOg.map(t => `• Отсутствует: ${t}`), context: 'OG-теги управляют превью при расшаривании ссылки в соцсетях и мессенджерах.' });
      seoScore -= 3;
    }

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
      issues.push({ type: 'json_ld', severity: 'critical', message: 'Нет JSON-LD структурированных данных', recommendation: 'Добавьте Schema.org разметку (Article, FAQPage, LocalBusiness)', category: 'llm', context: 'Структурированные данные — критически важны для AI-цитирования и rich snippets в поиске.' });
      llmScore -= 20;
    } else {
      issues.push({ type: 'json_ld_found', severity: 'info', message: `Найдено ${jsonLdMatches.length} блоков JSON-LD`, recommendation: 'Проверьте полноту разметки', category: 'llm', details: jsonLdTypes.map(t => `• Тип: ${t}`) });

      const jsonLdContent = jsonLdMatches.join(' ').toLowerCase();
      if (!jsonLdContent.includes('faqpage')) {
        issues.push({ type: 'json_ld_faq', severity: 'warning', message: 'Нет FAQPage в структурированных данных', recommendation: 'Добавьте FAQPage Schema — FAQ-блоки часто цитируются AI-системами', category: 'llm', context: 'FAQ-разметка позволяет получить расширенный сниппет и увеличивает шансы на AI-цитирование.' });
        llmScore -= 10;
      }
    }

    // FAQ block in HTML
    const hasFaqSection = /faq|часто\s*задаваемые|вопрос.*ответ/i.test(html);
    const hasDetailsSummary = /<details[\s>]/i.test(html);
    const hasFaqHeading = /<h[2-3][^>]*>[^<]*(faq|чзв|вопрос|q&a)/i.test(html);
    if (!hasFaqSection && !hasDetailsSummary && !hasFaqHeading) {
      issues.push({ type: 'faq_block', severity: 'warning', message: 'Нет FAQ-блока на странице', recommendation: 'Добавьте раздел «Вопросы и ответы» — LLM активно цитируют Q&A контент', category: 'llm', context: 'Вопросно-ответный формат — самый цитируемый AI-системами тип контента.' });
      llmScore -= 10;
    }

    // Lists (ul/ol) — good for LLM extraction
    const listCount = (html.match(/<(ul|ol)[\s>]/gi) || []).length;
    if (listCount === 0) {
      issues.push({ type: 'lists', severity: 'info', message: 'Нет маркированных или нумерованных списков', recommendation: 'Используйте списки для структурирования контента', category: 'llm', context: 'AI-системы лучше извлекают и цитируют информацию из структурированных списков.' });
      llmScore -= 5;
    }

    // Subheadings (H2, H3)
    const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
    const h3Count = (html.match(/<h3[\s>]/gi) || []).length;
    if (h2Count < 2) {
      issues.push({ type: 'subheadings', severity: 'warning', message: `Мало подзаголовков H2 (${h2Count})`, recommendation: 'Добавьте минимум 3-4 H2 для структурирования контента', category: 'llm', context: 'Подзаголовки помогают LLM разбить страницу на тематические секции.' });
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
      issues.push({ type: 'content_length', severity: 'warning', message: `Мало текстового контента (~${wordCount} слов)`, recommendation: 'Увеличьте объём контента до 800+ слов', category: 'llm', context: 'Короткие страницы редко цитируются AI — им не хватает контекста для генерации ответа.' });
      llmScore -= 15;
    } else if (wordCount < 600) {
      issues.push({ type: 'content_length', severity: 'info', message: `Текста маловато (~${wordCount} слов)`, recommendation: 'Рекомендуется 800-2000 слов для лучшего цитирования AI-системами', category: 'llm' });
      llmScore -= 5;
    }

    // Tables
    const tableCount = (html.match(/<table[\s>]/gi) || []).length;
    if (tableCount === 0 && wordCount > 500) {
      issues.push({ type: 'tables', severity: 'info', message: 'Нет таблиц на странице', recommendation: 'Таблицы помогают AI извлекать сравнительную информацию', category: 'llm' });
      llmScore -= 3;
    }

    // Lang attribute
    const langMatch = html.match(/<html[^>]*lang=["']([^"']+)["']/i);
    if (!langMatch) {
      issues.push({ type: 'lang', severity: 'info', message: 'Нет атрибута lang у <html>', recommendation: 'Добавьте lang="ru" (или другой)', category: 'llm', context: 'Атрибут lang помогает AI определить язык контента и корректно его цитировать.' });
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
          imagesWithoutAlt: imgsWithoutAltCount,
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
