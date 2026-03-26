import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const UA = 'OWNDEV-SiteCheck/2.0';

function getSupabase() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
}

// ─── Utility: fetch with timeout ───
async function fetchWithTimeout(url: string, timeoutMs = 8000, opts: RequestInit = {}) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const resp = await fetch(url, { ...opts, signal: controller.signal, headers: { 'User-Agent': UA, ...(opts.headers || {}) } });
    clearTimeout(id);
    return resp;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function checkUrl(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const resp = await fetchWithTimeout(url, 5000, { method: 'HEAD', redirect: 'follow' });
    return { ok: resp.ok, status: resp.status };
  } catch { return { ok: false, status: 0 }; }
}

// ─── Issue builder ───
interface Issue {
  id: string; module: string; severity: string; title: string;
  found: string; location: string; why_it_matters: string;
  how_to_fix: string; example_fix: string; visible_in_preview: boolean;
}

let issueCounter = 0;
function makeIssue(partial: Omit<Issue, 'id'>): Issue {
  return { id: `issue_${++issueCounter}`, ...partial };
}

// ─── Score calculator ───
function calcScores(issues: Issue[], html: string, parsedUrl: URL) {
  let seo = 100, direct = 100, schema = 100, ai = 100;
  for (const i of issues) {
    const w = i.severity === 'critical' ? 15 : i.severity === 'high' ? 8 : i.severity === 'medium' ? 4 : 2;
    if (i.module === 'technical' || i.module === 'content') seo -= w;
    if (i.module === 'direct') direct -= w;
    if (i.module === 'schema') schema -= w;
    if (i.module === 'ai') ai -= w;
  }
  seo = Math.max(0, Math.min(100, seo));
  direct = Math.max(0, Math.min(100, direct));
  schema = Math.max(0, Math.min(100, schema));
  ai = Math.max(0, Math.min(100, ai));
  const total = Math.round((seo * 0.3 + direct * 0.2 + schema * 0.25 + ai * 0.25));
  return { total, seo, direct, schema, ai };
}

// ═══ STEP 0: Theme detection (uses LLM) ═══
async function detectTheme(html: string, url: string): Promise<string> {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000) : '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return 'Общая тематика';
  
  try {
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: 'Определи тематику/нишу сайта одной короткой фразой на русском (2-5 слов). Примеры: "SEO-продвижение", "Интернет-магазин одежды", "Юридические услуги", "Стоматология". Отвечай ТОЛЬКО тематику, без пояснений.' },
          { role: 'user', content: `URL: ${url}\nTitle: ${title}\nТекст: ${bodyText.slice(0, 1000)}` },
        ],
        max_tokens: 30,
        temperature: 0.1,
      }),
    });
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || 'Общая тематика';
  } catch { return 'Общая тематика'; }
}

