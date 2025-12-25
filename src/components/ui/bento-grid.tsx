import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface BentoGridProps {
  children: React.ReactNode;
  className?: string;
}

interface BentoGridItemProps {
  children: React.ReactNode;
  colSpan?: 1 | 2;
  rowSpan?: 1 | 2;
  className?: string;
  index?: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { 
    opacity: 0, 
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut" as const,
    },
  },
};

export const BentoGrid = ({ children, className }: BentoGridProps) => {
  return (
    <motion.div
      className={cn(
        "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6",
        className
      )}
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      {children}
    </motion.div>
  );
};

export const BentoGridItem = ({ 
  children, 
  colSpan = 1, 
  rowSpan = 1, 
  className,
  index = 0,
}: BentoGridItemProps) => {
  const colSpanClasses = {
    1: "col-span-1",
    2: "md:col-span-2",
  };

  const rowSpanClasses = {
    1: "row-span-1",
    2: "md:row-span-2",
  };

  return (
    <motion.div
      className={cn(
        colSpanClasses[colSpan],
        rowSpanClasses[rowSpan],
        className
      )}
      variants={itemVariants}
    >
      {children}
    </motion.div>
  );
};

export default BentoGrid;
