import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { TypeAnimation } from "react-type-animation";
import { motion, useScroll, useTransform } from "framer-motion";
import MagneticButton from "@/components/ui/magnetic-button";
import { useRef } from "react";
import { useTouchDevice } from "@/hooks/use-touch-device";

const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const isMobile = useTouchDevice();
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Simplified parallax for mobile, full effect for desktop
  const layer1Y = useTransform(scrollYProgress, [0, 1], ["0%", isMobile ? "20%" : "50%"]);
  const layer2Y = useTransform(scrollYProgress, [0, 1], ["0%", isMobile ? "15%" : "35%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", isMobile ? "5%" : "10%"]);
  
  // Only apply complex effects on desktop
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, isMobile ? 1.1 : 1.3]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Layer 1: Background */}
      <motion.div 
        className="absolute inset-0 bg-background"
        style={{ y: layer1Y }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/50" />
      </motion.div>

      {/* Layer 2: Gradient mesh - simplified on mobile */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: layer2Y, scale: backgroundScale }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-radial from-accent/5 via-transparent to-transparent" />
      </motion.div>

      {/* Blur circles - static on mobile, animated on desktop */}
      <div 
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        style={{ willChange: "transform" }}
      />
      <div 
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
        style={{ willChange: "transform" }}
      />

      {/* Content - no blur filter on scroll */}
      <motion.div 
        className="relative z-10 container mx-auto px-6"
        style={{ 
          y: contentY, 
          opacity,
        }}
      >
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        >
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-semibold leading-tight tracking-tight mb-8">
            Создаём сайты,{" "}
            <span className="text-primary">
              <TypeAnimation
                sequence={[
                  "которые продают",
                  3000,
                  "которые конвертируют",
                  3000,
                  "которые работают",
                  3000,
                  "которые впечатляют",
                  3000,
                ]}
                wrapper="span"
                speed={40}
                repeat={Infinity}
              />
            </span>
          </h1>

          {/* Subtitle */}
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-12"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Разрабатываем современные веб-решения для бизнеса. 
            От лендингов до сложных SaaS-платформ.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <MagneticButton strength={isMobile ? 0 : 0.2}>
              <Button 
                size="lg"
                onClick={() => scrollToSection("contact")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base"
              >
                Обсудить проект
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </MagneticButton>
            
            <MagneticButton strength={isMobile ? 0 : 0.2}>
              <Button 
                variant="outline"
                size="lg"
                onClick={() => scrollToSection("projects")}
                className="border-border text-foreground hover:bg-muted px-8 py-6 text-base"
              >
                Смотреть работы
              </Button>
            </MagneticButton>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Scroll Indicator - only on desktop */}
      {!isMobile && (
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          style={{ opacity }}
        >
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
            <motion.div 
              className="w-1 h-2 bg-muted-foreground/50 rounded-full mt-2"
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      )}
    </section>
  );
};

export default Hero;
