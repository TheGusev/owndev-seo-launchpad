import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Code2, Sparkles, Bot, Send } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";

const points = [
  { icon: Code2, text: "Делаем сайты и лендинги под ключ" },
  { icon: Sparkles, text: "Запускаем pSEO‑проекты на тысячи страниц" },
  { icon: Bot, text: "Оптимизируем контент под AI‑поиск и LLM‑выдачу" },
];

const AboutSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="about" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(222_47%_10%),transparent_70%)]" />

      <div className="container px-4 md:px-6 relative z-10 max-w-3xl mx-auto">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Нужен не инструмент, а{" "}
            <span className="text-gradient">команда?</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Мы — агенты, которые этим живут. Если нужны не инструменты, а руки — напишите.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="space-y-4 mb-10"
        >
          {points.map((p, i) => (
            <div key={i} className="glass rounded-xl p-4 flex items-center gap-4">
              <div className="p-2.5 rounded-lg bg-primary/10 shrink-0">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-foreground font-medium">{p.text}</span>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center"
        >
          <a href="https://t.me/The_Suppor_t?text=owndev" target="_blank" rel="noopener noreferrer">
            <GradientButton size="lg">
              <Send className="w-5 h-5 mr-2" />
              Написать в Telegram
            </GradientButton>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