// ═══ STEP 1: Technical SEO ═══
function technicalAudit(html: string, parsedUrl: URL, robotsOk: boolean, sitemapOk: boolean, brokenLinks: string[], loadTimeMs: number): Issue[] {
  const issues: Issue[] = [];
  const origin = parsedUrl.origin;
  
  if (parsedUrl.protocol !== 'https:') {
    issues.push(makeIssue({ module: 'technical', severity: 'critical', title: 'Сайт не использует HTTPS',
      found: `Протокол: ${parsedUrl.protocol}`, location: 'URL сайта',
      why_it_matters: 'HTTPS — обязательный фактор ранжирования. Браузеры показывают "Не защищено"',
      how_to_fix: 'Установите SSL-сертификат и настройте редирект с HTTP на HTTPS',
      example_fix: 'Redirect 301 / https://yoursite.ru/', visible_in_preview: true }));
  }
  
  if (!robotsOk) {
    issues.push(makeIssue({ module: 'technical', severity: 'critical', title: 'robots.txt недоступен',
      found: `${origin}/robots.txt → ошибка`, location: '/robots.txt',
      why_it_matters: 'Без robots.txt поисковики не знают какие страницы индексировать',
      how_to_fix: 'Создайте robots.txt в корне сайта', example_fix: 'User-agent: *\nAllow: /\nSitemap: https://yoursite.ru/sitemap.xml',
      visible_in_preview: true }));
  }
  
  if (!sitemapOk) {
    issues.push(makeIssue({ module: 'technical', severity: 'high', title: 'sitemap.xml недоступен',
      found: `${origin}/sitemap.xml → ошибка`, location: '/sitemap.xml',
      why_it_matters: 'Sitemap ускоряет индексацию и помогает найти все страницы',
      how_to_fix: 'Сгенерируйте sitemap.xml и укажите в robots.txt',
      example_fix: 'Sitemap: https://yoursite.ru/sitemap.xml', visible_in_preview: true }));
  }
  
  if (brokenLinks.length > 0) {
    issues.push(makeIssue({ module: 'technical', severity: brokenLinks.length >= 3 ? 'critical' : 'high',
      title: `${brokenLinks.length} битых внутренних ссылок`,
      found: brokenLinks.slice(0, 3).join(', '), location: 'Внутренние ссылки',
      why_it_matters: 'Битые ссылки ухудшают краулинг и пользовательский опыт',
      how_to_fix: 'Исправьте URL или удалите нерабочие ссылки',
      example_fix: 'Замените на актуальные URL', visible_in_preview: true }));
  }
  
  if (loadTimeMs > 3000) {
    issues.push(makeIssue({ module: 'technical', severity: loadTimeMs > 5000 ? 'critical' : 'medium',
      title: `Медленная загрузка (${(loadTimeMs / 1000).toFixed(1)}с)`,
      found: `Время ответа: ${loadTimeMs}мс`, location: 'Сервер',
      why_it_matters: 'Медленные страницы теряют позиции и пользователей',
      how_to_fix: 'Оптимизируйте серверное время ответа, включите кэширование',
      example_fix: 'TTFB должен быть < 600мс', visible_in_preview: false }));
  }
  
  // CWV heuristics
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imgsNoDims = imgTags.filter((img: string) => !(/width=/i.test(img) && /height=/i.test(img))).length;
  if (imgsNoDims > 0) {
    issues.push(makeIssue({ module: 'technical', severity: 'medium', title: `${imgsNoDims} изображений без width/height`,
      found: `Из ${imgTags.length} изображений у ${imgsNoDims} нет размеров`, location: '<img> теги',
      why_it_matters: 'Без размеров браузер не может зарезервировать место — это вызывает CLS (сдвиг макета)',
      how_to_fix: 'Добавьте width и height к каждому <img>',
      example_fix: '<img src="hero.jpg" width="800" height="600" alt="...">', visible_in_preview: false }));
  }
  
  const hasMetaRobots = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  if (hasMetaRobots && hasMetaRobots[1].includes('noindex')) {
    issues.push(makeIssue({ module: 'technical', severity: 'critical', title: 'Страница помечена как noindex',
      found: `meta robots: "${hasMetaRobots[1]}"`, location: '<head>',
      why_it_matters: 'Noindex полностью блокирует страницу от появления в поиске',
      how_to_fix: 'Удалите noindex если страница должна индексироваться',
      example_fix: '<meta name="robots" content="index, follow">', visible_in_preview: true }));
  }
  
  return issues;
}

