import { Suspense } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { tools } from "@/data/tools-registry";
import { regions } from "@/data/regions";
import { niches, getNicheById } from "@/data/niches";
import { MapPin } from "lucide-react";

const NICHE_ENABLED_SLUGS = ["pseo-generator", "anti-duplicate", "ai-citation", "roi-calculator", "geo-map"];

const GeoNicheToolPage = () => {
  const { citySlug, nicheSlug, toolSlug } = useParams<{
    citySlug: string;
    nicheSlug: string;
    toolSlug: string;
  }>();

  const region = regions.find((r) => r.id === citySlug);
  const niche = nicheSlug ? getNicheById(nicheSlug) : undefined;
  const tool = tools.find((t) => t.slug === toolSlug && NICHE_ENABLED_SLUGS.includes(t.slug));

  if (!region || !niche || !tool) {
    return <Navigate to="/tools" replace />;
  }

  const ToolComponent = tool.component;

  const title = `${tool.name} для ${niche.nameCase} в ${region.nameCase} — OWNDEV`;
  const description = `${tool.shortDesc} для сферы «${niche.name}» в ${region.nameCase}. ${region.agencies} агентств, бюджеты ${region.priceRange} ₽/мес. Бесплатно.`;
  const canonical = `https://owndev.ru/${region.id}/${niche.id}/${tool.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: `${tool.name} — ${niche.name}`,
    description,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "RUB" },
    areaServed: { "@type": "City", name: region.name },
  };

  // Content templates per tool
  const contentBlock = generateContent(tool.slug, niche, region);

  // Interlinking: same city+niche → other tools
  const sameNicheTools = NICHE_ENABLED_SLUGS
    .filter((s) => s !== tool.slug)
    .map((s) => tools.find((t) => t.slug === s)!)
    .filter(Boolean);

  // Same city+tool → other niches
  const otherNiches = niches.filter((n) => n.id !== niche.id).slice(0, 6);

  // Same niche+tool → other cities
  const otherCities = regions
    .filter((r) => r.id !== region.id && r.population >= 500000)
    .sort((a, b) => b.population - a.population)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Header />
      <main className="pt-24 pb-16">
        <div className="container px-4 md:px-6">
          {/* Breadcrumb */}
          <nav className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Link to="/tools" className="hover:text-foreground transition-colors">Инструменты</Link>
            <span>/</span>
            <Link to={`/tools/${tool.slug}`} className="hover:text-foreground transition-colors">{tool.name}</Link>
            <span>/</span>
            <span className="text-foreground">{region.name}</span>
            <span>/</span>
            <span className="text-foreground">{niche.name}</span>
          </nav>

          {/* Hero */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-5">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">
                {region.name} · {niche.name} · {(region.population / 1_000_000).toFixed(1)}M жителей
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-3">
              {tool.name} для <span className="text-gradient">{niche.nameCase}</span> в {region.nameCase}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{description}</p>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-4 justify-center mb-10">
            <div className="glass px-4 py-2 rounded-full text-sm">
              <span className="text-muted-foreground">Агентств: </span>
              <span className="font-bold text-foreground">{region.agencies}</span>
            </div>
            <div className="glass px-4 py-2 rounded-full text-sm">
              <span className="text-muted-foreground">Бюджеты: </span>
              <span className="font-bold text-foreground">{region.priceRange} ₽/мес</span>
            </div>
            <div className="glass px-4 py-2 rounded-full text-sm">
              <span className="text-muted-foreground">Ниша: </span>
              <span className="font-bold text-foreground">{niche.name}</span>
            </div>
          </div>

          {/* Unique content */}
          <div className="max-w-3xl mx-auto mb-12 space-y-4">
            {contentBlock.map((p, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
            ))}
          </div>

          {/* Tool widget */}
          <div className="max-w-[900px] mx-auto mb-12">
            <Suspense fallback={<div className="glass rounded-2xl p-8 text-center text-muted-foreground">Загрузка…</div>}>
              <ToolComponent />
            </Suspense>
          </div>

          {/* CTA */}
          <div className="text-center mb-16">
            <Link
              to="/#contact"
              className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full text-primary font-semibold hover:border-primary/40 transition-colors"
            >
              Получить аудит для {niche.nameCase} в {region.nameCase} →
            </Link>
          </div>

          {/* Interlinking */}
          <div className="max-w-4xl mx-auto space-y-10">
            {/* Same city+niche, other tools */}
            <section>
              <h2 className="text-lg font-bold font-serif mb-4 text-center">
                Другие инструменты для {niche.nameCase} в {region.nameCase}
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {sameNicheTools.map((t) => (
                  <Link
                    key={t.slug}
                    to={`/${region.id}/${niche.id}/${t.slug}`}
                    className="glass px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {t.name}
                  </Link>
                ))}
              </div>
            </section>

            {/* Same city+tool, other niches */}
            <section>
              <h2 className="text-lg font-bold font-serif mb-4 text-center">
                {tool.name} в {region.nameCase} — другие ниши
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {otherNiches.map((n) => (
                  <Link
                    key={n.id}
                    to={`/${region.id}/${n.id}/${tool.slug}`}
                    className="glass px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {n.name}
                  </Link>
                ))}
              </div>
            </section>

            {/* Same niche+tool, other cities */}
            <section>
              <h2 className="text-lg font-bold font-serif mb-4 text-center">
                {tool.name} для {niche.nameCase} — другие города
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {otherCities.map((c) => (
                  <Link
                    key={c.id}
                    to={`/${c.id}/${niche.id}/${tool.slug}`}
                    className="glass px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

function generateContent(toolSlug: string, niche: { name: string; nameCase: string; description: string }, region: { name: string; nameCase: string; localText: string; agencies: number }): string[] {
  const base = region.localText.split("\n").filter(Boolean);

  const nicheIntro: Record<string, string> = {
    "pseo-generator": `pSEO Generator позволяет за минуты создать сотни уникальных GEO-страниц для сферы ${niche.nameCase} в ${region.nameCase}. Каждая страница получает уникальные Title, H1, H2, FAQ и Schema.org разметку, оптимизированную под ${niche.name.toLowerCase()}.`,
    "anti-duplicate": `Anti-Duplicate Checker анализирует тексты ваших pSEO-страниц в нише «${niche.name}» на шаблонность и риск деиндексации. Особенно важно для ${region.nameCase}, где ${region.agencies} агентств конкурируют за одни и те же запросы.`,
    "ai-citation": `AI Citation Checker оценивает готовность ваших страниц в нише «${niche.name}» к цитированию в Perplexity, ChatGPT и AI-обзорах. В ${region.nameCase} это даёт конкурентное преимущество перед ${region.agencies} агентствами.`,
    "roi-calculator": `ROI Calculator прогнозирует трафик, лиды и окупаемость pSEO-проекта для ${niche.nameCase} в ${region.nameCase}. Учитывает локальную конкуренцию среди ${region.agencies} агентств и средние бюджеты региона.`,
    "geo-map": `GEO Coverage Map помогает спланировать охват городов для pSEO-проекта в нише «${niche.name}». Начиная с ${region.nameCase}, вы можете расширить покрытие на соседние города и регионы.`,
  };

  const nicheBlock = `${niche.description} Programmatic SEO в этой нише позволяет автоматизировать создание посадочных страниц и масштабировать присутствие в поисковой выдаче.`;

  return [
    nicheIntro[toolSlug] || `${niche.name} в ${region.nameCase} — перспективное направление для programmatic SEO.`,
    nicheBlock,
    ...base.slice(0, 1),
  ];
}

export default GeoNicheToolPage;
