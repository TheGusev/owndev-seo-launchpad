import { motion } from "framer-motion";
import { ReactNode } from "react";

interface PageTransitionProps {
  children: ReactNode;
}

const pageVariants = {
  initial: { 
    opacity: 0, 
    y: 20,
    filter: "blur(4px)"
  },
  animate: { 
    opacity: 1, 
    y: 0,
    filter: "blur(0px)",
    transition: { 
      duration: 0.5, 
      ease: [0.25, 0.46, 0.45, 0.94] as const
    } 
  },
  exit: { 
    opacity: 0, 
    y: -20,
    filter: "blur(4px)",
    transition: { 
      duration: 0.3, 
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
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
