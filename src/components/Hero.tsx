import { Button } from "@/components/ui/button";
import { ArrowRight, Code2, Search, Rocket } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(174_72%_56%/0.15),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(262_83%_58%/0.1),transparent_50%)]" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/15 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(222_30%_18%/0.3)_1px,transparent_1px),linear-gradient(90deg,hsl(222_30%_18%/0.3)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="glass px-4 py-2 rounded-full flex items-center gap-2 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground font-mono">Создаём цифровое будущее</span>
          </div>
          
          {/* Main heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            <span className="text-gradient">OWNDEV</span>
          </h1>
          
          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
            SEO оптимизация и разработка <span className="text-foreground font-medium">SaaS решений</span>, платформ и приложений мирового уровня
          </p>
          
          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            <Button variant="hero" size="xl">
              Начать проект
              <ArrowRight className="ml-2" />
            </Button>
            <Button variant="glass" size="xl">
              Наши работы
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 md:gap-16 pt-12 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient">150+</div>
              <div className="text-sm text-muted-foreground mt-1">Проектов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient">98%</div>
              <div className="text-sm text-muted-foreground mt-1">Клиентов в ТОП</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient">5 лет</div>
              <div className="text-sm text-muted-foreground mt-1">Опыта</div>
            </div>
          </div>
        </div>
        
        {/* Floating icons */}
        <div className="absolute top-1/3 left-10 hidden lg:block animate-float">
          <div className="glass p-4 rounded-2xl">
            <Search className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="absolute top-1/2 right-10 hidden lg:block animate-float" style={{ animationDelay: '2s' }}>
          <div className="glass p-4 rounded-2xl">
            <Code2 className="w-8 h-8 text-secondary" />
          </div>
        </div>
        <div className="absolute bottom-1/3 left-20 hidden lg:block animate-float" style={{ animationDelay: '4s' }}>
          <div className="glass p-4 rounded-2xl">
            <Rocket className="w-8 h-8 text-primary" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
