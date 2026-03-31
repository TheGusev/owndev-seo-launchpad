import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { GlowingEffect } from "@/components/ui/glowing-effect";
import { CornerDecorations } from "@/components/ui/corner-decorations";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { saveLastUrl } from "@/utils/lastUrl";

const trustItems = [
  { icon: "✓", text: "50+ параметров анализа", color: "text-emerald-400" },
  { icon: "✓", text: "Аудит за 2 минуты", color: "text-emerald-400" },
  { icon: "✓", text: "PDF и Word отчёт", color: "text-emerald-400" },
  { icon: "✓", text: "Бесплатно", color: "text-emerald-400" },
  { icon: "✦", text: "GEO + AI-ready", color: "text-primary" },
];

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
            <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground font-mono">#1 GEO и AI-ready аудит в Рунете</span>
          </motion.div>

          {/* H1 */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-4"
          >
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight font-serif leading-tight">
              Ваш сайт не попадает{" "}
              <br className="hidden sm:block" />
              в ответы <span className="text-gradient">нейросетей</span>?
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              OWNDEV анализирует сайт по 50+ параметрам SEO, Schema.org, Яндекс.Директ и AI-готовности.
              Получите полный отчёт с планом исправления за 2 минуты.
            </p>
          </motion.div>

          {/* Trust bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground"
          >
            {trustItems.map((item, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className={item.color}>{item.icon}</span>
                {item.text}
              </span>
            ))}
          </motion.div>

          {/* Single CTA: URL input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            id="site-check-input"
            className="w-full max-w-2xl"
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
              <form onSubmit={handleQuickCheck} className="relative z-10 flex flex-col sm:flex-row gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://yoursite.ru"
                  className="flex-1 h-14 rounded-xl border border-border bg-card/60 backdrop-blur-xl px-5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
                />
                <Button type="submit" variant="default" size="lg" className="h-14 px-8 shrink-0 text-base font-semibold">
                  Проверить сайт
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </div>
            <p className="text-xs text-muted-foreground/60 mt-3 text-center">
              Нет регистрации · Результат через 2 минуты · Экспорт в PDF и Word
            </p>
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
