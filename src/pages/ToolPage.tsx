import { Suspense } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getToolBySlug } from "@/data/tools-registry";
import { ArrowLeft } from "lucide-react";
import { AnimatedGrid } from "@/components/ui/animated-grid";
import { FloatingParticles } from "@/components/ui/floating-particles";
import { MouseGradient } from "@/components/ui/mouse-gradient";
import { ClickRipple } from "@/components/ui/click-ripple";
import { ParallaxLayer } from "@/components/ui/parallax-layer";

const ToolPage = () => {
  const { toolSlug } = useParams<{ toolSlug: string }>();
  const tool = toolSlug ? getToolBySlug(toolSlug) : undefined;

  if (!tool) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold font-serif mb-4">Инструмент не найден</h1>
          <Link to="/tools" className="text-primary hover:underline">← Все инструменты</Link>
        </div>
      </div>
    );
  }

  const ToolComponent = tool.component;

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <MouseGradient />
      <ClickRipple />
      <Header />
      <main className="pt-24 pb-16 relative">
        {/* Background animations */}
        <div className="absolute inset-0 pointer-events-none">
          <AnimatedGrid theme="primary" lineCount={{ h: 5, v: 7 }} />
          <FloatingParticles count={10} className="absolute inset-0" />
          <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        </div>

        <div className="container px-4 md:px-6 relative z-10">
          {/* Breadcrumb */}
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Link to="/tools" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] py-2">
              <ArrowLeft className="w-4 h-4" />
              Все инструменты
            </Link>
          </motion.div>

          {/* Tool header */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              <tool.icon className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">{tool.name}</span>
            </motion.div>
            <motion.h1
              className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif mb-3"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              {tool.name}
            </motion.h1>
            <motion.p
              className="text-muted-foreground text-base md:text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              {tool.shortDesc}
            </motion.p>
          </div>

          {/* Tool widget */}
          <ParallaxLayer speed={0.2}>
          <motion.div
            className="max-w-[900px] mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <Suspense fallback={<div className="glass rounded-2xl p-8 text-center text-muted-foreground">Загрузка…</div>}>
              <ToolComponent />
            </Suspense>
          </motion.div>
          </ParallaxLayer>

          {/* Use cases */}
          <ParallaxLayer speed={0.1}>
          <motion.div
            className="max-w-2xl mx-auto text-center"
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Когда использовать</p>
            <ul className="flex flex-wrap justify-center gap-2">
              {tool.useCases.map((uc, i) => (
                <motion.li
                  key={uc}
                  className="glass px-3 py-2 rounded-full text-sm text-muted-foreground"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: i * 0.05 }}
                >
                  {uc}
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Disclaimer */}
          <p className="text-xs text-muted-foreground text-center mt-10 max-w-lg mx-auto">
            Быстрый чек — не заменяет полноценный аудит. Результаты носят ориентировочный характер.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ToolPage;
