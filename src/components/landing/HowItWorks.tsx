import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Globe, Zap, FileText } from "lucide-react";
import { NeuralNetworkBg } from "@/components/ui/neural-network-bg";
import { ScanLine } from "@/components/ui/scan-line";
import { TypingCodeBlock } from "@/components/ui/typing-code-block";

const steps = [
  { num: "01", icon: Globe, title: "Введите URL сайта", desc: "Вставьте адрес любого сайта — своего или конкурента. Мы запустим анализ немедленно." },
  { num: "02", icon: Zap, title: "Ждите 2 минуты", desc: "Наш сканер обходит страницу, анализирует код, проверяет конкурентов и генерирует рекомендации." },
  { num: "03", icon: FileText, title: "Получите отчёт", desc: "Полный PDF или Word с оценками, планом исправления, ключевыми словами и анализом конкурентов." },
];

const HowItWorks = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section className="py-12 md:py-20 relative overflow-hidden">
      <NeuralNetworkBg className="z-0" density="low" opacity={0.55} />
      <ScanLine className="z-[1]" duration={9} />
      <div className="container px-4 md:px-6 max-w-4xl mx-auto relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 16 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-bold font-serif mb-3">Как получить отчёт</h2>
          <p className="text-sm text-muted-foreground">3 шага — и у вас полный аудит с планом исправления</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-8 left-[calc(16.67%+2rem)] right-[calc(16.67%+2rem)] h-px bg-gradient-to-r from-primary/30 via-primary/50 to-primary/30" />

          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: 0.15 * i }}
              className="flex flex-col items-center text-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-2xl font-bold relative z-10 bg-background">
                {step.num}
              </div>
              <div>
                <h3 className="text-foreground font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-10 flex justify-center">
          <TypingCodeBlock
            variant="inline"
            loop
            speed={32}
            lineDelay={350}
            lines={[
              "owndev scan https://yoursite.ru",
              "→ crawling pages... ✓",
              "→ analyzing schema.org... ✓",
              "→ generating report... ✓ done",
            ]}
          />
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
