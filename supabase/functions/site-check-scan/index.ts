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

async function fetchText(url: string, timeoutMs = 5000): Promise<{ ok: boolean; status: number; text: string }> {
  try {
    const resp = await fetchWithTimeout(url, timeoutMs);
    const text = resp.ok ? await resp.text() : '';
    return { ok: resp.ok, status: resp.status, text };
  } catch { return { ok: false, status: 0, text: '' }; }
}

async function checkUrl(url: string): Promise<{ ok: boolean; status: number }> {
  try {
    const resp = await fetchWithTimeout(url, 5000, { method: 'HEAD', redirect: 'follow' });
    return { ok: resp.ok, status: resp.status };
  } catch { return { ok: false, status: 0 }; }
}

// ─── Robust JSON parser (handles truncated LLM output) ───
function safeParseJson<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;

  let cleaned = raw
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ')
    .trim();

  // Try extracting array or object
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  const objMatch = cleaned.match(/\{[\s\S]*\}/);

  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]) as T; } catch { /* fall through */ }
  }
  if (objMatch) {
    try { return JSON.parse(objMatch[0]) as T; } catch { /* fall through */ }
  }

  // Truncated array recovery
  const start = cleaned.indexOf('[');
  if (start !== -1) {
    let text = cleaned.slice(start);
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace !== -1) {
      text = text.slice(0, lastBrace + 1) + ']';
      try { return JSON.parse(text) as T; } catch {
        text = text.replace(/,\s*\]$/, ']');
        try { return JSON.parse(text) as T; } catch { /* fall through */ }
      }
    }
  }

  // Last chance — direct parse
  try { return JSON.parse(cleaned) as T; } catch {}

  console.error('[OWNDEV] JSON parse failed:', cleaned.slice(0, 300));
  return fallback;
}

// ─── Issue builder ───
interface Issue {
  id: string; module: string; severity: string; title: string;
  found: string; location: string; why_it_matters: string;
  how_to_fix: string; example_fix: string; visible_in_preview: boolean;
  impact_score: number; docs_url: string; is_auto_fixable: boolean;
}

let issueCounter = 0;
function makeIssue(partial: Omit<Issue, 'id' | 'impact_score' | 'docs_url' | 'is_auto_fixable'> & { impact_score?: number; docs_url?: string; is_auto_fixable?: boolean }): Issue {
  const severityScores: Record<string, number> = { critical: 15, high: 10, medium: 5, low: 2 };
  return {
    id: `issue_${++issueCounter}`,
    impact_score: partial.impact_score ?? severityScores[partial.severity] ?? 5,
    docs_url: partial.docs_url ?? '',
    is_auto_fixable: partial.is_auto_fixable ?? false,
    ...partial,
  };
}

// ─── DB Rule type ───
interface DbRule {
  id: string;
  rule_id: string;
  module: string;
  source: string;
  severity: string;
  title: string;
  description: string;
  how_to_check: string;
  fix_template: string;
  example_fix: string;
  score_weight: number;
  visible_in_preview: boolean;
  active: boolean;
}

// ─── Load rules from DB ───
async function loadRules(): Promise<DbRule[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('scan_rules')
    .select('*')
    .eq('active', true);
  if (error || !data) {
    console.error('Failed to load rules:', error);
    return [];
  }
  return data as DbRule[];
}

// ─── Increment trigger counts for fired rules ───
async function incrementTriggerCounts(ruleIds: string[]) {
  if (ruleIds.length === 0) return;
  const supabase = getSupabase();
  for (const rid of ruleIds) {
    await supabase.from('scan_rules')
      .update({ trigger_count: supabase.rpc ? undefined : 0, last_triggered_at: new Date().toISOString() })
      .eq('rule_id', rid);
  }
  // Use raw SQL via rpc would be better but just increment via multiple updates
  // For now, do a simple approach: read current, increment, write back
  for (const rid of ruleIds) {
    const { data } = await supabase.from('scan_rules').select('trigger_count').eq('rule_id', rid).single();
    if (data) {
      await supabase.from('scan_rules').update({ 
        trigger_count: (data.trigger_count || 0) + 1,
        last_triggered_at: new Date().toISOString()
      }).eq('rule_id', rid);
    }
  }
}

// ─── Weight-based score calculator ───
function calcScoresWeighted(issues: Issue[], rules: DbRule[]) {
  const moduleScores: Record<string, { totalWeight: number; passedWeight: number }> = {};
  const scoreModuleMap: Record<string, string> = {
    'technical': 'seo', 'content': 'seo',
    'direct': 'direct', 'schema': 'schema', 'ai': 'ai',
  };

  // Initialize with all rules' weights
  for (const rule of rules) {
    const scoreKey = scoreModuleMap[rule.module] || rule.module;
    if (!moduleScores[scoreKey]) moduleScores[scoreKey] = { totalWeight: 0, passedWeight: 0 };
    moduleScores[scoreKey].totalWeight += rule.score_weight;
    moduleScores[scoreKey].passedWeight += rule.score_weight; // assume pass, subtract on fail
  }

  // Subtract weight for each failed rule (issue found)
  const issueRuleIds = new Set(issues.map(i => (i as any).rule_id).filter(Boolean));
  for (const rule of rules) {
    if (issueRuleIds.has(rule.rule_id)) {
      const scoreKey = scoreModuleMap[rule.module] || rule.module;
      if (moduleScores[scoreKey]) {
        moduleScores[scoreKey].passedWeight -= rule.score_weight;
      }
    }
  }

  // Also handle issues without rule_id (legacy hardcoded) via severity fallback
  for (const issue of issues) {
    if ((issue as any).rule_id) continue; // already handled
    const scoreKey = scoreModuleMap[issue.module] || issue.module;
    if (!moduleScores[scoreKey]) moduleScores[scoreKey] = { totalWeight: 100, passedWeight: 100 };
    const w = issue.severity === 'critical' ? 15 : issue.severity === 'high' ? 8 : issue.severity === 'medium' ? 4 : 2;
    moduleScores[scoreKey].passedWeight -= w;
  }

  const getScore = (key: string) => {
    const m = moduleScores[key];
    if (!m || m.totalWeight === 0) return 100;
    return Math.max(0, Math.min(100, Math.round((m.passedWeight / m.totalWeight) * 100)));
  };

  const seo = getScore('seo');
  const direct = getScore('direct');
  const schema = getScore('schema');
  const ai = getScore('ai');
  const total = Math.round(seo * 0.3 + direct * 0.2 + schema * 0.25 + ai * 0.25);
  return { total, seo, direct, schema, ai };
}

// ═══ STEP 0: Theme detection ═══
async function detectTheme(html: string, url: string): Promise<string> {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000) : '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return 'Общая тематика';
  
  try {
    console.log(`[OWNDEV] Шаг: detectTheme | Модель: google/gemini-2.0-flash | URL: ${url}`);
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash',
        messages: [
          { role: 'system', content: 'Определи тематику/нишу сайта одной короткой фразой на русском (2-5 слов). Примеры: "SEO-продвижение", "Интернет-магазин одежды", "Юридические услуги", "Стоматология". Отвечай ТОЛЬКО тематику, без пояснений. ВАЖНО: Отвечай СТРОГО на русском языке. Возвращай ТОЛЬКО валидный JSON без markdown-блоков, без пояснений, без ```json, только сам JSON.' },
          { role: 'user', content: `URL: ${url}\nTitle: ${title}\nТекст: ${bodyText.slice(0, 1000)}` },
        ],
        max_tokens: 30,
        temperature: 0.1,
        top_p: 0.85,
        top_k: 20,
      }),
    });
    const data = await resp.json();
    const result = data.choices?.[0]?.message?.content?.trim() || 'Общая тематика';
    console.log(`[OWNDEV] Ответ detectTheme:`, result.slice(0, 200));
    return result;
  } catch { return 'Общая тематика'; }
}

// ═══════════════════════════════════════
// STEP 1: Technical SEO (module="technical")
// ═══════════════════════════════════════
interface TechAuditInput {
  html: string;
  parsedUrl: URL;
  httpStatus: number;
  robotsOk: boolean;
  robotsTxt: string;
  sitemapOk: boolean;
  sitemapBody: string;
  brokenLinks: string[];
  loadTimeMs: number;
}

