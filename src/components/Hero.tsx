import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { TypeAnimation } from "react-type-animation";
import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import MagneticButton from "@/components/ui/magnetic-button";
import { useRef } from "react";

// Декоративный floating orb с индивидуальным parallax
const FloatingOrb = ({ 
  className, 
  y, 
  scale, 
  rotate 
}: { 
  className: string; 
  y: MotionValue<string>; 
  scale: MotionValue<number>; 
  rotate: MotionValue<number>;
}) => (
  <motion.div 
    className={className}
    style={{ y, scale, rotate }}
  />
);

const Hero = () => {
  const sectionRef = useRef<HTMLElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"]
  });

  // Многослойный Parallax с разными скоростями
  const layer1Y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]); // Дальний фон (медленный)
  const layer2Y = useTransform(scrollYProgress, [0, 1], ["0%", "35%"]); // Средний слой
  const layer3Y = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]); // Blur circles
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "10%"]); // Контент (быстрый)
  
  // Scale эффект для фоновых элементов
  const backgroundScale = useTransform(scrollYProgress, [0, 1], [1, 1.3]);
  const orbScale1 = useTransform(scrollYProgress, [0, 1], [1, 0.8]);
  const orbScale2 = useTransform(scrollYProgress, [0, 1], [1, 1.4]);
  
  // Rotation для динамики
  const rotate1 = useTransform(scrollYProgress, [0, 1], [0, 20]);
  const rotate2 = useTransform(scrollYProgress, [0, 1], [0, -15]);
  const rotate3 = useTransform(scrollYProgress, [0, 1], [0, 30]);
  
  // Opacity и blur эффекты
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0]);
  const contentBlur = useTransform(scrollYProgress, [0, 0.5], [0, 8]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Layer 1: Дальний фон — base gradient */}
      <motion.div 
        className="absolute inset-0 bg-background"
        style={{ y: layer1Y }}
      >
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/50" />
      </motion.div>

      {/* Layer 2: Средний слой — gradient mesh */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: layer2Y, scale: backgroundScale }}
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-radial from-primary/5 via-transparent to-transparent" />
        <div className="absolute bottom-0 right-0 w-full h-full bg-gradient-radial from-accent/5 via-transparent to-transparent" />
      </motion.div>

      {/* Layer 3: Blur circles с scale и rotation */}
      <FloatingOrb
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl"
        y={layer3Y}
        scale={orbScale1}
        rotate={rotate1}
      />
      <FloatingOrb
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl"
        y={layer3Y}
        scale={orbScale2}
        rotate={rotate2}
      />
      
      {/* Дополнительные декоративные orbs */}
      <FloatingOrb
        className="absolute top-1/3 right-1/3 w-64 h-64 bg-secondary/8 rounded-full blur-2xl"
        y={layer2Y}
        scale={backgroundScale}
        rotate={rotate3}
      />
      <FloatingOrb
        className="absolute bottom-1/3 left-1/3 w-48 h-48 bg-primary/5 rounded-full blur-2xl"
        y={layer1Y}
        scale={orbScale2}
        rotate={rotate1}
      />
      
      {/* Floating dots/particles */}
      <motion.div 
        className="absolute inset-0 pointer-events-none"
        style={{ y: layer2Y, opacity }}
      >
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-primary/30 rounded-full"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{
              y: [0, -10, 0],
              opacity: [0.3, 0.6, 0.3],
            }}
            transition={{
              duration: 3 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.3,
            }}
          />
        ))}
      </motion.div>

      {/* Content с parallax и blur */}
      <motion.div 
        className="relative z-10 container mx-auto px-6"
        style={{ 
          y: contentY, 
          opacity,
          filter: useTransform(contentBlur, (v) => `blur(${v}px)`)
        }}
      >
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            Разрабатываем современные веб-решения для бизнеса. 
            От лендингов до сложных SaaS-платформ.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <MagneticButton strength={0.2}>
              <Button 
                size="lg"
                onClick={() => scrollToSection("contact")}
                className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-6 text-base"
              >
                Обсудить проект
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </MagneticButton>
            
            <MagneticButton strength={0.2}>
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

      {/* Scroll Indicator */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.8 }}
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
    </section>
  );
};

export default Hero;