// ═══ STEP 2: Content Audit ═══
function contentAudit(html: string): Issue[] {
  const issues: Issue[] = [];
  
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  if (!title) {
    issues.push(makeIssue({ module: 'content', severity: 'critical', title: 'Тег <title> отсутствует',
      found: '<title> не найден', location: '<head>',
      why_it_matters: 'Title — один из главных факторов ранжирования',
      how_to_fix: 'Добавьте уникальный title 50-60 символов',
      example_fix: '<title>SEO-продвижение сайтов в Москве — OwnDev</title>', visible_in_preview: true }));
  } else if (title.length < 30 || title.length > 70) {
    issues.push(makeIssue({ module: 'content', severity: 'medium', title: `Title ${title.length < 30 ? 'слишком короткий' : 'слишком длинный'} (${title.length} симв.)`,
      found: `"${title.slice(0, 70)}"`, location: '<title>',
      why_it_matters: title.length < 30 ? 'Короткий title не раскрывает содержание' : 'Длинный title обрезается в выдаче',
      how_to_fix: `${title.length < 30 ? 'Увеличьте' : 'Сократите'} до 50-60 символов`,
      example_fix: '<title>Основной запрос — Уточнение | Бренд</title>', visible_in_preview: false }));
  }
  
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
    || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : '';
  if (!description) {
    issues.push(makeIssue({ module: 'content', severity: 'critical', title: 'Meta description отсутствует',
      found: '<meta name="description"> не найден', location: '<head>',
      why_it_matters: 'Description отображается в сниппете поиска и влияет на CTR',
      how_to_fix: 'Добавьте meta description 150-160 символов',
      example_fix: '<meta name="description" content="SEO-аудит и продвижение сайтов — рост трафика от 30% за 3 месяца">', visible_in_preview: true }));
  }
  
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  if (h1Matches.length === 0) {
    issues.push(makeIssue({ module: 'content', severity: 'critical', title: 'H1 отсутствует',
      found: '<h1> не найден на странице', location: 'Страница',
      why_it_matters: 'H1 — главный заголовок, сообщает поисковикам основную тему',
      how_to_fix: 'Добавьте один H1 с основным ключевым словом',
      example_fix: '<h1>SEO-продвижение сайтов</h1>', visible_in_preview: true }));
  } else if (h1Matches.length > 1) {
    issues.push(makeIssue({ module: 'content', severity: 'high', title: `Несколько H1 (${h1Matches.length})`,
      found: `Найдено ${h1Matches.length} тегов <h1>`, location: 'Страница',
      why_it_matters: 'Несколько H1 размывают главную тему страницы',
      how_to_fix: 'Оставьте один H1, остальные замените на H2',
      example_fix: '<h1>Главный заголовок</h1>\n<h2>Подзаголовок</h2>', visible_in_preview: false }));
  }
  
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const noAlt = imgTags.filter((img) => !img.match(/alt=["'][^"']+["']/i));
  if (noAlt.length > 0) {
    issues.push(makeIssue({ module: 'content', severity: noAlt.length > 5 ? 'high' : 'medium',
      title: `${noAlt.length} изображений без alt`,
      found: `${noAlt.length} из ${imgTags.length} без alt-текста`, location: '<img> теги',
      why_it_matters: 'Alt-тексты помогают поисковикам понять изображения и улучшают доступность',
      how_to_fix: 'Добавьте описательный alt к каждому <img>',
      example_fix: '<img src="team.jpg" alt="Команда специалистов OwnDev">', visible_in_preview: false }));
  }
  
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const wordCount = bodyText.split(/\s+/).length;
  if (wordCount < 300) {
    issues.push(makeIssue({ module: 'content', severity: 'medium', title: `Мало текста (${wordCount} слов)`,
      found: `Всего ${wordCount} слов на странице`, location: 'Контент',
      why_it_matters: 'Страницы с малым количеством текста хуже ранжируются',
      how_to_fix: 'Добавьте полезный контент: описания, FAQ, инструкции',
      example_fix: 'Оптимальный объём для коммерческих страниц: 500-1500 слов', visible_in_preview: false }));
  }
  
  return issues;
}