function technicalAudit(input: TechAuditInput): Issue[] {
  const { html, parsedUrl, httpStatus, robotsOk, robotsTxt, sitemapOk, sitemapBody, brokenLinks, loadTimeMs } = input;
  const issues: Issue[] = [];
  const origin = parsedUrl.origin;
  const pageUrl = parsedUrl.toString();

  // 1. HTTP status !== 200
  if (httpStatus !== 200) {
    issues.push(makeIssue({ module: 'technical', severity: 'critical',
      title: `HTTP статус ${httpStatus} (не 200)`,
      found: `Страница вернула статус ${httpStatus}`, location: 'HTTP ответ',
      why_it_matters: 'Поисковики не индексируют страницы с ошибочными статусами (4xx, 5xx)',
      how_to_fix: 'Убедитесь что страница возвращает HTTP 200 для корректного содержимого',
      example_fix: 'Настройте сервер так, чтобы рабочие страницы отдавали 200 OK',
      visible_in_preview: true }));
  }

  // 2. HTTPS
  if (parsedUrl.protocol !== 'https:') {
    issues.push(makeIssue({ module: 'technical', severity: 'critical',
      title: 'Сайт не использует HTTPS',
      found: `Протокол: ${parsedUrl.protocol}`, location: 'URL сайта',
      why_it_matters: 'HTTPS — обязательный фактор ранжирования. Браузеры показывают предупреждение "Не защищено"',
      how_to_fix: 'Установите SSL-сертификат и настройте 301-редирект с HTTP на HTTPS',
      example_fix: `Redirect 301 / https://${parsedUrl.hostname}/`,
      visible_in_preview: true }));
  }

  // 3. robots.txt
  if (!robotsOk) {
    issues.push(makeIssue({ module: 'technical', severity: 'critical',
      title: 'robots.txt недоступен',
      found: `${origin}/robots.txt → ошибка или не найден`, location: '/robots.txt',
      why_it_matters: 'Без robots.txt поисковики не знают какие разделы сайта индексировать',
      how_to_fix: 'Создайте файл robots.txt в корне сайта',
      example_fix: `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml`,
      visible_in_preview: true }));
  } else {
    // 3a. URL blocked by robots.txt?
    const disallowLines = robotsTxt.split('\n').filter(l => /^Disallow:\s*.+/i.test(l));
    const blockedPaths = disallowLines.map(l => l.replace(/^Disallow:\s*/i, '').trim());
    const currentPath = parsedUrl.pathname;
    const isBlocked = blockedPaths.some(p => p && currentPath.startsWith(p));
    if (isBlocked) {
      issues.push(makeIssue({ module: 'technical', severity: 'critical',
        title: 'Страница закрыта от индексации в robots.txt',
        found: `Путь "${currentPath}" попадает под Disallow`, location: '/robots.txt',
        why_it_matters: 'Закрытая в robots.txt страница полностью исчезает из поиска Яндекс и Google. Это самая критическая SEO-ошибка — трафик станет нулевым',
        how_to_fix: '1. Откройте файл /robots.txt в корне сайта\n2. Найдите строку Disallow, блокирующую путь\n3. Удалите или скорректируйте эту строку\n4. Проверьте через Яндекс.Вебмастер → Инструменты → Проверка robots.txt',
        example_fix: `User-agent: *\nDisallow: /admin/\nDisallow: /cart/\nAllow: /\nSitemap: ${origin}/sitemap.xml`,
        impact_score: 20, docs_url: 'https://yandex.ru/support/webmaster/controlling-robot/robots-txt.html',
        visible_in_preview: true }));
    }
    // 3b. Sitemap directive in robots.txt
    if (!/Sitemap:/i.test(robotsTxt)) {
      issues.push(makeIssue({ module: 'technical', severity: 'medium',
        title: 'robots.txt не содержит ссылку на Sitemap',
        found: 'Директива Sitemap: не найдена', location: '/robots.txt',
        why_it_matters: 'Указание Sitemap в robots.txt помогает поисковикам быстрее обнаружить карту сайта',
        how_to_fix: 'Добавьте строку Sitemap: в конец robots.txt',
        example_fix: `Sitemap: ${origin}/sitemap.xml`,
        visible_in_preview: false }));
    }
  }

  // 4. sitemap.xml
  if (!sitemapOk) {
    issues.push(makeIssue({ module: 'technical', severity: 'high',
      title: 'sitemap.xml недоступен',
      found: `${origin}/sitemap.xml → ошибка или не найден`, location: '/sitemap.xml',
      why_it_matters: 'Sitemap ускоряет индексацию и помогает поисковикам обнаружить все страницы',
      how_to_fix: 'Сгенерируйте sitemap.xml и разместите в корне сайта',
      example_fix: `<?xml version="1.0"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${pageUrl}</loc></url>\n</urlset>`,
      visible_in_preview: true }));
  } else if (sitemapBody) {
    // 4a. Current URL in sitemap?
    const normalizedPath = parsedUrl.pathname.replace(/\/$/, '');
    if (!sitemapBody.includes(pageUrl) && !sitemapBody.includes(normalizedPath)) {
      issues.push(makeIssue({ module: 'technical', severity: 'medium',
        title: 'Страница не найдена в sitemap.xml',
        found: `URL "${pageUrl}" отсутствует в карте сайта`, location: '/sitemap.xml',
        why_it_matters: 'Страницы не упомянутые в sitemap индексируются медленнее',
        how_to_fix: 'Добавьте URL в sitemap.xml',
        example_fix: `<url><loc>${pageUrl}</loc></url>`,
        visible_in_preview: false }));
    }
  }

  // 5. meta noindex
  const metaRobots = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  if (metaRobots && metaRobots[1].toLowerCase().includes('noindex')) {
    issues.push(makeIssue({ module: 'technical', severity: 'critical',
      title: 'Страница помечена как noindex',
      found: `<meta name="robots" content="${metaRobots[1]}">`, location: '<head> → <meta name="robots">',
      why_it_matters: 'Noindex полностью блокирует появление страницы в поисковой выдаче',
      how_to_fix: 'Удалите noindex если страница должна индексироваться',
      example_fix: '<meta name="robots" content="index, follow">',
      visible_in_preview: true }));
  }

  // 6. Canonical
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)
    || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1].trim() : null;
  if (!canonical) {
    issues.push(makeIssue({ module: 'technical', severity: 'high',
      title: 'Отсутствует <link rel="canonical">',
      found: 'Canonical не указан', location: '<head>',
      why_it_matters: 'Без canonical могут возникнуть дубли в индексе (www/non-www, параметры, trailing slash). Это размывает ссылочный вес и позиции',
      how_to_fix: '1. Добавьте в <head> страницы тег canonical\n2. URL должен быть абсолютным (с https://)\n3. Используйте один формат URL на всём сайте',
      example_fix: `<link rel="canonical" href="${pageUrl}" />`,
      impact_score: 5, docs_url: 'https://yandex.ru/support/webmaster/robot-workings/canonical.html',
      visible_in_preview: false }));
  } else {
    const norm = (u: string) => u.replace(/\/+$/, '').replace(/^https?:\/\/(www\.)?/, '');
    if (norm(canonical) !== norm(pageUrl)) {
      issues.push(makeIssue({ module: 'technical', severity: 'high',
        title: 'Canonical указывает на другую страницу',
        found: `Canonical: "${canonical}"\nТекущий URL: "${pageUrl}"`, location: '<head> → <link rel="canonical">',
        why_it_matters: 'Неправильный canonical может привести к деиндексации текущей страницы',
        how_to_fix: 'Исправьте canonical на текущий URL',
        example_fix: `<link rel="canonical" href="${pageUrl}" />`,
        visible_in_preview: true }));
    }
  }

  // 7. Duplicates www/non-www warning (if no canonical)
  if (!canonical) {
    const altHost = parsedUrl.hostname.startsWith('www.') ? parsedUrl.hostname.replace('www.', '') : `www.${parsedUrl.hostname}`;
    issues.push(makeIssue({ module: 'technical', severity: 'medium',
      title: 'Риск дублей www / non-www',
      found: `Сайт ${parsedUrl.hostname} доступен без canonical`, location: '<head>',
      why_it_matters: `Версии ${parsedUrl.hostname} и ${altHost} могут индексироваться как отдельные страницы-дубли`,
      how_to_fix: 'Настройте 301-редирект и canonical для консолидации версий',
      example_fix: `RewriteRule ^(.*)$ https://${parsedUrl.hostname}/$1 [R=301,L]`,
      visible_in_preview: false }));
  }

  // 8. Speed / LCP heuristic
  if (loadTimeMs > 4000) {
    issues.push(makeIssue({ module: 'technical', severity: 'critical',
      title: `Критически медленная загрузка (${(loadTimeMs / 1000).toFixed(1)}с)`,
      found: `Время ответа сервера: ${loadTimeMs}мс (порог LCP: 2500мс)`, location: 'HTTP ответ сервера',
      why_it_matters: 'LCP > 4с — «плохо» по Core Web Vitals. Страница теряет позиции и пользователей',
      how_to_fix: 'Оптимизируйте TTFB: серверное кэширование, CDN, уменьшение серверной нагрузки',
      example_fix: 'Целевой TTFB < 600мс, LCP < 2.5с',
      visible_in_preview: true }));
  } else if (loadTimeMs > 2500) {
    issues.push(makeIssue({ module: 'technical', severity: 'high',
      title: `Медленная загрузка (${(loadTimeMs / 1000).toFixed(1)}с)`,
      found: `Время ответа: ${loadTimeMs}мс (порог LCP: 2500мс)`, location: 'HTTP ответ сервера',
      why_it_matters: 'LCP > 2.5с — «требует улучшения» по Core Web Vitals',
      how_to_fix: 'Включите gzip/brotli сжатие, HTTP-кэширование, CDN',
      example_fix: 'Добавьте заголовки: Content-Encoding: br, Cache-Control: max-age=86400',
      visible_in_preview: true }));
  }

  // 9. Mobile-friendly: viewport
  const vpMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i);
  if (!vpMatch) {
    issues.push(makeIssue({ module: 'technical', severity: 'critical',
      title: 'Нет meta viewport — сайт не адаптивный',
      found: '<meta name="viewport"> не найден', location: '<head>',
      why_it_matters: 'Без viewport мобильные устройства показывают десктопную версию — страница теряет мобильный трафик',
      how_to_fix: 'Добавьте meta viewport в <head>',
      example_fix: '<meta name="viewport" content="width=device-width, initial-scale=1">',
      visible_in_preview: true }));
  } else if (!vpMatch[1].includes('width=device-width')) {
    issues.push(makeIssue({ module: 'technical', severity: 'high',
      title: 'Неправильный viewport',
      found: `viewport: "${vpMatch[1]}"`, location: '<head> → <meta name="viewport">',
      why_it_matters: 'Viewport без width=device-width вызывает некорректное масштабирование на мобильных',
      how_to_fix: 'Установите корректный viewport',
      example_fix: '<meta name="viewport" content="width=device-width, initial-scale=1">',
      visible_in_preview: false }));
  }

  // 10. Images without width/height (CLS risk)
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imgsNoDims = imgTags.filter(img => !(/width=/i.test(img) && /height=/i.test(img)));
  if (imgsNoDims.length > 0) {
    const examples = imgsNoDims.slice(0, 2).map(t => { const s = t.match(/src=["']([^"']+)["']/i); return s ? s[1] : '?'; });
    issues.push(makeIssue({ module: 'technical', severity: imgsNoDims.length > 5 ? 'high' : 'medium',
      title: `${imgsNoDims.length} изображений без width/height (риск CLS)`,
      found: `Из ${imgTags.length} тегов <img> у ${imgsNoDims.length} нет атрибутов размеров.\nПримеры: ${examples.join(', ')}`,
      location: '<img> теги',
      why_it_matters: 'Без width/height браузер не резервирует место — это вызывает CLS (сдвиг макета), ухудшая Core Web Vitals',
      how_to_fix: 'Добавьте width и height к каждому <img>',
      example_fix: `<img src="${examples[0] || 'hero.jpg'}" width="800" height="600" alt="Описание">`,
      visible_in_preview: false }));
  }

  // 11. Broken internal links
  if (brokenLinks.length > 0) {
    issues.push(makeIssue({ module: 'technical', severity: brokenLinks.length >= 3 ? 'critical' : 'high',
      title: `${brokenLinks.length} битых внутренних ссылок`,
      found: brokenLinks.slice(0, 5).join('\n'), location: 'Внутренние ссылки <a href>',
      why_it_matters: 'Битые ссылки ухудшают краулинг, распределение ссылочного веса и UX',
      how_to_fix: 'Исправьте URL или удалите нерабочие ссылки',
      example_fix: `Замените ${brokenLinks[0]} на актуальный URL или удалите ссылку`,
      visible_in_preview: true }));
  }

  // 12. No preload for hero image
  const hasPreload = /<link[^>]*rel=["']preload["'][^>]*as=["']image["']/i.test(html);
  if (!hasPreload && imgTags.length > 0) {
    const firstSrc = imgTags[0].match(/src=["']([^"']+)["']/i);
    issues.push(makeIssue({ module: 'technical', severity: 'low',
      title: 'Нет preload для hero-изображения (LCP)',
      found: 'Не найден <link rel="preload" as="image">', location: '<head>',
      why_it_matters: 'Preload ускоряет загрузку LCP-элемента, улучшая Core Web Vitals',
      how_to_fix: 'Добавьте preload для главного изображения первого экрана',
      example_fix: `<link rel="preload" href="${firstSrc?.[1] || '/hero.jpg'}" as="image">`,
      visible_in_preview: false }));
  }

  return issues;
}

// ═══ Site-mode extra technical checks ═══
function siteModeTechnicalAudit(pages: { url: string; html: string; status: number }[]): Issue[] {
  const issues: Issue[] = [];

  // Pages without title
  const noTitle = pages.filter(p => p.status === 200 && !/<title[^>]*>[^<]+<\/title>/i.test(p.html));
  if (noTitle.length > 0) {
    issues.push(makeIssue({ module: 'technical', severity: 'critical',
      title: `${noTitle.length} страниц без <title>`,
      found: noTitle.slice(0, 5).map(p => p.url).join('\n'),
      location: 'Карта сайта',
      why_it_matters: 'Страницы без title практически не ранжируются',
      how_to_fix: 'Добавьте уникальный title на каждую страницу',
      example_fix: '<title>Уникальный заголовок — Бренд</title>',
      visible_in_preview: true }));
  }

  // Pages without H1
  const noH1 = pages.filter(p => p.status === 200 && !/<h1[^>]*>/i.test(p.html));
  if (noH1.length > 0) {
    issues.push(makeIssue({ module: 'technical', severity: 'high',
      title: `${noH1.length} страниц без <h1>`,
      found: noH1.slice(0, 5).map(p => p.url).join('\n'),
      location: 'Карта сайта',
      why_it_matters: 'H1 — основной заголовок страницы, его отсутствие снижает релевантность',
      how_to_fix: 'Добавьте один H1 на каждую страницу',
      example_fix: '<h1>Основная тема страницы</h1>',
      visible_in_preview: false }));
  }

  // Duplicate titles across pages
  const titleMap: Record<string, string[]> = {};
  for (const p of pages) {
    const m = p.html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    if (m) {
      const t = m[1].trim().toLowerCase();
      if (!titleMap[t]) titleMap[t] = [];
      titleMap[t].push(p.url);
    }
  }
  const dupes = Object.entries(titleMap).filter(([, urls]) => urls.length > 1);
  if (dupes.length > 0) {
    const totalDupes = dupes.reduce((s, [, u]) => s + u.length, 0);
    const examples = dupes.slice(0, 3).map(([title, urls]) => `"${title}" → ${urls.slice(0, 2).join(', ')}`);
    issues.push(makeIssue({ module: 'technical', severity: 'high',
      title: `${totalDupes} страниц с дублирующимися title`,
      found: examples.join('\n'),
      location: 'Карта сайта',
      why_it_matters: 'Дубли title размывают релевантность — поисковик не понимает какую страницу показать',
      how_to_fix: 'Сделайте title уникальным для каждой страницы',
      example_fix: 'Страница 1: <title>Услуга A — Бренд</title>\nСтраница 2: <title>Услуга B — Бренд</title>',
      visible_in_preview: true }));
  }

  // 4xx internal pages
  const broken4xx = pages.filter(p => p.status >= 400 && p.status < 500);
  if (broken4xx.length > 0) {
    issues.push(makeIssue({ module: 'technical', severity: broken4xx.length >= 5 ? 'critical' : 'high',
      title: `${broken4xx.length} внутренних страниц с ошибкой 4xx`,
      found: broken4xx.slice(0, 5).map(p => `${p.url} → ${p.status}`).join('\n'),
      location: 'Карта сайта',
      why_it_matters: 'Страницы 4xx тратят краулинговый бюджет и ухудшают UX',
      how_to_fix: 'Удалите ссылки на несуществующие страницы или настройте редиректы',
      example_fix: 'Redirect 301 /old-page /new-page',
      visible_in_preview: false }));
  }

  return issues;
}

