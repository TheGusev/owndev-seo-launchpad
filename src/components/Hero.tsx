import { GradientButton } from "@/components/ui/gradient-button";
import { Sparkles, ArrowDown, Search, Users } from "lucide-react";
import { TypeAnimation } from 'react-type-animation';
import { motion } from "framer-motion";
import { SparklesCore } from "@/components/ui/sparkles";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { CornerDecorations } from "@/components/ui/corner-decorations";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { ParallaxLayer } from "@/components/ui/parallax-layer";
import { Link } from "react-router-dom";

const Hero = () => {
  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 snap-section">
      <CornerDecorations size="lg" />
      
      <ParallaxLayer speed={0.3} className="absolute inset-0 z-[3] pointer-events-none">
        <FloatingParticles count={20} className="absolute inset-0" />
      </ParallaxLayer>
      
      <ParallaxLayer speed={0.2} className="absolute inset-0 z-0">
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
      </ParallaxLayer>
      
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background via-background/80 to-transparent z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent z-[1]" />
      
      <ParallaxLayer speed={0.1} className="absolute inset-0 z-[2]">
        <AnimatedGrid lineCount={{ h: 8, v: 10 }} className="opacity-70" theme="primary" />
      </ParallaxLayer>
      
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
            <span className="text-sm text-muted-foreground font-mono">Бесплатные LLM + SEO инструменты</span>
          </motion.div>
          
          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <div className="min-h-[5.5rem] sm:min-h-[4.5rem] md:min-h-[4.5rem] lg:min-h-[5.5rem] flex items-center justify-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight font-serif text-center leading-tight">
                <TypeAnimation
                  sequence={[
                    'SEO‑аудит за секунды',
                    2500,
                    'Schema.org в один клик',
                    2500,
                    'pSEO для вашего бизнеса',
                    2500,
                    'LLM‑оптимизация сайтов',
                    2500,
                  ]}
                  wrapper="span"
                  speed={50}
                  className="text-gradient"
                  repeat={Infinity}
                />
              </h1>
            </div>
            <p className="text-2xl md:text-3xl lg:text-4xl font-semibold text-foreground font-serif">
              бесплатно и без регистрации
            </p>
          </motion.div>
          
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed"
          >
            Набор честных инструментов для SEO, programmatic SEO и оптимизации под AI‑поиск. Без скрытых платежей.
          </motion.p>

          {/* Stats line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-sm text-muted-foreground font-medium"
          >
            7 инструментов &bull; SEO + LLM аудит &bull; Schema · Sitemap · pSEO
          </motion.p>
          
          {/* CTA buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4"
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
              <Link to="/tools">
                <GradientButton size="lg" className="group relative z-10">
                  <Search className="w-5 h-5 mr-2" />
                  Инструменты
                </GradientButton>
              </Link>
            </div>
            <div className="relative group">
              <GlowingEffect
                theme="accent"
                disabled={false}
                borderWidth={2}
                spread={25}
                glow={true}
                blur={10}
                proximity={80}
                inactiveZone={0.4}
              />
              <GradientButton variant="variant" size="lg" className="relative z-10" onClick={() => scrollTo("about")}>
                <Users className="w-5 h-5 mr-2" />
                О нас
              </GradientButton>
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
