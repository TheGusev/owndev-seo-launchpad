import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Globe, Building2, ShoppingCart, Search, Rocket, MessageSquare, Clock, Banknote, Users } from "lucide-react";

import { GlowingEffect } from "@/components/ui/glowing-effect";
import { ParallaxLayer } from "@/components/ui/parallax-layer";

const Capabilities = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const services = [
    {
      icon: Globe,
      title: "Landing Page / Лендинг",
      goal: "Продажи, лиды, регистрация",
      duration: "5 дней",
      price: "от 40,000 ₽",
      audience: "Стартапы, услуги, акции",
      color: "primary"
    },
    {
      icon: Building2,
      title: "Корпоративный сайт",
      goal: "Имидж, информация, контакты",
      duration: "2-3 недели",
      price: "от 90,000 ₽",
      audience: "Компании, агентства, студии",
      color: "accent"
    },
    {
      icon: ShoppingCart,
      title: "Интернет-магазин",
      goal: "E-commerce, продажи товаров",
      duration: "3-4 недели",
      price: "от 120,000 ₽",
      audience: "Розница, товары, услуги",
      color: "secondary"
    },
    {
      icon: Search,
      title: "SEO-оптимизация",
      goal: "Органический трафик, видимость",
      duration: "от 6 месяцев",
      price: "от 60,000 ₽/мес",
      audience: "B2B, услуги, ниши",
      color: "success"
    },
    {
      icon: Rocket,
      title: "SaaS-платформа",
      goal: "Масштабирование, recurring revenue",
      duration: "2-3 месяца",
      price: "от 300,000 ₽",
      audience: "Салоны красоты, клиники, сервис",
      color: "primary"
    },
    {
      icon: MessageSquare,
      title: "Консультация + Аудит",
      goal: "Понять, что нужно вашему бизнесу",
      duration: "1-2 дня",
      price: "БЕСПЛАТНО",
      audience: "Все, кто не знает, с чего начать",
      color: "accent",
      highlight: true
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { border: string; icon: string; badge: string }> = {
      primary: { border: "border-t-primary", icon: "text-primary", badge: "bg-primary/10 text-primary" },
      accent: { border: "border-t-accent", icon: "text-accent", badge: "bg-accent/10 text-accent" },
      secondary: { border: "border-t-secondary", icon: "text-secondary", badge: "bg-secondary/10 text-secondary" },
      success: { border: "border-t-success", icon: "text-success", badge: "bg-success/10 text-success" }
    };
    return colors[color] || colors.primary;
  };

  return (
    <section id="services" className="py-24 relative overflow-hidden">
      <ParallaxLayer speed={0.1} className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(174_72%_56%/0.08),transparent_50%)]" />
      </ParallaxLayer>
      
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Что мы можем{" "}
            <span className="text-gradient">разработать</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Полный цикл digital-услуг для вашего бизнеса
          </p>
        </motion.div>

        <div ref={ref} className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const colorClasses = getColorClasses(service.color);
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="relative group"
              >
                <GlowingEffect
                  theme={service.color as "primary" | "secondary" | "success" | "accent"}
                  disabled={false}
                  borderWidth={2}
                  spread={30}
                  glow={true}
                  blur={8}
                />
                <div className={`glass rounded-2xl p-6 border-t-4 ${colorClasses.border} card-hover relative z-10 h-full ${service.highlight ? 'ring-2 ring-primary/50' : ''}`}>
                  {service.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-semibold">
                        Рекомендуем
                      </span>
                    </div>
                  )}
                  
                  <div className="flex items-start gap-4 mb-4">
                    <div className={`p-3 rounded-xl bg-card ${colorClasses.icon}`}>
                      <service.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">{service.title}</h3>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">🎯 Цель:</span>
                      <span className="text-foreground">{service.goal}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Срок:</span>
                      <span className="text-foreground">{service.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Banknote className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Цена:</span>
                      <span className={`font-semibold ${service.highlight ? 'text-success' : 'text-foreground'}`}>
                        {service.price}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Для:</span>
                      <span className="text-foreground">{service.audience}</span>
                    </div>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Capabilities;
