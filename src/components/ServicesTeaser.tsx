import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Search, Code2, Sparkles, Bot, Target, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const directions = [
  {
    icon: Search,
    title: "SEO-аудит",
    desc: "Title, Description, H1-H6, canonical, robots, скорость, изображения, внутренние ссылки — 18 технических параметров.",
    badge: "18 проверок",
    accent: "text-blue-400 border-blue-500/20 hover:border-blue-500/30 hover:bg-blue-500/5",
    link: "/tools/seo-auditor",
  },
  {
    icon: Code2,
    title: "Schema.org разметка",
    desc: "Organization, LocalBusiness, FAQPage, Product, BreadcrumbList — расширенные сниппеты и AI-индексация.",
    badge: "12 типов схем",
    accent: "text-indigo-400 border-indigo-500/20 hover:border-indigo-500/30 hover:bg-indigo-500/5",
    link: "/tools/schema-generator",
  },
  {
    icon: Bot,
    title: "GEO-готовность",
    desc: "llms.txt, E-E-A-T, структура контента, AI-видимость — попадание в ответы ChatGPT, Perplexity, Яндекс Нейро.",
    badge: "NEW 2025",
    pulse: true,
    accent: "text-emerald-400 border-emerald-500/20 hover:border-emerald-500/30 hover:bg-emerald-500/5",
    link: "/geo-audit",
  },
  {
    icon: Target,
    title: "Яндекс.Директ",
    desc: "Семантическое ядро 150+ запросов, минус-слова по категориям, анализ конкурентов — готово к запуску рекламы.",
    badge: "150 ключей",
    accent: "text-pink-400 border-pink-500/20 hover:border-pink-500/30 hover:bg-pink-500/5",
    link: "/tools/site-check",
  },
];

const ServicesTeaser = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const navigate = useNavigate();

  return (
    <section className="py-12 md:py-20 relative">
      <div className="container px-4 md:px-6 max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl md:text-3xl font-bold font-serif mb-3">
            Полный аудит по 4 направлениям
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Каждое направление влияет на трафик, конверсию и попадание в AI-ответы
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {directions.map((d, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              onClick={() => navigate(d.link)}
              className={`relative p-5 rounded-2xl bg-card/40 border transition-all duration-300 group cursor-pointer ${d.accent}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <d.icon className="w-5 h-5 shrink-0" />
                <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                  {d.pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {d.badge}
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm">{d.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed mb-3">{d.desc}</p>
              <span className="inline-flex items-center gap-1 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                Открыть <ArrowRight className="w-3 h-3" />
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesTeaser;
