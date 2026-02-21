import { type ReactNode } from "react";
import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";

interface ToolScreenProps {
  id: string;
  index: number;
  total: number;
  icon: LucideIcon;
  title: string;
  subtitle: string;
  gradient: string;
  useCases: string[];
  children: ReactNode;
}

const ToolScreen = ({ id, index, total, icon: Icon, title, subtitle, gradient, useCases, children }: ToolScreenProps) => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.15 });

  return (
    <section
      id={id}
      className="tool-section"
      style={{ zIndex: 10 + index }}
    >
      <div className={`min-h-screen flex flex-col justify-center py-20 md:py-24 relative overflow-hidden ${gradient}`}>
        {/* Background overlay for depth */}
        <div className="absolute inset-0 bg-background/80" />

        <div className="container px-4 md:px-6 relative z-10" ref={ref}>
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-5">
              <Icon className="w-4 h-4 text-primary" />
              <span className="text-xs font-mono text-muted-foreground">Инструмент {index}/{total}</span>
            </div>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-3">
              {title}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">{subtitle}</p>
          </motion.div>

          {/* Widget */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="max-w-[900px] mx-auto mb-12"
          >
            {children}
          </motion.div>

          {/* Use cases */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mx-auto text-center"
          >
            <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Когда использовать</p>
            <ul className="flex flex-wrap justify-center gap-3">
              {useCases.map((uc) => (
                <li key={uc} className="glass px-4 py-2 rounded-full text-sm text-muted-foreground">{uc}</li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ToolScreen;
