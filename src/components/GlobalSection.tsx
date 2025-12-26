import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { MapPin, Globe, Clock } from "lucide-react";
import AnimatedText from "@/components/ui/animated-text";
import ScrollReveal from "@/components/ui/scroll-reveal";
import { StaggerContainer, StaggerItem } from "@/components/ui/stagger-container";

const metrics = [
  { icon: MapPin, value: 40, suffix: "+", label: "городов России" },
  { icon: Globe, value: 100, suffix: "%", label: "удалённо" },
  { icon: Clock, value: 24, suffix: "/7", label: "на связи" },
];

const GlobalSection = () => {
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.2,
  });

  return (
    <section className="relative min-h-screen flex items-center justify-center py-24 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
      
      {/* Animated grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px),
                           linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      <div className="container relative z-10 px-4 md:px-6" ref={ref}>
        <ScrollReveal className="text-center max-w-4xl mx-auto">
          {/* Main heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            <AnimatedText 
              text="Работаем по всей России" 
              highlightWords={[3]}
              highlightClassName="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent"
            />
          </h2>
          
          {/* Subtitle */}
          <ScrollReveal delay={0.2}>
            <p className="text-lg md:text-xl text-muted-foreground mb-16 max-w-2xl mx-auto">
              Удалённо взаимодействуем с клиентами из любого города. 
              Современные инструменты позволяют работать так же эффективно, как в офисе.
            </p>
          </ScrollReveal>

          {/* Metrics with staggered animation */}
          <StaggerContainer 
            className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12"
            staggerDelay={0.12}
            delayChildren={0.3}
          >
            {metrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <StaggerItem key={metric.label} className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 border border-primary/20">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>
                  <div className="text-4xl md:text-5xl font-bold text-foreground mb-2">
                    {inView ? (
                      <CountUp
                        end={metric.value}
                        duration={2}
                        suffix={metric.suffix}
                      />
                    ) : (
                      `0${metric.suffix}`
                    )}
                  </div>
                  <p className="text-muted-foreground text-sm md:text-base">
                    {metric.label}
                  </p>
                </StaggerItem>
              );
            })}
          </StaggerContainer>
        </ScrollReveal>
      </div>
    </section>
  );
};

export default GlobalSection;
