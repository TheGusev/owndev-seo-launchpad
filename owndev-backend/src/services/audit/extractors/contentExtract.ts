/**
 * extractors/contentExtract — extracts content metrics for SEO + AI/LLM axes.
 */

import * as cheerio from 'cheerio';
import type { ContentExtract } from '../types.js';

const FAQ_QUESTION_REGEX = /\?\s*$/;

export function extractContent(html: string, baseUrl: string): ContentExtract {
  const $ = cheerio.load(html);

  const $h1 = $('h1').first();
  const h1 = ($h1.text() || '').trim();
  const h1Length = h1.length;

  // Internal links — only same-host
  let host = '';
  try {
    host = new URL(baseUrl).hostname;
  } catch {
    host = '';
  }
  let internalLinkCount = 0;
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? '';
    if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
    if (href.startsWith('/') || (host && href.includes(host))) internalLinkCount++;
  });

  // Images
  const imgs = $('img');
  const imgCount = imgs.length;
  const imgAltMissing = imgs.filter((_, el) => !($(el).attr('alt') ?? '').trim()).length;

  // Word count from <main>, <article> or <body>
  const $content = $('main').length ? $('main') : $('article').length ? $('article') : $('body');
  const text = $content.text().replace(/\s+/g, ' ').trim();
  const words = text ? text.split(' ').filter(Boolean) : [];
  const wordCount = words.length;

  // Intro answer = first <p> within $content
  const firstP = $content.find('p').first().text().replace(/\s+/g, ' ').trim();
  const introWords = firstP ? firstP.split(' ').filter(Boolean).length : 0;
  const hasIntroAnswer = introWords >= 40 && introWords <= 80;

  // FAQ heuristic — count headings or summary elements that look like questions
  let faqCount = 0;
  $('h2, h3, h4, summary, [itemtype*="Question"], dt').each((_, el) => {
    const t = ($(el).text() || '').trim();
    if (t && (FAQ_QUESTION_REGEX.test(t) || /как |что такое |почему |когда |сколько /i.test(t))) faqCount++;
  });
  // FAQPage JSON-LD has its own counting downstream — the heuristic gives a floor

  const bodyLower = $.html().toLowerCase();
  const hasAuthorBio =
    $('[itemtype*="Person"]').length > 0 ||
    /by\s+author|автор:|об\s+авторе/i.test($content.text());
  const hasLastUpdated =
    /обновлено[:\s]|updated\s*[:on]/i.test($content.text()) ||
    $('time[datetime]').length > 0;
  const hasGlossary = /глоссари|термин[ыа]|definedterm/i.test(bodyLower);

  // Citable facts — heuristic on lists + tables + key metrics
  const lists = $('ul, ol').length;
  const tables = $('table').length;
  const numbers = (text.match(/\d+%|\d+\s*(?:руб|₽|usd|\$|штук|шт\.)/gi) ?? []).length;
  const citableFactsScore = Math.min(1, (lists * 0.15 + tables * 0.25 + numbers * 0.05));

  return {
    h1: h1 || null,
    h1_length: h1Length,
    internal_link_count: internalLinkCount,
    img_count: imgCount,
    img_alt_missing_count: imgAltMissing,
    word_count: wordCount,
    intro_first_paragraph_words: introWords,
    has_intro_answer_40_80: hasIntroAnswer,
    faq_question_count: faqCount,
    has_author_bio: hasAuthorBio,
    has_last_updated: hasLastUpdated,
    has_glossary: hasGlossary,
    citable_facts_score: citableFactsScore,
  };
}
