import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { tools, type ToolDef } from "@/data/tools-registry";
import { ArrowRight, ChevronDown, ChevronUp, Trophy, Star } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { CornerDecorations } from "@/components/ui/corner-decorations";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const FLAGSHIP_SLUG = "site-check";
const FORMULA_SLUG = "site-formula";

const TOOL_GROUPS = [
  {
    title: "Флагманский аудит",
    emoji: "🚀",
    slugs: ["full-audit"],
  },
  {
    title: "Аудит и анализ",
    emoji: "🔍",
    slugs: ["marketplace-audit", "seo-auditor", "competitor-analysis", "indexation-checker", "internal-links"],
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
        <meta name="description" content="15+ бесплатных инструментов для GEO-аудита, SEO, AI-видимости и конкурентного анализа. SEO Score + LLM Score. Без регистрации." />
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
            <motion.a
              href="https://dialogs.yandex.ru/store/skills/owndev-seo-audit"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="inline-flex items-center gap-2 mt-5 px-4 py-2 rounded-full border border-[#7B68EE]/40 bg-[#7B68EE]/10 text-[#7B68EE] text-sm hover:bg-[#7B68EE]/20 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z" />
              </svg>
              Скажите Алисе: «Запусти OWNDEV»
            </motion.a>
          </motion.div>

          {/* Flagship section — unified grid (same card size as below, but with stronger border + glow + Флагман badge) */}
          {(() => {
            const formula = getToolBySlug(FORMULA_SLUG);
            const flagshipCards = [
              flagship && {
                tool: flagship,
                href: "/tools/site-check",
                accent: "primary" as const,
                tagline: "SEO Score + LLM Score, топ-10 конкурентов, 200+ ключей, E‑E‑A‑T, Schema и экспорт",
              },
              formula && {
                tool: formula,
                href: "/site-formula",
                accent: "violet" as const,
                tagline: formula.shortDesc,
              },
            ].filter(Boolean) as Array<{ tool: ToolDef; href: string; accent: "primary" | "violet"; tagline: string }>;
            if (flagshipCards.length === 0) return null;
            return (
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl md:text-2xl font-bold font-serif text-foreground">
                    ⭐ Флагманские инструменты ({flagshipCards.length})
                  </h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {flagshipCards.map((card, i) => {
                    const isPrimary = card.accent === "primary";
                    const borderClass = isPrimary ? "border-primary/40 hover:border-primary/70" : "border-violet-500/40 hover:border-violet-500/70";
                    const glowStyle = isPrimary
                      ? { boxShadow: "0 0 28px -14px hsl(var(--primary) / 0.7)" }
                      : { boxShadow: "0 0 28px -14px hsl(270 80% 60% / 0.7)" };
                    const iconBg = isPrimary ? "bg-primary/10" : "bg-violet-500/10";
                    const iconColor = isPrimary ? "text-primary" : "text-violet-400";
                    const titleHover = isPrimary ? "group-hover:text-primary" : "group-hover:text-violet-400";
                    const linkColor = isPrimary ? "text-primary" : "text-violet-400";
                    const badgeBg = isPrimary ? "bg-primary/10 text-primary" : "bg-violet-500/15 text-violet-400";
                    return (
                      <motion.div
                        key={card.tool.slug}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                      >
                        <Link
                          to={card.href}
                          style={glowStyle}
                          className={`glass rounded-2xl p-5 transition-all group block h-full border ${borderClass}`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
                              <card.tool.icon className={`w-5 h-5 ${iconColor}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <Trophy className={`w-3.5 h-3.5 ${iconColor} shrink-0`} />
                                <h3 className={`font-semibold text-foreground transition-colors ${titleHover}`}>
                                  {card.tool.name}
                                </h3>
                                <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide ${badgeBg}`}>
                                  <Star className="w-2.5 h-2.5" /> Флагман
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground line-clamp-2">{card.tagline}</p>
                            </div>
                          </div>
                          <div className={`mt-4 flex items-center gap-1 text-sm font-medium ${linkColor}`}>
                            Открыть
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.section>
            );
          })()}

          {/* Grouped sections */}
          {TOOL_GROUPS.map((group) => {
            const groupTools = group.slugs.map(getToolBySlug).filter(Boolean) as typeof tools;
            const isCollapsed = group.collapsible && collapsedGroups[group.title];

            return (
              <motion.section
                key={group.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-xl md:text-2xl font-bold font-serif text-foreground">
                    {group.emoji} {group.title} ({groupTools.length})
                  </h2>
                  {group.collapsible && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroup(group.title)}
                      className="gap-1"
                    >
                      {isCollapsed ? "Показать все" : "Скрыть"}
                      {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                    </Button>
                  )}
                </div>

                {!isCollapsed && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupTools.map((tool, i) => (
                      <motion.div
                        key={tool.slug}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.4, delay: i * 0.06 }}
                      >
                        <Link to={tool.customPath || `/tools/${tool.slug}`} className="glass rounded-2xl p-5 hover:border-primary/40 transition-all group block h-full">
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
                              {tool.slug === "marketplace-audit" && (
                                <div className="flex gap-2 mt-2">
                                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{color: '#CB11AB', border: '1px solid #CB11AB'}}>WB</span>
                                  <span className="text-xs font-bold px-2 py-0.5 rounded" style={{color: '#005BFF', border: '1px solid #005BFF'}}>OZON</span>
                                </div>
                              )}
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
                )}
              </motion.section>
            );
          })}
        </div>

        <CornerDecorations size="lg" />
      </main>
      <Footer />
    </div>
  );
};

export default Tools;
