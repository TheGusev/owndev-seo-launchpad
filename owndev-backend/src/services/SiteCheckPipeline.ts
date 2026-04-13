/**
 * Full GEO-audit pipeline — ported from Edge Function site-check-scan.
 * Replaces the simplified AuditService + Puppeteer CrawlerService for site-check.
 * Uses fetch + Jina Reader (no Puppeteer/Chromium needed).
 */

import { logger } from '../utils/logger.js';

const UA = 'OWNDEV-SiteCheck/2.0';

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

// ─── SPA Detection ───
function isSpaPage(html: string): boolean {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  if (!bodyMatch) return false;
  const bodyContent = bodyMatch[1]
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = bodyContent.split(/\s+/).filter((w: string) => w.length > 1).length;
  const hasAppRoot = /<div[^>]*id=["'](root|app|__next|__nuxt|___gatsby|__svelte)["']/i.test(html);
  const hasFrameworkBundle = /(\/assets\/index[\w.-]+\.js|\/static\/js\/|\/chunks\/|_next\/static)/i.test(html);
  return wordCount < 150 && (hasAppRoot || hasFrameworkBundle);
}

// ─── Fetch rendered content via Jina Reader for SPA pages ───
async function fetchRenderedContent(url: string): Promise<string | null> {
  try {
    logger.info('PIPELINE', `SPA detected — fetching via Jina Reader: ${url}`);
    const resp = await fetchWithTimeout(`https://r.jina.ai/${url}`, 20000, {
      headers: { 'Accept': 'text/plain', 'X-Timeout': '15', 'X-Wait-For-Selector': 'h1' } as any,
    });
    if (!resp.ok) return null;
    const markdown = await resp.text();
    return markdown.length > 200 ? markdown : null;
  } catch (e: any) {
    logger.error('PIPELINE', `Jina Reader failed: ${e.message}`);
    return null;
  }
}

function buildEnrichedHtml(markdown: string, originalHtml: string): string {
  const titleMatch = markdown.match(/^Title:\s*(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const descMatch = markdown.match(/^Description:\s*(.+)$/m);
  const description = descMatch ? descMatch[1].trim() : '';

  const lines = markdown.split('\n');
  let contentStartIdx = 0;
  for (let i = 0; i < Math.min(lines.length, 10); i++) {
    if (/^(Title|URL Source|Description|Published Time|Image):/.test(lines[i])) {
      contentStartIdx = i + 1;
    } else if (lines[i].trim() === '' && contentStartIdx > 0) {
      contentStartIdx = i + 1;
      break;
    }
  }
  const contentMd = lines.slice(contentStartIdx).join('\n').trim();
  const h1Match2 = contentMd.match(/^#\s+(.+)$/m);
  const h1 = h1Match2 ? h1Match2[1].trim() : (title || '');

  let bodyHtml = '';
  if (h1) bodyHtml += `<h1>${h1}</h1>\n`;
  for (const line of contentMd.split('\n')) {
    const trimmed = line.trim();
    if (trimmed.startsWith('### ')) bodyHtml += `<h3>${trimmed.slice(4)}</h3>\n`;
    else if (trimmed.startsWith('## ')) bodyHtml += `<h2>${trimmed.slice(3)}</h2>\n`;
    else if (trimmed.startsWith('# ')) { /* already handled */ }
    else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) bodyHtml += `<li>${trimmed.slice(2)}</li>\n`;
    else if (trimmed.length > 0) bodyHtml += `<p>${trimmed}</p>\n`;
  }
  bodyHtml = bodyHtml.replace(/(<li>[\s\S]*?<\/li>\n)+/g, (match) => `<ul>${match}</ul>\n`);

  let headContent = '';
  const headMatch = originalHtml.match(/<head[^>]*>([\s\S]*?)<\/head>/i);
  if (headMatch) headContent = headMatch[1];
  if (title && !/<title[^>]*>[^<]+<\/title>/i.test(headContent)) headContent += `\n<title>${title}</title>`;
  if (description && !/name=["']description["']/i.test(headContent)) headContent += `\n<meta name="description" content="${description.replace(/"/g, '&quot;')}">`;

  const schemaBlocks = originalHtml.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>[\s\S]*?<\/script>/gi) || [];
  const htmlLang = (originalHtml.match(/<html[^>]*lang=["']([^"']*)["']/i) || [])[0] || '<html>';
  return `<!DOCTYPE html>\n${htmlLang}\n<head>${headContent}</head>\n<body>\n${bodyHtml}\n${schemaBlocks.join('\n')}\n</body>\n</html>`;
}

// ─── Robust JSON parser ───
function safeParseJson<T>(raw: string, fallback: T): T {
  if (!raw || typeof raw !== 'string') return fallback;
  let cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ').trim();
  const arrMatch = cleaned.match(/\[[\s\S]*\]/);
  const objMatch = cleaned.match(/\{[\s\S]*\}/);
  if (arrMatch) { try { return JSON.parse(arrMatch[0]) as T; } catch {} }
  if (objMatch) { try { return JSON.parse(objMatch[0]) as T; } catch {} }
  const start = cleaned.indexOf('[');
  if (start !== -1) {
    let text = cleaned.slice(start);
    const lastBrace = text.lastIndexOf('}');
    if (lastBrace !== -1) {
      text = text.slice(0, lastBrace + 1) + ']';
      try { return JSON.parse(text) as T; } catch {
        text = text.replace(/,\s*\]$/, ']');
        try { return JSON.parse(text) as T; } catch {}
      }
    }
  }
  try { return JSON.parse(cleaned) as T; } catch {}
  return fallback;
}

// ─── Issue builder ───
interface Issue {
  id: string; module: string; severity: string; title: string;
  found: string; location: string; why_it_matters: string;
  how_to_fix: string; example_fix: string; visible_in_preview: boolean;
  impact_score: number; docs_url: string; is_auto_fixable: boolean;
  rule_id?: string;
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

// ─── Scores ───
const SEO_WEIGHTS: Record<string, number> = {
  titleTag: 8, metaDescription: 8, h1Tag: 8, headingStructure: 5,
  canonical: 4, ogTags: 5, robots: 3, contentLength: 8, images: 5,
  internalLinks: 5, externalLinks: 3, https: 5, mobileViewport: 5,
  performance: 8, sitemap: 5, robotsTxt: 5, noMixedContent: 5, favicon: 3, langAttr: 2,
};
const LLM_WEIGHTS: Record<string, number> = {
  schemaOrg: 15, faqPresent: 10, llmsTxt: 10, contentStructure: 10,
  contentClarity: 10, directAnswers: 10, entityMentions: 8, citationReady: 7,
  freshness: 5, authorEeat: 5, semanticHtml: 5, multimodal: 5,
};

const ISSUE_TO_SEO_CRITERION: [RegExp, string][] = [
  [/title.*длин|title.*корот|title.*отсут|нет title/i, 'titleTag'],
  [/meta description.*длин|meta description.*корот|meta description.*отсут|нет meta desc/i, 'metaDescription'],
  [/h1.*отсут|нет h1|h1.*дубл|несколько h1/i, 'h1Tag'],
  [/иерарх|heading.*структур|пропуск.*уров|h[2-6].*пропу/i, 'headingStructure'],
  [/canonical/i, 'canonical'],
  [/og:|open graph|og title|og desc|og image/i, 'ogTags'],
  [/meta robots|x-robots/i, 'robots'],
  [/контент.*корот|мало.*слов|0 слов|слов.*менее|объём/i, 'contentLength'],
  [/alt.*текст|без alt|img.*alt|изображен.*без/i, 'images'],
  [/внутренн.*ссылк/i, 'internalLinks'],
  [/внешн.*ссылк/i, 'externalLinks'],
  [/не использует https|сайт не.*https|протокол.*http[^s]/i, 'https'],
  [/viewport/i, 'mobileViewport'],
  [/загрузк|lcp|cls|inp|core web|скорост|время ответ/i, 'performance'],
  [/sitemap/i, 'sitemap'],
  [/robots\.txt/i, 'robotsTxt'],
  [/mixed content/i, 'noMixedContent'],
  [/favicon/i, 'favicon'],
  [/lang.*атрибут|html lang|lang="/i, 'langAttr'],
];

const ISSUE_TO_LLM_CRITERION: [RegExp, string][] = [
  [/schema\.org|json-ld|json_ld|schema org|нет schema/i, 'schemaOrg'],
  [/faq|faqpage|howto.*schema/i, 'faqPresent'],
  [/llms\.txt|llms-full/i, 'llmsTxt'],
  [/структур.*контент|абзац|спис[ок]|таблиц/i, 'contentStructure'],
  [/keyword stuff|читаем|водность/i, 'contentClarity'],
  [/прямой ответ|direct answer/i, 'directAnswers'],
  [/сущност|entity|бренд/i, 'entityMentions'],
  [/цитир|citation/i, 'citationReady'],
  [/дата публикац|freshness|актуальн|datePublished/i, 'freshness'],
  [/e-e-a-t|eeat|автор.*стат|author/i, 'authorEeat'],
  [/семантич|<article|<section|<nav|<main/i, 'semanticHtml'],
  [/мультимод|подпис.*изображ|alt.*изображ/i, 'multimodal'],
];

interface CriterionResult { key: string; weight: number; earned: number; status: 'pass' | 'fail' | 'partial'; }

function calcScoresWeighted(issues: Issue[], dbRules: DbRule[]) {
  const failedSeo = new Set<string>();
  const failedLlm = new Set<string>();
  for (const issue of issues) {
    const text = `${issue.title} ${issue.found || ''}`;
    if (issue.module === 'technical' || issue.module === 'content') {
      for (const [rx, key] of ISSUE_TO_SEO_CRITERION) { if (rx.test(text)) { failedSeo.add(key); break; } }
    }
    if (issue.module === 'ai' || issue.module === 'schema') {
      for (const [rx, key] of ISSUE_TO_LLM_CRITERION) { if (rx.test(text)) { failedLlm.add(key); break; } }
    }
  }

  const seoBreakdown: CriterionResult[] = Object.entries(SEO_WEIGHTS).map(([key, weight]) => {
    const failed = failedSeo.has(key);
    return { key, weight, earned: failed ? 0 : weight, status: failed ? 'fail' as const : 'pass' as const };
  });
  const llmBreakdown: CriterionResult[] = Object.entries(LLM_WEIGHTS).map(([key, weight]) => {
    const failed = failedLlm.has(key);
    return { key, weight, earned: failed ? 0 : weight, status: failed ? 'fail' as const : 'pass' as const };
  });

  const seoMax = Object.values(SEO_WEIGHTS).reduce((a, b) => a + b, 0);
  const llmMax = Object.values(LLM_WEIGHTS).reduce((a, b) => a + b, 0);
  const seoEarned = seoBreakdown.reduce((s, c) => s + c.earned, 0);
  const llmEarned = llmBreakdown.reduce((s, c) => s + c.earned, 0);

  let seo = Math.round((seoEarned / seoMax) * 100);
  let ai = Math.round((llmEarned / llmMax) * 100);

  const moduleScores: Record<string, { totalWeight: number; passedWeight: number }> = {};
  const scoreModuleMap: Record<string, string> = { 'technical': 'seo', 'content': 'seo', 'direct': 'direct', 'schema': 'schema', 'ai': 'ai' };
  for (const rule of dbRules) {
    const scoreKey = scoreModuleMap[rule.module] || rule.module;
    if (scoreKey !== 'direct' && scoreKey !== 'schema') continue;
    if (!moduleScores[scoreKey]) moduleScores[scoreKey] = { totalWeight: 0, passedWeight: 0 };
    moduleScores[scoreKey].totalWeight += rule.score_weight;
    moduleScores[scoreKey].passedWeight += rule.score_weight;
  }
  const issueRuleIds = new Set(issues.map(i => i.rule_id).filter(Boolean));
  for (const rule of dbRules) {
    const scoreKey = scoreModuleMap[rule.module] || rule.module;
    if (scoreKey !== 'direct' && scoreKey !== 'schema') continue;
    if (issueRuleIds.has(rule.rule_id) && moduleScores[scoreKey]) {
      moduleScores[scoreKey].passedWeight -= rule.score_weight;
    }
  }
  for (const issue of issues) {
    if (issue.rule_id) continue;
    const scoreKey = scoreModuleMap[issue.module] || issue.module;
    if (scoreKey !== 'direct' && scoreKey !== 'schema') continue;
    if (!moduleScores[scoreKey]) moduleScores[scoreKey] = { totalWeight: 100, passedWeight: 100 };
    const w = issue.severity === 'critical' ? 15 : issue.severity === 'high' ? 8 : issue.severity === 'medium' ? 4 : 2;
    moduleScores[scoreKey].passedWeight -= w;
  }

  const getModScore = (key: string) => {
    const m = moduleScores[key];
    if (!m || m.totalWeight === 0) return 100;
    return Math.max(0, Math.min(100, Math.round((m.passedWeight / m.totalWeight) * 100)));
  };

  let direct = getModScore('direct');
  let schema = getModScore('schema');
  const hasNoJsonLd = issues.some(i => i.module === 'schema' && /JSON-LD не найден/i.test(i.found || i.title || ''));
  const hasMicrodata = issues.some(i => i.module === 'schema' && /microdata|rdfa/i.test(i.found || ''));
  if (hasNoJsonLd) { schema = hasMicrodata ? Math.min(schema, 30) : 0; }

  const total = Math.round(seo * 0.3 + direct * 0.2 + schema * 0.25 + ai * 0.25);
  return { total, seo, direct, schema, ai, breakdown: { seo: seoBreakdown, ai: llmBreakdown } };
}

// ─── DB Rule type ───
interface DbRule {
  id: string; rule_id: string; module: string; source: string; severity: string;
  title: string; description: string; how_to_check: string; fix_template: string;
  example_fix: string; score_weight: number; visible_in_preview: boolean; active: boolean;
}

// ─── LLM provider config ───
const LLM_PROVIDER = process.env.LLM_PROVIDER || 'lovable';

function getLlmConfig(apiKey: string) {
  if (LLM_PROVIDER === 'lovable') {
    const lovableKey = process.env.LOVABLE_API_KEY || apiKey;
    return {
      url: 'https://ai.gateway.lovable.dev/v1/chat/completions',
      authHeader: `Bearer ${lovableKey}`,
      defaultModel: 'google/gemini-2.5-flash',
    };
  }
  return {
    url: 'https://api.openai.com/v1/chat/completions',
    authHeader: `Bearer ${apiKey}`,
    defaultModel: 'gpt-4o-mini',
  };
}

// ─── LLM helper ───
async function llmCall(apiKey: string, _model: string, systemPrompt: string, userPrompt: string, maxTokens = 4000, temperature = 0.1): Promise<string> {
  const config = getLlmConfig(apiKey);
  try {
    const resp = await fetch(config.url, {
      method: 'POST',
      headers: { Authorization: config.authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.defaultModel, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        max_tokens: maxTokens, temperature, top_p: 0.85,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      logger.error('PIPELINE', `LLM HTTP ${resp.status} [${LLM_PROVIDER}]: ${errText.slice(0, 300)}`);
      return '';
    }
    const data = await resp.json();
    return data.choices?.[0]?.message?.content?.trim() || '';
  } catch (e: any) {
    logger.error('PIPELINE', `LLM call failed [${LLM_PROVIDER}]: ${e.message}`);
    return '';
  }
}

async function llmToolCall(apiKey: string, _model: string, systemPrompt: string, userPrompt: string, tool: any): Promise<any> {
  const config = getLlmConfig(apiKey);
  try {
    const resp = await fetch(config.url, {
      method: 'POST',
      headers: { Authorization: config.authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.defaultModel, messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        tools: [tool], tool_choice: { type: 'function', function: { name: tool.function.name } },
        temperature: 0.4,
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      logger.error('PIPELINE', `LLM tool HTTP ${resp.status} [${LLM_PROVIDER}]: ${errText.slice(0, 300)}`);
      return null;
    }
    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      const content = data.choices?.[0]?.message?.content;
      return content ? safeParseJson(content, null) : null;
    }
    return typeof toolCall.function.arguments === 'string' ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments;
  } catch (e: any) {
    logger.error('PIPELINE', `LLM tool call failed [${LLM_PROVIDER}]: ${e.message}`);
    return null;
  }
}

// ═══ STEP 0: Theme detection ═══
async function detectTheme(html: string, url: string, apiKey: string): Promise<string> {
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 2000) : '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  if (!apiKey) return 'Общая тематика';
  const result = await llmCall(apiKey, 'gpt-4o-mini', 
    'Определи тематику/нишу сайта одной короткой фразой на русском (2-5 слов). Примеры: "SEO-продвижение", "Интернет-магазин одежды". Отвечай ТОЛЬКО тематику.',
    `URL: ${url}\nTitle: ${title}\nТекст: ${bodyText.slice(0, 1000)}`, 30);
  return result || 'Общая тематика';
}

// ═══ STEP 1: Technical SEO ═══
function technicalAudit(html: string, parsedUrl: URL, httpStatus: number, robotsOk: boolean, robotsTxt: string, sitemapOk: boolean, sitemapBody: string, brokenLinks: string[], loadTimeMs: number): Issue[] {
  const issues: Issue[] = [];
  const origin = parsedUrl.origin;
  const pageUrl = parsedUrl.toString();

  if (httpStatus !== 200) issues.push(makeIssue({ module: 'technical', severity: 'critical', title: `HTTP статус ${httpStatus} (не 200)`, found: `Страница вернула статус ${httpStatus}`, location: 'HTTP ответ', why_it_matters: 'Поисковики не индексируют страницы с ошибочными статусами', how_to_fix: 'Убедитесь что страница возвращает HTTP 200', example_fix: 'Настройте сервер для 200 OK', visible_in_preview: true }));
  if (parsedUrl.protocol !== 'https:') issues.push(makeIssue({ module: 'technical', severity: 'critical', title: 'Сайт не использует HTTPS', found: `Протокол: ${parsedUrl.protocol}`, location: 'URL', why_it_matters: 'HTTPS — обязательный фактор ранжирования', how_to_fix: 'Установите SSL-сертификат', example_fix: `Redirect 301 / https://${parsedUrl.hostname}/`, visible_in_preview: true }));

  if (!robotsOk) {
    issues.push(makeIssue({ module: 'technical', severity: 'critical', title: 'robots.txt недоступен', found: `${origin}/robots.txt → ошибка`, location: '/robots.txt', why_it_matters: 'Без robots.txt поисковики не знают что индексировать', how_to_fix: 'Создайте robots.txt', example_fix: `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml`, visible_in_preview: true }));
  } else {
    const disallowLines = robotsTxt.split('\n').filter(l => /^Disallow:\s*.+/i.test(l));
    const blockedPaths = disallowLines.map(l => l.replace(/^Disallow:\s*/i, '').trim());
    const currentPath = parsedUrl.pathname;
    if (blockedPaths.some(p => p && currentPath.startsWith(p))) {
      issues.push(makeIssue({ module: 'technical', severity: 'critical', title: 'Страница закрыта от индексации в robots.txt', found: `Путь "${currentPath}" попадает под Disallow`, location: '/robots.txt', why_it_matters: 'Страница полностью исчезает из поиска', how_to_fix: 'Удалите или скорректируйте Disallow', example_fix: `User-agent: *\nAllow: /\nSitemap: ${origin}/sitemap.xml`, impact_score: 20, visible_in_preview: true }));
    }
    if (!/Sitemap:/i.test(robotsTxt)) {
      issues.push(makeIssue({ module: 'technical', severity: 'medium', title: 'robots.txt не содержит ссылку на Sitemap', found: 'Директива Sitemap: не найдена', location: '/robots.txt', why_it_matters: 'Указание Sitemap помогает быстрее обнаружить карту сайта', how_to_fix: 'Добавьте Sitemap: в robots.txt', example_fix: `Sitemap: ${origin}/sitemap.xml`, visible_in_preview: false }));
    }
  }

  if (!sitemapOk) {
    issues.push(makeIssue({ module: 'technical', severity: 'high', title: 'sitemap.xml недоступен', found: `${origin}/sitemap.xml → ошибка`, location: '/sitemap.xml', why_it_matters: 'Sitemap ускоряет индексацию', how_to_fix: 'Сгенерируйте sitemap.xml', example_fix: `<?xml version="1.0"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${pageUrl}</loc></url></urlset>`, visible_in_preview: true }));
  } else if (sitemapBody) {
    const normalizedPath = parsedUrl.pathname.replace(/\/$/, '');
    if (!sitemapBody.includes(pageUrl) && !sitemapBody.includes(normalizedPath)) {
      issues.push(makeIssue({ module: 'technical', severity: 'medium', title: 'Страница не найдена в sitemap.xml', found: `URL "${pageUrl}" отсутствует в карте сайта`, location: '/sitemap.xml', why_it_matters: 'Страницы вне sitemap индексируются медленнее', how_to_fix: 'Добавьте URL в sitemap.xml', example_fix: `<url><loc>${pageUrl}</loc></url>`, visible_in_preview: false }));
    }
  }

  const metaRobots = html.match(/<meta[^>]*name=["']robots["'][^>]*content=["']([^"']+)["']/i);
  if (metaRobots && metaRobots[1].toLowerCase().includes('noindex')) {
    issues.push(makeIssue({ module: 'technical', severity: 'critical', title: 'Страница помечена как noindex', found: `<meta name="robots" content="${metaRobots[1]}">`, location: '<head>', why_it_matters: 'Noindex блокирует появление в выдаче', how_to_fix: 'Удалите noindex', example_fix: '<meta name="robots" content="index, follow">', visible_in_preview: true }));
  }

  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i) || html.match(/<link[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1].trim() : null;
  if (!canonical) {
    issues.push(makeIssue({ module: 'technical', severity: 'high', title: 'Отсутствует <link rel="canonical">', found: 'Canonical не указан', location: '<head>', why_it_matters: 'Без canonical возникают дубли в индексе', how_to_fix: 'Добавьте canonical', example_fix: `<link rel="canonical" href="${pageUrl}" />`, visible_in_preview: false }));
  } else {
    const norm = (u: string) => u.replace(/\/+$/, '').replace(/^https?:\/\/(www\.)?/, '');
    if (norm(canonical) !== norm(pageUrl)) {
      issues.push(makeIssue({ module: 'technical', severity: 'high', title: 'Canonical указывает на другую страницу', found: `Canonical: "${canonical}"\nТекущий: "${pageUrl}"`, location: '<head>', why_it_matters: 'Неправильный canonical может деиндексировать страницу', how_to_fix: 'Исправьте canonical', example_fix: `<link rel="canonical" href="${pageUrl}" />`, visible_in_preview: true }));
    }
  }

  if (loadTimeMs > 4000) {
    issues.push(makeIssue({ module: 'technical', severity: 'critical', title: `Критически медленная загрузка (${(loadTimeMs / 1000).toFixed(1)}с)`, found: `Время ответа: ${loadTimeMs}мс`, location: 'HTTP ответ', why_it_matters: 'LCP > 4с — «плохо» по Core Web Vitals', how_to_fix: 'Оптимизируйте TTFB: кэширование, CDN', example_fix: 'Целевой TTFB < 600мс', visible_in_preview: true }));
  } else if (loadTimeMs > 2500) {
    issues.push(makeIssue({ module: 'technical', severity: 'high', title: `Медленная загрузка (${(loadTimeMs / 1000).toFixed(1)}с)`, found: `Время ответа: ${loadTimeMs}мс`, location: 'HTTP ответ', why_it_matters: 'LCP > 2.5с — «требует улучшения»', how_to_fix: 'Включите сжатие, кэширование, CDN', example_fix: 'Content-Encoding: br, Cache-Control: max-age=86400', visible_in_preview: true }));
  }

  const vpMatch = html.match(/<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/i);
  if (!vpMatch) {
    issues.push(makeIssue({ module: 'technical', severity: 'critical', title: 'Нет meta viewport — сайт не адаптивный', found: 'viewport не найден', location: '<head>', why_it_matters: 'Без viewport мобильные устройства показывают десктопную версию', how_to_fix: 'Добавьте meta viewport', example_fix: '<meta name="viewport" content="width=device-width, initial-scale=1">', visible_in_preview: true }));
  }

  const imgTags = html.match(/<img[^>]*>/gi) || [];
  const imgsNoAlt = imgTags.filter(img => !img.match(/alt=["'][^"']+["']/i));
  if (imgsNoAlt.length > 0) {
    issues.push(makeIssue({ module: 'technical', severity: imgsNoAlt.length > 5 ? 'high' : 'medium', title: `${imgsNoAlt.length} изображений без alt`, found: `Из ${imgTags.length} <img> у ${imgsNoAlt.length} нет alt`, location: '<img> теги', why_it_matters: 'Без alt изображения невидимы для поисковиков и скринридеров', how_to_fix: 'Добавьте описательный alt к каждому <img>', example_fix: '<img src="photo.jpg" alt="Описание изображения">', visible_in_preview: false }));
  }

  if (brokenLinks.length > 0) {
    issues.push(makeIssue({ module: 'technical', severity: brokenLinks.length >= 3 ? 'critical' : 'high', title: `${brokenLinks.length} битых внутренних ссылок`, found: brokenLinks.slice(0, 5).join('\n'), location: '<a href>', why_it_matters: 'Битые ссылки ухудшают краулинг и UX', how_to_fix: 'Исправьте или удалите нерабочие ссылки', example_fix: `Замените ${brokenLinks[0]} на актуальный URL`, visible_in_preview: true }));
  }

  return issues;
}

// ═══ STEP 2: Content Audit ═══
function contentAudit(html: string, theme: string): Issue[] {
  const issues: Issue[] = [];
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([\s\S]*?)["']/i) || html.match(/<meta[^>]*content=["']([\s\S]*?)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : '';
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h1Texts = h1Matches.map(m => m.replace(/<[^>]+>/g, '').trim());
  const h1 = h1Texts[0] || '';
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 1).length;
  const themeWords = theme.toLowerCase().split(/[\s,—–\-]+/).filter(w => w.length > 3);

  if (!title) {
    issues.push(makeIssue({ module: 'content', severity: 'critical', title: 'Тег <title> отсутствует', found: '<title> не найден', location: '<head>', why_it_matters: 'Title — один из главных факторов ранжирования', how_to_fix: 'Добавьте title 50-70 символов', example_fix: `<title>${theme} — заказать | Бренд</title>`, impact_score: 15, visible_in_preview: true }));
  } else {
    if (title.length < 50) issues.push(makeIssue({ module: 'content', severity: 'medium', title: `Title короткий (${title.length} симв.)`, found: `"${title}"`, location: '<title>', why_it_matters: 'Короткий title не раскрывает содержание', how_to_fix: 'Дополните до 50-70 символов', example_fix: `<title>${title} — ${theme} | Бренд</title>`, visible_in_preview: false }));
    else if (title.length > 70) issues.push(makeIssue({ module: 'content', severity: 'medium', title: `Title длинный (${title.length} симв.)`, found: `"${title.slice(0, 80)}..."`, location: '<title>', why_it_matters: 'Длинный title обрезается в выдаче', how_to_fix: 'Сократите до 50-70 символов', example_fix: `<title>${theme} — уточнение | Бренд</title>`, visible_in_preview: false }));
    const titleLower = title.toLowerCase();
    if (themeWords.length > 0 && !themeWords.some(w => titleLower.includes(w))) {
      issues.push(makeIssue({ module: 'content', severity: 'high', title: 'Title не содержит ключевое слово тематики', found: `Title: "${title}"\nТема: "${theme}"`, location: '<title>', why_it_matters: 'Без ключевого слова снижается релевантность', how_to_fix: `Включите «${theme}» в Title`, example_fix: `<title>${theme} — ${title.split('—')[0]?.trim() || ''} | Бренд</title>`, visible_in_preview: false }));
    }
  }

  if (h1Matches.length === 0) {
    issues.push(makeIssue({ module: 'content', severity: 'critical', title: 'H1 отсутствует', found: '<h1> не найден', location: 'Контент', why_it_matters: 'H1 — главный заголовок для поисковиков', how_to_fix: 'Добавьте один H1', example_fix: `<h1>${theme}</h1>`, visible_in_preview: true }));
  } else if (h1Matches.length > 1) {
    issues.push(makeIssue({ module: 'content', severity: 'high', title: `Несколько H1 (${h1Matches.length})`, found: h1Texts.map((t, i) => `H1 #${i + 1}: "${t}"`).join('\n'), location: 'Контент', why_it_matters: 'Несколько H1 размывают тему', how_to_fix: 'Оставьте один H1', example_fix: `<h1>${h1Texts[0]}</h1>`, visible_in_preview: false }));
  }

  if (!description) {
    issues.push(makeIssue({ module: 'content', severity: 'medium', title: 'Meta description отсутствует', found: 'Не найден', location: '<head>', why_it_matters: 'Description влияет на CTR в выдаче', how_to_fix: 'Добавьте description 120-160 символов', example_fix: `<meta name="description" content="${theme} — закажите. Опыт 10+ лет.">`, visible_in_preview: true }));
  } else {
    if (description.length < 120 || description.length > 160) {
      issues.push(makeIssue({ module: 'content', severity: 'low', title: `Description ${description.length < 120 ? 'короткий' : 'длинный'} (${description.length} симв.)`, found: `"${description.slice(0, 160)}"`, location: '<meta description>', why_it_matters: description.length < 120 ? 'Короткий description не использует место в сниппете' : 'Длинный description обрезается', how_to_fix: 'Скорректируйте до 120-160 символов', example_fix: `<meta name="description" content="${theme} — результат за 30 дней.">`, visible_in_preview: false }));
    }
  }

  if (wordCount < 300) {
    issues.push(makeIssue({ module: 'content', severity: 'medium', title: `Мало текста (${wordCount} слов)`, found: `${wordCount} слов`, location: '<body>', why_it_matters: '«Тонкие» страницы хуже ранжируются', how_to_fix: 'Расширьте до 300+ слов', example_fix: 'Добавьте FAQ, описания, преимущества', impact_score: 10, visible_in_preview: false }));
  }

  const h2Count = (html.match(/<h2[^>]*>/gi) || []).length;
  if (h2Count === 0 && wordCount > 200) {
    issues.push(makeIssue({ module: 'content', severity: 'low', title: 'Нет подзаголовков H2', found: 'H2 не найдено', location: 'Контент', why_it_matters: 'H2 структурируют контент', how_to_fix: 'Добавьте H2 для разделов', example_fix: `<h2>Преимущества ${theme.toLowerCase()}</h2>`, visible_in_preview: false }));
  }

  // OG tags
  const hasOgTitle = /<meta[^>]*property=["']og:title["']/i.test(html);
  const hasOgDesc = /<meta[^>]*property=["']og:description["']/i.test(html);
  const hasOgImage = /<meta[^>]*property=["']og:image["']/i.test(html);
  if (!hasOgTitle || !hasOgDesc || !hasOgImage) {
    const missing = [!hasOgTitle && 'og:title', !hasOgDesc && 'og:description', !hasOgImage && 'og:image'].filter(Boolean).join(', ');
    issues.push(makeIssue({ module: 'content', severity: 'medium', title: 'Неполные Open Graph теги', found: `Отсутствуют: ${missing}`, location: '<head>', why_it_matters: 'OG теги управляют отображением при расшаривании в соцсетях', how_to_fix: 'Добавьте все OG теги', example_fix: '<meta property="og:title" content="...">\n<meta property="og:description" content="...">\n<meta property="og:image" content="...">', visible_in_preview: false }));
  }

  // lang attribute
  if (!/<html[^>]*lang=["'][^"']+["']/i.test(html)) {
    issues.push(makeIssue({ module: 'content', severity: 'low', title: 'Нет атрибута lang у <html>', found: '<html> без lang', location: '<html>', why_it_matters: 'lang помогает поисковикам определить язык страницы', how_to_fix: 'Добавьте lang="ru"', example_fix: '<html lang="ru">', visible_in_preview: false }));
  }

  return issues;
}

// ═══ STEP 3: Direct Audit ═══
interface DirectAdSuggestion { headline1: string; headline2: string; ad_text: string; sitelinks: { title: string; description: string }[]; callouts: string[]; }

function directAudit(html: string, theme: string): { issues: Issue[]; ad_headline: string; autotargeting_categories: Record<string, boolean>; readiness_score: number } {
  const issues: Issue[] = [];
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 1).length;
  const themeWords = theme.toLowerCase().split(/[\s,—–\-]+/).filter(w => w.length > 3);
  const genericH1 = /^(главная|home|добро пожаловать|welcome)/i;

  let passedChecks = 0;
  const checkWeights: number[] = [];

  // 1. Title alignment with theme
  const titleLower = (title || '').toLowerCase();
  if (themeWords.length > 0 && !themeWords.some(tw => titleLower.includes(tw))) {
    issues.push(makeIssue({ module: 'direct', severity: 'high', title: 'Title не релевантен тематике для Директа', found: `Title: "${title}"\nТема: "${theme}"`, location: '<title>', why_it_matters: 'Автотаргетинг Директа использует Title для подбора запросов', how_to_fix: 'Включите ключевое слово тематики в Title', example_fix: `<title>${theme} — услуги | Бренд</title>`, impact_score: 12, visible_in_preview: true }));
    checkWeights.push(0);
  } else { passedChecks++; checkWeights.push(1.5); }

  // 2. H1 quality
  if (!h1 || genericH1.test(h1.trim())) {
    issues.push(makeIssue({ module: 'direct', severity: 'high', title: 'H1 не подходит для автотаргетинга Директа', found: `H1: "${h1 || '(отсутствует)'}"`, location: '<h1>', why_it_matters: 'Общий или отсутствующий H1 не даёт Директу сигналов о теме', how_to_fix: 'Напишите конкретный H1 с ключевым словом', example_fix: `<h1>${theme} — профессиональный подход</h1>`, visible_in_preview: true }));
    checkWeights.push(0);
  } else { passedChecks++; checkWeights.push(1); }

  // 3. Content volume
  if (wordCount < 200) {
    issues.push(makeIssue({ module: 'direct', severity: 'medium', title: 'Слишком мало текста для автотаргетинга', found: `${wordCount} слов`, location: 'Контент', why_it_matters: 'Мало текста = мало сигналов для автотаргетинга', how_to_fix: 'Расширьте контент до 500+ слов', example_fix: 'Добавьте описания, FAQ, преимущества', visible_in_preview: false }));
    checkWeights.push(0);
  } else { passedChecks++; checkWeights.push(1); }

  // 4. CTA
  const ctaPattern = /заказ|купи|оставь|запис|получи|звони|консультац|заявк|корзин|добавить в/i;
  if (!ctaPattern.test(html)) {
    issues.push(makeIssue({ module: 'direct', severity: 'high', title: 'Нет CTA (призыва к действию)', found: 'Не найдены кнопки заказа или формы', location: 'Контент', why_it_matters: 'Без CTA посетители из Директа уходят', how_to_fix: 'Добавьте кнопку CTA', example_fix: `<button>Заказать ${theme.toLowerCase()}</button>`, impact_score: 11, visible_in_preview: true }));
    checkWeights.push(0);
  } else { passedChecks++; checkWeights.push(1); }

  // 5. Яндекс.Метрика
  const hasMetrika = /mc\.yandex\.ru\/metrika\/tag\.js|mc\.yandex\.ru\/watch\/|ym\(\s*\d+/i.test(html);
  if (!hasMetrika) {
    issues.push(makeIssue({ module: 'direct', severity: 'critical', title: 'Нет Яндекс.Метрики', found: 'Счётчик не найден', location: 'Скрипты', why_it_matters: 'Без Метрики невозможно отследить конверсии', how_to_fix: 'Установите счётчик Яндекс.Метрики', example_fix: 'Создайте счётчик на metrika.yandex.ru', impact_score: 15, visible_in_preview: true }));
    checkWeights.push(0);
  } else { passedChecks++; checkWeights.push(1.5); }

  // 6. Viewport
  if (!/<meta[^>]*name=["']viewport["']/i.test(html)) {
    issues.push(makeIssue({ module: 'direct', severity: 'high', title: 'Страница не адаптирована для мобильного', found: 'viewport не найден', location: '<head>', why_it_matters: '60-70% трафика из Директа — мобильные', how_to_fix: 'Добавьте meta viewport', example_fix: '<meta name="viewport" content="width=device-width, initial-scale=1">', visible_in_preview: true }));
    checkWeights.push(0);
  } else { passedChecks++; checkWeights.push(1); }

  const maxWeight = checkWeights.length > 0 ? checkWeights.reduce((a, b) => a + Math.max(b, 1), 0) : 6;
  const earnedWeight = checkWeights.reduce((a, b) => a + b, 0);
  const readiness_score = Math.round((earnedWeight / maxWeight) * 10);

  let ad_headline = (h1 || title || theme).replace(/<[^>]+>/g, '').replace(/[|—–\-].*$/, '').trim();
  if (ad_headline.length > 35) {
    const words = ad_headline.split(/\s+/);
    ad_headline = '';
    for (const w of words) { if ((ad_headline + ' ' + w).trim().length <= 35) ad_headline = (ad_headline + ' ' + w).trim(); else break; }
  }
  if (!ad_headline || ad_headline.length < 5) ad_headline = theme.slice(0, 35);

  const hasNarrowFocus = h1 && !genericH1.test(h1.trim()) && themeWords.some(tw => h1.toLowerCase().includes(tw));
  const autotargeting_categories: Record<string, boolean> = { 'Целевые': true, 'Узкие': !!hasNarrowFocus, 'Альтернативные': false, 'Сопутствующие': false, 'Брендовые': /бренд|brand/i.test(bodyText) };

  return { issues, ad_headline, autotargeting_categories, readiness_score };
}

// ═══ STEP 3b: AI Direct Ad ═══
async function generateDirectAd(html: string, theme: string, url: string, apiKey: string): Promise<DirectAdSuggestion | null> {
  if (!apiKey) return null;
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 1500) : '';

  const parsed = await llmToolCall(apiKey, 'gpt-4o-mini', 
    `Ты — эксперт по Яндекс.Директу. Сгенерируй полное объявление.\nОГРАНИЧЕНИЯ: headline1 до 35 символов, headline2 до 30, ad_text до 81, sitelinks: 4 (title до 30, description до 60), callouts: 4 (до 25). Пиши на русском.`,
    `URL: ${url}\nТематика: ${theme}\nTitle: ${title}\nH1: ${h1}\nТекст: ${bodyText.slice(0, 800)}`,
    { type: 'function', function: { name: 'create_direct_ad', description: 'Создаёт объявление', parameters: { type: 'object', properties: { headline1: { type: 'string' }, headline2: { type: 'string' }, ad_text: { type: 'string' }, sitelinks: { type: 'array', items: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' } }, required: ['title', 'description'] } }, callouts: { type: 'array', items: { type: 'string' } } }, required: ['headline1', 'headline2', 'ad_text', 'sitelinks', 'callouts'] } } }
  );

  if (!parsed) return null;
  return {
    headline1: (parsed.headline1 || '').slice(0, 35),
    headline2: (parsed.headline2 || '').slice(0, 30),
    ad_text: (parsed.ad_text || '').slice(0, 81),
    sitelinks: (parsed.sitelinks || []).slice(0, 4).map((s: any) => ({ title: (s.title || '').slice(0, 30), description: (s.description || '').slice(0, 60) })),
    callouts: (parsed.callouts || []).slice(0, 4).map((c: string) => (c || '').slice(0, 25)),
  };
}

// ═══ STEP 7: Schema Audit ═══
function schemaAudit(html: string): Issue[] {
  const issues: Issue[] = [];
  const hasMicrodata = /itemscope|itemtype=/i.test(html);
  const hasRdfa = /typeof=["'].*schema\.org/i.test(html) || /property=["']og:/i.test(html);
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];

  if (jsonLdMatches.length === 0) {
    if (hasMicrodata || hasRdfa) {
      issues.push(makeIssue({ module: 'schema', severity: 'high', title: 'Нет JSON-LD — используется устаревший формат', found: `Найдено: ${hasMicrodata ? 'Microdata' : ''}${hasRdfa ? ' RDFa' : ''}`, location: 'HTML разметка', why_it_matters: 'JSON-LD — рекомендуемый Google формат разметки', how_to_fix: 'Перенесите разметку в JSON-LD', example_fix: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization"}</script>', visible_in_preview: true }));
    } else {
      issues.push(makeIssue({ module: 'schema', severity: 'critical', title: 'JSON-LD не найден — нет структурированных данных', found: 'Ни JSON-LD, ни Microdata, ни RDFa', location: 'HTML', why_it_matters: 'Без структурированных данных сайт не получит расширенные сниппеты', how_to_fix: 'Добавьте JSON-LD разметку', example_fix: '<script type="application/ld+json">{"@context":"https://schema.org","@type":"WebPage"}</script>', impact_score: 15, visible_in_preview: true }));
    }
  } else {
    const schemaTypes: string[] = [];
    for (const m of jsonLdMatches) {
      const content = m.replace(/<\/?script[^>]*>/gi, '');
      try {
        const parsed = JSON.parse(content);
        if (parsed['@type']) schemaTypes.push(parsed['@type']);
        if (Array.isArray(parsed['@graph'])) parsed['@graph'].forEach((item: any) => { if (item['@type']) schemaTypes.push(item['@type']); });
      } catch {}
    }
    const recommended = ['Organization', 'WebPage', 'WebSite', 'Article', 'FAQPage', 'BreadcrumbList', 'LocalBusiness', 'Product'];
    const hasRecommended = recommended.some(r => schemaTypes.includes(r));
    if (!hasRecommended) {
      issues.push(makeIssue({ module: 'schema', severity: 'high', title: 'Нет рекомендуемых типов Schema', found: `Типы: ${schemaTypes.join(', ') || 'не определены'}`, location: 'JSON-LD', why_it_matters: 'Organization, WebPage, FAQPage — базовые типы для расширенных сниппетов', how_to_fix: 'Добавьте Organization или WebPage', example_fix: '{"@type":"Organization","name":"...","url":"..."}', visible_in_preview: false }));
    }
    if (!schemaTypes.includes('BreadcrumbList')) {
      issues.push(makeIssue({ module: 'schema', severity: 'medium', title: 'Нет BreadcrumbList Schema', found: 'BreadcrumbList отсутствует', location: 'JSON-LD', why_it_matters: 'Хлебные крошки улучшают навигацию в выдаче', how_to_fix: 'Добавьте BreadcrumbList', example_fix: '{"@type":"BreadcrumbList","itemListElement":[...]}', visible_in_preview: false }));
    }
  }
  return issues;
}

// ═══ STEP 8: AI Readiness Audit ═══
async function aiAudit(html: string, origin: string, pageUrl: string, isSpa: boolean, spaRenderFailed: boolean): Promise<Issue[]> {
  const issues: Issue[] = [];
  if (isSpa && spaRenderFailed) {
    issues.push(makeIssue({ module: 'ai', severity: 'critical', title: 'SPA без серверного рендеринга — AI не видит контент', found: 'SPA detected, Jina Reader failed', location: 'Рендеринг', why_it_matters: 'AI-краулеры не выполняют JavaScript', how_to_fix: 'Настройте SSR или SSG', example_fix: 'Для React: Next.js, для Vue: Nuxt.js', visible_in_preview: true }));
  }

  // llms.txt
  try {
    const llmsResp = await fetchWithTimeout(`${origin}/llms.txt`, 5000);
    if (!llmsResp.ok) {
      issues.push(makeIssue({ module: 'ai', severity: 'high', title: 'Нет файла /llms.txt', found: `${origin}/llms.txt → ${llmsResp.status}`, location: '/llms.txt', why_it_matters: 'llms.txt — стандарт для AI-краулеров. Без него сайт теряет 20 баллов LLM Score', how_to_fix: 'Создайте llms.txt', example_fix: `# ${origin}\n> Описание сайта`, impact_score: 20, docs_url: 'https://llmstxt.org', visible_in_preview: true }));
    }
  } catch {}

  try {
    const llmsFullResp = await fetchWithTimeout(`${origin}/llms-full.txt`, 5000, { method: 'HEAD' });
    if (!llmsFullResp.ok) {
      issues.push(makeIssue({ module: 'ai', severity: 'medium', title: 'Нет файла /llms-full.txt', found: `${origin}/llms-full.txt → ${llmsFullResp.status}`, location: '/llms-full.txt', why_it_matters: 'llms-full.txt — расширенная версия для AI', how_to_fix: 'Создайте llms-full.txt', example_fix: `# ${origin}\n> Полное описание`, visible_in_preview: false }));
    }
  } catch {}

  // FAQPage Schema
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const schemaTypes: string[] = [];
  for (const m of jsonLdMatches) {
    try {
      const content = m.replace(/<\/?script[^>]*>/gi, '');
      const parsed = JSON.parse(content);
      if (parsed['@type']) schemaTypes.push(parsed['@type']);
      if (Array.isArray(parsed['@graph'])) parsed['@graph'].forEach((item: any) => { if (item['@type']) schemaTypes.push(item['@type']); });
    } catch {}
  }

  if (!schemaTypes.includes('FAQPage')) {
    issues.push(makeIssue({ module: 'ai', severity: 'high', title: '🤖 Нет FAQPage Schema для AI-видимости', found: `Schema типы: ${schemaTypes.length > 0 ? schemaTypes.join(', ') : 'нет'}`, location: 'JSON-LD', why_it_matters: 'FAQPage Schema цитируется AI в 3 раза чаще', how_to_fix: 'Добавьте FAQPage Schema', example_fix: '<script type="application/ld+json">{"@type":"FAQPage","mainEntity":[...]}</script>', impact_score: 10, visible_in_preview: true }));
  }

  // E-E-A-T
  const isArticlePage = /\/(blog|article|post|news|stati)\//i.test(pageUrl) || /<article[\s>]/i.test(html);
  const hasAuthor = /об\s*автор|author|автор\s*стать/i.test(html) || schemaTypes.includes('Person');
  const hasDatePublished = /datePublished/i.test(html) || /<time[^>]*datetime/i.test(html);
  if (isArticlePage && !hasAuthor && !hasDatePublished) {
    issues.push(makeIssue({ module: 'ai', severity: 'high', title: 'Нет E-E-A-T сигналов', found: 'Нет автора, нет даты', location: 'Контент', why_it_matters: 'E-E-A-T — ключевой фактор для AI-цитирования', how_to_fix: 'Добавьте автора и дату', example_fix: '<p>Автор: <strong>Имя</strong></p>', visible_in_preview: true }));
  }

  // Question H2
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h2Texts = h2Matches.map(m => m.replace(/<[^>]+>/g, '').trim());
  const questionH2s = h2Texts.filter(t => /\?$/.test(t) || /^(как|что|зачем|почему|когда|где|сколько)/i.test(t));
  if (h2Texts.length > 0 && questionH2s.length === 0) {
    issues.push(makeIssue({ module: 'ai', severity: 'high', title: 'H2 не в формате вопросов', found: `${h2Texts.length} H2, ни один не вопрос`, location: '<h2>', why_it_matters: 'LLM чаще цитируют Q&A формат', how_to_fix: 'Переформулируйте H2 в вопросы', example_fix: '<h2>Как заказать SEO-аудит?</h2>', impact_score: 8, visible_in_preview: true }));
  }

  // FAQ block
  const hasFaq = /faq|часто\s*задаваемые|вопрос.*ответ/i.test(html) || /<details[\s>]/i.test(html);
  if (!hasFaq) {
    issues.push(makeIssue({ module: 'ai', severity: 'medium', title: 'Нет FAQ-блока', found: 'Не найден FAQ', location: 'Контент', why_it_matters: 'FAQ-блоки — основной источник для AI-ответов', how_to_fix: 'Добавьте FAQ с 5-10 вопросами', example_fix: '<h2>FAQ</h2><h3>Сколько стоит?</h3><p>Ответ.</p>', impact_score: 10, visible_in_preview: false }));
  }

  return issues;
}

// ═══ STEP 4: Competitor Analysis ═══
interface CompetitorProfile {
  _type: 'competitor'; position: number; url: string; domain: string;
  title: string | null; h1: string | null; content_length_words: number;
  has_faq: boolean; has_price_block: boolean; has_reviews: boolean;
  has_schema: boolean; has_cta_button: boolean; has_video: boolean; has_blog: boolean;
  load_speed_sec: number | null; h2_count: number; h3_count: number;
  images_count: number; internal_links_count: number; top_phrases: string[];
  is_analyzed: boolean;
}

function parseCompetitorHtml(url: string, html: string, loadMs: number, position: number): CompetitorProfile {
  const domain = (() => { try { return new URL(url).hostname.replace(/^www\./, ''); } catch { return url; } })();
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() || null : null;
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() || null : null;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const words = bodyText.split(/\s+/).filter(w => w.length > 2);
  const htmlLower = html.toLowerCase();

  return {
    _type: 'competitor', position, url, domain, title, h1,
    content_length_words: words.length,
    has_faq: /faq|часто\s*задаваемые/i.test(html) || html.includes('FAQPage') || /<details[\s>]/i.test(html),
    has_price_block: /прайс|стоимость|цена|руб|₽|\d+\s*р\b/i.test(bodyText),
    has_reviews: /отзыв|review|testimonial/i.test(bodyText),
    has_schema: !!html.match(/<script[^>]*type=["']application\/ld\+json["']/i),
    has_cta_button: /заказ|купи|оставить заявку|запис|получить|корзин/i.test(html),
    has_video: htmlLower.includes('<video') || htmlLower.includes('youtube.com') || htmlLower.includes('rutube.ru'),
    has_blog: htmlLower.includes('/blog') || htmlLower.includes('/stati') || htmlLower.includes('/news'),
    load_speed_sec: loadMs > 0 ? +(loadMs / 1000).toFixed(1) : null,
    h2_count: (html.match(/<h2[\s>]/gi) || []).length,
    h3_count: (html.match(/<h3[\s>]/gi) || []).length,
    images_count: (html.match(/<img[\s>]/gi) || []).length,
    internal_links_count: (html.match(/<a[^>]*href=["'][^"'#]*["']/gi) || []).length,
    top_phrases: words.slice(0, 200).filter(w => w.length > 4).reduce((acc: string[], w) => { if (!acc.includes(w.toLowerCase()) && acc.length < 10) acc.push(w.toLowerCase()); return acc; }, []),
    is_analyzed: words.length > 50,
  };
}

function isExcludedUrl(url: string, ownHostname: string): boolean {
  const excluded = ['youtube.com', 'google.com', 'facebook.com', 'instagram.com', 'twitter.com', 'vk.com', 'ok.ru', 'wikipedia.org', 'yandex.ru', 'maps.google', 'play.google'];
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    if (hostname === ownHostname) return true;
    return excluded.some(e => hostname.includes(e));
  } catch { return true; }
}

async function competitorAnalysis(url: string, theme: string, html: string, mode: string, loadTimeMs: number, apiKey: string): Promise<{ competitors: CompetitorProfile[]; comparisonTable: any; directMeta: any; gap_issues: Issue[] }> {
  const parsedUrl = new URL(url);
  const ownHostname = parsedUrl.hostname.replace(/^www\./, '');

  // Build own profile
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const ownWords = bodyText.split(/\s+/).filter(w => w.length > 2);
  const own = {
    content_length_words: ownWords.length,
    h2_count: (html.match(/<h2[\s>]/gi) || []).length,
    images_count: (html.match(/<img[\s>]/gi) || []).length,
    has_faq: /faq|часто\s*задаваемые/i.test(html) || html.includes('FAQPage'),
    has_price_block: /стоимость|цена|руб|₽/i.test(bodyText),
    has_reviews: /отзыв|review/i.test(bodyText),
    has_schema: !!html.match(/<script[^>]*type=["']application\/ld\+json["']/i),
    has_video: /youtube\.com|<video/i.test(html),
    has_cta_button: /заказ|купи|получить|корзин/i.test(html),
    domain: ownHostname,
  };

  // Find competitor URLs via LLM
  const competitorUrls = new Set<string>();
  const searchQueries = [theme, `${theme} сайт`, `${theme} компания`];

  if (apiKey) {
    for (const query of searchQueries.slice(0, 2)) {
      if (competitorUrls.size >= 10) break;
      try {
        const content = await llmCall(apiKey, 'gpt-4o-mini',
          'Ты — поисковый аналитик. Верни JSON-массив из 5-7 URL-адресов сайтов-конкурентов для данного запроса. Только домашние страницы реальных компаний. Исключи маркетплейсы, соцсети, Wikipedia. Формат: ["https://example.com",...]',
          `Запрос: "${query}"\nСайт пользователя: ${url}\nНЕ включай ${ownHostname}`, 1000);
        const urls: string[] = safeParseJson<string[]>(content, []);
        for (const u of urls) {
          if (!isExcludedUrl(u, ownHostname) && competitorUrls.size < 10) competitorUrls.add(u);
        }
      } catch {}
    }
  }

  // Fetch and parse competitors
  const competitors: CompetitorProfile[] = [];
  let posCounter = 0;
  const fetchPromises = [...competitorUrls].map(async (compUrl) => {
    const pos = ++posCounter;
    try {
      const start = Date.now();
      const resp = await fetchWithTimeout(compUrl, 8000);
      const ms = Date.now() - start;
      if (!resp.ok) return null;
      const ct = resp.headers.get('content-type') || '';
      if (!ct.includes('text/html')) return null;
      const compHtml = await resp.text();
      return parseCompetitorHtml(compUrl, compHtml, ms, pos);
    } catch { return null; }
  });
  const results = await Promise.all(fetchPromises);
  for (const r of results) { if (r) competitors.push(r); }

  // Build comparison table
  const analyzed = competitors.filter(c => c.is_analyzed && c.content_length_words > 50);
  const avg = (arr: number[]) => arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0;
  const leader = analyzed.length ? analyzed.reduce((best, c) => c.content_length_words > best.content_length_words ? c : best, analyzed[0]) : null;

  const avgMetrics = {
    content_length_words: avg(analyzed.map(c => c.content_length_words)),
    h2_count: avg(analyzed.map(c => c.h2_count)),
    images_count: avg(analyzed.map(c => c.images_count)),
    has_faq: analyzed.filter(c => c.has_faq).length >= analyzed.length / 2,
    has_price_block: analyzed.filter(c => c.has_price_block).length >= analyzed.length / 2,
    has_reviews: analyzed.filter(c => c.has_reviews).length >= analyzed.length / 2,
    has_schema: analyzed.filter(c => c.has_schema).length >= analyzed.length / 2,
    has_video: analyzed.filter(c => c.has_video).length >= analyzed.length / 2,
  };

  const insights: string[] = [];
  if (own.content_length_words < avgMetrics.content_length_words - 300) insights.push(`Объём контента ниже среднего на ${avgMetrics.content_length_words - own.content_length_words} слов`);
  if (!own.has_faq && avgMetrics.has_faq) insights.push('FAQ есть у конкурентов — добавьте');
  if (!own.has_reviews && avgMetrics.has_reviews) insights.push('Отзывы есть у конкурентов');
  if (!own.has_schema && avgMetrics.has_schema) insights.push('Schema.org есть у конкурентов');
  if (insights.length === 0) insights.push('Сайт конкурентоспособен');

  const comparisonTable = {
    _type: 'comparison_table',
    your_site: { content_length_words: own.content_length_words, h2_count: own.h2_count, images_count: own.images_count, has_faq: own.has_faq, has_price_block: own.has_price_block, has_reviews: own.has_reviews, has_schema: own.has_schema, has_video: own.has_video },
    avg_top10: avgMetrics,
    leader: leader ? { content_length_words: leader.content_length_words, h2_count: leader.h2_count, images_count: leader.images_count, has_faq: leader.has_faq, has_price_block: leader.has_price_block, has_reviews: leader.has_reviews, has_schema: leader.has_schema, has_video: leader.has_video } : avgMetrics,
    leader_domain: leader?.domain || '',
    insights,
  };

  const directMeta = { _type: 'direct_meta', query: searchQueries[0] || theme, region: 'Россия', serp_date: new Date().toISOString().split('T')[0], total_found: competitors.length };

  // Gap issues
  const gap_issues: Issue[] = [];
  const total = analyzed.length;
  if (total >= 3) {
    const gaps = [
      { param: 'FAQ', ownHas: own.has_faq, compCount: analyzed.filter(c => c.has_faq).length, fixTitle: 'Нет FAQ — есть у конкурентов', fixHow: 'Добавьте FAQ', fixExample: '<h2>FAQ</h2>' },
      { param: 'Цены', ownHas: own.has_price_block, compCount: analyzed.filter(c => c.has_price_block).length, fixTitle: 'Нет цен — есть у конкурентов', fixHow: 'Добавьте блок цен', fixExample: '<h2>Стоимость</h2>' },
      { param: 'Отзывы', ownHas: own.has_reviews, compCount: analyzed.filter(c => c.has_reviews).length, fixTitle: 'Нет отзывов — есть у конкурентов', fixHow: 'Добавьте отзывы', fixExample: '<h2>Отзывы</h2>' },
      { param: 'Schema', ownHas: own.has_schema, compCount: analyzed.filter(c => c.has_schema).length, fixTitle: 'Нет Schema — есть у конкурентов', fixHow: 'Добавьте JSON-LD', fixExample: '<script type="application/ld+json">...</script>' },
    ];
    for (const gap of gaps) {
      if (gap.ownHas) continue;
      const threshold = Math.ceil(total * 0.6);
      if (gap.compCount >= threshold) {
        gap_issues.push(makeIssue({ module: 'competitors', severity: gap.compCount >= Math.ceil(total * 0.8) ? 'high' : 'medium', title: gap.fixTitle, found: `У вас: нет. У конкурентов: ${gap.compCount}/${total}`, location: 'Контент', why_it_matters: `${gap.compCount} из ${total} конкурентов имеют ${gap.param}`, how_to_fix: gap.fixHow, example_fix: gap.fixExample, visible_in_preview: false }));
      }
    }

    const avgWords = avg(analyzed.map(c => c.content_length_words));
    if (own.content_length_words < avgWords * 0.5 && avgWords > 300) {
      gap_issues.push(makeIssue({ module: 'competitors', severity: 'high', title: 'Объём контента значительно меньше конкурентов', found: `У вас: ${own.content_length_words} слов. Среднее: ${avgWords}`, location: 'Контент', why_it_matters: 'Конкуренты в топе имеют больше контента', how_to_fix: `Расширьте до ${avgWords}+ слов`, example_fix: 'Добавьте FAQ, кейсы, описания', visible_in_preview: false }));
    }
  }

  return { competitors, comparisonTable, directMeta, gap_issues };
}

// ═══ STEP 5: Keywords ═══
interface KeywordEntry { phrase: string; cluster: string; intent: string; frequency: number; landing_needed: boolean; }

async function extractKeywords(html: string, theme: string, url: string, competitorPhrases: string[], apiKey: string): Promise<KeywordEntry[]> {
  if (!apiKey) return [];
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '').replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  const phrasesBlock = competitorPhrases.length > 0 ? `\nФразы конкурентов: ${competitorPhrases.join(', ')}` : '';

  const allKeywords: KeywordEntry[] = [];
  for (let batch = 0; batch < 3; batch++) {
    const userPrompt = batch === 0
      ? `URL: ${url}\nTitle: ${title}\nH1: ${h1}\nТекст: ${bodyText.slice(0, 1500)}${phrasesBlock}`
      : `Ещё 100 НОВЫХ запросов для "${theme}". Не дублируй: ${allKeywords.slice(0, 20).map(k => k.phrase).join(', ')}`;
    const content = await llmCall(apiKey, 'gpt-4o-mini',
      `Ты — SEO-специалист для Рунета. Сгенерируй 150 ключевых запросов.\nТребования: реальные запросы Яндекса, 7 кластеров max, intent: commercial/informational/navigational/transactional, frequency: 50-50000.\nФормат: JSON-массив [{"phrase":"...","cluster":"...","intent":"commercial","frequency":2400,"landing_needed":false}].\nТолько JSON.`,
      userPrompt, 16000, 0.1);
    const parsed = safeParseJson<KeywordEntry[]>(content, []);
    allKeywords.push(...parsed);
    if (allKeywords.length >= 300) break;
  }

  // Deduplicate
  const seen = new Set<string>();
  return allKeywords.filter(k => {
    const key = k.phrase?.toLowerCase()?.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 400);
}

// ═══ STEP 6: Minus words ═══
interface MinusWord { word: string; type: string; reason: string; }

async function generateMinusWords(theme: string, keywords: KeywordEntry[], apiKey: string): Promise<MinusWord[]> {
  if (!apiKey) return [];
  const topPhrases = keywords.slice(0, 40).map(k => k.phrase).join(', ');
  const content = await llmCall(apiKey, 'gpt-4o-mini',
    `Ты — специалист по Яндекс.Директу. Сгенерируй 50-100 минус-слов для рекламной кампании.\nФормат: JSON-массив [{"word":"бесплатно","type":"informational","reason":"Отсекает некоммерческий трафик"}].\nТолько JSON.`,
    `Тематика: ${theme}\nКлючевые: ${topPhrases}`, 8000, 0.1);
  const parsed = safeParseJson<MinusWord[]>(content, []);
  return parsed.filter(w => w.word && w.word.length > 1).slice(0, 150);
}

// ─── SEO Data extraction for reports ───
function extractSeoData(html: string, parsedUrl: URL, httpStatus: number, loadTimeMs: number, robotsResult: { ok: boolean; text: string }, sitemapResult: { ok: boolean; text: string }, hasLlmsTxt: boolean) {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';
  const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) || html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : '';
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1Match ? h1Match[1].replace(/<[^>]+>/g, '').trim() : '';
  const h1Count = (html.match(/<h1[\s>]/gi) || []).length;
  const h2Count = (html.match(/<h2[\s>]/gi) || []).length;
  const h3Count = (html.match(/<h3[\s>]/gi) || []).length;
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const bodyText = bodyMatch ? bodyMatch[1].replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : '';
  const wordCount = bodyText.split(/\s+/).filter(w => w.length > 1).length;
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
  const canonical = canonicalMatch ? canonicalMatch[1] : '';
  const ogTitle = (html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';
  const ogDescription = (html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';
  const ogImage = (html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';
  const langMatch = html.match(/<html[^>]*lang=["']([^"']*)["']/i);
  const lang = langMatch ? langMatch[1] : '';
  const allImages = html.match(/<img[^>]*>/gi) || [];
  const imagesTotal = allImages.length;
  const imagesWithoutAlt = allImages.filter(img => !img.match(/alt=["'][^"']+["']/i)).length;
  const jsonLdBlocks = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
  const schemaTypes: string[] = [];
  let hasFaq = false;
  for (const block of jsonLdBlocks) {
    try {
      const parsed = JSON.parse(block.replace(/<\/?script[^>]*>/gi, ''));
      const extractTypes = (obj: any) => {
        if (obj?.['@type']) { const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']]; schemaTypes.push(...types); if (types.some((t: string) => t.toLowerCase().includes('faq'))) hasFaq = true; }
        if (obj?.['@graph'] && Array.isArray(obj['@graph'])) obj['@graph'].forEach(extractTypes);
      };
      extractTypes(parsed);
    } catch {}
  }

  return {
    title, titleLength: title.length, description, descriptionLength: description.length,
    h1, h1Count, h2Count, h3Count, wordCount, canonical,
    ogTitle, ogDescription, ogImage, lang,
    imagesTotal, imagesWithoutAlt,
    hasSchema: schemaTypes.length > 0, schemaTypes: [...new Set(schemaTypes)],
    hasFaq, hasLlmsTxt,
    hasViewport: /<meta[^>]*name=["']viewport["']/i.test(html),
    loadTimeMs, httpStatus,
    hasRobotsTxt: robotsResult.ok, hasSitemap: sitemapResult.ok,
  };
}

// ═══ Main pipeline export ═══
export interface PipelineResult {
  status: 'done' | 'error';
  url: string;
  mode: string;
  theme: string;
  is_spa: boolean;
  scores: { total: number; seo: number; direct: number; schema: number; ai: number; breakdown?: any };
  issues: Issue[];
  competitors: any[];
  keywords: KeywordEntry[];
  minus_words: MinusWord[];
  seo_data: any;
  error_message?: string;
}

export async function runPipeline(
  url: string,
  mode: string,
  onProgress: (pct: number, partialData?: Record<string, any>) => Promise<void>,
  apiKey: string,
  dbRules: DbRule[] = [],
  scanMode: string = 'full',
): Promise<PipelineResult> {
  issueCounter = 0;
  
  await onProgress(5);

  // Fetch page HTML
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
  } catch (e: any) {
    const unavailableIssue = makeIssue({ module: 'technical', severity: 'critical', title: 'Сайт недоступен', found: `Ошибка: ${e.message}`, location: 'HTTP запрос', why_it_matters: 'Невозможно проанализировать недоступный сайт', how_to_fix: 'Убедитесь что сайт доступен', example_fix: 'Проверьте WAF/Cloudflare', visible_in_preview: true });
    return {
      status: 'done', url: parsedUrl.toString(), mode, theme: '', is_spa: false,
      scores: { total: 0, seo: 0, direct: 0, schema: 0, ai: 0 },
      issues: [unavailableIssue], competitors: [], keywords: [], minus_words: [], seo_data: null,
    };
  }

  await onProgress(10);

  // SPA Detection
  let isSpa = false;
  let spaRenderFailed = false;
  if (isSpaPage(html)) {
    isSpa = true;
    const renderedMd = await fetchRenderedContent(parsedUrl.toString());
    if (renderedMd) {
      html = buildEnrichedHtml(renderedMd, html);
    } else {
      spaRenderFailed = true;
    }
  }

  // Theme (skip LLM for basic mode)
  const theme = scanMode === 'basic' ? 'Общая тематика' : await detectTheme(html, parsedUrl.toString(), apiKey);
  await onProgress(20, { theme, is_spa: isSpa });

  // Robots & sitemap
  const [robotsResult, sitemapResult] = await Promise.all([
    fetchText(`${origin}/robots.txt`),
    fetchText(`${origin}/sitemap.xml`),
  ]);

  // Broken links
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

  // SEO data
  let hasLlmsTxt = false;
  try { const llmsCheck = await fetchWithTimeout(`${origin}/llms.txt`, 5000, { method: 'HEAD' }); hasLlmsTxt = llmsCheck.ok; } catch {}
  const seoData = extractSeoData(html, parsedUrl, httpStatus, loadTimeMs, robotsResult, sitemapResult, hasLlmsTxt);

  await onProgress(35, { seo_data: seoData });

  // STEP 1: Technical SEO
  const techIssues = technicalAudit(html, parsedUrl, httpStatus, robotsResult.ok, robotsResult.text, sitemapResult.ok, sitemapResult.text, brokenLinks, loadTimeMs);

  // STEP 2: Content
  const contentIssues = contentAudit(html, theme);

  // STEP 3: Direct
  const directResult = directAudit(html, theme);

  // STEP 3b: AI ad (async — skip for basic)
  const adSuggestionPromise = scanMode === 'basic' ? Promise.resolve(null) : generateDirectAd(html, theme, parsedUrl.toString(), apiKey);

  // STEP 7: Schema
  const schemaIssues = schemaAudit(html);

  // STEP 8: AI
  const aiIssues = await aiAudit(html, origin, parsedUrl.toString(), isSpa, spaRenderFailed);

  let allIssues = [...techIssues, ...contentIssues, ...directResult.issues, ...schemaIssues, ...aiIssues];

  // Map to DB rules
  const firedRuleIds: string[] = [];
  for (const issue of allIssues) {
    const matchingRule = dbRules.find(r => {
      if (r.module !== issue.module) return false;
      const titleLower = issue.title.toLowerCase();
      const ruleTitleLower = r.title.toLowerCase();
      const ruleWords = ruleTitleLower.split(/\s+/).filter(w => w.length > 3);
      const matchCount = ruleWords.filter(w => titleLower.includes(w)).length;
      return matchCount >= Math.ceil(ruleWords.length * 0.5);
    });
    if (matchingRule) {
      issue.rule_id = matchingRule.rule_id;
      issue.visible_in_preview = matchingRule.visible_in_preview;
      firedRuleIds.push(matchingRule.rule_id!);
    }
  }

  // Enrich issues
  allIssues = allIssues.map(issue => ({
    ...issue,
    impact_score: issue.impact_score || (issue.severity === 'critical' ? 15 : issue.severity === 'high' ? 10 : issue.severity === 'medium' ? 5 : 2),
    docs_url: issue.docs_url || 'https://yandex.ru/support/webmaster/',
    why_it_matters: issue.why_it_matters || issue.found || '',
    how_to_fix: issue.how_to_fix || 'Обратитесь к SEO-специалисту.',
    example_fix: issue.example_fix || '',
  }));

  const scores = calcScoresWeighted(allIssues, dbRules);
  await onProgress(60, { scores, issues: allIssues });

  // STEP 4: Competitors (skip LLM for basic)
  const compResult = scanMode === 'basic'
    ? { competitors: [] as any[], gap_issues: [] as Issue[], directMeta: null, comparisonTable: null }
    : await competitorAnalysis(parsedUrl.toString(), theme, html, mode, loadTimeMs, apiKey);
  allIssues = [...allIssues, ...compResult.gap_issues];

  await onProgress(75);

  // STEP 5: Keywords (skip for basic)
  let keywords: KeywordEntry[] = [];
  if (scanMode !== 'basic') {
    const competitorPhrases = compResult.competitors.flatMap((c: any) => c.top_phrases).slice(0, 30);
    keywords = await extractKeywords(html, theme, parsedUrl.toString(), competitorPhrases, apiKey);
  }

  await onProgress(85, { keywords });

  // STEP 6: Minus words (skip for basic)
  const minusWords = scanMode === 'basic' ? [] as MinusWord[] : await generateMinusWords(theme, keywords, apiKey);

  const finalScores = calcScoresWeighted(allIssues, dbRules);

  // Await ad suggestion
  const adSuggestion = await adSuggestionPromise;

  const competitorsData = [
    compResult.directMeta,
    ...compResult.competitors,
    compResult.comparisonTable,
    {
      _type: 'direct_ad_meta',
      ad_headline: directResult.ad_headline,
      autotargeting_categories: directResult.autotargeting_categories,
      readiness_score: directResult.readiness_score,
      ad_suggestion: adSuggestion,
    },
  ].filter(Boolean);

  return {
    status: 'done',
    url: parsedUrl.toString(),
    mode,
    theme,
    is_spa: isSpa,
    scores: finalScores,
    issues: allIssues,
    competitors: competitorsData,
    keywords,
    minus_words: minusWords,
    seo_data: seoData,
  };
}
