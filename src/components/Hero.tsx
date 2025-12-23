import { GradientButton } from "@/components/ui/gradient-button";
import { ArrowRight, CheckCircle, TrendingUp, Shield, Clock } from "lucide-react";
import { TypeAnimation } from 'react-type-animation';
import { motion } from "framer-motion";
import { SparklesCore } from "@/components/ui/sparkles";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { AnimatedText } from "@/components/ui/animated-text";
import { CornerDecorations } from "@/components/ui/corner-decorations";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { AnimatedGrid } from "@/components/ui/animated-grid";

const Hero = () => {
  const trustItems = [
    { icon: Shield, text: "Гарантия результата" },
    { icon: Clock, text: "6 месяцев поддержки" },
    { icon: TrendingUp, text: "Рост органики 150%+" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Corner Decorations */}
      <CornerDecorations size="lg" />
      
      {/* Floating Particles */}
      <FloatingParticles count={20} className="absolute inset-0 z-[3] pointer-events-none" />
      
      {/* Sparkles Background */}
      <div className="absolute inset-0 z-0">
        <SparklesCore
          id="hero-sparkles"
          background="transparent"
          particleColor="#3dd9c3"
          particleDensity={80}
          minSize={1}
          maxSize={2}
          speed={2}
          className="w-full h-full"
        />
      </div>
      
      {/* Gradient overlays for depth */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background via-background/80 to-transparent z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent z-[1]" />
      
      {/* Animated SVG Grid */}
      <AnimatedGrid lineCount={{ h: 8, v: 10 }} className="z-[2] opacity-70" theme="primary" />
      
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
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight font-serif">
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
            <p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground font-serif">
              <AnimatedText text="Разработка, оптимизация, рост 📈" wordDelay={150} theme="primary" />
            </p>
          </motion.div>
          
          {/* Subheading */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed"
          >
            <AnimatedText 
              text="Мы создаём веб-сайты и SaaS-платформы для малого и среднего бизнеса." 
              wordDelay={80}
              theme="accent"
            />
            <br />
            <span className="text-foreground font-medium inline-block mt-2">
              <AnimatedText 
                text="30+ проектов. 5+ млн руб выручки клиентов в год благодаря нам." 
                wordDelay={80}
                theme="success"
              />
            </span>
          </motion.div>
          
          {/* CTA buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-6"
          >
            <div className="relative group">
              <GlowingEffect
                theme="primary"
                disabled={false}
                borderWidth={2}
                spread={30}
                glow={true}
                blur={12}
                proximity={80}
                inactiveZone={0.4}
              />
              <GradientButton size="xl" className="group relative z-10">
                Первая консультация — БЕСПЛАТНО
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />
              </GradientButton>
            </div>
            <div className="relative group">
              <GlowingEffect
                theme="secondary"
                disabled={false}
                borderWidth={2}
                spread={25}
                glow={true}
                blur={10}
                proximity={80}
                inactiveZone={0.4}
              />
              <GradientButton variant="variant" size="xl" className="relative z-10">
                Смотреть портфолио ↓
              </GradientButton>
            </div>
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
            <div className="relative group text-center p-4 rounded-xl">
              <GlowingEffect
                theme="primary"
                disabled={false}
                borderWidth={1}
                spread={20}
                glow={true}
                blur={8}
                proximity={60}
                inactiveZone={0.3}
              />
              <div className="relative z-10">
                <div className="text-3xl md:text-4xl font-bold text-gradient font-serif">30+</div>
                <div className="text-sm text-muted-foreground mt-1">Проектов</div>
              </div>
            </div>
            <div className="relative group text-center p-4 rounded-xl">
              <GlowingEffect
                theme="success"
                disabled={false}
                borderWidth={1}
                spread={20}
                glow={true}
                blur={8}
                proximity={60}
                inactiveZone={0.3}
              />
              <div className="relative z-10">
                <div className="text-3xl md:text-4xl font-bold text-gradient font-serif">150%</div>
                <div className="text-sm text-muted-foreground mt-1">Рост органики</div>
              </div>
            </div>
            <div className="relative group text-center p-4 rounded-xl">
              <GlowingEffect
                theme="accent"
                disabled={false}
                borderWidth={1}
                spread={20}
                glow={true}
                blur={8}
                proximity={60}
                inactiveZone={0.3}
              />
              <div className="relative z-10">
                <div className="text-3xl md:text-4xl font-bold text-gradient font-serif">5+ лет</div>
                <div className="text-sm text-muted-foreground mt-1">Опыта</div>
              </div>
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
