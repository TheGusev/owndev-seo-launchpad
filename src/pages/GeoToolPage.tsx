import { Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getToolBySlug } from "@/data/tools-registry";
import { getRegionById, getRegionNeighbors } from "@/data/regions";
import { ArrowLeft, MapPin } from "lucide-react";

const GeoToolPage = () => {
  const { toolSlug, regionSlug } = useParams<{ toolSlug: string; regionSlug: string }>();
  const tool = toolSlug ? getToolBySlug(toolSlug) : undefined;
  const region = regionSlug ? getRegionById(regionSlug) : undefined;

  if (!tool || !region) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-serif mb-4">Страница не найдена</h1>
          <Link to="/tools" className="text-primary hover:underline">← Все инструменты</Link>
        </div>
      </div>
    );
  }

  const ToolComponent = tool.component;
  const neighbors = getRegionNeighbors(region);
  const title = `${tool.name} в ${region.nameCase} — цены от ${region.priceRange.split("-")[0]}₽`;
  const description = `${tool.shortDesc} в ${region.nameCase}. ${region.agencies} SEO-агентств, бюджеты ${region.priceRange}₽/мес. Бесплатный инструмент OWNDEV.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    "name": `OWNDEV — ${tool.name}`,
    "description": description,
    "address": {
      "@type": "PostalAddress",
      "addressLocality": region.name,
      "addressCountry": "RU",
    },
    "areaServed": {
      "@type": "City",
      "name": region.name,
    },
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://owndev.ru/tools/${tool.slug}/${region.id}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Header />
      <main className="pt-24 pb-16">
        <div className="container px-4 md:px-6">
          {/* Breadcrumb */}
          <nav className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/tools" className="hover:text-foreground transition-colors">Инструменты</Link>
            <span>/</span>
            <Link to={`/tools/${tool.slug}`} className="hover:text-foreground transition-colors">{tool.name}</Link>
            <span>/</span>
            <span className="text-foreground">{region.name}</span>
          </nav>

          {/* Localized header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-5">
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">{region.name} · {(region.population / 1_000_000).toFixed(1)}M жителей</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-3">
              {tool.name} в <span className="text-gradient">{region.nameCase}</span>
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{tool.shortDesc}</p>
          </div>

          {/* Stats bar */}
          <div className="flex flex-wrap gap-6 justify-center mb-10">
            <div className="glass px-4 py-2 rounded-full text-sm">
              <span className="text-muted-foreground">Агентств: </span>
              <span className="font-bold text-foreground">{region.agencies}</span>
            </div>
            <div className="glass px-4 py-2 rounded-full text-sm">
              <span className="text-muted-foreground">Бюджеты: </span>
              <span className="font-bold text-foreground">{region.priceRange} ₽/мес</span>
            </div>
            <div className="glass px-4 py-2 rounded-full text-sm">
              <span className="text-muted-foreground">Ниши: </span>
              <span className="font-bold text-foreground">{region.localNiches.slice(0, 3).join(", ")}</span>
            </div>
          </div>

          {/* Local content */}
          <div className="max-w-3xl mx-auto mb-12">
            {region.localText.split("\n").map((paragraph, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed mb-4">{paragraph}</p>
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
              Получить аудит для {region.name} →
            </Link>
          </div>

          {/* Interlinking */}
          {neighbors.length > 0 && (
            <div className="max-w-3xl mx-auto">
              <h2 className="text-xl font-bold font-serif mb-4 text-center">Другие регионы</h2>
              <div className="flex flex-wrap justify-center gap-3">
                {neighbors.map((n) => (
                  <Link
                    key={n.id}
                    to={`/tools/${tool.slug}/${n.id}`}
                    className="glass px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                  >
                    {tool.name} в {n.nameCase}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GeoToolPage;
