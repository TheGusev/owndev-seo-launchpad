import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Search, Code2, Sparkles, Bot, Target } from "lucide-react";

const directions = [
  {
    icon: Search,
    title: "SEO-аудит",
    desc: "Title, Description, H1-H6, canonical, robots, скорость, изображения, внутренние ссылки — 18 технических параметров.",
    badge: "18 проверок",
    accent: "text-blue-400 border-blue-500/20 hover:border-blue-500/30 hover:bg-blue-500/5",
  },
  {
    icon: Code2,
    title: "Schema.org разметка",
    desc: "Organization, LocalBusiness, FAQPage, Product, BreadcrumbList — расширенные сниппеты и AI-индексация.",
    badge: "12 типов схем",
    accent: "text-indigo-400 border-indigo-500/20 hover:border-indigo-500/30 hover:bg-indigo-500/5",
  },
  {
    icon: Bot,
    title: "GEO-готовность",
    desc: "llms.txt, E-E-A-T, структура контента, AI-видимость — попадание в ответы ChatGPT, Perplexity, Яндекс Нейро.",
    badge: "NEW 2025",
    pulse: true,
    accent: "text-emerald-400 border-emerald-500/20 hover:border-emerald-500/30 hover:bg-emerald-500/5",
  },
  {
    icon: Target,
    title: "Яндекс.Директ",
    desc: "Семантическое ядро 150+ запросов, минус-слова по категориям, анализ конкурентов — готово к запуску рекламы.",
    badge: "150 ключей",
    accent: "text-pink-400 border-pink-500/20 hover:border-pink-500/30 hover:bg-pink-500/5",
  },
];

const scrollToInput = () => {
  document.getElementById("site-check-input")?.scrollIntoView({ behavior: "smooth" });
  setTimeout(() => {
    (document.querySelector("#site-check-input input") as HTMLInputElement)?.focus();
  }, 600);
};

const ServicesTeaser = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

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
              className={`relative p-5 rounded-2xl bg-card/40 border transition-all duration-300 group ${d.accent}`}
            >
              <div className="flex items-center gap-2 mb-3">
                <d.icon className="w-5 h-5 shrink-0" />
                <span className="text-xs bg-muted/50 px-2 py-0.5 rounded-full text-muted-foreground flex items-center gap-1">
                  {d.pulse && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                  {d.badge}
                </span>
              </div>
              <h3 className="font-semibold text-foreground mb-2 text-sm">{d.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="text-center mt-8"
        >
          <button
            onClick={scrollToInput}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-foreground bg-primary/10 border border-primary/20 hover:bg-primary/20 active:bg-primary/20 transition-all text-sm min-h-[44px]"
          >
            <Sparkles className="w-4 h-4" />
            Проверить сайт →
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default ServicesTeaser;