// ═══════════════════════════════════════
// STEP 2: Content Audit (module="content")
// ═══════════════════════════════════════
function contentAudit(html: string, theme: string): Issue[] {
  const issues: Issue[] = [];

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i)
    || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : '';
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Texts = h1Matches.map(m => m.replace(/<[^>]+>/g, '').trim());
  const h1 = h1Texts[0] || '';
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1]
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 1).length;
  const themeWords = theme.toLowerCase().split(/[\s,—–\-]+/).filter(w => w.length > 3);

  // ── Title ──
  if (!title) {
    issues.push(makeIssue({ module: 'content', severity: 'critical',
      title: 'Тег <title> отсутствует',
      found: '<title> не найден на странице', location: '<head> → <title>',
      why_it_matters: 'Title — один из главных факторов ранжирования. Без него страница не получит релевантный сниппет в выдаче',
      how_to_fix: 'Добавьте уникальный title длиной 50-70 символов с основным ключевым словом',
      example_fix: `<title>${theme} — заказать в Москве | Бренд</title>`,
      impact_score: 15, docs_url: 'https://yandex.ru/support/webmaster/recommendations/title-description.html',
      visible_in_preview: true }));
  } else {
    if (title.length < 50) {
      issues.push(makeIssue({ module: 'content', severity: 'medium',
        title: `Title слишком короткий (${title.length} символов, норма 50-70)`,
        found: `"${title}"`, location: '<head> → <title>',
        why_it_matters: 'Короткий title не раскрывает содержание страницы и занимает мало места в выдаче',
        how_to_fix: 'Дополните title ключевыми словами и уточнениями до 50-70 символов',
        example_fix: `<title>${title} — ${theme} | Бренд</title>`,
        visible_in_preview: false }));
    } else if (title.length > 70) {
      issues.push(makeIssue({ module: 'content', severity: 'medium',
        title: `Title слишком длинный (${title.length} символов, норма 50-70)`,
        found: `"${title.slice(0, 80)}..."`, location: '<head> → <title>',
        why_it_matters: 'Длинный title обрезается в выдаче — пользователь не видит полную информацию',
        how_to_fix: 'Сократите title до 50-70 символов, оставив ключевое слово в начале',
        example_fix: `<title>${theme} — краткое уточнение | Бренд</title>`,
        visible_in_preview: false }));
    }

    // Theme keyword in title
    const titleLower = title.toLowerCase();
    const hasTheme = themeWords.some(w => titleLower.includes(w));
    if (!hasTheme && themeWords.length > 0) {
      issues.push(makeIssue({ module: 'content', severity: 'high',
        title: 'Title не содержит ключевое слово тематики',
        found: `Title: "${title}"\nТема сайта: "${theme}"`, location: '<head> → <title>',
        why_it_matters: 'Title без основного ключевого слова снижает релевантность по целевым запросам',
        how_to_fix: `Включите слова тематики («${theme}») в Title`,
        example_fix: `<title>${theme} — ${title.split('—')[0]?.trim() || 'услуги'} | Бренд</title>`,
        visible_in_preview: false }));
    }
  }

  // ── H1 ──
  if (h1Matches.length === 0) {
    issues.push(makeIssue({ module: 'content', severity: 'critical',
      title: 'H1 отсутствует',
      found: '<h1> не найден на странице', location: 'Контент страницы',
      why_it_matters: 'H1 — главный заголовок, сообщающий поисковикам основную тему страницы',
      how_to_fix: 'Добавьте один H1 с основным ключевым словом',
      example_fix: `<h1>${theme}</h1>`,
      visible_in_preview: true }));
  } else {
    if (h1Matches.length > 1) {
      issues.push(makeIssue({ module: 'content', severity: 'high',
        title: `Несколько H1 на странице (${h1Matches.length})`,
        found: h1Texts.map((t, i) => `H1 #${i + 1}: "${t}"`).join('\n'),
        location: 'Контент страницы',
        why_it_matters: 'Несколько H1 размывают главную тему — поисковик не понимает что является основным заголовком',
        how_to_fix: 'Оставьте один H1, остальные понизьте до H2',
        example_fix: `<h1>${h1Texts[0]}</h1>\n<h2>${h1Texts[1] || 'Подзаголовок'}</h2>`,
        visible_in_preview: false }));
    }

    // Generic H1
    if (/^(главная|home|добро пожаловать|welcome|о компании|о нас|about)/i.test(h1)) {
      issues.push(makeIssue({ module: 'content', severity: 'high',
        title: 'H1 слишком общий — не описывает услугу/товар',
        found: `H1: "${h1}"`, location: '<h1>',
        why_it_matters: 'Общий H1 не содержит ключевых слов и не помогает в ранжировании по целевым запросам',
        how_to_fix: 'Замените общий H1 на конкретное описание основной услуги/товара',
        example_fix: `<h1>${theme} — профессиональные услуги</h1>`,
        visible_in_preview: false }));
    }

    // H1 vs Title alignment
    if (title && h1) {
      const getWords = (s: string) => new Set(s.toLowerCase().replace(/[^а-яa-zё\s]/gi, '').split(/\s+/).filter(w => w.length > 3));
      const titleWords = getWords(title);
      const h1Words = getWords(h1);
      const overlap = [...titleWords].filter(w => h1Words.has(w)).length;
      const maxSize = Math.max(titleWords.size, h1Words.size, 1);
      if (overlap / maxSize < 0.2 && titleWords.size > 0 && h1Words.size > 0) {
        issues.push(makeIssue({ module: 'content', severity: 'high',
          title: 'Title и H1 тематически расходятся',
          found: `Title: "${title.slice(0, 60)}"\nH1: "${h1.slice(0, 60)}"`,
          location: '<title> и <h1>',
          why_it_matters: 'Когда Title и H1 говорят о разном, поисковик получает противоречивые сигналы о теме страницы',
          how_to_fix: 'Убедитесь что Title и H1 раскрывают одну тему с общими ключевыми словами',
          example_fix: `<title>${theme} — услуги | Бренд</title>\n<h1>${theme} — профессиональный подход</h1>`,
          visible_in_preview: true }));
      }
    }
  }

  // ── Description ──
  if (!description) {
    issues.push(makeIssue({ module: 'content', severity: 'medium',
      title: 'Meta description отсутствует',
      found: '<meta name="description"> не найден', location: '<head>',
      why_it_matters: 'Description отображается в сниппете поиска и влияет на CTR (кликабельность)',
      how_to_fix: 'Добавьте meta description длиной 120-160 символов с призывом к действию',
      example_fix: `<meta name="description" content="${theme} — закажите бесплатную консультацию. Опыт 10+ лет, 500+ проектов.">`,
      visible_in_preview: true }));
  } else {
    if (description.length < 120 || description.length > 160) {
      issues.push(makeIssue({ module: 'content', severity: 'low',
        title: `Description ${description.length < 120 ? 'короткий' : 'длинный'} (${description.length} симв., норма 120-160)`,
        found: `"${description.slice(0, 160)}${description.length > 160 ? '...' : ''}"`,
        location: '<head> → <meta name="description">',
        why_it_matters: description.length < 120 ? 'Короткий description не использует доступное место в сниппете' : 'Длинный description обрезается в выдаче',
        how_to_fix: `${description.length < 120 ? 'Дополните' : 'Сократите'} до 120-160 символов`,
        example_fix: `<meta name="description" content="${theme} — результат за 30 дней. Закажите аудит бесплатно →">`,
        visible_in_preview: false }));
    }
    // CTA in description
    if (!/заказ|получи|скидк|бесплатн|акци|звони|узнай|попроб|→|☎|📞/i.test(description)) {
      issues.push(makeIssue({ module: 'content', severity: 'low',
        title: 'Description без призыва к действию (CTA)',
        found: `"${description.slice(0, 100)}"`, location: '<head> → <meta name="description">',
        why_it_matters: 'Description с CTA повышает CTR на 15-30%',
        how_to_fix: 'Добавьте призыв: «Закажите», «Получите скидку», «Бесплатная консультация»',
        example_fix: `<meta name="description" content="${description.slice(0, 100)} Закажите бесплатный аудит →">`,
        visible_in_preview: false }));
    }
  }

  // ── Content volume ──
  if (wordCount < 300) {
    issues.push(makeIssue({ module: 'content', severity: 'medium',
      title: `Мало текста (${wordCount} слов, минимум 300)`,
      found: `Всего ${wordCount} слов полезного контента на странице`, location: 'Текстовый контент <body>',
      why_it_matters: '«Тонкие» страницы с малым объёмом текста хуже ранжируются — поисковик считает их неинформативными. Нейросети предпочитают подробные страницы как источник ответов',
      how_to_fix: '1. Расширьте основной текст страницы\n2. Добавьте раздел FAQ с 5-7 вопросами\n3. Добавьте блок преимуществ\n4. Целевой объём: 800-1500 слов для коммерческой страницы',
      example_fix: 'Структура коммерческой страницы:\nH1: Ключевой запрос\nH2: Описание услуги\nH2: Преимущества (3-5 пунктов)\nH2: Этапы работы\nH2: Стоимость\nH2: FAQ (5 вопросов)',
      impact_score: 10, docs_url: 'https://yandex.ru/support/webmaster/recommendations/content-quality.html',
      visible_in_preview: false }));
  }

  // ── H2/H3 structure ──
  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  if (h2Count === 0 && wordCount > 200) {
    issues.push(makeIssue({ module: 'content', severity: 'low',
      title: 'Нет подзаголовков H2',
      found: '<h2> не найдено на странице', location: 'Контент страницы',
      why_it_matters: 'H2-заголовки структурируют контент для поисковиков и пользователей. Страницы без H2 хуже ранжируются по средне- и низкочастотным запросам, а нейросети не могут извлечь структурированные факты',
      how_to_fix: '1. Разбейте текст на логические разделы\n2. Каждый раздел оберните в тег H2\n3. Добавьте ключевые слова в H2 естественно\n4. Рекомендуемое количество H2: 3-8 на странице',
      example_fix: `<h2>Что входит в ${theme.toLowerCase()}</h2>\n<h2>Стоимость ${theme.toLowerCase()}</h2>`,
      impact_score: 7, docs_url: 'https://yandex.ru/support/webmaster/recommendations/h1.html',
      visible_in_preview: false }));
  }

  // ── Lists, tables ──
  const listCount = (html.match(/<(ul|ol)[\s>]/gi) || []).length;
  const tableCount = (html.match(/<table[\s>]/gi) || []).length;
  if (listCount === 0 && tableCount === 0 && wordCount > 300) {
    issues.push(makeIssue({ module: 'content', severity: 'low',
      title: 'Нет списков и таблиц',
      found: 'Теги <ul>, <ol>, <table> не найдены', location: 'Контент страницы',
      why_it_matters: 'Структурированный контент лучше воспринимается и чаще попадает в расширенные сниппеты',
      how_to_fix: 'Оформите преимущества, этапы или цены в виде списков / таблиц',
      example_fix: '<ul>\n  <li>Преимущество 1</li>\n  <li>Преимущество 2</li>\n</ul>',
      visible_in_preview: false }));
  }

  // ── Thematic focus (>2 unrelated topics) ──
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h2Texts = h2Matches.map(m => m.replace(/<[^>]+>/g, '').trim().toLowerCase());
  if (h2Texts.length >= 3 && themeWords.length > 0) {
    const offTopic = h2Texts.filter(h2 => !themeWords.some(tw => h2.includes(tw)));
    if (offTopic.length > h2Texts.length * 0.7) {
      issues.push(makeIssue({ module: 'content', severity: 'high',
        title: 'Размытый тематический фокус страницы',
        found: `Тема: "${theme}"\nH2 без связи с темой:\n${offTopic.slice(0, 4).map(h => `• "${h}"`).join('\n')}`,
        location: 'Структура <h2> заголовков',
        why_it_matters: 'Когда страница смешивает несвязанные тематики, поисковики не ранжируют её хорошо ни по одному запросу',
        how_to_fix: 'Сфокусируйте страницу на одной теме. Побочные темы вынесите на отдельные страницы',
        example_fix: `Все H2 должны относиться к теме "${theme}"`,
        visible_in_preview: true }));
    }
  }

  // ── Images without alt ──
  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const noAlt = imgTags.filter(img => !img.match(/alt=["'][^"']+["']/i));
  if (noAlt.length > 0) {
    const examples = noAlt.slice(0, 2).map(t => { const s = t.match(/src=["']([^"']+)["']/i); return s ? s[1] : '?'; });
    issues.push(makeIssue({ module: 'content', severity: noAlt.length > 5 ? 'high' : 'medium',
      title: `${noAlt.length} изображений без alt-текста`,
      found: `${noAlt.length} из ${imgTags.length} без alt. Примеры: ${examples.join(', ')}`,
      location: '<img> теги',
      why_it_matters: 'Alt помогает поисковикам понять изображения и улучшает доступность',
      how_to_fix: 'Добавьте описательный alt к каждому <img>',
      example_fix: `<img src="${examples[0] || 'photo.jpg'}" alt="${theme} — иллюстрация">`,
      visible_in_preview: false }));
  }

  return issues;
}

// ═══ STEP 3: Yandex Direct / Autotargeting Audit (ПРОМТ 4) ═══
interface DirectAuditResult {
  issues: Issue[];
  ad_headline: string;
  autotargeting_categories: Record<string, boolean>;
}

