/**
 * services/technicalPassport/headTemplatesBuilder
 *
 * Готовые шаблоны <head> для каждого типа страницы из стратегии.
 * Юзер копирует целиком — без правок ИИ-студия/разработчик получает
 * SEO-, AI- и социальные мета-теги, готовые к индексации и AI-grounding.
 */

import type { PassportInputs } from './types.js';
import type { SiteStrategy, SitePage } from '../strategy/types.js';

export interface HeadTemplateEntry {
  page_type: string;
  url_pattern: string;
  /** Готовый текст всех meta+link тегов для этой страницы */
  head_html: string;
}

export interface HeadTemplatesResult {
  /** По одному <head>-блоку на тип страницы из стратегии */
  per_page: HeadTemplateEntry[];
  /** Базовый <head>-фрагмент, общий для всего сайта */
  base_head: string;
}

const escapeAttr = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

function pageTitle(inputs: PassportInputs, page: SitePage): string {
  const t = page.contract?.title_template ?? page.contract?.h1_template ?? page.page_type;
  // Если в шаблоне уже есть бренд — возвращаем как есть, иначе добавляем
  return t.includes(inputs.brand_name) ? t : `${t} — ${inputs.brand_name}`;
}

function pageDesc(inputs: PassportInputs, page: SitePage): string {
  return (
    page.contract?.meta_description_template ??
    page.contract?.intro_answer_template ??
    `${page.contract?.title_template ?? page.page_type}. ${inputs.description_ru}`
  );
}

function buildBaseHead(inputs: PassportInputs): string {
  const baseUrl = inputs.base_url.replace(/\/$/, '');
  return [
    `<!-- Базовые мета-теги — копируй в <head> каждой страницы -->`,
    `<meta charset="utf-8">`,
    `<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">`,
    `<meta name="format-detection" content="telephone=no">`,
    `<meta http-equiv="X-UA-Compatible" content="IE=edge">`,
    ``,
    `<!-- Robots / AI-индексация -->`,
    `<meta name="robots" content="index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1">`,
    `<meta name="googlebot" content="index,follow">`,
    `<meta name="yandex" content="index,follow">`,
    `<meta name="ai-content-declaration" content="${escapeAttr(inputs.ai_training_policy)}">`,
    ``,
    `<!-- Брендинг и фавиконы -->`,
    `<link rel="icon" href="${baseUrl}/favicon.ico" sizes="32x32">`,
    `<link rel="icon" href="${baseUrl}/icon.svg" type="image/svg+xml">`,
    `<link rel="apple-touch-icon" href="${baseUrl}/apple-touch-icon.png">`,
    `<link rel="manifest" href="${baseUrl}/site.webmanifest">`,
    ``,
    `<!-- Yandex.Webmaster verification -->`,
    `<!-- <meta name="yandex-verification" content="ВСТАВЬТЕ_ВАШ_ТОКЕН"> -->`,
    `<!-- <meta name="google-site-verification" content="ВСТАВЬТЕ_ВАШ_ТОКЕН"> -->`,
  ].join('\n');
}

function buildPageHead(inputs: PassportInputs, page: SitePage): string {
  const baseUrl = inputs.base_url.replace(/\/$/, '');
  const url = `${baseUrl}${page.url_pattern.replace(/:\w+/g, '').replace(/\/$/, '') || '/'}`;
  const title = pageTitle(inputs, page);
  const desc = pageDesc(inputs, page);
  const ogImage = `${baseUrl}/og/${page.page_type}.jpg`;

  return [
    `<!-- ${page.page_type} · ${page.url_pattern} -->`,
    `<title>${escapeAttr(title)}</title>`,
    `<meta name="description" content="${escapeAttr(desc)}">`,
    `<link rel="canonical" href="${url}">`,
    ``,
    `<!-- Open Graph (соцсети, мессенджеры, превью) -->`,
    `<meta property="og:type" content="website">`,
    `<meta property="og:locale" content="${inputs.languages[0] === 'ru' ? 'ru_RU' : 'en_US'}">`,
    `<meta property="og:title" content="${escapeAttr(title)}">`,
    `<meta property="og:description" content="${escapeAttr(desc)}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:site_name" content="${escapeAttr(inputs.brand_name)}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="630">`,
    ``,
    `<!-- Twitter / X -->`,
    `<meta name="twitter:card" content="summary_large_image">`,
    `<meta name="twitter:title" content="${escapeAttr(title)}">`,
    `<meta name="twitter:description" content="${escapeAttr(desc)}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
    ``,
    `<!-- Hreflang (если есть мульти-язык) -->`,
    ...inputs.languages.map(
      (lang) => `<link rel="alternate" hreflang="${lang}" href="${url}">`,
    ),
    `<link rel="alternate" hreflang="x-default" href="${url}">`,
  ].join('\n');
}

export function buildHeadTemplates(
  inputs: PassportInputs,
  strategy: SiteStrategy,
): HeadTemplatesResult {
  const base_head = buildBaseHead(inputs);
  const per_page = strategy.pages.map((p) => ({
    page_type: p.page_type,
    url_pattern: p.url_pattern,
    head_html: buildPageHead(inputs, p),
  }));
  return { per_page, base_head };
}
