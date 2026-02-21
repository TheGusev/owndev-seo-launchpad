import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Code2, Palette, Package, ExternalLink } from "lucide-react";
import { GradientButton } from "@/components/ui/gradient-button";
import { GlowingEffect } from "@/components/ui/glowing-effect";

const services = [
  {
    icon: Palette,
    title: "Под ключ",
    description: "Дизайн + разработка + SEO. Полный цикл от идеи до запуска.",
    features: ["UI/UX дизайн", "Адаптив", "SEO-оптимизация", "Хостинг"],
    theme: "primary" as const,
  },
  {
    icon: Code2,
    title: "Натянем ваш фронт",
    description: "Ваш дизайн — наш backend. Подключим базу, формы, оплату.",
    features: ["Вёрстка макета", "Backend", "Интеграции", "Деплой"],
    theme: "accent" as const,
  },
  {
    icon: Package,
    title: "Аренда решений",
    description: "6+ готовых проектов. Берите платформу и запускайтесь за день.",
    features: ["SaaS-платформы", "Лендинги", "Магазины", "Обновления"],
    theme: "secondary" as const,
  },
];

const projects = [
  { name: "protocro.ru", category: "SaaS", metric: "+240% трафик" },
  { name: "vozmozhnost.shop", category: "E-commerce", metric: "1200 товаров" },
  { name: "clinica-smile.ru", category: "Медицина", metric: "+180% лидов" },
  { name: "logist-pro.ru", category: "Логистика", metric: "ROI 320%" },
  { name: "remont-elite.ru", category: "Строительство", metric: "50 городов" },
  { name: "edu-platform.ru", category: "Образование", metric: "5K студентов" },
];

const WebStudioSection = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="web-studio" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(174_72%_56%_/_0.05),transparent_50%)]" />

      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 font-serif">
            Делаем сайты, которые{" "}
            <span className="text-gradient">продают</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Под ключ, натягиваем ваш фронт, или аренда готовых решений
          </p>
        </motion.div>

        {/* Service Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * i }}
              className="relative group"
            >
              <GlowingEffect
                theme={service.theme}
                disabled={false}
                borderWidth={1}
                spread={20}
                glow={true}
                blur={8}
              />
              <div className="glass rounded-2xl p-6 h-full relative z-10">
                <div className="p-3 rounded-xl bg-card inline-block mb-4">
                  <service.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">{service.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">{service.description}</p>
                <div className="flex flex-wrap gap-2">
                  {service.features.map((f) => (
                    <span key={f} className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground">
                      {f}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Portfolio Grid */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <h3 className="text-xl font-semibold mb-6 text-center font-serif">
            Наши проекты
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-12">
            {projects.map((project) => (
              <div
                key={project.name}
                className="glass rounded-xl p-4 text-center card-hover cursor-default"
              >
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center mx-auto mb-3">
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium truncate">{project.name}</p>
                <p className="text-xs text-muted-foreground">{project.category}</p>
                <p className="text-xs text-primary font-mono mt-1">{project.metric}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <div className="text-center">
          <div className="relative group inline-block">
            <GlowingEffect
              theme="primary"
              disabled={false}
              borderWidth={2}
              spread={25}
              glow={true}
              blur={10}
              proximity={80}
              inactiveZone={0.4}
            />
            <GradientButton size="lg" className="relative z-10" onClick={() => scrollTo("contact")}>
              Заказать сайт
            </GradientButton>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WebStudioSection;