// ═══ STEP 3: Yandex Direct / Autotargeting Audit ═══
function directAudit(html: string, theme: string): Issue[] {
  const issues: Issue[] = [];
  
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  
  // Check commercial intent in title/h1
  const commercialWords = ['купить', 'заказать', 'цена', 'стоимость', 'услуг', 'аренда', 'аудит', 'продвижение', 'доставка', 'ремонт', 'строительство'];
  const hasCommercial = commercialWords.some(w => (title + ' ' + h1).toLowerCase().includes(w));
  if (!hasCommercial && title) {
    issues.push(makeIssue({ module: 'direct', severity: 'high', title: 'Заголовки не содержат коммерческих слов',
      found: `Title: "${title.slice(0, 60)}", H1: "${h1.slice(0, 60)}"`, location: '<title> и <h1>',
      why_it_matters: 'Автотаргетинг Яндекс.Директа берёт ключи из заголовков — без коммерческих слов показы нерелевантные',
      how_to_fix: 'Включите коммерческие запросы в Title и H1',
      example_fix: `<title>${theme} — заказать аудит и оптимизацию | OwnDev</title>`, visible_in_preview: true }));
  }
  
  // Check for price/CTA elements
  const hasPrices = /цена|стоимость|руб|₽|\d+\s*р\b/i.test(html);
  if (!hasPrices) {
    issues.push(makeIssue({ module: 'direct', severity: 'medium', title: 'Нет цен на странице',
      found: 'Не найдены упоминания цен или стоимости', location: 'Контент',
      why_it_matters: 'Страницы с ценами конвертируют лучше в Директе — пользователи сразу видят стоимость',
      how_to_fix: 'Добавьте цены или ценовые вилки на страницу',
      example_fix: '<p>Стоимость SEO-аудита: от 5 000 ₽</p>', visible_in_preview: false }));
  }
  
  // Check for CTA buttons
  const ctaPatterns = /заказать|оставить заявку|связаться|получить консультацию|записаться|купить/i;
  if (!ctaPatterns.test(html)) {
    issues.push(makeIssue({ module: 'direct', severity: 'high', title: 'Нет CTA (призыва к действию)',
      found: 'Не найдены кнопки заказа или формы обратной связи', location: 'Страница',
      why_it_matters: 'Без CTA посетители из Директа не конвертируются в лиды',
      how_to_fix: 'Добавьте заметную кнопку CTA выше первого экрана',
      example_fix: '<button>Заказать бесплатный аудит</button>', visible_in_preview: true }));
  }
  
  // Check OG-tags for Yandex ads
  if (!/<meta[^>]*property=["']og:title["']/i.test(html)) {
    issues.push(makeIssue({ module: 'direct', severity: 'low', title: 'Нет Open Graph тегов',
      found: 'og:title не найден', location: '<head>',
      why_it_matters: 'OG-теги улучшают отображение при шаринге и в некоторых рекламных форматах',
      how_to_fix: 'Добавьте og:title, og:description, og:image',
      example_fix: '<meta property="og:title" content="...">', visible_in_preview: false }));
  }
  
  return issues;
}

// ═══ STEP 7: Schema Audit ═══
function schemaAudit(html: string): Issue[] {
  const issues: Issue[] = [];
  
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  if (jsonLdMatches.length === 0) {
    issues.push(makeIssue({ module: 'schema', severity: 'high', title: 'Нет Schema.org разметки',
      found: 'JSON-LD не найден на странице', location: 'Вся страница',
      why_it_matters: 'Без Schema.org страница не получит расширенные сниппеты в поиске',
      how_to_fix: 'Добавьте JSON-LD разметку Organization, WebPage или Product',
      example_fix: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"..."}</script>',
      visible_in_preview: true }));
  } else {
    // Check for required types
    const types: string[] = [];
    for (const m of jsonLdMatches) {
      try {
        const content = m.replace(/<\/?script[^>]*>/gi, '');
        const parsed = JSON.parse(content);
        if (parsed['@type']) types.push(parsed['@type']);
      } catch {}
    }
    
    if (!types.includes('Organization') && !types.includes('LocalBusiness')) {
      issues.push(makeIssue({ module: 'schema', severity: 'medium', title: 'Нет Schema Organization',
        found: `Типы Schema: ${types.join(', ')}`, location: 'JSON-LD',
        why_it_matters: 'Organization — базовая разметка для любого сайта компании',
        how_to_fix: 'Добавьте JSON-LD с типом Organization',
        example_fix: '{"@type":"Organization","name":"...","url":"...","logo":"..."}', visible_in_preview: false }));
    }
    
    if (!types.includes('FAQPage') && !types.includes('HowTo')) {
      issues.push(makeIssue({ module: 'schema', severity: 'low', title: 'Нет FAQ или HowTo Schema',
        found: 'FAQPage и HowTo не найдены', location: 'JSON-LD',
        why_it_matters: 'FAQ-разметка даёт расширенные сниппеты с вопросами прямо в выдаче',
        how_to_fix: 'Добавьте FAQPage разметку для частых вопросов',
        example_fix: '{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"...","acceptedAnswer":{"@type":"Answer","text":"..."}}]}',
        visible_in_preview: false }));
    }
  }
  
  return issues;
}

