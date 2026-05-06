/**
 * services/conversion — CTA auditor.
 *
 * Cheerio-based heuristic audit of CTAs on a page:
 *   • detect primary CTA (first matching button/anchor with action keywords)
 *   • check phone clickability (tel:)
 *   • check messenger links (wa.me, t.me, viber://)
 *   • detect contrast (heuristic: explicit background-color attribute or .btn-primary class)
 */

import * as cheerio from 'cheerio';
import type { CtaAuditInput, CtaAuditResult } from './types.js';

const DEFAULT_PRIMARY_KEYWORDS = [
  'заказать',
  'купить',
  'оставить заявку',
  'получить расчет',
  'получить расчёт',
  'записаться',
  'забронировать',
  'оформить',
  'отправить',
  'подписаться',
  'попробовать',
  'demo',
  'позвонить',
  'связаться',
  'оставить заявк',
  'консультаци',
];

export function auditCta(input: CtaAuditInput): CtaAuditResult {
  const $ = cheerio.load(input.html);
  const keywords = (input.primary_cta_keywords ?? DEFAULT_PRIMARY_KEYWORDS).map((s) => s.toLowerCase());

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Find candidate CTA elements (above-fold = first ~800px ≈ first 30% of body)
  const candidates: Array<{ text: string; el: cheerio.Cheerio<any> }> = [];
  $('button, a.btn, a.button, a[role="button"], .btn, .cta, [data-cta]').each((_, el) => {
    const $el = $(el);
    const text = ($el.text() || '').trim().toLowerCase();
    if (!text) return;
    candidates.push({ text, el: $el });
  });

  let primaryCta: { text: string; el: cheerio.Cheerio<any> } | null = null;
  for (const c of candidates) {
    if (keywords.some((k) => c.text.includes(k))) {
      primaryCta = c;
      break;
    }
  }

  // Above-fold heuristic: first CTA in document order or inside <header>/<section> with index ≤ 1
  const aboveFoldCandidates = candidates.slice(0, 3);
  const hasPrimaryAboveFold =
    !!primaryCta && aboveFoldCandidates.some((c) => c.text === primaryCta!.text);

  // Secondary CTA = any other CTA-like element
  const hasSecondary = candidates.length >= 2;

  // Contrast heuristic
  const primaryClass = primaryCta?.el.attr('class') ?? '';
  const primaryStyle = primaryCta?.el.attr('style') ?? '';
  const contrastOk =
    /btn-primary|primary|accent|cta|warning|success/i.test(primaryClass) ||
    /background[^;]*#?[0-9a-f]{3,6}/i.test(primaryStyle);

  // Phone
  const hasPhone = $('a[href^="tel:"]').length > 0;

  // Messenger links
  const hasMessenger =
    $('a[href*="wa.me"], a[href*="api.whatsapp.com"], a[href*="t.me/"], a[href^="viber:"], a[href^="tg:"]')
      .length > 0;

  if (!primaryCta) {
    issues.push('Нет CTA с явным действием (заказать/купить/оставить заявку)');
    recommendations.push('Добавить кнопку primary CTA с глаголом действия и приоритетом above-the-fold');
  }
  if (!hasPrimaryAboveFold) {
    issues.push('Первичный CTA не определяется above-the-fold (первые 3 кнопки)');
    recommendations.push('Перенести primary CTA в первый экран');
  }
  if (!hasPhone) {
    issues.push('Телефон не кликабельный (нет tel:)');
    recommendations.push('Использовать <a href="tel:+7XXXXXXXXXX">…</a>');
  }
  if (!hasSecondary) {
    recommendations.push('Добавить вторичный CTA (расчёт стоимости, консультация, образец работ)');
  }
  if (primaryCta && !contrastOk) {
    issues.push('Первичный CTA не имеет акцентного класса/стиля — низкий визуальный контраст');
    recommendations.push('Применить класс btn-primary или явный фон с контрастом ≥ 4.5:1');
  }

  return {
    has_primary_cta_above_fold: hasPrimaryAboveFold,
    has_secondary_cta: hasSecondary,
    primary_cta_text: primaryCta?.text.slice(0, 80) ?? null,
    primary_cta_contrast_ok: !primaryCta ? false : contrastOk,
    has_phone_clickable: hasPhone,
    has_messenger_links: hasMessenger,
    cta_count_total: candidates.length,
    issues,
    recommendations,
  };
}
