import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { categories, getToolsByCategory } from "@/data/tools-registry";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { CornerDecorations } from "@/components/ui/corner-decorations";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";


const Tools = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Helmet>
        <title>SEO и LLM инструменты — бесплатно | OWNDEV</title>
        <meta name="description" content="12 бесплатных инструментов для SEO-аудита, programmatic SEO, генерации контента и оптимизации под AI-поиск. Без регистрации." />
        <link rel="canonical" href="https://owndev.ru/tools" />
      </Helmet>
      <MouseGradient />
      <ClickRipple />
      <Header />
      <main className="pt-24 pb-16 relative">
        {/* Background animations */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedGrid theme="accent" lineCount={{ h: 6, v: 8 }} />
          <FloatingParticles count={12} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container px-4 md:px-6 relative z-10">
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
              <span className="text-sm text-muted-foreground font-mono">Все инструменты платформы</span>
            </motion.div>
            <motion.h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-4"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <span className="text-gradient">12 инструментов</span> для SEO + LLM
            </motion.h1>
            <motion.p
              className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              Бесплатные инструменты для SEO, programmatic SEO и оптимизации под AI‑поиск
            </motion.p>
          </motion.div>

          {categories.map((cat, catIdx) => {
            const catTools = getToolsByCategory(cat.id);
            if (catTools.length === 0) return null;

            return (
              <ParallaxLayer key={cat.id} speed={0.15}>
              <motion.section
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: catIdx * 0.08 }}
                className="mb-10"
              >
                <div className="flex items-center gap-3 mb-5">
                  <cat.icon className="w-5 h-5 text-primary" />
                  <h2 className="text-xl md:text-2xl font-bold font-serif text-foreground">{cat.name}</h2>
                </div>

                <div className="flex flex-wrap justify-center gap-4">
                  {catTools.map((tool, toolIdx) => (
                    <motion.div
                      key={tool.id}
                      className="w-full sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.75rem)]"
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: toolIdx * 0.06 }}
                    >
                      <Link to={`/tools/${tool.slug}`} className="glass rounded-2xl p-5 hover:border-primary/40 transition-all group min-h-[44px] block h-full">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                            <tool.icon className="w-5 h-5 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{tool.name}</h3>
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
              </ParallaxLayer>
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
