import { Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getToolBySlug } from "@/data/tools-registry";
import { getRegionById, getRegionNeighbors } from "@/data/regions";
import { ArrowLeft, MapPin } from "lucide-react";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";
import { ParallaxLayer } from "@/components/ui/parallax-layer";

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
    "address": { "@type": "PostalAddress", "addressLocality": region.name, "addressCountry": "RU" },
    "areaServed": { "@type": "City", "name": region.name },
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <MouseGradient />
      <ClickRipple />
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`https://owndev.ru/tools/${tool.slug}/${region.id}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      <Header />
      <main className="pt-24 pb-16 relative">
        {/* Background animations */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedGrid theme="primary" lineCount={{ h: 5, v: 7 }} />
          <FloatingParticles count={10} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container px-4 md:px-6 relative z-10">
          {/* Breadcrumb */}
          <motion.nav
            className="mb-8 flex items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link to="/tools" className="hover:text-foreground transition-colors">Инструменты</Link>
            <span>/</span>
            <Link to={`/tools/${tool.slug}`} className="hover:text-foreground transition-colors">{tool.name}</Link>
            <span>/</span>
            <span className="text-foreground">{region.name}</span>
          </motion.nav>

          {/* Localized header */}
          <div className="text-center mb-10">
            <motion.div
              className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">{region.name} · {(region.population / 1_000_000).toFixed(1)}M жителей</span>
            </motion.div>
            <motion.h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {tool.name} в <span className="text-gradient">{region.nameCase}</span>
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {tool.shortDesc}
            </motion.p>
          </div>

          {/* Stats bar */}
          <ParallaxLayer speed={0.15}>
          <motion.div
            className="flex flex-wrap gap-6 justify-center mb-10"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
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
          </motion.div>
          </ParallaxLayer>

          {/* Local content */}
          <motion.div
            className="max-w-3xl mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {region.localText.split("\n").map((paragraph, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed mb-4">{paragraph}</p>
            ))}
          </motion.div>

          {/* Tool widget */}
          <ParallaxLayer speed={0.2}>
          <motion.div
            className="max-w-[900px] mx-auto mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Suspense fallback={<div className="glass rounded-2xl p-8 text-center text-muted-foreground">Загрузка…</div>}>
              <ToolComponent />
            </Suspense>
          </motion.div>
          </ParallaxLayer>

          {/* CTA */}
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <Link
              to="/#contact"
              className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full text-primary font-semibold hover:border-primary/40 transition-colors"
            >
              Получить аудит для {region.name} →
            </Link>
          </motion.div>

          {/* Interlinking */}
          {neighbors.length > 0 && (
            <motion.div
              className="max-w-3xl mx-auto"
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
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
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GeoToolPage;
