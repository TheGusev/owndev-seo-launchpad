export const autoFixTemplates: Record<string, (data: Record<string, string>) => string> = {
  missing_meta_description: (d) =>
    `<meta name="description" content="${d.suggestedDescription || 'Описание вашей страницы в 140–160 символов'}" />`,

  missing_og_tags: (d) =>
    `<!-- Open Graph -->\n<meta property="og:title" content="${d.title || 'Заголовок'}" />\n<meta property="og:description" content="${d.description || 'Описание'}" />\n<meta property="og:url" content="${d.url}" />\n<meta property="og:type" content="website" />\n<meta property="og:image" content="${d.url}/og-image.png" />\n<meta property="og:locale" content="ru_RU" />`,

  missing_schema_org: (d) =>
    `<script type="application/ld+json">\n${JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: d.title || "Заголовок",
        description: d.description || "Описание",
        url: d.url,
        publisher: { "@type": "Organization", name: d.siteName || safeHost(d.url) },
      },
      null,
      2
    )}\n</script>`,

  missing_faq_schema: () =>
    `<script type="application/ld+json">\n${JSON.stringify(
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: [
          { "@type": "Question", name: "Ваш вопрос", acceptedAnswer: { "@type": "Answer", text: "Ваш ответ" } },
        ],
      },
      null,
      2
    )}\n</script>`,

  missing_llms_txt: (d) =>
    `# ${d.siteName || safeHost(d.url)}\n\n> ${d.description || "Описание сайта"}\n\n## Offered\n\n- Основная услуга/продукт\n\n## Links\n\n- ${d.url}: Главная страница`,

  missing_h1: (d) => `<h1>${d.suggestedH1 || "Заголовок страницы"}</h1>`,

  missing_canonical: (d) => `<link rel="canonical" href="${d.url}" />`,

  missing_hreflang: (d) => `<link rel="alternate" hreflang="ru" href="${d.url}" />`,

  missing_twitter_card: (d) =>
    `<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:title" content="${d.title || "Заголовок"}" />\n<meta name="twitter:description" content="${d.description || "Описание"}" />`,

  short_title: (d) => `<title>${d.suggestedTitle || "Оптимальный заголовок 50-60 символов"}</title>`,

  short_meta_description: (d) =>
    `<meta name="description" content="${d.suggestedDescription || "Описание 140-160 символов"}" />`,

  missing_viewport: () => `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,

  missing_lang: () => `<html lang="ru">`,

  missing_favicon: () => `<link rel="icon" href="/favicon.ico" type="image/x-icon" />`,

  missing_robots_txt: (d) =>
    `User-agent: *\nAllow: /\n\nSitemap: ${d.url}/sitemap.xml\n\n# AI crawlers\nUser-agent: GPTBot\nAllow: /\nUser-agent: Google-Extended\nAllow: /`,

  missing_sitemap: (d) =>
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url>\n    <loc>${d.url}/</loc>\n    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n    <priority>1.0</priority>\n  </url>\n</urlset>`,
};

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** Match an issue title to a template key */
export function matchIssueToTemplate(title: string): string | null {
  const lower = title.toLowerCase();
  const map: [RegExp, string][] = [
    [/meta\s*description.*отсутств|нет\s*meta\s*desc/i, "missing_meta_description"],
    [/description.*корот|description.*мало/i, "short_meta_description"],
    [/open\s*graph|og[:\s]*tag/i, "missing_og_tags"],
    [/json-ld.*не найден|schema.*не найден|schema\.org.*отсутств/i, "missing_schema_org"],
    [/faq.*schema|faq.*разметк/i, "missing_faq_schema"],
    [/llms\.txt/i, "missing_llms_txt"],
    [/h1.*отсутств|нет\s*h1/i, "missing_h1"],
    [/canonical/i, "missing_canonical"],
    [/hreflang/i, "missing_hreflang"],
    [/twitter\s*card/i, "missing_twitter_card"],
    [/title.*корот/i, "short_title"],
    [/viewport/i, "missing_viewport"],
    [/lang.*атрибут|html.*lang/i, "missing_lang"],
    [/favicon/i, "missing_favicon"],
    [/robots\.txt.*не найден|нет\s*robots/i, "missing_robots_txt"],
    [/sitemap.*не найден|нет\s*sitemap/i, "missing_sitemap"],
  ];
  for (const [re, key] of map) {
    if (re.test(lower)) return key;
  }
  return null;
}
