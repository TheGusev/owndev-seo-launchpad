import { GradientButton } from "@/components/ui/gradient-button";
import { Search, ArrowRight } from "lucide-react";
import { TypeAnimation } from 'react-type-animation';
import { motion } from "framer-motion";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { CornerDecorations } from "@/components/ui/corner-decorations";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { saveLastUrl } from "@/utils/lastUrl";

const Hero = () => {
  const [url, setUrl] = useState("");
  const navigate = useNavigate();

  const handleQuickCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    saveLastUrl(trimmed);
    navigate(`/tools/site-check?url=${encodeURIComponent(trimmed)}`);
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20 snap-section">
      <CornerDecorations size="lg" />
      
      <FloatingParticles count={10} className="absolute inset-0 z-[3] pointer-events-none" />
      
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.08),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(var(--accent)/0.06),transparent_50%)]" />
      </div>
      
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-background via-background/80 to-transparent z-[1]" />
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent z-[1]" />
      
      <AnimatedGrid lineCount={{ h: 8, v: 10 }} className="absolute inset-0 z-[2] opacity-70" theme="primary" />
      
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
            <span className="text-sm text-muted-foreground font-mono">✦ Первый GEO-аудитор в Рунете</span>
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
                    'SEO Score + LLM Score',
                    2500,
                    'GEO‑аудит за 60 секунд',
                    2500,
                    'AI‑ready проверка сайта',
                    2500,
                    'llms.txt — новый стандарт',
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
              первый двойной аудит в Рунете
            </p>
          </motion.div>
          
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed"
          >
            Проверяем сайт сразу по двум слоям — классическое SEO и готовность к AI‑выдаче в ChatGPT, Яндекс Нейро и Perplexity. SEO Score + LLM Score в одном отчёте.
          </motion.p>

          {/* Stats line */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.25 }}
            className="text-sm text-muted-foreground font-medium"
          >
            SEO Score + LLM Score &bull; 200+ ключей &bull; Топ-10 конкурентов &bull; Экспорт
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
              <Link to="/tools/site-check">
                <GradientButton size="lg" className="group relative z-10">
                  <Search className="w-5 h-5 mr-2" />
                  Проверить сайт бесплатно
                </GradientButton>
              </Link>
            </div>
            <Link to="/tools/site-check">
              <Button variant="outline" size="lg">
                Смотреть пример отчёта
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>

          {/* Quick URL input */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            onSubmit={handleQuickCheck}
            className="flex w-full max-w-xl gap-2"
          >
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://ваш-сайт.ru"
              className="flex-1 h-12 rounded-xl border border-border bg-card/60 backdrop-blur-xl px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
            />
            <Button type="submit" variant="default" size="lg" className="shrink-0">
              Проверить
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </motion.form>
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
