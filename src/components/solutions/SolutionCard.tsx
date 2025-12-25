import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import CountUp from "react-countup";
import { ArrowRight, LucideIcon } from "lucide-react";
import TiltCard from "@/components/ui/tilt-card";

interface ExpandedContent {
  fullDescription: string;
  features: string[];
  technologies: string[];
  timeline: string;
  price: string;
}

interface Solution {
  id: string;
  icon: LucideIcon;
  title: string;
  description: string;
  metric: number;
  metricSuffix: string;
  metricLabel: string;
  color: string;
  colSpan: 1 | 2;
  rowSpan: 1 | 2;
  featured?: boolean;
  expandedContent: ExpandedContent;
}

interface SolutionCardProps {
  solution: Solution;
  index: number;
  onClick: () => void;
}

const SolutionCard = ({ solution, index, onClick }: SolutionCardProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.2
  });

  const Icon = solution.icon;
  const isTall = solution.rowSpan === 2;

  return (
    <motion.div
      layoutId={`card-${solution.id}`}
      onClick={onClick}
      className="cursor-pointer h-full"
    >
      <TiltCard className="h-full">
        <div 
          ref={ref} 
          className={`
            group relative h-full p-6 rounded-2xl 
            bg-card/50 backdrop-blur-sm 
            border border-border/50 
            hover:border-primary/30 
            transition-all duration-500
            overflow-hidden
            ${isTall ? 'flex flex-col justify-between min-h-[320px] md:min-h-[400px]' : ''}
          `}
        >
          {/* Gradient glow on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          <div className="relative z-10">
            {/* Icon */}
            <motion.div 
              layoutId={`icon-${solution.id}`}
              className={`w-12 h-12 rounded-xl bg-white/[0.05] flex items-center justify-center mb-4 ${solution.color} group-hover:scale-110 transition-transform duration-300`}
            >
              <Icon className="w-6 h-6" />
            </motion.div>

            {/* Title */}
            <motion.h3 
              layoutId={`title-${solution.id}`}
              className="text-xl font-semibold text-foreground mb-2"
            >
              {solution.title}
            </motion.h3>

            {/* Description */}
            <motion.p 
              layoutId={`description-${solution.id}`}
              className={`text-muted-foreground text-sm ${isTall ? 'mb-6' : 'mb-4'}`}
            >
              {solution.description}
            </motion.p>
          </div>

          <div className="relative z-10">
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
          </div>

          {/* Featured badge for first card */}
          {solution.featured && (
            <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-xs font-medium text-primary">Популярное</span>
            </div>
          )}
        </div>
      </TiltCard>
    </motion.div>
  );
};

export default SolutionCard;