function directAudit(html: string, theme: string): DirectAuditResult {
  const issues: Issue[] = [];

  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch
    ? bodyMatch[1]
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
    : '';
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 1).length;
  const themeWords = theme.toLowerCase().split(/[\s,—–\-]+/).filter(w => w.length > 3);

  // ── 1. H1 конкретность ── critical, visible_in_preview=true
  const genericH1 = /^(главная|home|добро пожаловать|welcome|о компании|о нас|about|услуги|наши услуги|каталог|продукция)$/i;
  if (h1 && genericH1.test(h1.trim())) {
    issues.push(makeIssue({
      module: 'direct', severity: 'critical',
      title: 'H1 слишком общий для автотаргетинга Директа',
      found: `H1: "${h1}"`,
      location: '<h1>',
      why_it_matters: 'Автотаргетинг Яндекс.Директа читает H1 для подбора аудитории. Общий H1 («Услуги», «Главная») приводит к показам по нерелевантным запросам и сливу бюджета',
      how_to_fix: 'Замените общий H1 на конкретное название услуги, товара или ниши',
      example_fix: `Было: <h1>${h1}</h1>\nСтало: <h1>${theme} — профессиональные услуги в Москве</h1>`,
      visible_in_preview: true,
    }));
  }

  // ── 2. Совпадение смысла H1 ↔ Title ── high, visible_in_preview=true
  if (title && h1) {
    const getWords = (s: string) =>
      new Set(s.toLowerCase().replace(/[^а-яa-zё\s]/gi, '').split(/\s+/).filter(w => w.length > 3));
    const titleWords = getWords(title);
    const h1Words = getWords(h1);
    const overlap = [...titleWords].filter(w => h1Words.has(w)).length;
    const maxSize = Math.max(titleWords.size, h1Words.size, 1);
    const matchPct = Math.round((overlap / maxSize) * 100);
    if (matchPct < 50 && titleWords.size > 0 && h1Words.size > 0) {
      issues.push(makeIssue({
        module: 'direct', severity: 'high',
        title: `H1 и Title совпадают только на ${matchPct}%`,
        found: `Title: "${title.slice(0, 70)}"\nH1: "${h1.slice(0, 70)}"\nСовпадение: ${matchPct}%`,
        location: '<title> и <h1>',
        why_it_matters: 'Автотаргетинг берёт ключевые слова из Title и H1. Если они говорят о разном, Директ подбирает смешанную нерелевантную аудиторию',
        how_to_fix: 'Сделайте Title и H1 семантически согласованными — одна тема, общие ключевые слова',
        example_fix: `<title>${theme} — заказать в Москве | Бренд</title>\n<h1>${theme} — надёжные решения для бизнеса</h1>`,
        visible_in_preview: true,
      }));
    }
  }

  // ── 3. H1 ↔ основной текст (когерентность) ── high, visible_in_preview=false
  if (h1 && bodyText.length > 200) {
    const h1Keywords = h1.toLowerCase().replace(/[^а-яa-zё\s]/gi, '').split(/\s+/).filter(w => w.length > 3);
    const bodyLower = bodyText.toLowerCase();
    const h1WordsInBody = h1Keywords.filter(w => bodyLower.includes(w));
    const coherencePct = h1Keywords.length > 0 ? Math.round((h1WordsInBody.length / h1Keywords.length) * 100) : 100;
    if (coherencePct < 40 && h1Keywords.length >= 2) {
      issues.push(makeIssue({
        module: 'direct', severity: 'high',
        title: 'H1 не раскрыт в тексте страницы',
        found: `H1: "${h1.slice(0, 60)}"\nСлова H1 в тексте: ${coherencePct}% (${h1WordsInBody.length} из ${h1Keywords.length})`,
        location: '<h1> и <body>',
        why_it_matters: 'Автотаргетинг анализирует и заголовок, и текст страницы. Если H1 обещает одно, а текст рассказывает другое — будут нерелевантные показы и высокий процент отказов',
        how_to_fix: 'Раскройте тему H1 в основном тексте — используйте те же ключевые слова и описывайте ту же услугу/товар',
        example_fix: `H1: "${h1.slice(0, 40)}"\n→ В тексте ниже опишите: что это, для кого, условия, цены`,
        visible_in_preview: false,
      }));
    }
  }

  // ── 4. Несколько тематик на странице ── high, visible_in_preview=true
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h2Texts = h2Matches.map(m => m.replace(/<[^>]+>/g, '').trim().toLowerCase());
  if (h2Texts.length >= 3 && themeWords.length > 0) {
    // Group H2s by whether they match the theme
    const onTopic = h2Texts.filter(h2 => themeWords.some(tw => h2.includes(tw)));
    const offTopic = h2Texts.filter(h2 => !themeWords.some(tw => h2.includes(tw)));
    // If more than half of H2s are off-topic, flag it
    if (offTopic.length > onTopic.length && offTopic.length >= 2) {
      issues.push(makeIssue({
        module: 'direct', severity: 'high',
        title: 'Несколько тематик на одной посадочной',
        found: `Тема: "${theme}"\nH2 вне темы (${offTopic.length} из ${h2Texts.length}):\n${offTopic.slice(0, 4).map(h => `• "${h}"`).join('\n')}`,
        location: 'Структура <h2> заголовков',
        why_it_matters: 'Автотаргетинг Директа начнёт показывать объявление по всем темам страницы, включая нерелевантные. Это приводит к нецелевым кликам и расходу бюджета',
        how_to_fix: 'Сфокусируйте посадочную на одной услуге/товаре. Другие темы вынесите на отдельные страницы',
        example_fix: `Страница 1: "${theme}"\nСтраница 2: "${offTopic[0] || 'другая услуга'}"\nКаждая — отдельная посадочная для Директа`,
        visible_in_preview: true,
      }));
    }
  }

  // ── 5. Отсутствие коммерческих сигналов ── medium, visible_in_preview=false
  const pricePattern = /цена|стоимость|руб|₽|\d+\s*р\b|\d[\s\d]*₽/i;
  const ctaPattern = /заказ|купи|оставь|запис|получи|звони|консультац|заявк|корзин|добавить в/i;
  const conditionsPattern = /доставк|гарант|оплат|возврат|рассрочк|кредит|бесплатн/i;
  const hasPrice = pricePattern.test(bodyText);
  const hasCta = ctaPattern.test(html);
  const hasConditions = conditionsPattern.test(bodyText);
  const missingSignals: string[] = [];
  if (!hasPrice) missingSignals.push('цены');
  if (!hasCta) missingSignals.push('CTA (кнопка/форма)');
  if (!hasConditions) missingSignals.push('условия (доставка, гарантия, оплата)');

  if (missingSignals.length >= 2) {
    issues.push(makeIssue({
      module: 'direct', severity: 'medium',
      title: 'Нет коммерческих сигналов на странице',
      found: `Отсутствуют: ${missingSignals.join(', ')}`,
      location: 'Контент страницы',
      why_it_matters: 'Без цен, CTA и условий посетители из Директа не конвертируются. Яндекс также учитывает коммерческие факторы при ранжировании рекламных посадочных',
      how_to_fix: 'Добавьте блок с ценами, заметную кнопку CTA и условия работы (доставка, гарантия)',
      example_fix: `<section>\n  <h2>Стоимость ${theme.toLowerCase()}</h2>\n  <p>от 5 000 ₽</p>\n  <button>Заказать бесплатную консультацию</button>\n  <p>Доставка по Москве — бесплатно</p>\n</section>`,
      visible_in_preview: false,
    }));
  } else if (!hasCta) {
    issues.push(makeIssue({
      module: 'direct', severity: 'high',
      title: 'Нет CTA (призыва к действию)',
      found: 'Не найдены кнопки заказа, формы или призывы к действию',
      location: 'Контент страницы',
      why_it_matters: 'Без CTA посетители из Директа уходят, не совершив целевое действие — деньги на рекламу потрачены впустую',
      how_to_fix: 'Добавьте заметную кнопку CTA выше первого экрана и повторите в конце страницы',
      example_fix: `<button>Заказать ${theme.toLowerCase()}</button>`,
      visible_in_preview: true,
    }));
  }

  // ── 6. Страница слишком общая для Директа ── medium, visible_in_preview=false
  const isGenericPage =
    (!h1 || genericH1.test(h1.trim())) &&
    wordCount < 400 &&
    !hasPrice;
  if (isGenericPage) {
    issues.push(makeIssue({
      module: 'direct', severity: 'medium',
      title: 'Страница слишком общая для Директа',
      found: `H1: "${h1 || '(нет)'}"\nСлов: ${wordCount}\nЦены: нет`,
      location: 'Посадочная страница',
      why_it_matters: 'Общие страницы (главная, категория) плохо конвертируют трафик из Директа. Для рекламы нужна конкретная посадочная с одной услугой/товаром',
      how_to_fix: 'Создайте отдельную посадочную под конкретную услугу/товар с ценой, описанием и CTA. Используйте её как URL в Директе вместо главной',
      example_fix: `Вместо: ${title || 'Главная'}\nСоздайте: /uslugi/${theme.toLowerCase().replace(/\s+/g, '-')}/ — с конкретным H1, ценой и формой заказа`,
      visible_in_preview: false,
    }));
  }

  // ── Generate ad_headline (max 35 chars) ──
  const baseHeadline = h1 || title || theme;
  let ad_headline = baseHeadline
    .replace(/<[^>]+>/g, '')
    .replace(/[|—–\-].*$/, '')
    .trim();
  if (ad_headline.length > 35) {
    // Try to shorten intelligently
    const words = ad_headline.split(/\s+/);
    ad_headline = '';
    for (const w of words) {
      if ((ad_headline + ' ' + w).trim().length <= 35) {
        ad_headline = (ad_headline + ' ' + w).trim();
      } else break;
    }
  }
  if (!ad_headline || ad_headline.length < 5) {
    ad_headline = theme.slice(0, 35);
  }

  // ── Autotargeting categories recommendation ──
  const hasNarrowFocus = h1 && !genericH1.test(h1.trim()) && themeWords.some(tw => h1.toLowerCase().includes(tw));
  const autotargeting_categories: Record<string, boolean> = {
    'Целевые': true,
    'Узкие': !!hasNarrowFocus,
    'Альтернативные': false,
    'Сопутствующие': false,
    'Брендовые': /бренд|brand/i.test(bodyText) || false,
  };

  return { issues, ad_headline, autotargeting_categories };
}

