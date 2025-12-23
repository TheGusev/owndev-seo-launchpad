import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Search, Code, Rocket, TrendingUp, ArrowDown } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const Process = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const steps = [
    {
      number: "01",
      icon: Search,
      title: "ДИАГНОСТИКА",
      duration: "неделя 1",
      items: [
        "Анализ вашего бизнеса, конкурентов, аудитории",
        "Выявляем «узкие места» и возможности роста",
        "Первая консультация + техническое задание"
      ],
      color: "from-primary/20 to-primary/5",
      theme: "primary" as const
    },
    {
      number: "02",
      icon: Code,
      title: "РАЗРАБОТКА",
      duration: "недели 2-6",
      items: [
        "Дизайн сайта с высокой конверсией",
        "Разработка на современном стеке",
        "Оптимизация скорости загрузки (< 2 сек)"
      ],
      color: "from-accent/20 to-accent/5",
      theme: "accent" as const
    },
    {
      number: "03",
      icon: Rocket,
      title: "ЗАПУСК И SEO",
      duration: "неделя 7",
      items: [
        "Развертывание на хостинге",
        "Настройка поисковой оптимизации",
        "Подключение аналитики"
      ],
      color: "from-secondary/20 to-secondary/5",
      theme: "secondary" as const
    },
    {
      number: "04",
      icon: TrendingUp,
      title: "РОСТ",
      duration: "месяцы 2-6",
      items: [
        "Техподдержка и доработки (бесплатно)",
        "Месячные отчеты с метриками",
        "Непрерывное улучшение на основе данных"
      ],
      color: "from-success/20 to-success/5",
      theme: "success" as const
    }
  ];

  return (
    <section id="process" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-muted/20 to-background" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
            Процесс за <span className="text-gradient">4 шага</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Прозрачный и понятный процесс от первой встречи до результата
          </p>
        </motion.div>

        <div ref={ref} className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: index % 2 === 0 ? -30 : 30 }}
              animate={inView ? { opacity: 1, x: 0 } : {}}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="relative"
            >
              <div className="relative group mb-8">
                <GlowingEffect
                  theme={step.theme}
                  disabled={false}
                  borderWidth={2}
                  spread={40}
                  glow={true}
                  blur={10}
                />
                <div className={`glass rounded-2xl p-6 md:p-8 bg-gradient-to-br ${step.color} card-hover relative z-10`}>
                  <div className="flex flex-col md:flex-row md:items-start gap-6">
                    {/* Number and Icon */}
                    <div className="flex items-center gap-4">
                      <span className="text-5xl font-bold text-muted-foreground/30">{step.number}</span>
                      <div className="glass p-4 rounded-xl">
                        <step.icon className="w-8 h-8 text-primary" />
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3 mb-4">
                        <h3 className="text-xl md:text-2xl font-bold">{step.title}</h3>
                        <span className="glass px-3 py-1 rounded-full text-sm text-primary font-mono">
                          {step.duration}
                        </span>
                      </div>
                      <ul className="space-y-2">
                        {step.items.map((item, i) => (
                          <li key={i} className="text-muted-foreground flex items-start gap-2">
                            <span className="text-primary mt-1.5">•</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Arrow connector */}
              {index < steps.length - 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={inView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: index * 0.15 + 0.3, duration: 0.3 }}
                  className="flex justify-center mb-4"
                >
                  <ArrowDown className="w-6 h-6 text-primary animate-bounce" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Process;
