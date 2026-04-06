import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { tools } from "@/data/tools-registry";
import { ArrowRight, ChevronDown, ChevronUp, Shield, Trophy } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { CornerDecorations } from "@/components/ui/corner-decorations";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";
import { GradientButton } from "@/components/ui/gradient-button";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const FLAGSHIP_SLUG = "site-check";

const TOOL_GROUPS = [
  {
    title: "Аудит и анализ",
    emoji: "🔍",
    slugs: ["seo-auditor", "competitor-analysis", "indexation-checker", "internal-links"],
  },
  {
    title: "AI-видимость и GEO",
    emoji: "🧠",
    slugs: ["brand-tracker", "content-brief", "mcp-server"],
  },
  {
    title: "Генерация и контент",
    emoji: "⚙️",
    slugs: ["pseo-generator", "semantic-core", "ai-text-generator", "schema-generator", "llm-prompt-helper"],
  },
  {
    title: "Утилиты вебмастера",
    emoji: "🛠",
    slugs: ["webmaster-files", "anti-duplicate", "position-monitor"],
    collapsible: true,
  },
];

const getToolBySlug = (slug: string) => tools.find(t => t.slug === slug);

const Tools = () => {
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const flagship = getToolBySlug(FLAGSHIP_SLUG);

  const toggleGroup = (title: string) => {
    setCollapsedGroups(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Helmet>
        <title>Инструменты GEO и AI-ready аудита — бесплатно | OWNDEV</title>
        <meta name="description" content="13 бесплатных инструментов для GEO-аудита, SEO, AI-видимости и конкурентного анализа. SEO Score + LLM Score. Без регистрации." />
        <link rel="canonical" href="https://owndev.ru/tools" />
        <meta property="og:url" content="https://owndev.ru/tools" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Главная", item: "https://owndev.ru/" },
            { "@type": "ListItem", position: 2, name: "Инструменты", item: "https://owndev.ru/tools" },
          ],
        })}</script>
      </Helmet>
      <MouseGradient />
      <ClickRipple />
      <Header />
      <main className="pt-24 pb-16 relative">
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedGrid theme="accent" lineCount={{ h: 6, v: 8 }} />
          <FloatingParticles count={12} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container px-4 md:px-6 relative z-10">
          {/* Page header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground font-mono">Все инструменты GEO‑платформы</span>
            </motion.div>
            <motion.h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="text-gradient">15+ инструментов</span> GEO и AI‑ready аудита
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Инструменты для SEO, AI‑видимости и конкурентного анализа
            </motion.p>
          </motion.div>

          {/* Section 1 — Flagship */}
          {flagship && (
            <motion.section
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="mb-12"
            >
              <Link to="/tools/site-check" className="block glass rounded-2xl p-8 md:p-10 border border-primary/30 hover:border-primary/60 transition-all group">
                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                    <flagship.icon className="w-7 h-7 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl md:text-3xl font-bold font-serif text-foreground group-hover:text-primary transition-colors">
                        {flagship.name}
                      </h2>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        <Shield className="w-3 h-3" />
                        <Trophy className="w-3 h-3" /> GEO‑аудит
                      </span>
                    </div>
                    <p className="text-muted-foreground text-lg">
                      SEO Score + LLM Score, топ-10 конкурентов, 200+ ключей, E‑E‑A‑T, Schema и экспорт
                    </p>
                  </div>
                  <GradientButton size="lg" className="shrink-0">
                    Начать проверку
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </GradientButton>
                </div>
              </Link>
            </motion.section>
          )}

          {/* Section 2 — Technical tools */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="mb-12"
          >
            <h2 className="text-xl md:text-2xl font-bold font-serif text-foreground mb-5">Технические инструменты</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {technicalTools.map((tool, i) => (
                <motion.div
                  key={tool.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <Link to={`/tools/${tool.slug}`} className="glass rounded-2xl p-5 hover:border-primary/40 transition-all group block h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <tool.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                          {tool.name}
                          {tool.slug === "mcp-server" && (
                            <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold rounded bg-primary/20 text-primary align-middle">NEW</span>
                          )}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">{tool.shortDesc}</p>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center gap-1 text-sm text-primary font-medium">
                      Открыть
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.section>

          {/* Section 3 — Utility tools (collapsible) */}
          <motion.section
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl md:text-2xl font-bold font-serif text-foreground">
                Вспомогательные утилиты ({utilityTools.length})
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUtils(!showUtils)}
                className="gap-1"
              >
                {showUtils ? "Скрыть" : "Показать все"}
                {showUtils ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </Button>
            </div>

            {showUtils && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {utilityTools.map((tool, i) => (
                  <motion.div
                    key={tool.slug}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.04 }}
                  >
                    <Link to={`/tools/${tool.slug}`} className="glass rounded-2xl p-4 hover:border-primary/40 transition-all group block h-full">
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                          <tool.icon className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground text-sm mb-1 group-hover:text-primary transition-colors">{tool.name}</h3>
                          <p className="text-xs text-muted-foreground line-clamp-2">{tool.shortDesc}</p>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        </div>

        <CornerDecorations size="lg" />
      </main>
      <Footer />
    </div>
  );
};

export default Tools;
