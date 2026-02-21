import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Sparkles, Shield, Bot, Calculator, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const tools = [
  {
    icon: Sparkles,
    name: "pSEO Generator",
    description: "Массовая генерация GEO‑страниц для городов и ниш",
    slug: "pseo-generator",
    theme: "primary" as const,
  },
  {
    icon: Shield,
    name: "Anti‑Duplicate Checker",
    description: "Проверка текста на шаблонность и риск деиндексации",
    slug: "anti-duplicate",
    theme: "destructive" as const,
  },
  {
    icon: Bot,
    name: "AI Citation Checker",
    description: "Готовность к Perplexity, ChatGPT и AI‑обзорам",
    slug: "ai-citation",
    theme: "accent" as const,
  },
  {
    icon: Calculator,
    name: "ROI Calculator",
    description: "Прогноз трафика, лидов и окупаемости pSEO‑проекта",
    slug: "roi-calculator",
    theme: "success" as const,
  },
  {
    icon: MapPin,
    name: "GEO Coverage Map",
    description: "Планирование охвата городов России для pSEO",
    slug: "geo-map",
    theme: "secondary" as const,
  },
];

const ToolsShowcase = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="tools-showcase" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(217_91%_60%_/_0.05),transparent_50%)]" />

      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Бесплатные{" "}
            <span className="text-gradient">SEO‑инструменты</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            5 профессиональных инструментов для programmatic SEO
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {tools.map((tool, i) => (
            <motion.div
              key={tool.slug}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.08 * i }}
              className="relative group"
            >
              <GlowingEffect
                theme={tool.theme}
                disabled={false}
                borderWidth={1}
                spread={15}
                glow={true}
                blur={6}
              />
              <Link
                to={`/tools/${tool.slug}`}
                className="glass rounded-2xl p-6 flex flex-col h-full relative z-10 card-hover block"
              >
                <div className="p-3 rounded-xl bg-card inline-block mb-4 self-start">
                  <tool.icon className="w-5 h-5 text-primary" />
                </div>
                <h3 className="text-lg font-bold mb-2">{tool.name}</h3>
                <p className="text-muted-foreground text-sm mb-4 flex-1">{tool.description}</p>
                <span className="text-primary text-sm font-medium">
                  Открыть →
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Link
            to="/tools"
            className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full text-primary font-semibold hover:border-primary/40 transition-colors"
          >
            Все 20 инструментов →
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ToolsShowcase;