// ═══ STEP 8: AI Visibility Audit ═══
function aiAudit(html: string): Issue[] {
  const issues: Issue[] = [];
  
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h2Texts = h2Matches.map(m => m.replace(/<[^>]+>/g, '').trim());
  const questionH2s = h2Texts.filter(t => /\?$/.test(t) || /^(как|что|зачем|почему|когда|где|сколько|какой|какие)/i.test(t));
  
  if (h2Texts.length > 0 && questionH2s.length === 0) {
    issues.push(makeIssue({ module: 'ai', severity: 'high', title: 'H2 не в формате вопросов',
      found: `${h2Texts.length} заголовков H2, ни один не является вопросом`,
      location: '<h2> заголовки',
      why_it_matters: 'LLM-системы (ChatGPT, Perplexity) чаще цитируют контент в формате Q&A',
      how_to_fix: 'Переформулируйте H2 в вопросы целевой аудитории',
      example_fix: `Было: <h2>Наши услуги</h2>\nСтало: <h2>Какие SEO-услуги мы предоставляем?</h2>`,
      visible_in_preview: true }));
  }
  
  const hasFaq = /faq|часто\s*задаваемые|вопрос.*ответ/i.test(html) || /<details[\s>]/i.test(html);
  if (!hasFaq) {
    issues.push(makeIssue({ module: 'ai', severity: 'medium', title: 'Нет FAQ-блока',
      found: 'Не найден раздел FAQ или часто задаваемых вопросов', location: 'Контент',
      why_it_matters: 'FAQ-блоки — основной источник цитирования для AI-поисковиков',
      how_to_fix: 'Добавьте секцию FAQ с 5-10 вопросами целевой аудитории',
      example_fix: '<h2>Часто задаваемые вопросы</h2>\n<h3>Сколько стоит SEO?</h3>\n<p>Стоимость зависит от...</p>',
      visible_in_preview: false }));
  }
  
  const listCount = (html.match(/<(ul|ol)[\s>]/gi) || []).length;
  if (listCount === 0) {
    issues.push(makeIssue({ module: 'ai', severity: 'low', title: 'Нет структурированных списков',
      found: 'Списки <ul>/<ol> не найдены', location: 'Контент',
      why_it_matters: 'Списки помогают AI-системам извлекать структурированную информацию',
      how_to_fix: 'Оформите ключевую информацию в виде списков',
      example_fix: '<ul><li>Преимущество 1</li><li>Преимущество 2</li></ul>',
      visible_in_preview: false }));
  }
  
  return issues;
}

// ═══ STEP 4: Competitor Analysis (uses LLM) ═══
async function competitorAnalysis(url: string, theme: string, html: string): Promise<{ url: string; scores: any }[]> {
  // This step will be enhanced with real SERP data in production
  // For now, analyze the page's competitive landscape heuristically
  return [];
}

// ═══ STEP 5: Keyword Extraction (uses LLM) ═══
async function extractKeywords(html: string, theme: string, url: string): Promise<{ keyword: string; volume: number; cluster: string }[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return [];
  
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 3000) : '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  try {
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: `Ты — SEO-специалист. Извлеки 30-50 ключевых запросов для сайта тематики "${theme}". Для каждого запроса укажи примерный месячный объём поиска в Яндексе и кластер. Формат JSON массив: [{"keyword":"запрос","volume":1000,"cluster":"название кластера"}]. Отвечай ТОЛЬКО валидным JSON без markdown.` },
          { role: 'user', content: `URL: ${url}\nTitle: ${title}\nТекст: ${bodyText.slice(0, 2000)}` },
        ],
        max_tokens: 4000,
        temperature: 0.3,
      }),
    });
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '[]';
    // Extract JSON from potential markdown code blocks
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch { return []; }
}

// ═══ STEP 6: Minus Words ═══
async function generateMinusWords(theme: string, keywords: { keyword: string }[]): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return [];
  
  try {
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [
          { role: 'system', content: `Сгенерируй список из 30-50 минус-слов для Яндекс.Директа для тематики "${theme}". Минус-слова — это слова, по которым показ объявлений нежелателен (бесплатно, скачать, курс, реферат, вакансия и т.д.). Формат: JSON массив строк. Отвечай ТОЛЬКО валидным JSON.` },
          { role: 'user', content: `Тематика: ${theme}\nПримеры ключей: ${keywords.slice(0, 10).map(k => k.keyword).join(', ')}` },
        ],
        max_tokens: 1000,
        temperature: 0.2,
      }),
    });
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '[]';
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
  } catch { return []; }
}

