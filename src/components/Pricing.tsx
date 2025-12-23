import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Check } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { AnimatedText } from "@/components/ui/animated-text";

const Pricing = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const plans = [
    {
      name: "СТАРТАП",
      price: "40,000 - 80,000",
      description: "Landing Page / Лендинг",
      features: [
        "До 5 страниц",
        "Дизайн",
        "Разработка",
        "SEO базовая",
        "Хостинг 1 год",
        "Поддержка 1 мес"
      ],
      recommended: false,
      theme: "accent" as const
    },
    {
      name: "СТАНДАРТ",
      price: "90,000 - 150,000",
      description: "Корпоративный сайт",
      features: [
        "10-15 страниц",
        "Сложный дизайн",
        "Разработка",
        "SEO базовая",
        "Хостинг 1 год",
        "Поддержка 3 мес",
        "Аналитика"
      ],
      recommended: true,
      theme: "primary" as const
    },
    {
      name: "ПРОФИ",
      price: "150,000 - 300,000",
      description: "Интернет-магазин",
      features: [
        "50-100 товаров",
        "Платежные системы",
        "Интеграции",
        "Разработка",
        "SEO расширенная",
        "Поддержка 6 мес",
        "Аналитика"
      ],
      recommended: false,
      theme: "secondary" as const
    },
    {
      name: "ПРЕМИУМ",
      price: "от 300,000",
      description: "SaaS-платформа",
      features: [
        "Всё из Профи",
        "Кастомная система",
        "API интеграции",
        "Масштабирование",
        "Поддержка 1 год",
        "Обучение команды"
      ],
      recommended: false,
      theme: "success" as const
    }
  ];

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(217_91%_60%/0.08),transparent_50%)]" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
            <AnimatedText text="Прозрачная" theme="secondary" wordDelay={150} />
            {" "}
            <span className="text-gradient">
              <AnimatedText text="ценовая модель" theme="primary" wordDelay={150} />
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            <AnimatedText text="Выберите подходящий тариф для вашего бизнеса" theme="accent" wordDelay={60} />
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`relative group ${plan.recommended ? 'scale-105 z-10' : ''}`}
            >
              <GlowingEffect
                theme={plan.theme}
                disabled={false}
                borderWidth={plan.recommended ? 3 : 2}
                spread={plan.recommended ? 40 : 25}
                glow={true}
                blur={plan.recommended ? 12 : 8}
              />
              <div className={`glass rounded-2xl p-6 relative z-10 h-full ${
                plan.recommended 
                  ? 'ring-2 ring-primary shadow-lg shadow-primary/20' 
                  : ''
              }`}>
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="bg-primary text-primary-foreground px-4 py-1.5 rounded-full text-sm font-semibold">
                      Рекомендуем
                    </span>
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-muted-foreground mb-2">{plan.name}</h3>
                  <div className="mb-2">
                    <span className="text-2xl md:text-3xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm"> ₽</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>
                
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="w-4 h-4 text-success flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <GradientButton 
                  variant={plan.recommended ? "default" : "variant"} 
                  className="w-full"
                  size="sm"
                >
                  Выбрать
                </GradientButton>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-12 text-center space-y-2"
        >
          <p className="text-sm text-muted-foreground">
            💡 Стоимость указана без учёта SEO-продвижения
          </p>
          <p className="text-sm text-muted-foreground">
            💡 Дополнительно: SEO от 60,000 ₽/мес, техподдержка от 10,000 ₽/мес
          </p>
          <p className="text-sm text-muted-foreground">
            💡 Кастомные проекты обсуждаются индивидуально
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Pricing;
