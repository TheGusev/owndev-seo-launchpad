import { GradientButton } from "@/components/ui/gradient-button";
import { ArrowRight, CheckCircle, TrendingUp, Shield, Clock } from "lucide-react";
import { TypeAnimation } from 'react-type-animation';
import { motion } from "framer-motion";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import ThreeBackground from "@/components/ui/three-background";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";

const Hero = () => {
  const { ref: statsRef, inView: statsInView } = useInView({ triggerOnce: true, threshold: 0.3 });
  
  const trustItems = [
    { icon: Shield, text: "Гарантия результата" },
    { icon: Clock, text: "6 месяцев поддержки" },
    { icon: TrendingUp, text: "Рост органики 150%+" },
  ];

  const scrollToContact = () => {
    const element = document.getElementById("contact");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToPortfolio = () => {
    const element = document.getElementById("portfolio");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Three.js Animated Background */}
      <ThreeBackground />
      
      {/* Gradient overlay for text readability */}
      <div 
        className="absolute inset-0 z-[1]" 
        style={{
          background: 'linear-gradient(to bottom, rgba(10,11,13,0.3) 0%, rgba(10,11,13,0.7) 50%, rgba(10,11,13,0.9) 100%)'
        }}
      />
      
      {/* Main Content */}
      <div className="container relative z-10 px-4 md:px-6">
        <div className="flex flex-col items-center text-center max-w-[900px] mx-auto">
          
          {/* Floating Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="animate-float-badge mb-8"
          >
            <div className="glass px-5 py-2.5 rounded-full flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-[hsl(var(--color-secondary-01))] rounded-full animate-pulse" />
              <span className="text-sm text-foreground/90 font-medium">🟢 Создаём цифровое будущее</span>
            </div>
          </motion.div>
          
          {/* Main Heading - 01.tech Typography */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mb-6"
          >
            <div className="min-h-[4rem] sm:min-h-[5rem] md:min-h-[6rem] lg:min-h-[7rem] flex items-center justify-center">
              <h1 
                className="text-[clamp(2.5rem,6vw,4.5rem)] font-bold font-serif leading-[1.1]"
                style={{ 
                  color: '#E8E9EA',
                  letterSpacing: '-0.02em'
                }}
              >
                Сайты, которые{" "}
                <TypeAnimation
                  sequence={[
                    'конвертируют.',
                    3000,
                    'продают.',
                    3000,
                    'работают.',
                    3000,
                  ]}
                  wrapper="span"
                  speed={50}
                  className="text-01-cyan"
                  repeat={Infinity}
                />
              </h1>
            </div>
          </motion.div>
          
          {/* Subheading */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="text-2xl md:text-3xl font-semibold text-foreground mb-5 font-serif"
          >
            Разработка, оптимизация, рост 📈
          </motion.p>
          
          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-4 leading-relaxed"
          >
            Мы создаём веб-сайты и SaaS-платформы для малого и среднего бизнеса.
          </motion.p>
          
          {/* Metrics */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.35 }}
            className="text-foreground font-medium mb-10"
          >
            30+ проектов. 5+ млн руб выручки клиентов в год благодаря нам.
          </motion.p>
          
          {/* CTA Buttons - 01.tech Style */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-5"
          >
            <div className="relative group">
              <GlowingEffect
                theme="primary"
                disabled={false}
                borderWidth={2}
                spread={35}
                glow={true}
                blur={15}
                proximity={100}
                inactiveZone={0.3}
              />
              <button
                onClick={scrollToContact}
                className="relative z-10 px-8 py-5 rounded-xl font-semibold text-background transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_hsl(var(--color-primary-01)/0.5)]"
                style={{
                  background: 'linear-gradient(135deg, hsl(var(--color-primary-01)), hsl(var(--color-secondary-01)))'
                }}
              >
                <span className="flex items-center gap-2">
                  Первая консультация — БЕСПЛАТНО
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
            </div>
            
            <div className="relative group">
              <GlowingEffect
                theme="secondary"
                disabled={false}
                borderWidth={2}
                spread={30}
                glow={true}
                blur={12}
                proximity={80}
                inactiveZone={0.4}
              />
              <GradientButton 
                variant="variant" 
                size="xl" 
                className="relative z-10"
                onClick={scrollToPortfolio}
              >
                Смотреть портфолио ↓
              </GradientButton>
            </div>
          </motion.div>
          
          {/* Trust badges */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-wrap justify-center gap-6 pt-10"
          >
            {trustItems.map((item, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-muted-foreground"
              >
                <CheckCircle className="w-5 h-5 text-01-green" />
                <span className="text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </motion.div>
          
          {/* Stats with CountUp */}
          <motion.div 
            ref={statsRef}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-3 gap-8 md:gap-16 pt-10 border-t border-border/50 mt-10"
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
                <div className="text-3xl md:text-4xl font-bold text-01-cyan font-serif">
                  {statsInView && <CountUp end={30} duration={2} suffix="+" />}
                </div>
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
                <div className="text-3xl md:text-4xl font-bold text-01-green font-serif">
                  {statsInView && <CountUp end={150} duration={2} suffix="%" />}
                </div>
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
                <div className="text-3xl md:text-4xl font-bold text-gradient font-serif">
                  {statsInView && <CountUp end={5} duration={2} suffix="+ лет" />}
                </div>
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
        transition={{ delay: 1.2, duration: 0.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
          <motion.div 
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-1.5 h-3 rounded-full mt-2"
            style={{ background: 'hsl(var(--color-primary-01))' }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;