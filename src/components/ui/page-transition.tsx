import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

// Content visible immediately - no opacity:0 to prevent mobile black screen
const pageVariants = {
  initial: { 
    opacity: 1, 
    y: 0,
  },
  animate: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.3, 
      ease: [0.25, 0.46, 0.45, 0.94] as const
    } 
  },
  exit: { 
    opacity: 1, 
    transition: { 
      duration: 0.15, 
      ease: [0.25, 0.46, 0.45, 0.94] as const
    } 
  }
};

const PageTransition = ({ children }: PageTransitionProps) => {
  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      style={{ willChange: "opacity, transform" }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
