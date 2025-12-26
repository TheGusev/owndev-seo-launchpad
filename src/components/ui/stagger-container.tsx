import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";
import { useTouchDevice } from "@/hooks/use-touch-device";

interface StaggerContainerProps {
  children: ReactNode;
  staggerDelay?: number;
  delayChildren?: number;
  className?: string;
  once?: boolean;
  viewport?: { margin?: string; amount?: number };
}

interface StaggerItemProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

const StaggerContainer = ({
  children,
  staggerDelay = 0.1,
  delayChildren = 0.2,
  className = "",
  once = true,
  viewport = { margin: "-50px", amount: 0.1 },
}: StaggerContainerProps) => {
  const isMobile = useTouchDevice();
  
  // Faster stagger on mobile
  const mobileStagger = Math.min(staggerDelay, 0.08);
  const mobileDelay = Math.min(delayChildren, 0.1);
  
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: isMobile ? mobileStagger : staggerDelay,
        delayChildren: isMobile ? mobileDelay : delayChildren,
      },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, ...viewport }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

const StaggerItem = ({ children, className = "" }: StaggerItemProps) => {
  const isMobile = useTouchDevice();
  
  const itemVariants: Variants = {
    hidden: { 
      opacity: 0, 
      y: isMobile ? 20 : 30, 
      scale: 0.95 
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: isMobile ? 0.4 : 0.5,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.div
      variants={itemVariants}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
};

export { StaggerContainer, StaggerItem };
export default StaggerContainer;