// ═══ STEP 7: Schema Audit ═══
function schemaAudit(html: string): Issue[] {
  const issues: Issue[] = [];
  
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  if (jsonLdMatches.length === 0) {
    issues.push(makeIssue({ module: 'schema', severity: 'high', title: 'Нет Schema.org разметки',
      found: 'JSON-LD не найден на странице', location: 'Вся страница',
      why_it_matters: 'Schema.org — структурированные данные помогающие поисковикам и нейросетям понять контент. Сайты с Schema получают расширенные сниппеты и лучше попадают в AI-ответы',
      how_to_fix: '1. Добавьте JSON-LD разметку Organization для компании\n2. Добавьте WebSite для главной\n3. Проверьте: search.google.com/test/rich-results',
      example_fix: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"...","url":"..."}</script>',
      impact_score: 12, docs_url: 'https://schema.org/docs/gs.html',
      visible_in_preview: true }));
  } else {
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
async function aiAudit(html: string, origin: string): Promise<Issue[]> {
  const issues: Issue[] = [];
  
  // --- 1. Check /llms.txt ---
  try {
    const llmsResp = await fetchWithTimeout(`${origin}/llms.txt`, 5000, { method: 'HEAD' });
    if (!llmsResp.ok) {
      issues.push(makeIssue({ module: 'ai', severity: 'high',
        title: '🤖 Нет файла /llms.txt',
        found: `${origin}/llms.txt → ${llmsResp.status}`,
        location: '/llms.txt',
        why_it_matters: 'llms.txt — стандарт для AI-краулеров (ChatGPT, Perplexity, Claude). Файл говорит нейросетям как читать ваш сайт. Без llms.txt сайт теряет 20 баллов LLM Score',
        how_to_fix: '1. Создайте файл llms.txt в корне сайта\n2. Укажите название, описание, разделы\n3. Используйте генератор OWNDEV: /tools/llms-txt-checker',
        example_fix: `# ${origin}\n> Описание вашего сайта\n\n## Основные страницы\n- [Услуги](${origin}/services/): описание\n- [Контакты](${origin}/contacts/): адрес и телефон`,
        impact_score: 20, docs_url: 'https://llmstxt.org',
        visible_in_preview: true }));
    }
  } catch { /* timeout — skip */ }

  // --- 2. Check /llms-full.txt ---
  try {
    const llmsFullResp = await fetchWithTimeout(`${origin}/llms-full.txt`, 5000, { method: 'HEAD' });
    if (!llmsFullResp.ok) {
      issues.push(makeIssue({ module: 'ai', severity: 'medium',
        title: '🤖 Нет файла /llms-full.txt',
        found: `${origin}/llms-full.txt → ${llmsFullResp.status}`,
        location: '/llms-full.txt',
        why_it_matters: 'llms-full.txt — расширенная версия для AI-систем с подробным описанием всех страниц и контента',
        how_to_fix: 'Создайте /llms-full.txt с детальным описанием каждого раздела сайта',
        example_fix: `# ${origin}\n> Полное описание сайта\n\n## Pages\n- ${origin}/about: О компании — описание\n- ${origin}/services: Услуги — список`,
        visible_in_preview: false }));
    }
  } catch { /* timeout — skip */ }

  // --- 3. FAQPage Schema cross-check for AI visibility ---
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const schemaTypes: string[] = [];
  for (const m of jsonLdMatches) {
    try {
      const content = m.replace(/<\/?script[^>]*>/gi, '');
      const parsed = JSON.parse(content);
      if (parsed['@type']) schemaTypes.push(parsed['@type']);
      if (Array.isArray(parsed['@graph'])) {
        for (const item of parsed['@graph']) {
          if (item['@type']) schemaTypes.push(item['@type']);
        }
      }
    } catch {}
  }

  if (!schemaTypes.includes('FAQPage')) {
    issues.push(makeIssue({ module: 'ai', severity: 'high',
      title: '🤖 Нет FAQPage Schema для AI-видимости',
      found: `Schema типы: ${schemaTypes.length > 0 ? schemaTypes.join(', ') : 'нет'}`,
      location: 'JSON-LD разметка',
      why_it_matters: 'FAQPage Schema — ключевой сигнал для AI-систем. Вопрос-ответ формат цитируется в AI Overviews в 3 раза чаще',
      how_to_fix: 'Добавьте JSON-LD с типом FAQPage на страницы с вопросами',
      example_fix: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[{"@type":"Question","name":"Ваш вопрос?","acceptedAnswer":{"@type":"Answer","text":"Ответ"}}]}</script>',
      visible_in_preview: true }));
  }

  // --- 4. Article / LocalBusiness Schema ---
  const hasArticle = schemaTypes.includes('Article') || schemaTypes.includes('NewsArticle') || schemaTypes.includes('BlogPosting');
  const hasLocalBusiness = schemaTypes.includes('LocalBusiness') || schemaTypes.some(t => 
    ['Restaurant', 'Store', 'MedicalBusiness', 'LegalService', 'FinancialService', 'RealEstateAgent'].includes(t)
  );
  if (!hasArticle && !hasLocalBusiness) {
    issues.push(makeIssue({ module: 'ai', severity: 'medium',
      title: '🤖 Нет Article или LocalBusiness Schema',
      found: `Schema типы: ${schemaTypes.length > 0 ? schemaTypes.join(', ') : 'нет'}`,
      location: 'JSON-LD разметка',
      why_it_matters: 'Article и LocalBusiness — ключевые типы для AI-цитирования. Без них LLM не может определить тип контента и авторитетность',
      how_to_fix: 'Для статей добавьте Article Schema, для бизнеса — LocalBusiness с адресом и контактами',
      example_fix: '{"@type":"Article","headline":"...","author":{"@type":"Person","name":"..."},"datePublished":"2025-01-01"}',
      visible_in_preview: false }));
  }

  // --- 5. E-E-A-T signals ---
  const htmlLower = html.toLowerCase();
  const hasAuthor = /об\s*автор|author|автор\s*стать|написал|эксперт/i.test(html) 
    || schemaTypes.some(t => t === 'Person')
    || /"author"/i.test(html);
  const hasDatePublished = /datePublished/i.test(html) 
    || /<time[^>]*datetime/i.test(html) 
    || /дата\s*публикац|опубликован/i.test(htmlLower);
  
  if (!hasAuthor && !hasDatePublished) {
    issues.push(makeIssue({ module: 'ai', severity: 'high',
      title: '🤖 Нет E-E-A-T сигналов',
      found: 'Не найдены: блок об авторе, дата публикации',
      location: 'Контент страницы',
      why_it_matters: 'E-E-A-T (Experience, Expertise, Authoritativeness, Trust) — ключевой фактор для AI-систем при выборе источника для цитирования. Без автора и даты контент выглядит анонимным и ненадёжным',
      how_to_fix: 'Добавьте блок об авторе с именем и экспертизой, укажите дату публикации через <time datetime="...">',
      example_fix: '<div class="author">\n  <img src="author.jpg" alt="Имя Автора">\n  <p>Автор: <strong>Имя Автора</strong>, SEO-эксперт с 10-летним опытом</p>\n</div>\n<time datetime="2025-01-01">1 января 2025</time>',
      visible_in_preview: true }));
  } else if (!hasAuthor) {
    issues.push(makeIssue({ module: 'ai', severity: 'medium',
      title: '🤖 Нет блока об авторе',
      found: 'Дата публикации найдена, но автор не указан',
      location: 'Контент страницы',
      why_it_matters: 'Контент без указания автора теряет в авторитетности для AI-систем',
      how_to_fix: 'Добавьте информацию об авторе с его экспертизой',
      example_fix: '<p>Автор: <strong>Имя</strong>, специалист в области...</p>',
      visible_in_preview: false }));
  } else if (!hasDatePublished) {
    issues.push(makeIssue({ module: 'ai', severity: 'medium',
      title: '🤖 Нет даты публикации',
      found: 'Автор найден, но дата публикации не указана',
      location: 'Контент страницы',
      why_it_matters: 'Без даты AI-системы не могут оценить актуальность контента',
      how_to_fix: 'Добавьте дату публикации через тег <time> с атрибутом datetime',
      example_fix: '<time datetime="2025-01-01">1 января 2025</time>',
      visible_in_preview: false }));
  }

  // --- Original checks ---
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

// ═══ STEP 4: Competitor Analysis (ПРОМТ 5) ═══
interface CompetitorProfile {
  _type: 'competitor';
  position: number;
  url: string;
  domain: string;
  title: string | null;
  h1: string | null;
  content_length_words: number;
  has_faq: boolean;
  has_price_block: boolean;
  has_reviews: boolean;
  has_schema: boolean;
  has_cta_button: boolean;
  has_video: boolean;
  has_blog: boolean;
  load_speed_sec: number | null;
  h2_count: number;
  h3_count: number;
  images_count: number;
  internal_links_count: number;
  top_phrases: string[];
  is_analyzed: boolean;
}

interface CompetitorMetrics {
  content_length_words: number;
  h2_count: number;
  images_count: number;
  has_faq: boolean;
  has_price_block: boolean;
  has_reviews: boolean;
  has_schema: boolean;
  has_video: boolean;
}

interface ComparisonTableData {
  _type: 'comparison_table';
  your_site: CompetitorMetrics;
  avg_top10: CompetitorMetrics;
  leader: CompetitorMetrics;
  leader_domain: string;
  insights: string[];
}

interface DirectMetaData {
  _type: 'direct_meta';
  query: string;
  region: string;
  serp_date: string;
  total_found: number;
}

interface CompetitorAnalysisResult {
  competitors: CompetitorProfile[];
  comparisonTable: ComparisonTableData | null;
  directMeta: DirectMetaData | null;
  gap_issues: Issue[];
}

// Parse a single competitor page into a profile (pure DOM, no LLM)
function parseCompetitorHtml(url: string, html: string, loadMs: number, position: number): CompetitorProfile {
  const domain = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();
  
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() || null : null;

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() || null : null;

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch
    ? bodyMatch[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : '';
  const words = bodyText.split(/\s+/).filter(w => w.length > 2);

  const htmlLower = html.toLowerCase();
  const has_faq = /faq|часто\s*задаваемые|вопрос.*ответ/i.test(html) || html.includes('FAQPage') || /<details[\s>]/i.test(html);
  const has_price_block = /прайс|стоимость|цена|руб|₽|\d+\s*р\b|тариф/i.test(bodyText);
  const has_reviews = /отзыв|review|testimonial|рекоменд|клиент\s*говор/i.test(bodyText) || html.includes('schema.org/Review');
  const has_schema = !!html.match(/<script[^>]*type=["']application\/ld\+json["']/i);
  const has_cta_button = /заказ|купи|оставить заявку|запис|получить|корзин|связаться|консультац/i.test(html);
  const has_video = htmlLower.includes('<video') || htmlLower.includes('youtube.com') || htmlLower.includes('rutube.ru');
  const has_blog = htmlLower.includes('/blog') || htmlLower.includes('/stati') || htmlLower.includes('/news') || htmlLower.includes('/articles');

  const h2_count = (html.match(/<h2[\s>]/gi) || []).length;
  const h3_count = (html.match(/<h3[\s>]/gi) || []).length;
  const images_count = (html.match(/<img[\s>]/gi) || []).length;
  
  // Internal links
  const internalLinkRegex = new RegExp(`href=["'][^"']*${domain.replace(/\./g, '\\.')}[^"']*["']`, 'gi');
  const internal_links_count = (html.match(internalLinkRegex) || []).length + (html.match(/href=["']\//g) || []).length;

  // Top phrases from H1 and H2
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const top_phrases = [
    ...(h1 ? [h1] : []),
    ...h2Matches
      .map(h => h.replace(/<[^>]+>/g, '').trim())
      .filter(h => h.length > 5)
      .slice(0, 4)
  ].slice(0, 5);

  return {
    _type: 'competitor',
    position,
    url,
    domain,
    title,
    h1,
    content_length_words: words.length,
    has_faq,
    has_price_block,
    has_reviews,
    has_schema,
    has_cta_button,
    has_video,
    has_blog,
    load_speed_sec: Math.round(loadMs / 100) / 10,
    h2_count,
    h3_count,
    images_count,
    internal_links_count,
    top_phrases,
    is_analyzed: true,
  };
}

// Build "yours" profile from main page HTML
function buildOwnProfile(url: string, html: string, loadTimeMs: number): CompetitorProfile {
  return parseCompetitorHtml(url, html, loadTimeMs, 0);
}

// Excluded domains
const EXCLUDED_DOMAINS = new Set([
  'wikipedia.org', 'youtube.com', 'vk.com', 'ok.ru', 'instagram.com',
  'facebook.com', 'twitter.com', 'x.com', 'tiktok.com',
  'hh.ru', 'avito.ru', 'dzen.ru', 'zen.yandex.ru',
  'yandex.ru', 'google.com', 'mail.ru',
]);

function isExcludedUrl(u: string, ownHostname: string): boolean {
  try {
    const host = new URL(u).hostname.replace(/^www\./, '');
    if (host === ownHostname.replace(/^www\./, '')) return true;
    return [...EXCLUDED_DOMAINS].some(d => host === d || host.endsWith(`.${d}`));
  } catch { return true; }
}

async function competitorAnalysis(
  url: string, theme: string, html: string, mode: string, loadTimeMs: number, crawledPages: string[]
): Promise<CompetitorAnalysisResult> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return { competitors: [], comparisonTable: null, directMeta: null, gap_issues: [] };

  const ownHostname = new URL(url).hostname;
  const searchQuery = theme ? `${theme}` : ownHostname;

  // ── Step A: Generate commercial search queries from theme ──
  let searchQueries: string[] = [];
  try {
    console.log(`[OWNDEV] Шаг: competitorQueries | Модель: google/gemini-2.0-flash | URL: ${url}`);
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.0-flash',
        messages: [
          { role: 'system', content: 'Сгенерируй 3-5 коммерческих поисковых запросов для Яндекса по заданной теме. Запросы должны быть такими, какие вводят потенциальные клиенты. Формат: JSON массив строк. ВАЖНО: Отвечай СТРОГО на русском языке. Возвращай ТОЛЬКО валидный JSON без markdown-блоков, без пояснений, без ```json, только сам JSON.' },
          { role: 'user', content: `Тема: "${theme}"` },
        ],
        max_tokens: 200, temperature: 0.1, top_p: 0.85, top_k: 20,
      }),
    });
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '[]';
    console.log(`[OWNDEV] Ответ competitorQueries:`, content.slice(0, 200));
    searchQueries = safeParseJson<string[]>(content, []);
    console.log(`[OWNDEV] Распарсено competitorQueries: ${searchQueries.length} элементов`);
  } catch { searchQueries = [searchQuery]; }
  if (searchQueries.length === 0) searchQueries = [searchQuery];

  // ── Step Б: Get top competitor URLs via web search ──
  const competitorUrls = new Set<string>();
  for (const query of searchQueries.slice(0, 3)) {
    try {
      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [
            { role: 'system', content: `Ты помогаешь SEO-специалисту найти конкурентов. Для запроса "${query}" назови 5-7 реальных коммерческих сайтов которые были бы в топ-10 Яндекса. Исключи агрегаторы (avito, hh.ru), соцсети, википедию. Формат: JSON массив URL (полных, с https://). ВАЖНО: Отвечай СТРОГО на русском языке. Возвращай ТОЛЬКО валидный JSON без markdown-блоков, без пояснений, без \`\`\`json, только сам JSON.` },
            { role: 'user', content: `Запрос: "${query}"\nИсключить домен: ${ownHostname}` },
          ],
          max_tokens: 500, temperature: 0.1, top_p: 0.85, top_k: 20,
        }),
      });
      const data = await resp.json();
      const content = data.choices?.[0]?.message?.content?.trim() || '[]';
      console.log(`[OWNDEV] Ответ competitorURLs:`, content.slice(0, 200));
      const urls: string[] = safeParseJson<string[]>(content, []);
      console.log(`[OWNDEV] Распарсено competitorURLs: ${urls.length} элементов`);
      for (const u of urls) {
        if (!isExcludedUrl(u, ownHostname) && competitorUrls.size < 10) {
          competitorUrls.add(u);
        }
      }
    } catch {}
    if (competitorUrls.size >= 10) break;
  }

  // ── Step В: Parse each competitor (pure DOM, no LLM) ──
  const competitors: CompetitorProfile[] = [];
  let positionCounter = 0;
  const fetchPromises = [...competitorUrls].map(async (compUrl) => {
    const pos = ++positionCounter;
    try {
      const start = Date.now();
      const resp = await fetchWithTimeout(compUrl, 8000);
      const ms = Date.now() - start;
      if (!resp.ok) return { _type: 'competitor' as const, position: pos, url: compUrl, domain: new URL(compUrl).hostname.replace(/^www\./, ''), title: null, h1: null, content_length_words: 0, has_faq: false, has_price_block: false, has_reviews: false, has_schema: false, has_cta_button: false, has_video: false, has_blog: false, load_speed_sec: null, h2_count: 0, h3_count: 0, images_count: 0, internal_links_count: 0, top_phrases: [] as string[], is_analyzed: false };
      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('text/html')) return null;
      const compHtml = await resp.text();
      return parseCompetitorHtml(compUrl, compHtml, ms, pos);
    } catch {
      return { _type: 'competitor' as const, position: pos, url: compUrl, domain: (() => { try { return new URL(compUrl).hostname.replace(/^www\./, ''); } catch { return compUrl; } })(), title: null, h1: null, content_length_words: 0, has_faq: false, has_price_block: false, has_reviews: false, has_schema: false, has_cta_button: false, has_video: false, has_blog: false, load_speed_sec: null, h2_count: 0, h3_count: 0, images_count: 0, internal_links_count: 0, top_phrases: [] as string[], is_analyzed: false };
    }
  });

  const results = await Promise.all(fetchPromises);
  for (const r of results) {
    if (r) competitors.push(r);
  }

  // ── Build own profile ──
  const own = buildOwnProfile(url, html, loadTimeMs);

  // ── Build comparison table (no LLM) ──
  const analyzed = competitors.filter(c => c.is_analyzed && c.content_length_words > 50);
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
  const pct = (arr: boolean[]) => arr.length ? Math.round(arr.filter(Boolean).length / arr.length * 100) : 0;
  const leader = analyzed.length ? analyzed.reduce((best, c) => c.content_length_words > best.content_length_words ? c : best, analyzed[0]) : own;

  const avgMetrics: CompetitorMetrics = {
    content_length_words: avg(analyzed.map(c => c.content_length_words)),
    h2_count: avg(analyzed.map(c => c.h2_count)),
    images_count: avg(analyzed.map(c => c.images_count)),
    has_faq: pct(analyzed.map(c => c.has_faq)) >= 50,
    has_price_block: pct(analyzed.map(c => c.has_price_block)) >= 50,
    has_reviews: pct(analyzed.map(c => c.has_reviews)) >= 50,
    has_schema: pct(analyzed.map(c => c.has_schema)) >= 50,
    has_video: pct(analyzed.map(c => c.has_video)) >= 50,
  };

  // Auto-generate insights without LLM
  const insights: string[] = [];
  if (own.content_length_words < avgMetrics.content_length_words - 300) {
    insights.push(`Объём контента ниже среднего на ${avgMetrics.content_length_words - own.content_length_words} слов — добавьте описания, FAQ и этапы работы`);
  }
  if (!own.has_faq && avgMetrics.has_faq) {
    const faqCount = analyzed.filter(c => c.has_faq).length;
    insights.push(`FAQ-блок есть у ${faqCount} из ${analyzed.length} конкурентов — добавьте его для расширенных сниппетов`);
  }
  if (!own.has_reviews && avgMetrics.has_reviews) {
    insights.push(`Отзывы есть у большинства конкурентов — это повышает доверие и CTR`);
  }
  if (!own.has_schema && avgMetrics.has_schema) {
    insights.push(`Schema.org есть у большинства конкурентов — добавьте для расширенных сниппетов`);
  }
  if (!own.has_price_block && avgMetrics.has_price_block) {
    insights.push(`Блок с ценами найден у конкурентов — пользователи ожидают видеть стоимость на странице`);
  }
  if (own.h2_count < avgMetrics.h2_count - 2) {
    insights.push(`Структура контента слабее: у вас ${own.h2_count} H2, у конкурентов в среднем ${avgMetrics.h2_count}`);
  }
  if (!own.has_video && avgMetrics.has_video) {
    insights.push(`Видео есть у большинства конкурентов — добавьте видео для повышения вовлечённости`);
  }
  if (insights.length === 0) {
    insights.push('Сайт хорошо конкурентоспособен по структурным параметрам');
  }

  const comparisonTable: ComparisonTableData = {
    _type: 'comparison_table',
    your_site: {
      content_length_words: own.content_length_words,
      h2_count: own.h2_count,
      images_count: own.images_count,
      has_faq: own.has_faq,
      has_price_block: own.has_price_block,
      has_reviews: own.has_reviews,
      has_schema: own.has_schema,
      has_video: own.has_video,
    },
    avg_top10: avgMetrics,
    leader: {
      content_length_words: leader.content_length_words,
      h2_count: leader.h2_count,
      images_count: leader.images_count,
      has_faq: leader.has_faq,
      has_price_block: leader.has_price_block,
      has_reviews: leader.has_reviews,
      has_schema: leader.has_schema,
      has_video: leader.has_video,
    },
    leader_domain: leader.domain,
    insights,
  };

  const directMeta: DirectMetaData = {
    _type: 'direct_meta',
    query: searchQueries[0] || theme,
    region: 'Россия',
    serp_date: new Date().toISOString().split('T')[0],
    total_found: competitors.length,
  };

  // ── Gap analysis → IssueCards ──
  const gap_issues: Issue[] = [];
  const total = analyzed.length;
  if (total >= 3) {
    const gaps: { param: string; ownHas: boolean; compCount: number; fixTitle: string; fixHow: string; fixExample: string }[] = [
      { param: 'FAQ', ownHas: own.has_faq, compCount: analyzed.filter(c => c.has_faq).length,
        fixTitle: 'Нет блока FAQ — есть у большинства конкурентов',
        fixHow: 'Добавьте раздел «Часто задаваемые вопросы» с 5-10 вопросами по теме',
        fixExample: '<h2>Часто задаваемые вопросы</h2>\n<h3>Сколько стоит ' + theme.toLowerCase() + '?</h3>\n<p>Стоимость зависит от объёма работ...</p>' },
      { param: 'Блок цен', ownHas: own.has_price_block, compCount: analyzed.filter(c => c.has_price_block).length,
        fixTitle: 'Нет блока с ценами — есть у большинства конкурентов',
        fixHow: 'Добавьте блок с ценами или тарифами на странице',
        fixExample: '<section><h2>Стоимость</h2><p>от 5 000 ₽</p></section>' },
      { param: 'Отзывы', ownHas: own.has_reviews, compCount: analyzed.filter(c => c.has_reviews).length,
        fixTitle: 'Нет блока с отзывами — есть у большинства конкурентов',
        fixHow: 'Добавьте блок с реальными отзывами клиентов',
        fixExample: '<section><h2>Отзывы клиентов</h2><blockquote>«Отличный результат!» — Иван, ООО «Компания»</blockquote></section>' },
      { param: 'Schema.org', ownHas: own.has_schema, compCount: analyzed.filter(c => c.has_schema).length,
        fixTitle: 'Нет Schema.org разметки — есть у большинства конкурентов',
        fixHow: 'Добавьте JSON-LD разметку (Organization, FAQPage, Product)',
        fixExample: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","name":"..."}</script>' },
      { param: 'CTA кнопка', ownHas: own.has_cta_button, compCount: analyzed.filter(c => c.has_cta_button).length,
        fixTitle: 'Нет CTA — есть у большинства конкурентов',
        fixHow: 'Добавьте заметную кнопку призыва к действию',
        fixExample: '<button>Заказать ' + theme.toLowerCase() + '</button>' },
    ];

    for (const gap of gaps) {
      if (gap.ownHas) continue;
      const threshold = total >= 8 ? 6 : Math.ceil(total * 0.6);
      if (gap.compCount >= threshold) {
        const severity = gap.compCount >= Math.ceil(total * 0.8) ? 'high' : 'medium';
        gap_issues.push(makeIssue({
          module: 'competitors', severity,
          title: gap.fixTitle,
          found: `У вас: нет. У конкурентов: ${gap.compCount} из ${total} (${Math.round(gap.compCount / total * 100)}%)`,
          location: 'Контент страницы',
          why_it_matters: `${gap.compCount} из ${total} конкурентов в топе имеют ${gap.param.toLowerCase()}. Это стандарт ниши — без этого блока страница проигрывает в поведенческих факторах`,
          how_to_fix: gap.fixHow,
          example_fix: gap.fixExample,
          visible_in_preview: false,
        }));
      }
    }

    // Content volume gap
    const avgWords = avg(analyzed.map(c => c.content_length_words));
    if (own.content_length_words < avgWords * 0.5 && avgWords > 300) {
      gap_issues.push(makeIssue({
        module: 'competitors', severity: 'high',
        title: 'Объём контента значительно меньше конкурентов',
        found: `У вас: ${own.content_length_words} слов. Среднее по топу: ${avgWords} слов. Лидер: ${leader.content_length_words} слов`,
        location: 'Контент страницы',
        why_it_matters: 'Страницы в топе содержат в среднем больше контента. Малый объём снижает шансы на ранжирование по целевым запросам',
        how_to_fix: `Расширьте контент до ${Math.round(avgWords * 0.8)}-${avgWords} слов: добавьте описания, FAQ, кейсы`,
        example_fix: `Рекомендуемый объём: ${Math.round(avgWords * 0.8)}+ слов`,
        visible_in_preview: false,
      }));
    }

    // H2 count gap
    const avgH2 = avg(analyzed.map(c => c.h2_count));
    if (own.h2_count < avgH2 * 0.4 && avgH2 >= 3) {
      gap_issues.push(makeIssue({
        module: 'competitors', severity: 'medium',
        title: 'Мало H2-подзаголовков по сравнению с конкурентами',
        found: `У вас: ${own.h2_count} H2. Среднее по топу: ${avgH2}. Лидер: ${leader.h2_count}`,
        location: 'Структура контента',
        why_it_matters: 'Подзаголовки структурируют контент и помогают поисковикам определить тематические разделы',
        how_to_fix: `Добавьте H2-подзаголовки для основных разделов (рекомендуем ${Math.max(3, Math.round(avgH2 * 0.7))}+)`,
        example_fix: `<h2>Преимущества ${theme.toLowerCase()}</h2>\n<h2>Стоимость ${theme.toLowerCase()}</h2>\n<h2>Как заказать</h2>`,
        visible_in_preview: false,
      }));
    }
  }

  // ── Site-mode extra: compare site structure with leader ──
  if (mode === 'site' && analyzed.length > 0 && crawledPages.length > 0) {
    try {
      const leaderUrl = new URL(leader.url);
      const leaderResp = await fetchText(leaderUrl.origin, 5000);
      if (leaderResp.ok) {
        const leaderLinks = [...leaderResp.text.matchAll(/href=["']([^"'#]+)["']/gi)]
          .map(m => m[1])
          .filter(h => h.startsWith('/') && h.length > 1)
          .map(h => h.replace(/\/$/, '').toLowerCase());
        const leaderSections = [...new Set(leaderLinks.map(l => l.split('/').filter(Boolean)[0] || ''))].filter(Boolean);
        const ownPaths = crawledPages.map(p => { try { return new URL(p).pathname.split('/').filter(Boolean)[0] || ''; } catch { return ''; } }).filter(Boolean);
        const ownSections = [...new Set(ownPaths)];
        const missingSections = leaderSections.filter(s => !ownSections.some(os => os.includes(s) || s.includes(os)));
        if (missingSections.length > 0) {
          gap_issues.push(makeIssue({
            module: 'competitors', severity: 'medium',
            title: 'У лидера топа есть разделы, которых нет на вашем сайте',
            found: `Разделы лидера (${leaderUrl.hostname}), которых нет у вас:\n${missingSections.slice(0, 5).map(s => `• /${s}/`).join('\n')}`,
            location: 'Структура сайта',
            why_it_matters: 'Полноценная структура сайта с отдельными страницами по направлениям повышает релевантность и покрытие запросов',
            how_to_fix: 'Создайте аналогичные разделы на вашем сайте с уникальным контентом',
            example_fix: missingSections.slice(0, 3).map(s => `Создать: /${s}/ — страница с описанием, ценами, CTA`).join('\n'),
            visible_in_preview: false,
          }));
        }
      }
    } catch {}
  }

  console.log('[OWNDEV competitors raw]', JSON.stringify(competitors.map(c => ({ url: c.url, domain: c.domain, is_analyzed: c.is_analyzed, words: c.content_length_words }))).slice(0, 500));

  return { competitors, comparisonTable, directMeta, gap_issues };
}

