import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  index?: number;
}

const GlassCard = ({ children, className, index = 0 }: GlassCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ 
        duration: 0.5, 
        delay: index * 0.1,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{ 
        y: -12, 
        scale: 1.02,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className={cn(
        "group relative p-6 rounded-2xl",
        "bg-white/[0.03] backdrop-blur-sm",
        "border border-white/[0.08]",
        "transition-all duration-300 ease-out",
        "hover:border-white/[0.15]",
        "hover:shadow-[0_0_40px_rgba(61,217,195,0.1)]",
        "hover:bg-white/[0.05]",
        className
      )}
    >
      {/* Gradient glow effect on hover */}
      <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
      </div>
      
      <div className="relative z-10">
        {children}
      </div>
    </motion.div>
  );
};

export default GlassCard;