// ═══ Crawl site (mode=site) ═══
async function crawlSite(startUrl: string, maxPages = 100): Promise<string[]> {
  const visited = new Set<string>();
  const queue = [startUrl];
  const parsedStart = new URL(startUrl);
  
  // Check robots.txt for disallowed paths
  const disallowed: string[] = [];
  try {
    const robotsResp = await fetchWithTimeout(`${parsedStart.origin}/robots.txt`, 3000);
    if (robotsResp.ok) {
      const robotsTxt = await robotsResp.text();
      const lines = robotsTxt.split('\n');
      for (const line of lines) {
        const match = line.match(/^Disallow:\s*(.+)/i);
        if (match) disallowed.push(match[1].trim());
      }
    }
  } catch {}
  
  while (queue.length > 0 && visited.size < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    
    // Check against robots.txt
    const path = new URL(url).pathname;
    if (disallowed.some(d => path.startsWith(d))) continue;
    
    visited.add(url);
    
    try {
      const resp = await fetchWithTimeout(url, 5000);
      if (!resp.ok) continue;
      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) { await resp.text(); continue; }
      const html = await resp.text();
      
      // Extract internal links
      const linkMatches = [...html.matchAll(/href=["']([^"'#]+)["']/gi)];
      for (const m of linkMatches) {
        let href = m[1];
        if (href.startsWith('/')) href = `${parsedStart.origin}${href}`;
        try {
          const parsed = new URL(href);
          if (parsed.hostname === parsedStart.hostname && !visited.has(parsed.origin + parsed.pathname)) {
            queue.push(parsed.origin + parsed.pathname);
          }
        } catch {}
      }
    } catch {}
  }
  
  return [...visited];
}

// ═══ Update scan progress in DB ═══
async function updateScan(scanId: string, updates: Record<string, any>) {
  const supabase = getSupabase();
  await supabase.from('scans').update(updates).eq('id', scanId);
}

