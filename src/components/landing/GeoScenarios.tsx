import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Eye, FileText, Megaphone, BarChart3, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const scenarios = [
  {
    icon: Eye,
    title: "Аудит AI-видимости",
    desc: "Проверьте, видит ли ваш сайт ChatGPT, Perplexity и Яндекс Нейро",
    link: "/tools/site-check",
    accent: "from-cyan-500/20 to-cyan-500/5",
    iconColor: "text-cyan-400",
    borderColor: "border-cyan-500/20 hover:border-cyan-500/40",
  },
  {
    icon: FileText,
    title: "AI-ready контент",
    desc: "Создайте контент, который цитируют нейросети: структура, E-E-A-T, FAQ",
    link: "/tools/content-brief",
    accent: "from-violet-500/20 to-violet-500/5",
    iconColor: "text-violet-400",
    borderColor: "border-violet-500/20 hover:border-violet-500/40",
  },
  {
    icon: Megaphone,
    title: "Присутствие бренда в AI",
    desc: "Узнайте, упоминают ли AI-ассистенты ваш бренд и в каком контексте",
    link: "/tools/brand-tracker",
    accent: "from-emerald-500/20 to-emerald-500/5",
    iconColor: "text-emerald-400",
    borderColor: "border-emerald-500/20 hover:border-emerald-500/40",
  },
  {
    icon: BarChart3,
    title: "Мониторинг GEO-позиций",
    desc: "Отслеживайте динамику SEO Score и LLM Score еженедельно",
    link: "/geo-rating",
    accent: "from-amber-500/20 to-amber-500/5",
    iconColor: "text-amber-400",
    borderColor: "border-amber-500/20 hover:border-amber-500/40",
  },
];

const GeoScenarios = () => {
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
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            GEO-сценарии
          </span>
          <h2 className="text-2xl md:text-3xl font-bold font-serif mb-3">
            4 сценария работы с AI-видимостью
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
            Выберите задачу — получите готовый инструмент и план действий
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {scenarios.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              onClick={() => navigate(s.link)}
              className={`relative p-6 rounded-2xl bg-gradient-to-br ${s.accent} backdrop-blur-sm border ${s.borderColor} transition-all duration-300 group cursor-pointer hover:shadow-lg`}
            >
              <div className={`w-10 h-10 rounded-xl bg-card/60 flex items-center justify-center mb-4 ${s.iconColor}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">{s.desc}</p>
              <span className="inline-flex items-center gap-1 text-sm font-medium text-primary opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                Перейти <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GeoScenarios;
