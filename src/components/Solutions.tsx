import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { 
  Layout, 
  Building2, 
  ShoppingCart, 
  Layers, 
  Search, 
  Headphones,
  ArrowRight
} from "lucide-react";
import GlassCard from "@/components/ui/glass-card";

const solutions = [
  {
    icon: Layout,
    title: "Лендинг",
    description: "Продающие одностраничники с высокой конверсией для вашего бизнеса",
    metric: 30,
    metricSuffix: "+",
    metricLabel: "проектов",
    color: "text-primary"
  },
  {
    icon: Building2,
    title: "Корпоративный сайт",
    description: "Представительство вашей компании в интернете с полным функционалом",
    metric: 25,
    metricSuffix: "+",
    metricLabel: "проектов",
    color: "text-accent"
  },
  {
    icon: ShoppingCart,
    title: "Интернет-магазин",
    description: "E-commerce решения с интеграцией платежей и CRM-систем",
    metric: 15,
    metricSuffix: "+",
    metricLabel: "проектов",
    color: "text-primary"
  },
  {
    icon: Layers,
    title: "SaaS-платформа",
    description: "Сложные веб-приложения с личными кабинетами и API",
    metric: 10,
    metricSuffix: "+",
    metricLabel: "проектов",
    color: "text-accent"
  },
  {
    icon: Search,
    title: "SEO-оптимизация",
    description: "Продвижение сайтов в поисковых системах и увеличение трафика",
    metric: 50,
    metricSuffix: "+",
    metricLabel: "клиентов",
    color: "text-primary"
  },
  {
    icon: Headphones,
    title: "Техподдержка",
    description: "Круглосуточная поддержка и обслуживание ваших проектов",
    metric: 24,
    metricSuffix: "/7",
    metricLabel: "доступность",
    color: "text-accent"
  }
];

const SolutionCard = ({ solution, index }: { solution: typeof solutions[0]; index: number }) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2
  });

  const Icon = solution.icon;

  return (
    <div ref={ref} className="snap-start shrink-0 w-[85vw] md:w-auto">
      <GlassCard index={index} className="h-full flex flex-col">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 ${solution.color}`}>
          <Icon className="w-6 h-6" />
        </div>

        {/* Title */}
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {solution.title}
        </h3>

        {/* Description */}
        <p className="text-muted-foreground text-sm mb-4 flex-grow">
          {solution.description}
        </p>

        {/* Metric */}
        <div className="flex items-baseline gap-1 mb-4">
          <span className={`text-3xl font-bold ${solution.color}`}>
            {inView ? (
              <CountUp
                end={solution.metric}
                duration={2}
                delay={0.2 + index * 0.1}
              />
            ) : (
              "0"
            )}
          </span>
          <span className={`text-xl font-bold ${solution.color}`}>
            {solution.metricSuffix}
          </span>
          <span className="text-muted-foreground text-sm ml-1">
            {solution.metricLabel}
          </span>
        </div>

        {/* CTA Link */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-primary transition-colors duration-300">
          <span>Подробнее</span>
          <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform duration-300" />
        </div>
      </GlassCard>
    </div>
  );
};

const Solutions = () => {
  return (
    <section className="py-24 px-4 md:px-8 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/50 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Наши <span className="text-gradient">решения</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Полный спектр услуг веб-разработки для вашего бизнеса
          </p>
        </motion.div>

        {/* Cards Grid - Desktop */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {solutions.map((solution, index) => (
            <SolutionCard key={solution.title} solution={solution} index={index} />
          ))}
        </div>

        {/* Cards Scroll - Mobile */}
        <div className="md:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 -mx-4 px-4">
          {solutions.map((solution, index) => (
            <SolutionCard key={solution.title} solution={solution} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Solutions;