// ═══ Main pipeline ═══
async function runPipeline(scanId: string, url: string, mode: string) {
  try {
    await updateScan(scanId, { status: 'running', progress_pct: 5 });
    
    // Fetch page HTML
    const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
    const startTime = Date.now();
    const response = await fetchWithTimeout(parsedUrl.toString(), 10000);
    const loadTimeMs = Date.now() - startTime;
    const html = await response.text();
    
    await updateScan(scanId, { progress_pct: 15, raw_html: html.slice(0, 50000) });
    
    // STEP 0: Theme Detection
    const theme = await detectTheme(html, parsedUrl.toString());
    await updateScan(scanId, { theme, progress_pct: 25 });
    
    // STEP 1 & 2 & 3: Parallel technical/content/direct checks
    const origin = parsedUrl.origin;
    const [robotsResult, sitemapResult] = await Promise.all([
      checkUrl(`${origin}/robots.txt`),
      checkUrl(`${origin}/sitemap.xml`),
    ]);
    
    // Check broken links
    const allLinks = [...html.matchAll(/<a[^>]*href=["']([^"'#][^"']*)["']/gi)];
    const internalHrefs: string[] = [];
    for (const m of allLinks) {
      const href = m[1];
      if (href.startsWith('/') || href.includes(parsedUrl.hostname)) {
        internalHrefs.push(href.startsWith('/') ? `${origin}${href}` : href);
      }
    }
    const uniqueHrefs = [...new Set(internalHrefs)].slice(0, 10);
    const linkResults = await Promise.all(uniqueHrefs.map(h => checkUrl(h)));
    const brokenLinks = uniqueHrefs.filter((_, i) => !linkResults[i].ok && linkResults[i].status !== 0);
    
    // Run Steps 1-3
    const techIssues = technicalAudit(html, parsedUrl, robotsResult.ok, sitemapResult.ok, brokenLinks, loadTimeMs);
    const contentIssues = contentAudit(html);
    const directIssues = directAudit(html, theme);
    const schemaIssues = schemaAudit(html);
    const aiIssues = aiAudit(html);
    
    const allIssues = [...techIssues, ...contentIssues, ...directIssues, ...schemaIssues, ...aiIssues];
    const scores = calcScores(allIssues, html, parsedUrl);
    
    await updateScan(scanId, { progress_pct: 60, scores, issues: allIssues });
    
    // STEPS 4-8: Background (non-blocking for preview)
    // Run keyword extraction and minus words in parallel
    const [keywords, competitors] = await Promise.all([
      extractKeywords(html, theme, parsedUrl.toString()),
      competitorAnalysis(parsedUrl.toString(), theme, html),
    ]);
    
    await updateScan(scanId, { progress_pct: 85, keywords, competitors });
    
    const minusWords = await generateMinusWords(theme, keywords);
    
    // Crawl if site mode
    let crawledPages: string[] = [];
    if (mode === 'site') {
      crawledPages = await crawlSite(parsedUrl.toString(), 100);
    }
    
    await updateScan(scanId, {
      status: 'done',
      progress_pct: 100,
      minus_words: minusWords,
      crawled_pages: crawledPages,
      issues: allIssues,
      scores,
    });
    
  } catch (error) {
    await updateScan(scanId, { status: 'error', error_message: error.message });
  }
}

// ═══ HTTP Handler ═══
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  // Edge function path: /site-check-scan/...
  // pathParts[0] = 'site-check-scan', rest is our routing
  
  const supabase = getSupabase();
  const json = async () => { try { return await req.json(); } catch { return {}; } };
  
  try {
    // POST /start — create scan and start pipeline
    if (req.method === 'POST' && (pathParts.length <= 1 || pathParts[1] === 'start')) {
      const body = await json();
      const { url: scanUrl, mode = 'page' } = body;
      
      if (!scanUrl) {
        return new Response(JSON.stringify({ error: 'url is required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      
      // Create scan record
      const { data: scan, error } = await supabase.from('scans').insert({
        url: scanUrl,
        mode,
        status: 'running',
      }).select('id').single();
      
      if (error) throw error;
      
      // Start pipeline async (don't await)
      const edgePromise = runPipeline(scan.id, scanUrl, mode);
      // Use waitUntil pattern — run in background
      // deno edge functions support this natively
      edgePromise.catch(e => console.error('Pipeline error:', e));
      
      return new Response(JSON.stringify({ scan_id: scan.id, status: 'running' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // GET /status/:scanId
    if (req.method === 'GET' && pathParts[1] === 'status' && pathParts[2]) {
      const scanId = pathParts[2];
      const { data, error } = await supabase.from('scans').select('status, progress_pct, scores').eq('id', scanId).single();
      if (error || !data) return new Response(JSON.stringify({ error: 'Scan not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      
      return new Response(JSON.stringify({ status: data.status, progress_pct: data.progress_pct, scores_preview: data.scores }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    // GET /preview/:scanId
    if (req.method === 'GET' && pathParts[1] === 'preview' && pathParts[2]) {
      const scanId = pathParts[2];
      const { data, error } = await supabase.from('scans').select('*').eq('id', scanId).single();
      if (error || !data) return new Response(JSON.stringify({ error: 'Scan not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      
      const allIssues = (data.issues as Issue[]) || [];
      const previewIssues = allIssues.filter(i => i.visible_in_preview).slice(0, 5);
      
      return new Response(JSON.stringify({
        scan_id: data.id,
        url: data.url,
        mode: data.mode,
        status: data.status,
        scores: data.scores,
        issues: previewIssues,
        issue_count: allIssues.length,
        theme: data.theme,
        created_at: data.created_at,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    // GET /full/:scanId — full report data (only with valid report token)
    if (req.method === 'GET' && pathParts[1] === 'full' && pathParts[2]) {
      const scanId = pathParts[2];
      const token = url.searchParams.get('token');
      
      if (!token) return new Response(JSON.stringify({ error: 'Token required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      
      // Verify token via report
      const { data: report } = await supabase.from('reports').select('*').eq('scan_id', scanId).eq('download_token', token).eq('payment_status', 'paid').single();
      if (!report) return new Response(JSON.stringify({ error: 'Invalid token or unpaid' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      
      const { data: scan } = await supabase.from('scans').select('*').eq('id', scanId).single();
      if (!scan) return new Response(JSON.stringify({ error: 'Scan not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      
      return new Response(JSON.stringify({
        scan,
        report: { report_id: report.id, email: report.email, payment_status: report.payment_status },
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
