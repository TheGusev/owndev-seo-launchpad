import { motion } from "framer-motion";
import { X, Check, Clock, Coins } from "lucide-react";
import { LucideIcon } from "lucide-react";

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
  expandedContent: ExpandedContent;
}

interface ExpandedSolutionCardProps {
  solution: Solution;
  onClose: () => void;
}

const ExpandedSolutionCard = ({ solution, onClose }: ExpandedSolutionCardProps) => {
  const Icon = solution.icon;

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md"
      />

      {/* Expanded Card */}
      <motion.div
        layoutId={`card-${solution.id}`}
        className="fixed z-50 bg-card border border-border/50 rounded-3xl overflow-hidden shadow-2xl"
        style={{
          top: '50%',
          left: '50%',
          x: '-50%',
          y: '-50%',
          width: 'min(90vw, 600px)',
          maxHeight: '85vh',
        }}
      >
        <div className="overflow-y-auto max-h-[85vh] p-6 md:p-8">
          {/* Close Button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            onClick={onClose}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-foreground" />
          </motion.button>

          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <motion.div 
              layoutId={`icon-${solution.id}`}
              className={`w-16 h-16 rounded-2xl bg-white/[0.05] flex items-center justify-center ${solution.color}`}
            >
              <Icon className="w-8 h-8" />
            </motion.div>
            
            <div className="flex-1">
              <motion.h2 
                layoutId={`title-${solution.id}`}
                className="text-2xl md:text-3xl font-bold text-foreground"
              >
                {solution.title}
              </motion.h2>
              <motion.p 
                layoutId={`description-${solution.id}`}
                className="text-muted-foreground mt-1"
              >
                {solution.description}
              </motion.p>
            </div>
          </div>

          {/* Expanded Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.4 }}
            className="space-y-6"
          >
            {/* Full Description */}
            <p className="text-foreground/90 leading-relaxed">
              {solution.expandedContent.fullDescription}
            </p>

            {/* Features */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Что включено
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {solution.expandedContent.features.map((feature, i) => (
                  <motion.li
                    key={feature}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.05 }}
                    className="flex items-center gap-2 text-foreground/80"
                  >
                    <Check className={`w-4 h-4 ${solution.color}`} />
                    <span>{feature}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            {/* Technologies */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Технологии
              </h4>
              <div className="flex flex-wrap gap-2">
                {solution.expandedContent.technologies.map((tech, i) => (
                  <motion.span
                    key={tech}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.25 + i * 0.05 }}
                    className="px-3 py-1 rounded-full bg-white/[0.05] border border-border/50 text-sm text-foreground/80"
                  >
                    {tech}
                  </motion.span>
                ))}
              </div>
            </div>

            {/* Timeline & Price */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border/30">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Сроки</p>
                  <p className="font-semibold text-foreground">{solution.expandedContent.timeline}</p>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center">
                  <Coins className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Стоимость</p>
                  <p className="font-semibold text-foreground">{solution.expandedContent.price}</p>
                </div>
              </motion.div>
            </div>

            {/* CTA Button */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
            >
              Обсудить проект
            </motion.button>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default ExpandedSolutionCard;
