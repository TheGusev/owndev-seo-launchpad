import { Suspense } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { tools } from "@/data/tools-registry";
import { regions } from "@/data/regions";
import { niches, getNicheById } from "@/data/niches";
import { GEO_ALLOWED_TOOLS, GEO_BLOCKED_TOOLS } from "@/config/pseoConfig";
import { MapPin } from "lucide-react";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";


const NICHE_ENABLED_SLUGS = [...GEO_ALLOWED_TOOLS, ...GEO_BLOCKED_TOOLS];

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
  const isBlocked = GEO_BLOCKED_TOOLS.includes(tool.slug);
  const canonical = isBlocked
    ? `https://owndev.ru/tools/${tool.slug}`
    : `https://owndev.ru/${citySlug}/${nicheSlug}/${toolSlug}`;

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

  const contentBlock = generateContent(tool.slug, niche, region);

  const sameNicheTools = NICHE_ENABLED_SLUGS
    .filter((s) => s !== tool.slug)
    .map((s) => tools.find((t) => t.slug === s)!)
    .filter(Boolean);

  const otherNiches = niches.filter((n) => n.id !== niche.id).slice(0, 6);

  const otherCities = regions
    .filter((r) => r.id !== region.id && r.population >= 500000)
    .sort((a, b) => b.population - a.population)
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <MouseGradient />
      <ClickRipple />
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={canonical} />
        {isBlocked && <meta name="robots" content="noindex, follow" />}
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={canonical} />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "https://owndev.ru/" },
            { "@type": "ListItem", position: 2, name: "Инструменты", item: "https://owndev.ru/tools" },
            { "@type": "ListItem", position: 3, name: tool.name, item: `https://owndev.ru/tools/${tool.slug}` },
            { "@type": "ListItem", position: 4, name: region.name, item: `https://owndev.ru/tools/${tool.slug}/${region.id}` },
            { "@type": "ListItem", position: 5, name: niche.name, item: canonical },
          ],
        })}</script>
      </Helmet>

      <Header />
      <main className="pt-24 pb-16 relative">
        {/* Background animations */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedGrid theme="accent" lineCount={{ h: 5, v: 7 }} />
          <FloatingParticles count={10} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container px-4 md:px-6 relative z-10">
          {/* Breadcrumb */}
          <motion.nav
            aria-label="Breadcrumb"
            className="mb-8 flex flex-wrap items-center gap-2 text-sm text-muted-foreground"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link to="/tools" className="hover:text-foreground transition-colors">Инструменты</Link>
            <span>/</span>
            <Link to={`/tools/${tool.slug}`} className="hover:text-foreground transition-colors">{tool.name}</Link>
            <span>/</span>
            <span className="text-foreground">{region.name}</span>
            <span>/</span>
            <span className="text-foreground">{niche.name}</span>
          </motion.nav>

          {/* Hero */}
          <div className="text-center mb-10">
            <motion.div
              className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <MapPin className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">
                {region.name} · {niche.name} · {(region.population / 1_000_000).toFixed(1)}M жителей
              </span>
            </motion.div>
            <motion.h1
              className="text-[clamp(2rem,7vw,4.5rem)] font-bold font-serif leading-[1.1] tracking-tight hero-title-animate mb-3"
              initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              {tool.name} для <span className="brand-highlight">{niche.nameCase}</span> в {region.nameCase}
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-[clamp(0.9rem,2.5vw,1.1rem)] leading-relaxed max-w-lg mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {description}
            </motion.p>
          </div>

          {/* Stats */}
          <motion.div
            className="flex flex-wrap gap-4 justify-center mb-10"
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
              <span className="text-muted-foreground">Ниша: </span>
              <span className="font-bold text-foreground">{niche.name}</span>
            </div>
          </motion.div>

          {/* Unique content */}
          <motion.div
            className="max-w-3xl mx-auto mb-12 space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            {contentBlock.map((p, i) => (
              <p key={i} className="text-muted-foreground leading-relaxed">{p}</p>
            ))}
          </motion.div>

          {/* Tool widget */}
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
              Получить аудит для {niche.nameCase} в {region.nameCase} →
            </Link>
          </motion.div>

          {/* Interlinking */}
          <div className="max-w-4xl mx-auto space-y-10">
            {[
              { title: `Другие инструменты для ${niche.nameCase} в ${region.nameCase}`, items: sameNicheTools.map(t => ({ key: t.slug, to: `/${region.id}/${niche.id}/${t.slug}`, label: t.name })) },
              { title: `${tool.name} в ${region.nameCase} — другие ниши`, items: otherNiches.map(n => ({ key: n.id, to: `/${region.id}/${n.id}/${tool.slug}`, label: n.name })) },
              { title: `${tool.name} для ${niche.nameCase} — другие города`, items: otherCities.map(c => ({ key: c.id, to: `/${c.id}/${niche.id}/${tool.slug}`, label: c.name })) },
            ].map((section, sIdx) => (
              <motion.section
                key={sIdx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
              >
                <h2 className="text-lg font-bold font-serif mb-4 text-center">{section.title}</h2>
                <div className="flex flex-wrap justify-center gap-3">
                  {section.items.map((item) => (
                    <Link
                      key={item.key}
                      to={item.to}
                      className="glass px-4 py-2 rounded-full text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </motion.section>
            ))}
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
