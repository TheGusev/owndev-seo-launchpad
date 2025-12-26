import { motion, Variants } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { useTouchDevice } from "@/hooks/use-touch-device";

interface AnimatedTextProps {
  text: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "h4" | "p" | "span";
  highlightWords?: number[]; // indices of words to highlight
  highlightClassName?: string; // class for highlighted words
}

const AnimatedText = ({ 
  text, 
  className = "", 
  delay = 0,
  highlightWords = [],
  highlightClassName = "text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent",
}: AnimatedTextProps) => {
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  const isMobile = useTouchDevice();
  const words = text.split(" ");

  // Container is always visible (opacity: 1), only children animate
  const container: Variants = {
    hidden: {},
    visible: {
      transition: { staggerChildren: isMobile ? 0.05 : 0.08, delayChildren: delay },
    },
  };

  const child: Variants = {
    hidden: {
      opacity: 0,
      y: 15,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 25,
        stiffness: 120,
      },
    },
  };

  return (
    <motion.span
      ref={ref}
      className={`inline-flex flex-wrap ${className}`}
      variants={container}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {words.map((word, index) => {
        const isHighlighted = highlightWords.includes(index);
        return (
          <motion.span
            key={index}
            className={`inline-block mr-[0.25em] animated-text-word ${isHighlighted ? highlightClassName : ""}`}
            style={{ willChange: "transform, opacity" }}
            variants={child}
          >
            {word}
          </motion.span>
        );
      })}
    </motion.span>
  );
};

export default AnimatedText;
