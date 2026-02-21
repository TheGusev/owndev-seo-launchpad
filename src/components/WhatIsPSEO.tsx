import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Database, Layout, Zap } from "lucide-react";

const cards = [
  {
    icon: Database,
    title: "База данных",
    description: "Города, товары, услуги — структурированные данные для генерации страниц.",
  },
  {
    icon: Layout,
    title: "Шаблоны страниц",
    description: "Структура URL, H1, H2, FAQ — единый формат для масштабирования.",
  },
  {
    icon: Zap,
    title: "Автоматизация",
    description: "Генерация сотен страниц вместо ручной работы.",
  },
];

const WhatIsPSEO = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section id="what-is-pseo" className="min-h-screen flex items-center py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05),transparent_60%)]" />
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-4">
            Что такое <span className="text-gradient">programmatic SEO</span>?
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Системный подход к созданию сотен оптимизированных страниц
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="glass rounded-2xl p-8 text-center card-hover"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                <card.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-3 font-serif">{card.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{card.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center text-muted-foreground text-lg max-w-3xl mx-auto"
        >
          <span className="text-foreground font-semibold">OWNDDEV</span> — это рабочий стол, где все эти части собираются вместе.
        </motion.p>
      </div>
    </section>
  );
};

export default WhatIsPSEO;
