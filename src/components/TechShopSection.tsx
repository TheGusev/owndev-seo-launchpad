import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Cpu, Zap, Bot, Check, ArrowRight } from "lucide-react";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { GradientButton } from "@/components/ui/gradient-button";

const products = [
  {
    icon: Zap,
    name: "AI-контейнер Starter",
    price: "от 15,000 ₽",
    badge: "Популярный",
    badgeColor: "bg-primary/20 text-primary",
    description: "Базовый набор промтов, моделей и автоматизаций для бизнеса",
    features: [
      "5 настроенных AI-моделей",
      "Шаблоны промтов для контента",
      "Интеграция с Telegram",
      "Обновления 3 месяца",
    ],
    theme: "primary" as const,
  },
  {
    icon: Cpu,
    name: "AI-контейнер Pro",
    price: "от 45,000 ₽",
    badge: "Максимум",
    badgeColor: "bg-secondary/20 text-secondary",
    description: "Полная платформа с AI-ассистентами, аналитикой и пожизненными обновлениями",
    features: [
      "15+ AI-моделей и агентов",
      "CRM + аналитика",
      "Голосовые ассистенты",
      "Пожизненные обновления",
    ],
    theme: "secondary" as const,
  },
  {
    icon: Bot,
    name: "Робот-ассистент",
    price: "Предзаказ",
    badge: "Скоро",
    badgeColor: "bg-accent/20 text-accent",
    description: "Физический AI-ассистент для офиса. Встречает клиентов, отвечает на вопросы",
    features: [
      "Распознавание речи",
      "Навигация по помещению",
      "Интеграция с CRM",
      "Запуск Q2 2026",
    ],
    theme: "accent" as const,
  },
];

const TechShopSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  return (
    <section id="tech-shop" className="py-24 md:py-32 relative overflow-hidden min-h-screen snap-section">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(262_83%_58%_/_0.04),transparent_60%)]" />

      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Магазин{" "}
            <span className="text-gradient">технологий будущего</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Умные контейнеры с AI, роботы и платформы с пожизненными обновлениями
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {products.map((product, i) => (
            <motion.div
              key={product.name}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.12 * i }}
              className="relative group"
              style={{ perspective: "800px" }}
            >
              <GlowingEffect
                theme={product.theme}
                disabled={false}
                borderWidth={1}
                spread={20}
                glow={true}
                blur={8}
              />
              <div className="glass rounded-2xl p-6 h-full relative z-10 transition-transform duration-500 group-hover:[transform:rotateY(2deg)_rotateX(1deg)]">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-card">
                    <product.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${product.badgeColor}`}>
                    {product.badge}
                  </span>
                </div>

                <h3 className="text-xl font-bold mb-1">{product.name}</h3>
                <p className="text-primary font-mono font-bold text-lg mb-3">{product.price}</p>
                <p className="text-muted-foreground text-sm mb-5">{product.description}</p>

                <ul className="space-y-2.5">
                  {product.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <a
            href="https://t.me/The_Suppor_t?text=Хочу узнать про AI-контейнеры"
            target="_blank"
            rel="noopener noreferrer"
          >
            <GradientButton variant="variant" size="lg">
              Узнать подробнее
              <ArrowRight className="w-4 h-4 ml-2" />
            </GradientButton>
          </a>
        </div>
      </div>
    </section>
  );
};

export default TechShopSection;
