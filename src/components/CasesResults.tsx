import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { TrendingUp, MapPin, Percent } from "lucide-react";

const stats = [
  { icon: TrendingUp, value: "+180%", label: "органического трафика за 6 месяцев" },
  { icon: MapPin, value: "50+", label: "городов в одном проекте" },
  { icon: Percent, value: "450%", label: "ROI" },
];

const CasesResults = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.2 });

  return (
    <section id="cases" className="min-h-screen flex items-center py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,hsl(var(--primary)/0.06),transparent_60%)]" />
      <div className="container px-4 md:px-6 relative z-10">
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold font-serif mb-4">
            Кейсы и <span className="text-gradient">результаты</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.15 * i }}
              className="glass rounded-2xl p-8 text-center card-hover"
            >
              <s.icon className="w-8 h-8 text-primary mx-auto mb-4" />
              <div className="text-4xl md:text-5xl font-bold text-gradient font-serif mb-3">{s.value}</div>
              <p className="text-muted-foreground text-sm">{s.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CasesResults;
