import { type Plugin } from "vite";

const BASE = "https://owndev.ru";

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

const niches = [
  "saas","lokalnye-uslugi","ecommerce","b2b","nedvizhimost","avto",
  "medicina","obrazovanie","finansy","stroitelstvo","it-razrabotka",
  "marketing","hr","logistika","turizm","restorany","sport","krasota",
  "deti","zhivotnye",
];

const nicheTools = [
  "pseo-generator","anti-duplicate","ai-citation","roi-calculator","geo-map",
];

function urlEntry(loc: string, priority = "0.7") {
  return `<url><loc>${loc}</loc><changefreq>monthly</changefreq><priority>${priority}</priority></url>`;
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

      // Static pages sitemap
      const staticUrls = [
        urlEntry(BASE, "1.0"),
        urlEntry(`${BASE}/tools`, "0.9"),
        urlEntry(`${BASE}/privacy`, "0.3"),
        urlEntry(`${BASE}/terms`, "0.3"),
      ];
      this.emitFile({ type: "asset", fileName: "sitemap-pages.xml", source: wrapUrlset(staticUrls) });

      // Per-tool geo sitemaps
      const sitemapNames: string[] = ["sitemap-pages.xml"];
      for (const tool of nicheTools) {
        const urls: string[] = [];
        // Tool base page
        urls.push(urlEntry(`${BASE}/tools/${tool}`, "0.8"));
        for (const city of cities) {
          for (const niche of niches) {
            urls.push(urlEntry(`${BASE}/${city}/${niche}/${tool}`));
          }
        }
        const fileName = `sitemap-geo-${tool}.xml`;
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
