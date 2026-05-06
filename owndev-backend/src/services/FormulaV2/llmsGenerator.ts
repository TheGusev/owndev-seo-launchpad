/**
 * llms.txt and robots.txt generators.
 *
 * llms.txt spec: https://llmstxt.org — H1, blockquote summary, then sections
 * of links. robots.txt: classic User-agent / Allow / Disallow / Sitemap.
 *
 * Inputs are intentionally minimal so generators can be called both during
 * blueprint build and during recovery (when only the audit is known).
 */
import type { ProjectType, BlueprintPagePlan } from '../../types/formulaV2.js';

export interface LlmsTxtInput {
  business_name: string;
  site_url: string;
  short_description: string;
  long_description?: string;
  pages: Array<{
    title: string;
    url: string;
    description?: string;
    section?: string; // 'Services','About','Contact', etc.
  }>;
}

export function generateLlmsTxt(input: LlmsTxtInput): string {
  const { business_name, site_url, short_description, long_description, pages } = input;

  const lines: string[] = [];
  lines.push(`# ${business_name}`);
  lines.push('');
  lines.push(`> ${short_description}`);
  lines.push('');
  if (long_description) {
    lines.push(long_description.trim());
    lines.push('');
  }

  // Group pages by section
  const sections = new Map<string, typeof pages>();
  for (const p of pages) {
    const s = p.section ?? 'Pages';
    if (!sections.has(s)) sections.set(s, []);
    sections.get(s)!.push(p);
  }

  // Stable section order: Services > Pages > About > Contact > others
  const order = ['Services', 'Pages', 'Products', 'Articles', 'About', 'Contact'];
  const sortedSections = Array.from(sections.entries()).sort(([a], [b]) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  for (const [section, items] of sortedSections) {
    lines.push(`## ${section}`);
    lines.push('');
    for (const p of items) {
      const absoluteUrl = p.url.startsWith('http') ? p.url : `${site_url.replace(/\/$/, '')}${p.url}`;
      const desc = p.description ? `: ${p.description}` : '';
      lines.push(`- [${p.title}](${absoluteUrl})${desc}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

export interface RobotsTxtInput {
  site_url: string;
  sitemap_url?: string;
  disallow_paths?: string[]; // utility / private paths
  allow_paths?: string[];
  ai_bots_policy?: 'allow' | 'disallow' | 'mixed';
}

const AI_BOTS = [
  'GPTBot',
  'ChatGPT-User',
  'OAI-SearchBot',
  'PerplexityBot',
  'ClaudeBot',
  'anthropic-ai',
  'YandexGPT',
  'Google-Extended',
  'CCBot',
];

export function generateRobotsTxt(input: RobotsTxtInput): string {
  const { site_url, sitemap_url, disallow_paths = [], allow_paths = [], ai_bots_policy = 'allow' } = input;

  const lines: string[] = [];
  // Default policy
  lines.push('User-agent: *');
  for (const a of allow_paths) lines.push(`Allow: ${a}`);
  for (const d of disallow_paths) lines.push(`Disallow: ${d}`);
  if (allow_paths.length === 0 && disallow_paths.length === 0) lines.push('Allow: /');
  lines.push('');

  // AI bots block
  if (ai_bots_policy === 'disallow') {
    for (const bot of AI_BOTS) {
      lines.push(`User-agent: ${bot}`);
      lines.push('Disallow: /');
      lines.push('');
    }
  } else if (ai_bots_policy === 'mixed') {
    // Allow read, disallow private utility paths
    for (const bot of AI_BOTS) {
      lines.push(`User-agent: ${bot}`);
      for (const d of disallow_paths) lines.push(`Disallow: ${d}`);
      lines.push('Allow: /');
      lines.push('');
    }
  }
  // 'allow' = no extra rules; covered by User-agent: *

  if (sitemap_url) {
    lines.push(`Sitemap: ${sitemap_url}`);
  } else {
    lines.push(`Sitemap: ${site_url.replace(/\/$/, '')}/sitemap.xml`);
  }

  return lines.join('\n');
}

export interface SitemapSkeletonInput {
  site_url: string;
  pages: Array<{ url: string; lastmod?: string; priority?: number; changefreq?: string }>;
}

export function generateSitemapXml(input: SitemapSkeletonInput): string {
  const { site_url, pages } = input;
  const today = new Date().toISOString().split('T')[0];
  const base = site_url.replace(/\/$/, '');

  const urlEntries = pages
    .map((p) => {
      const loc = p.url.startsWith('http') ? p.url : `${base}${p.url}`;
      const lastmod = p.lastmod ?? today;
      const priority = (p.priority ?? 0.5).toFixed(1);
      const changefreq = p.changefreq ?? 'monthly';
      return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>
`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ─── Project-type-aware llms.txt builder ──────────────────────
// Helper that maps page_type → llms.txt section name.
const PAGE_TYPE_TO_SECTION: Record<string, string> = {
  home: 'Pages',
  category: 'Services',
  service: 'Services',
  product: 'Products',
  article: 'Articles',
  contacts: 'Contact',
  about: 'About',
  team: 'About',
  doctors: 'About',
  cases: 'About',
};

export function pagePlanToLlmsTxtPages(
  plans: BlueprintPagePlan[],
  projectType: ProjectType,
): LlmsTxtInput['pages'] {
  void projectType; // reserved for future per-type tweaks
  const out: LlmsTxtInput['pages'] = [];
  for (const plan of plans) {
    const section = PAGE_TYPE_TO_SECTION[plan.page_type] ?? 'Pages';
    // Use first example URL when available, otherwise the pattern itself.
    const url = plan.examples[0] ?? plan.url_pattern;
    out.push({
      title: plan.h1_template.replace(/\{\{[^}]+\}\}/g, '').trim() || plan.page_type,
      url,
      description: plan.notes_ru ?? undefined,
      section,
    });
  }
  return out;
}
