import { motion } from "framer-motion";
import CountUp from "react-countup";
import { useInView } from "react-intersection-observer";
import { MapPin, Globe, Clock } from "lucide-react";
import AnimatedText from "@/components/ui/animated-text";

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
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
          className="text-center max-w-4xl mx-auto"
        >
          {/* Main heading */}
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
            <AnimatedText text="Работаем по всей" />{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-accent">
              <AnimatedText text="России" delay={0.3} />
            </span>
          </h2>
          
          {/* Subtitle */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground mb-16 max-w-2xl mx-auto"
          >
            Удалённо взаимодействуем с клиентами из любого города. 
            Современные инструменты позволяют работать так же эффективно, как в офисе.
          </motion.p>

          {/* Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  className="flex flex-col items-center"
                >
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
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default GlobalSection;
