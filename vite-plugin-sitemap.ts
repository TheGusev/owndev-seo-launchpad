import { type Plugin } from "vite";

const BASE = "https://owndev.ru";

/** Regions matching src/data/regions.ts */
const cities = [
  "moskva","sankt-peterburg","novosibirsk","ekaterinburg","kazan",
  "nizhny-novgorod","krasnoyarsk","chelyabinsk","samara","rostov-na-donu",
  "ufa","omsk","perm","voronezh","volgograd","krasnodar","tyumen","saratov",
  "tolyatti","izhevsk","barnaul","ulyanovsk","irkutsk","khabarovsk",
  "vladivostok","yaroslavl","tomsk","orenburg","kemerovo","novokuznetsk",
  "ryazan","astrakhan","penza","lipetsk","kirov","cheboksary","kaliningrad",
  "tula","stavropol","kursk","magnitogorsk","ivanovo","bryansk","belgorod",
  "surgut","vladimir","arkhangelsk","smolensk","kurgan",
];

/** Niches matching src/data/niches.ts */
const niches = [
  "saas","lokalnye-uslugi","ecommerce","b2b","nedvizhimost","avto",
  "medicina","obrazovanie","finansy","stroitelstvo","it-razrabotka",
  "marketing","hr","logistika","turizm","restorany","sport","krasota",
  "deti","zhivotnye",
];

/** Tools that exist in tools-registry AND are geoEnabled */
const geoEnabledTools = ["seo-auditor"];

/** Tools that exist in GeoNicheToolPage NICHE_ENABLED_SLUGS AND in tools-registry */
const nicheEnabledTools: string[] = [];

/** All tool slugs from tools-registry.ts */
const allToolSlugs = [
  "seo-auditor", "competitor-analysis", "indexation-checker", "position-monitor",
  "pseo-generator", "schema-generator", "semantic-core",
  "ai-text-generator", "llm-prompt-helper", "anti-duplicate",
  "webmaster-files", "internal-links",
];

/** All blog post slugs */
const blogSlugs = [
  "chto-takoe-llm-optimizaciya",
  "kak-proverit-citiruet-li-chatgpt-vash-sajt",
  "eeat-dlya-ai-poiska",
  "kak-popast-v-ai-overviews-google",
  "ai-overviews-vs-perplexity-vs-chatgpt",
  "kak-otslezhivat-pozicii-v-ai-vydache",
  "pseo-masshtabirovanie-seo",
  "pseo-dlya-lokalnogo-biznesa",
  "avtomatizaciya-seo-rutiny",
  "schema-org-razmetka-dlya-ai",
  "faq-razmetka-dlya-llm",
  "mikrorazmetka-dlya-internet-magazina",
  "promty-dlya-seo-chatgpt",
  "kak-pisat-teksty-dlya-ai-assistentov",
  "kontent-plan-dlya-ai-vidimosti",
  "chek-list-seo-audita-2025",
  "vnutrennyaya-perelinkoa-dlya-llm",
  "skorost-sajta-core-web-vitals-2025",
];

function urlEntry(loc: string, priority = "0.7", changefreq = "monthly") {
  return `<url><loc>${loc}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`;
}

function wrapUrlset(entries: string[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>`;
}

export default function sitemapPlugin(): Plugin {
  return {
    name: "generate-sitemaps",
    apply: "build",
    generateBundle() {
      const today = new Date().toISOString().split("T")[0];
      const sitemapNames: string[] = [];

      // 1. Static pages sitemap
      const staticUrls = [
        urlEntry(BASE, "1.0", "weekly"),
        urlEntry(`${BASE}/tools`, "0.9", "weekly"),
        urlEntry(`${BASE}/blog`, "0.8", "weekly"),
        urlEntry(`${BASE}/privacy`, "0.3"),
        urlEntry(`${BASE}/terms`, "0.3"),
      ];
      // Add all tool pages
      for (const slug of allToolSlugs) {
        staticUrls.push(urlEntry(`${BASE}/tools/${slug}`, "0.8"));
      }
      this.emitFile({ type: "asset", fileName: "sitemap-pages.xml", source: wrapUrlset(staticUrls) });
      sitemapNames.push("sitemap-pages.xml");

      // 2. Blog sitemap
      const blogUrls = blogSlugs.map(slug => urlEntry(`${BASE}/blog/${slug}`, "0.7"));
      this.emitFile({ type: "asset", fileName: "sitemap-blog.xml", source: wrapUrlset(blogUrls) });
      sitemapNames.push("sitemap-blog.xml");

      // 3. Geo tool pages: /tools/:toolSlug/:regionSlug
      for (const tool of geoEnabledTools) {
        const urls: string[] = [];
        for (const city of cities) {
          urls.push(urlEntry(`${BASE}/tools/${tool}/${city}`, "0.6"));
        }
        const fileName = `sitemap-geo-${tool}.xml`;
        this.emitFile({ type: "asset", fileName, source: wrapUrlset(urls) });
        sitemapNames.push(fileName);
      }

      // 4. Niche geo pages: /:citySlug/:nicheSlug/:toolSlug
      for (const tool of nicheEnabledTools) {
        const urls: string[] = [];
        for (const city of cities) {
          for (const niche of niches) {
            urls.push(urlEntry(`${BASE}/${city}/${niche}/${tool}`, "0.5"));
          }
        }
        const fileName = `sitemap-niche-${tool}.xml`;
        this.emitFile({ type: "asset", fileName, source: wrapUrlset(urls) });
        sitemapNames.push(fileName);
      }

      // Sitemap index
      const indexEntries = sitemapNames
        .map((name) => `<sitemap><loc>${BASE}/${name}</loc><lastmod>${today}</lastmod></sitemap>`)
        .join("\n");
      const indexXml = `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${indexEntries}\n</sitemapindex>`;
      this.emitFile({ type: "asset", fileName: "sitemap.xml", source: indexXml });
    },
  };
}
