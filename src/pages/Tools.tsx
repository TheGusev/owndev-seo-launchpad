import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { categories, getToolsByCategory } from "@/data/tools-registry";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const Tools = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container px-4 md:px-6">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-5">
              <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-sm text-muted-foreground font-mono">Все инструменты платформы</span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-4">
              <span className="text-gradient">12 инструментов</span> для SEO + LLM
            </h1>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Бесплатные инструменты для SEO, programmatic SEO и оптимизации под AI‑поиск
            </p>
          </div>

          {categories.map((cat, catIdx) => {
            const catTools = getToolsByCategory(cat.id);
            if (catTools.length === 0) return null;

            return (
              <motion.section
                key={cat.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: catIdx * 0.05 }}
                className="mb-10"
              >
                <div className="flex items-center gap-3 mb-5">
                  <cat.icon className="w-5 h-5 text-primary" />
                  <h2 className="text-xl md:text-2xl font-bold font-serif text-foreground">{cat.name}</h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catTools.map((tool) => (
                    <Link key={tool.id} to={`/tools/${tool.slug}`} className="glass rounded-2xl p-5 hover:border-primary/40 transition-all group min-h-[44px]">
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
                  ))}
                </div>
              </motion.section>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Tools;
