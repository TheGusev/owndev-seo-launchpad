import { Search, Code, Smartphone, BarChart3, Zap, Shield } from "lucide-react";

const services = [
  {
    icon: Search,
    title: "SEO Оптимизация",
    description: "Комплексное продвижение в поисковых системах. Вывод в ТОП-10 за 3-6 месяцев с гарантией результата.",
    color: "primary" as const,
  },
  {
    icon: Code,
    title: "SaaS Разработка",
    description: "Создание облачных сервисов и платформ под ключ. От MVP до масштабируемых enterprise решений.",
    color: "secondary" as const,
  },
  {
    icon: Smartphone,
    title: "Web & Mobile Apps",
    description: "Разработка современных веб-приложений и кроссплатформенных мобильных решений.",
    color: "primary" as const,
  },
  {
    icon: BarChart3,
    title: "Аналитика",
    description: "Настройка систем аналитики, A/B тестирование и оптимизация конверсии.",
    color: "secondary" as const,
  },
  {
    icon: Zap,
    title: "Performance",
    description: "Оптимизация скорости загрузки и Core Web Vitals для лучшего ранжирования.",
    color: "primary" as const,
  },
  {
    icon: Shield,
    title: "Поддержка",
    description: "Техническая поддержка 24/7, мониторинг и оперативное решение задач.",
    color: "secondary" as const,
  },
];

const Services = () => {
  return (
    <section id="services" className="py-24 relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(262_83%_58%/0.08),transparent_70%)]" />
      
      <div className="container px-4 md:px-6 relative z-10">
        <div className="text-center mb-16">
          <span className="text-primary font-mono text-sm tracking-wider uppercase">Услуги</span>
          <h2 className="text-4xl md:text-5xl font-bold mt-4 mb-6">
            Что мы <span className="text-gradient">создаём</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Полный цикл digital-услуг для вашего бизнеса
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div
              key={service.title}
              className="group gradient-border rounded-2xl p-6 hover:scale-[1.02] transition-all duration-300"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-5 ${
                service.color === 'primary' 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-secondary/10 text-secondary'
              } group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className="w-7 h-7" />
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-foreground">
                {service.title}
              </h3>
              
              <p className="text-muted-foreground leading-relaxed">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
