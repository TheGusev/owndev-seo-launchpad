import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";
import { useTouchDevice } from "@/hooks/use-touch-device";

type Direction = "up" | "down" | "left" | "right";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  duration?: number;
  distance?: number;
  once?: boolean;
  className?: string;
  viewport?: { margin?: string; amount?: number };
}

const getInitialPosition = (direction: Direction, distance: number) => {
  switch (direction) {
    case "up": return { y: distance, x: 0 };
    case "down": return { y: -distance, x: 0 };
    case "left": return { x: distance, y: 0 };
    case "right": return { x: -distance, y: 0 };
    default: return { y: distance, x: 0 };
  }
};

const ScrollReveal = ({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  distance = 40,
  once = true,
  className = "",
  viewport = { margin: "-50px", amount: 0.1 },
}: ScrollRevealProps) => {
  const isMobile = useTouchDevice();
  
  // Reduce distance and duration on mobile for snappier feel
  const mobileDistance = Math.min(distance, 20);
  const mobileDuration = Math.min(duration, 0.4);
  
  const finalDistance = isMobile ? mobileDistance : distance;
  const finalDuration = isMobile ? mobileDuration : duration;
  
  const initialPosition = getInitialPosition(direction, finalDistance);

  const variants: Variants = {
    hidden: {
      opacity: 0,
      ...initialPosition,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration: finalDuration,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };

  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, ...viewport }}
      className={className}
      style={{ willChange: "transform, opacity" }}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
