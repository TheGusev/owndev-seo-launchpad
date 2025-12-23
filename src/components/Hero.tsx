import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, TrendingUp, Shield, Clock } from "lucide-react";
import { TypeAnimation } from 'react-type-animation';
import { motion } from "framer-motion";

const Hero = () => {
  const trustItems = [
    { icon: Shield, text: "Гарантия результата" },
    { icon: Clock, text: "6 месяцев поддержки" },
    { icon: TrendingUp, text: "Рост органики 150%+" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(174_72%_56%/0.12),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(217_91%_60%/0.08),transparent_50%)]" />
      
      {/* Grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(hsl(222_30%_18%/0.3)_1px,transparent_1px),linear-gradient(90deg,hsl(222_30%_18%/0.3)_1px,transparent_1px)] bg-[size:60px_60px]" />
      
      {/* Floating orbs */}
      <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-[100px] animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/15 rounded-full blur-[120px] animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      
      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-8 max-w-5xl mx-auto">
          {/* Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass px-4 py-2 rounded-full flex items-center gap-2"
          >
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground font-mono">Создаём цифровое будущее</span>
          </motion.div>
          
          {/* Main heading with typewriter */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
              <TypeAnimation
                sequence={[
                  'Сайты, которые продают.',
                  2000,
                  'Сайты, которые конвертируют.',
                  2000,
                  'Сайты, которые работают.',
                  2000,
                ]}
                wrapper="span"
                speed={50}
                className="text-gradient"
                repeat={Infinity}
              />
            </h1>
            <p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground">
              Разработка, оптимизация, рост 📈
            </p>
          </motion.div>
          
          {/* Subheading */}
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed"
          >
            Мы создаём веб-сайты и SaaS-платформы для малого и среднего бизнеса.
            <br />
            <span className="text-foreground font-medium">30+ проектов. 5+ млн руб выручки клиентов в год благодаря нам.</span>
          </motion.p>
          
          {/* CTA buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
          >
            <Button variant="hero" size="xl" className="group">
              Первая консультация — БЕСПЛАТНО
              <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button variant="glass" size="xl">
              Смотреть портфолио ↓
            </Button>
          </motion.div>
          
          {/* Trust badges */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-wrap justify-center gap-6 pt-8"
          >
            {trustItems.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>
          
          {/* Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="grid grid-cols-3 gap-8 md:gap-16 pt-8 border-t border-border/50 mt-8"
          >
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient">30+</div>
              <div className="text-sm text-muted-foreground mt-1">Проектов</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient">150%</div>
              <div className="text-sm text-muted-foreground mt-1">Рост органики</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-gradient">5+ лет</div>
              <div className="text-sm text-muted-foreground mt-1">Опыта</div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Scroll indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <motion.div 
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 bg-primary rounded-full mt-2"
          />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;
