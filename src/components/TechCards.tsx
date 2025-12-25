import { motion } from "framer-motion";
import { BarChart3, Shield, LineChart, Lock, Database, Zap } from "lucide-react";
import GlassCard from "./ui/glass-card";

const techCards = [
  {
    icon: BarChart3,
    title: "Аналитика и отчётность",
    description: "Подключаем Яндекс.Метрику, Google Analytics и настраиваем детальные отчёты для отслеживания эффективности.",
    features: [
      { icon: LineChart, text: "Тепловые карты и воронки" },
      { icon: Zap, text: "A/B тестирование" },
      { icon: Database, text: "Интеграция с CRM" },
    ],
  },
  {
    icon: Shield,
    title: "Безопасность и защита",
    description: "SSL-сертификаты, защита от DDoS-атак, регулярные бэкапы и мониторинг безопасности 24/7.",
    features: [
      { icon: Lock, text: "SSL-шифрование" },
      { icon: Shield, text: "Защита от DDoS" },
      { icon: Database, text: "Автоматические бэкапы" },
    ],
  },
];

const TechCards = () => {
  return (
    <section className="py-24 relative">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-background" />
      
      <div className="container relative z-10 px-4 md:px-6">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Технологии и{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-primary">
              надёжность
            </span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Используем проверенные решения для максимальной производительности и безопасности
          </p>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {techCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <GlassCard key={card.title} index={index} className="p-8">
                {/* Icon */}
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6 border border-white/10">
                  <Icon className="w-7 h-7 text-primary" />
                </div>

                {/* Title */}
                <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-3">
                  {card.title}
                </h3>

                {/* Description */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                  {card.description}
                </p>

                {/* Features list */}
                <div className="space-y-3">
                  {card.features.map((feature) => {
                    const FeatureIcon = feature.icon;
                    return (
                      <div
                        key={feature.text}
                        className="flex items-center gap-3 text-sm text-muted-foreground"
                      >
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                          <FeatureIcon className="w-4 h-4 text-primary/80" />
                        </div>
                        <span>{feature.text}</span>
                      </div>
                    );
                  })}
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default TechCards;
