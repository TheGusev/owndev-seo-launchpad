/**
 * Общий HTML-фетчер с теми же эвристиками, что в Site Check pipeline.
 *
 * Зачем: «полный аудит» (CRO) и другие инструменты раньше ходили за HTML
 * собственным `fetch` с упрощёнными заголовками — это ловило 403/EMPTY на
 * нормальных сайтах (Beget, Bitrix, WP с базовой защитой), и LLM
 * галлюцинировал «сайт недоступен / WAF / Cloudflare». Здесь — честная
 * единая точка входа: ходим как Site Check, при пустом теле SPA-фолбэк
 * через Jina Reader, возвращаем структурированный результат.
 */

import { logger } from './logger.js';

export const SHARED_USER_AGENT = 'OWNDEV-SiteCheck/2.0 (+https://owndev.ru)';

export interface FetchedPage {
  ok: boolean;
  status: number;
  /** Финальный URL после редиректов (если ok). */
  finalUrl: string;
  /** Сырой HTML, если получили. */
  html: string;
  /** Извлечённый видимый текст (без скриптов/стилей/тегов). */
  bodyText: string;
  /** <title>. */
  title: string;
  /** <meta description>. */
  metaDescription: string;
  /** Был ли использован Jina-fallback (SPA или почти пустое тело). */
  usedJinaFallback: boolean;
  /** Если ok=false — короткое человекочитаемое описание почему. */
  reason?: string;
}

interface FetchOptions {
  /** Таймаут на основной HTTP-запрос. По умолчанию 10 секунд. */
  timeoutMs?: number;
  /** Таймаут на Jina-fallback. По умолчанию 20 секунд. */
  jinaTimeoutMs?: number;
  /** Принудительно использовать Jina, даже если основной fetch вернул HTML. */
  forceJina?: boolean;
  /** Если основной fetch не дал минимум столько символов видимого текста — пробуем Jina. По умолчанию 500. */
  jinaThreshold?: number;
  /** Пометка для логов. */
  label?: string;
}

function withTimeout(timeoutMs: number) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  return { signal: controller.signal, cancel: () => clearTimeout(id) };
}

function extractVisibleText(html: string): { bodyText: string; title: string; metaDescription: string } {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : '';

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i)
    || html.match(/<meta[^>]+content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const metaDescription = descMatch ? descMatch[1].trim() : '';

  const bodyMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
  const raw = bodyMatch ? bodyMatch[1] : html;
  const bodyText = raw
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return { bodyText, title, metaDescription };
}

/**
 * Эвристика SPA: мало текста + признаки фреймворк-shell + нет SSR-маркеров.
 * Та же логика, что в SiteCheckPipeline.isSpaPage — держим её здесь, чтобы
 * любой инструмент мог ей пользоваться.
 */