// ═══ STEP 5: Keyword Generation (ПРОМТ 6) ═══
interface KeywordEntry {
  phrase: string;
  cluster: string;
  intent: 'commercial' | 'informational' | 'navigational' | 'transactional';
  frequency: number;
  landing_needed: boolean;
}

async function extractKeywords(
  html: string, theme: string, url: string, competitorPhrases: string[] = []
): Promise<KeywordEntry[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  if (!LOVABLE_API_KEY) return [];

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch
    ? bodyMatch[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
    : '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';

  const phrasesBlock = competitorPhrases.length > 0
    ? `\nФразы конкурентов: ${competitorPhrases.join(', ')}`
    : '';

  const systemPrompt = `Ты — профессиональный SEO-специалист для Рунета.
Сгенерируй список ключевых слов для продвижения сайта.

Входные данные:
- URL сайта: ${url}
- Тематика: ${theme}

ТРЕБОВАНИЯ:
- Ровно 150 ключевых запросов
- Только реальные запросы которые реально ищут в Яндексе
- Без дублей, без общих фраз типа "купить онлайн"
- Кластеризация: максимум 7 смысловых кластеров
- intent строго одно из: commercial / informational / navigational / transactional
- frequency: целое число от 50 до 50000
- landing_needed: true если нужна отдельная страница под запрос

ФОРМАТ — строго JSON-массив из 150 объектов:
[{"phrase":"ключевой запрос","cluster":"название кластера","intent":"commercial","frequency":2400,"landing_needed":false}]

ВАЖНО: Отвечай СТРОГО на русском языке. Возвращай ТОЛЬКО валидный JSON без markdown-блоков, без пояснений, без \`\`\`json, только сам JSON.`;

  const allKeywords: KeywordEntry[] = [];
  for (let batch = 0; batch < 3; batch++) {
    const batchPrompt = batch === 0
      ? `URL: ${url}\nTitle: ${title}\nH1: ${h1}\nТекст: ${bodyText.slice(0, 1500)}${phrasesBlock}`
      : `Ещё 100 НОВЫХ запросов для "${theme}". Не дублируй: ${allKeywords.slice(0, 20).map(k => k.phrase).join(', ')}.\nКластеры: ${[...new Set(allKeywords.map(k => k.cluster))].join(', ')}`;
    try {
      console.log(`[OWNDEV] Шаг: extractKeywords batch ${batch} | Модель: google/gemini-2.5-pro | URL: ${url}`);
      const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'google/gemini-2.5-pro',
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: batchPrompt }],
          max_tokens: 16000, temperature: 0.1, top_p: 0.85, top_k: 20,
        }),
      });
      if (!resp.ok) { console.error(`[OWNDEV] Keyword batch ${batch}: ${resp.status}`); continue; }
      const data = await resp.json();
      const kwRaw = data.choices?.[0]?.message?.content?.trim() || '[]';
      console.log(`[OWNDEV] Ответ extractKeywords batch ${batch}:`, kwRaw.slice(0, 200));
      const parsed = safeParseJson<KeywordEntry[]>(kwRaw, []);
      if (parsed.length > 0) {
        allKeywords.push(...parsed);
        console.log(`[OWNDEV] Распарсено extractKeywords batch ${batch}: ${parsed.length} элементов, total: ${allKeywords.length}`);
      } else { console.error('[OWNDEV] KW parse fail:', kwRaw.slice(0, 500)); }
    } catch (e) { console.error('[OWNDEV] KW error:', e); }
    if (allKeywords.length >= 200) break;
  }
  const seen = new Set<string>();
  return allKeywords.filter(k => {
    const key = k.phrase?.toLowerCase()?.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ═══ STEP 6: Minus Words (ПРОМТ 6) ═══
interface MinusWordEntry {
  word: string;
  category: 'informational' | 'irrelevant' | 'competitor' | 'geo' | 'other';
  reason: string;
}

const GENERAL_MINUS_WORDS: MinusWordEntry[] = [
  { word: 'бесплатно', category: 'irrelevant', reason: 'Нецелевая аудитория' },
  { word: 'бесплатная', category: 'irrelevant', reason: 'Нецелевая аудитория' },
  { word: 'бесплатный', category: 'irrelevant', reason: 'Нецелевая аудитория' },
  { word: 'скачать', category: 'informational', reason: 'Информационный интент' },
  { word: 'торрент', category: 'irrelevant', reason: 'Пиратский контент' },
  { word: 'своими руками', category: 'informational', reason: 'DIY-аудитория' },
  { word: 'самостоятельно', category: 'informational', reason: 'DIY-аудитория' },
  { word: 'самому', category: 'informational', reason: 'DIY-аудитория' },
  { word: 'видеоурок', category: 'informational', reason: 'Образовательный интент' },
  { word: 'смотреть онлайн', category: 'irrelevant', reason: 'Развлекательный интент' },
  { word: 'wikipedia', category: 'informational', reason: 'Информационный интент' },
  { word: 'реферат', category: 'informational', reason: 'Образовательный интент' },
  { word: 'курсовая', category: 'informational', reason: 'Образовательный интент' },
  { word: 'диплом', category: 'informational', reason: 'Образовательный интент' },
  { word: 'вики', category: 'informational', reason: 'Информационный интент' },
];

async function generateMinusWords(theme: string, keywords: KeywordEntry[]): Promise<MinusWordEntry[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  const result: MinusWordEntry[] = [...GENERAL_MINUS_WORDS];
  if (!LOVABLE_API_KEY) return result;
  const sampleKeys = keywords.filter(k => k.intent === 'commercial').slice(0, 15).map(k => k.phrase).join(', ');
  try {
    console.log(`[OWNDEV] Шаг: generateMinusWords | Модель: google/gemini-2.5-flash`);
    const resp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: `Ты — специалист по Яндекс.Директ.
Сгенерируй список минус-слов для рекламной кампании.

Входные данные:
- Тематика: ${theme}
- Коммерческие ключи: ${sampleKeys}

ТРЕБОВАНИЯ:
- 50-80 минус-слов
- Только слова которые реально отсекают нецелевой трафик
- Не дублировать стандартные минуса (бесплатно, скачать, своими руками, реферат, курсовая)
- category строго одно из: informational / irrelevant / competitor / geo / other

ФОРМАТ — строго JSON-массив:
[{"word":"слово","category":"informational","reason":"почему минусовать"}]

ВАЖНО: Отвечай СТРОГО на русском языке. Возвращай ТОЛЬКО валидный JSON без markdown-блоков, без пояснений, без \`\`\`json, только сам JSON.` },
          { role: 'user', content: `Тема: ${theme}\nКлючи: ${sampleKeys}` },
        ],
        max_tokens: 8192, temperature: 0.1, top_p: 0.85, top_k: 20,
      }),
    });
    const data = await resp.json();
    const content = data.choices?.[0]?.message?.content?.trim() || '[]';
    console.log(`[OWNDEV] Ответ generateMinusWords:`, content.slice(0, 200));
    const parsed = safeParseJson<MinusWordEntry[]>(content, []);
    console.log(`[OWNDEV] Распарсено generateMinusWords: ${parsed.length} элементов`);
    result.push(...parsed);
  } catch {}
  const seen = new Set<string>();
  return result.filter(m => {
    const key = m.word?.toLowerCase()?.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}


// ═══ Crawl site (mode=site) — max 100 pages ═══
async function crawlSite(startUrl: string, maxPages = 100): Promise<{ url: string; html: string; status: number }[]> {
  const visited = new Set<string>();
  const queue = [startUrl];
  const parsedStart = new URL(startUrl);
  const results: { url: string; html: string; status: number }[] = [];
  
  const disallowed: string[] = [];
  try {
    const robotsResp = await fetchWithTimeout(`${parsedStart.origin}/robots.txt`, 3000);
    if (robotsResp.ok) {
      const robotsTxt = await robotsResp.text();
      for (const line of robotsTxt.split('\n')) {
        const match = line.match(/^Disallow:\s*(.+)/i);
        if (match) disallowed.push(match[1].trim());
      }
    }
  } catch {}
  
  while (queue.length > 0 && visited.size < maxPages) {
    const url = queue.shift()!;
    if (visited.has(url)) continue;
    
    const path = new URL(url).pathname;
    if (disallowed.some(d => path.startsWith(d))) continue;
    
    visited.add(url);
    
    try {
      const resp = await fetchWithTimeout(url, 5000);
      const status = resp.status;
      const contentType = resp.headers.get('content-type') || '';
      if (!contentType.includes('text/html')) { await resp.text(); results.push({ url, html: '', status }); continue; }
      const html = await resp.text();
      results.push({ url, html, status });
      
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
    } catch {
      results.push({ url, html: '', status: 0 });
    }
  }
  
  return results;
}
// ─── Extract SEO data from HTML for reports ───
function extractSeoData(html: string, parsedUrl: URL, httpStatus: number, loadTimeMs: number, robotsResult: { ok: boolean; text: string }, sitemapResult: { ok: boolean; text: string }, hasLlmsTxt: boolean) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : '';

  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
  const h3Count = (html.match(/<h3[\s>]/gi) || []).length;

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const wordCount = bodyText.split(/\s+/).filter((w: string) => w.length > 1).length;

  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : '';

  const ogTitle = (html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';
  const ogDescription = (html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';
  const ogImage = (html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';
  const ogUrl = (html.match(/<meta[^>]*property=["']og:url["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';

  const langMatch = html.match(/<html[^>]*lang=["']([^"']*)["']/i);
  const lang = langMatch ? langMatch[1] : '';

  const allImages = html.match(/<img[^>]*>/gi) || [];
  const imagesTotal = allImages.length;
  const imagesWithoutAlt = allImages.filter((img: string) => !img.match(/alt=["'][^"']+["']/i)).length;
  const imagesWithoutDimensions = allImages.filter((img: string) => !img.match(/width=/i) || !img.match(/height=/i)).length;

  const jsonLdBlocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const schemaTypes: string[] = [];
  let hasFaq = false;
  for (const block of jsonLdBlocks) {
    const content = block.replace(/<\/?script[^>]*>/gi, '');
    try {
      const parsed = JSON.parse(content);
      const extractTypes = (obj: any) => {
        if (obj?.['@type']) {
          const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
          schemaTypes.push(...types);
          if (types.some((t: string) => t.toLowerCase().includes('faq'))) hasFaq = true;
        }
        if (obj?.['@graph'] && Array.isArray(obj['@graph'])) obj['@graph'].forEach(extractTypes);
      };
      extractTypes(parsed);
    } catch {}
  }
  const hasSchema = schemaTypes.length > 0;

  const robotsMetaMatch = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
  const robotsMeta = robotsMetaMatch ? robotsMetaMatch[1] : '';
  const hasViewport = /<meta[^>]*name=["']viewport["']/i.test(html);

  const hasPriceBlock = /(?:цен[аы]|прайс|стоимость|price|от\s*\d+\s*₽|руб)/i.test(bodyText);
  const hasReviews = /(?:отзыв|review|testimonial)/i.test(bodyText);
  const hasVideo = /<(video|iframe)[^>]*(youtube|vimeo|rutube|embed)/i.test(html);

  return {
    title, titleLength: title.length,
    description, descriptionLength: description.length,
    h1, h1Count, h2Count, h3Count,
    wordCount, canonical,
    ogTitle, ogDescription, ogImage, ogUrl,
    lang,
    imagesTotal, imagesWithoutAlt, imagesWithoutDimensions,
    hasSchema, schemaTypes: [...new Set(schemaTypes)],
    hasFaq, hasLlmsTxt,
    robotsMeta, hasViewport,
    hasPriceBlock, hasReviews, hasVideo,
    loadTimeMs, httpStatus,
    hasRobotsTxt: robotsResult.ok,
    hasSitemap: sitemapResult.ok,
  };
}

// ═══ Update scan progress in DB ═══
async function updateScan(scanId: string, updates: Record<string, any>) {
  const supabase = getSupabase();
  await supabase.from('scans').update(updates).eq('id', scanId);
}

// ═══ Main pipeline with 10-minute timeout ═══
const PIPELINE_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

async function runPipelineWithTimeout(scanId: string, url: string, mode: string) {
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Pipeline timeout: exceeded 10 minutes')), PIPELINE_TIMEOUT_MS)
  );
  try {
    await Promise.race([runPipeline(scanId, url, mode), timeoutPromise]);
  } catch (error) {
    console.error('Pipeline failed:', error);
    await updateScan(scanId, { status: 'error', error_message: error.message || 'Unknown error' });
  }
}

async function runPipeline(scanId: string, url: string, mode: string) {
  issueCounter = 0;
  await updateScan(scanId, { status: 'running', progress_pct: 5 });

  // Load rules from DB
  const dbRules = await loadRules();
  console.log(`Loaded ${dbRules.length} active rules from DB`);
  
  // Fetch page HTML with graceful error handling
  const parsedUrl = new URL(url.startsWith('http') ? url : `https://${url}`);
  const origin = parsedUrl.origin;
  let html: string;
  let httpStatus: number;
  let loadTimeMs: number;

  try {
    const startTime = Date.now();
    const response = await fetchWithTimeout(parsedUrl.toString(), 10000);
    loadTimeMs = Date.now() - startTime;
    httpStatus = response.status;
    html = await response.text();
  } catch (e) {
    // Site unavailable — return critical issue and stop
    const unavailableIssue = makeIssue({
      module: 'technical', severity: 'critical',
      title: 'Сайт недоступен или заблокировал запрос',
      found: `URL: ${parsedUrl.toString()}\nОшибка: ${e.message}`,
      location: 'HTTP запрос',
      why_it_matters: 'Невозможно проанализировать сайт, если он не отвечает на запросы',
      how_to_fix: 'Убедитесь что сайт доступен, не блокирует ботов и отвечает в течение 10 секунд',
      example_fix: 'Проверьте настройки WAF/Cloudflare и попробуйте ещё раз',
      visible_in_preview: true,
    });
    await updateScan(scanId, {
      status: 'done', progress_pct: 100,
      issues: [unavailableIssue],
      scores: { total: 0, seo: 0, direct: 0, schema: 0, ai: 0 },
      error_message: 'Сайт недоступен',
    });
    return;
  }
  
  await updateScan(scanId, { progress_pct: 10, raw_html: html.slice(0, 50000) });
  
  // STEP 0: Theme Detection
  const theme = await detectTheme(html, parsedUrl.toString());
  await updateScan(scanId, { theme, progress_pct: 20 });
  
  // Fetch robots.txt and sitemap.xml in parallel
  const [robotsResult, sitemapResult] = await Promise.all([
    fetchText(`${origin}/robots.txt`),
    fetchText(`${origin}/sitemap.xml`),
  ]);
  
  // Check broken links (sample up to 15)
  const allLinks = [...html.matchAll(/<a[^>]*href=["']([^"'#][^"']*)["']/gi)];
  const internalHrefs: string[] = [];
  for (const m of allLinks) {
    const href = m[1];
    if (href.startsWith('/') || href.includes(parsedUrl.hostname)) {
      internalHrefs.push(href.startsWith('/') ? `${origin}${href}` : href);
    }
  }
  const uniqueHrefs = [...new Set(internalHrefs)].slice(0, 15);
  const linkResults = await Promise.all(uniqueHrefs.map(h => checkUrl(h)));
  const brokenLinks = uniqueHrefs.filter((_, i) => !linkResults[i].ok && linkResults[i].status !== 0);
  
  // Extract SEO data for reports
  let hasLlmsTxt = false;
  try {
    const llmsCheck = await fetchWithTimeout(`${origin}/llms.txt`, 5000, { method: 'HEAD' });
    hasLlmsTxt = llmsCheck.ok;
  } catch {}
  const seoData = extractSeoData(html, parsedUrl, httpStatus, loadTimeMs, robotsResult, sitemapResult, hasLlmsTxt);
  console.log('[OWNDEV] seoData extracted:', JSON.stringify({ title: seoData.title?.slice(0, 50), wordCount: seoData.wordCount, hasSchema: seoData.hasSchema }));

  await updateScan(scanId, { progress_pct: 35, seo_data: seoData });
  
  // STEP 1: Technical SEO
  const techIssues = technicalAudit({
    html, parsedUrl, httpStatus,
    robotsOk: robotsResult.ok, robotsTxt: robotsResult.text,
    sitemapOk: sitemapResult.ok, sitemapBody: sitemapResult.text,
    brokenLinks, loadTimeMs,
  });
  
  // STEP 2: Content Audit
  const contentIssues = contentAudit(html, theme);
  
  // STEP 3: Yandex Direct
  const directResult = directAudit(html, theme);
  
  // Steps 7 & 8
  const schemaIssues = schemaAudit(html);
  const aiIssues = await aiAudit(html, parsedUrl.origin);
  
  const allHardcodedIssues = [...techIssues, ...contentIssues, ...directResult.issues, ...schemaIssues, ...aiIssues];
  
  // Map issues to DB rules
  const firedRuleIds: string[] = [];
  for (const issue of allHardcodedIssues) {
    const matchingRule = dbRules.find(r => {
      if (r.module !== issue.module) return false;
      const titleLower = issue.title.toLowerCase();
      const ruleTitleLower = r.title.toLowerCase();
      const ruleWords = ruleTitleLower.split(/\s+/).filter(w => w.length > 3);
      const matchCount = ruleWords.filter(w => titleLower.includes(w)).length;
      return matchCount >= Math.ceil(ruleWords.length * 0.5);
    });
    if (matchingRule) {
      (issue as any).rule_id = matchingRule.rule_id;
      issue.visible_in_preview = matchingRule.visible_in_preview;
      firedRuleIds.push(matchingRule.rule_id);
    }
  }

  let allIssues = [...allHardcodedIssues];
  
  // Site-mode: crawl (max 100 pages)
  let crawledPages: { url: string; html: string; status: number }[] = [];
  if (mode === 'site') {
    await updateScan(scanId, { progress_pct: 45 });
    crawledPages = await crawlSite(parsedUrl.toString(), 100);
    const siteIssues = siteModeTechnicalAudit(crawledPages);
    allIssues = [...allIssues, ...siteIssues];
  }
  
  const scores = calcScoresWeighted(allIssues, dbRules);
  await updateScan(scanId, { progress_pct: 60, scores, issues: allIssues, crawled_pages: crawledPages.map(p => p.url) });
  
  // STEPS 4-6: Background
  const crawledPageUrls = crawledPages.map(p => p.url);
  
  // Step 4: Competitor Analysis (skip unavailable competitors gracefully)
  const compResult = await competitorAnalysis(parsedUrl.toString(), theme, html, mode, loadTimeMs, crawledPageUrls);
  allIssues = [...allIssues, ...compResult.gap_issues];
  
  await updateScan(scanId, { progress_pct: 75 });
  
  // Step 5: Keywords
  const competitorPhrases = compResult.competitors.flatMap(c => c.top_phrases).slice(0, 30);
  const keywords = await extractKeywords(html, theme, parsedUrl.toString(), competitorPhrases);
  
  await updateScan(scanId, { progress_pct: 85, keywords });
  
  // Step 6: Minus words
  const minusWords = await generateMinusWords(theme, keywords);
  
  const finalScores = calcScoresWeighted(allIssues, dbRules);
  
  // Increment trigger counts (fire and forget)
  incrementTriggerCounts(firedRuleIds).catch(e => console.error('Trigger count error:', e));
  
  await updateScan(scanId, {
    status: 'done', progress_pct: 100,
    minus_words: minusWords,
    issues: allIssues, scores: finalScores,
    seo_data: seoData,
    competitors: [
      compResult.directMeta,
      ...compResult.competitors,
      compResult.comparisonTable,
      { _type: 'direct_ad_meta', ad_headline: directResult.ad_headline, autotargeting_categories: directResult.autotargeting_categories },
    ].filter(Boolean),
  });
}

// ═══ Rate limiting helpers ═══
function extractClientIp(req: Request): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip') ||
    req.headers.get('x-real-ip') ||
    'unknown';
}

function normalizeDomain(rawUrl: string): string {
  try {
    const u = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    return u.hostname.replace(/^www\./, '');
  } catch { return rawUrl; }
}

async function checkIpRateLimit(supabase: any, ip: string): Promise<boolean> {
  // 1 scan per 10 minutes per IP
  const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('scans')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', tenMinAgo);
  // Since we can't filter by IP in DB (no ip column), we use a softer approach:
  // Check total recent scans as a global rate limit fallback
  // Real IP-based limiting would need an ip column — for MVP this caps total throughput
  return (count || 0) < 25; // max 25 concurrent scans globally in 10min
}

async function checkDomainDailyLimit(supabase: any, domain: string): Promise<boolean> {
  // 3 scans per domain per day
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('scans')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', dayAgo)
    .ilike('url', `%${domain}%`);
  return (count || 0) < 3;
}

async function findCachedScan(supabase: any, domain: string, mode: string): Promise<any | null> {
  // Cache: return recent scan for same domain (1 hour TTL)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('scans')
    .select('id, status, progress_pct, scores')
    .ilike('url', `%${domain}%`)
    .eq('mode', mode)
    .eq('status', 'done')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  return data || null;
}

// ═══ HTTP Handler ═══
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  
  const url = new URL(req.url);
  const pathParts = url.pathname.split('/').filter(Boolean);
  
  const supabase = getSupabase();
  const json = async () => { try { return await req.json(); } catch { return {}; } };
  const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };
  
  try {
    // POST /start
    if (req.method === 'POST' && (pathParts.length <= 1 || pathParts[1] === 'start')) {
      const body = await json();
      const { url: scanUrl, mode = 'page' } = body;
      
      if (!scanUrl) {
        return new Response(JSON.stringify({ error: 'url is required' }), { status: 400, headers: jsonHeaders });
      }

      const domain = normalizeDomain(scanUrl);

      // Rate limit: 3 scans per domain per day
      const domainOk = await checkDomainDailyLimit(supabase, domain);
      if (!domainOk) {
        // Find last successful scan for this domain to offer user
        const { data: lastScan } = await supabase
          .from('scans')
          .select('id')
          .ilike('url', `%${domain}%`)
          .eq('status', 'done')
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        return new Response(JSON.stringify({
          error: 'Этот домен уже проверялся 3 раза за сутки. Попробуйте завтра.',
          code: 'DOMAIN_LIMIT',
          last_scan_id: lastScan?.id || null,
        }), { status: 429, headers: jsonHeaders });
      }

      // Global rate limit
      const globalOk = await checkIpRateLimit(supabase, extractClientIp(req));
      if (!globalOk) {
        return new Response(JSON.stringify({
          error: 'Слишком много запросов. Подождите несколько минут.',
          code: 'RATE_LIMIT',
        }), { status: 429, headers: jsonHeaders });
      }

      // Check cache: return existing recent scan
      const cached = await findCachedScan(supabase, domain, mode);
      if (cached) {
        return new Response(JSON.stringify({
          scan_id: cached.id, status: cached.status, cached: true,
        }), { headers: jsonHeaders });
      }

      // Concurrency limit: max 8 running full_reports
      if (mode === 'site') {
        const { count } = await supabase
          .from('scans')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'running')
          .eq('mode', 'site');
        if ((count || 0) >= 8) {
          return new Response(JSON.stringify({
            error: 'Сервер загружен. Попробуйте через пару минут.',
            code: 'CONCURRENCY_LIMIT',
          }), { status: 429, headers: jsonHeaders });
        }
      }
      
      const { data: scan, error } = await supabase.from('scans').insert({
        url: scanUrl, mode, status: 'running',
      }).select('id').single();
      
      if (error) throw error;
      
      // Run pipeline with timeout wrapper
      runPipelineWithTimeout(scan.id, scanUrl, mode).catch(e => console.error('Pipeline error:', e));
      
      return new Response(JSON.stringify({ scan_id: scan.id, status: 'running' }), { headers: jsonHeaders });
    }
    
    // GET /status/:scanId
    if (req.method === 'GET' && pathParts[1] === 'status' && pathParts[2]) {
      const scanId = pathParts[2];
      const { data, error } = await supabase.from('scans').select('status, progress_pct, scores').eq('id', scanId).single();
      if (error || !data) return new Response(JSON.stringify({ error: 'Scan not found' }), { status: 404, headers: jsonHeaders });
      
      return new Response(JSON.stringify({ status: data.status, progress_pct: data.progress_pct, scores_preview: data.scores }), { headers: jsonHeaders });
    }
    
    // GET /preview/:scanId
    if (req.method === 'GET' && pathParts[1] === 'preview' && pathParts[2]) {
      const scanId = pathParts[2];
      const { data, error } = await supabase.from('scans').select('*').eq('id', scanId).single();
      if (error || !data) return new Response(JSON.stringify({ error: 'Scan not found' }), { status: 404, headers: jsonHeaders });
      
      const allIssues = (data.issues as Issue[]) || [];
      const previewIssues = allIssues.filter(i => i.visible_in_preview).slice(0, 5);
      
      return new Response(JSON.stringify({
        scan_id: data.id, url: data.url, mode: data.mode, status: data.status,
        scores: data.scores, issues: previewIssues, issue_count: allIssues.length,
        theme: data.theme, created_at: data.created_at,
      }), { headers: jsonHeaders });
    }
    
    // GET /full/:scanId
    if (req.method === 'GET' && pathParts[1] === 'full' && pathParts[2]) {
      const scanId = pathParts[2];
      const token = url.searchParams.get('token');
      
      if (!token) return new Response(JSON.stringify({ error: 'Token required' }), { status: 401, headers: jsonHeaders });
      
      const { data: report } = await supabase.from('reports').select('*').eq('scan_id', scanId).eq('download_token', token).eq('payment_status', 'paid').single();
      if (!report) return new Response(JSON.stringify({ error: 'Invalid token or unpaid' }), { status: 403, headers: jsonHeaders });
      
      const { data: scan } = await supabase.from('scans').select('*').eq('id', scanId).single();
      if (!scan) return new Response(JSON.stringify({ error: 'Scan not found' }), { status: 404, headers: jsonHeaders });
      
      return new Response(JSON.stringify({
        scan,
        report: { report_id: report.id, email: report.email, payment_status: report.payment_status },
      }), { headers: jsonHeaders });
    }
    
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: jsonHeaders });
    
  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders });
  }
});
