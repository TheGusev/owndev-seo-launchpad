import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Smartphone, Zap } from "lucide-react";

const services = [
  {
    icon: Globe,
    title: "Веб-разработка",
    description: "Создаём современные веб-приложения и сайты любой сложности",
  },
  {
    icon: Smartphone,
    title: "Мобильные приложения",
    description: "Разрабатываем нативные и кроссплатформенные приложения",
  },
  {
    icon: Zap,
    title: "Автоматизация",
    description: "Оптимизируем бизнес-процессы с помощью современных технологий",
  },
];

const Services = () => {
  return (
    <section id="services" className="py-24 bg-secondary/30">
      <div className="container mx-auto px-6">
        <h2 className="text-3xl font-bold text-center text-foreground mb-12">
          Услуги
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {services.map((service) => (
            <Card key={service.title} className="bg-card border-border">
              <CardHeader>
                <service.icon className="w-10 h-10 text-primary mb-4" />
                <CardTitle className="text-foreground">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Services;