export function isSpaShell(html: string): boolean {
  const { bodyText } = extractVisibleText(html);
  const wordCount = bodyText.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
  const hasAppRoot = /<div[^>]*id=["'](root|app|__next|__nuxt|___gatsby|__svelte)["']/i.test(html);
  const hasFrameworkBundle = /(\/assets\/index[\w.-]+\.js|\/static\/js\/|\/chunks\/|_next\/static)/i.test(html);
  const hasServerRendered =
    /data-server-rendered=["']true["']/i.test(html) ||
    /<script[^>]*id=["']__NEXT_DATA__["']/i.test(html) ||
    /data-reactroot/i.test(html) ||
    /window\.__NUXT__/i.test(html);
  return wordCount < 150 && (hasAppRoot || hasFrameworkBundle) && !hasServerRendered;
}

async function fetchViaJina(url: string, timeoutMs: number, label: string): Promise<{ html: string; title: string; bodyText: string } | null> {
  const t = withTimeout(timeoutMs);
  try {
    const resp = await fetch(`https://r.jina.ai/${url}`, {
      signal: t.signal,
      headers: {
        Accept: 'text/plain',
        'User-Agent': SHARED_USER_AGENT,
        'X-Timeout': '15',
        'X-Wait-For-Selector': 'h1',
      } as any,
    });
    t.cancel();
    if (!resp.ok) return null;
    const md = await resp.text();
    if (md.length <= 200) return null;
    const titleMatch = md.match(/^Title:\s*(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : '';
    // Уберём служебный header (Title/URL Source/Description/...) и схлопнем пробелы.
    const content = md
      .replace(/^(Title|URL Source|Description|Published Time|Image):.*$/gm, '')
      .replace(/\s+/g, ' ')
      .trim();
    // Жалкий, но рабочий «html» для дальнейших детекторов наличия маркеров.
    const html = `<title>${title}</title><body>${content}</body>`;
    return { html, title, bodyText: content };
  } catch (e: any) {
    t.cancel();
    logger.error(label || 'HTML_FETCHER', `Jina fallback failed: ${e?.message || e}`);
    return null;
  }
}

/**
 * Главная точка входа. Старается отдать максимум информации о странице,
 * не «галлюцинирует» — если страница реально недоступна, возвращает ok=false
 * с человекочитаемой причиной. Никогда не упоминает CDN/WAF имён в reason.
 */
export async function fetchPageForAnalysis(url: string, opts: FetchOptions = {}): Promise<FetchedPage> {
  const timeoutMs = opts.timeoutMs ?? 10000;
  const jinaTimeoutMs = opts.jinaTimeoutMs ?? 20000;
  const jinaThreshold = opts.jinaThreshold ?? 500;
  const label = opts.label ?? 'HTML_FETCHER';

  let html = '';
  let status = 0;
  let finalUrl = url;
  let mainErr: string | null = null;

  if (!opts.forceJina) {
    const t = withTimeout(timeoutMs);
    try {
      const resp = await fetch(url, {
        signal: t.signal,
        redirect: 'follow',
        headers: {
          'User-Agent': SHARED_USER_AGENT,
          // Нормальные браузерные заголовки, чтобы хосты с базовой защитой
          // не отдавали 403/empty. Без этого многие WP/Bitrix-сайты режут запрос.
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'ru-RU,ru;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
        },
      });
      t.cancel();
      status = resp.status;
      finalUrl = resp.url || url;
      if (resp.ok) {
        html = await resp.text();
      } else {
        mainErr = `HTTP ${resp.status}`;
      }
    } catch (e: any) {
      t.cancel();
      mainErr = e?.message || String(e);
      logger.info(label, `direct fetch failed for ${url}: ${mainErr}`);
    }
  }

  let { bodyText, title, metaDescription } = extractVisibleText(html);
  let usedJinaFallback = false;

  // Пробуем Jina если: forceJina, или прямого html нет, или body слишком пустой,
  // или это SPA-shell (мало текста + признаки фреймворка).
  const needsJina =
    opts.forceJina ||
    !html ||
    bodyText.length < jinaThreshold ||
    isSpaShell(html);

  if (needsJina) {
    const jina = await fetchViaJina(url, jinaTimeoutMs, label);
    if (jina) {
      usedJinaFallback = true;
      // Если основного html нет — берём «псевдо-html» из Jina; он годен для
      // последующих regex-детекторов наличия слов «отзыв», «гарантия», и т.п.
      if (!html) html = jina.html;
      // Текст всегда заменяем на Jina-версию, если она существенно богаче.
      if (jina.bodyText.length > bodyText.length) bodyText = jina.bodyText;
      if (!title && jina.title) title = jina.title;
    }
  }

  if (!html && !bodyText) {
    return {
      ok: false,
      status,
      finalUrl,
      html: '',
      bodyText: '',
      title: '',
      metaDescription: '',
      usedJinaFallback,
      // НЕ упоминаем имена CDN/WAF/хостингов — юзер запрещает.
      reason: mainErr
        ? `Не удалось получить HTML страницы (${mainErr}). Возможно сайт временно недоступен или ограничивает автоматические запросы.`
        : 'Не удалось получить содержимое страницы.',
    };
  }

  return {
    ok: true,
    status: status || 200,
    finalUrl,
    html,
    bodyText,
    title: title || finalUrl,
    metaDescription,
    usedJinaFallback,
  };
}
