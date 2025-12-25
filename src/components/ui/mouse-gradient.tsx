import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const MouseGradient = () => {
  const [isTouch, setIsTouch] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 100 };
  const gradientX = useSpring(mouseX, springConfig);
  const gradientY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    setIsTouch(isTouchDevice);
    if (isTouchDevice) return;

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  if (isTouch) return null;

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-0"
      style={{
        background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), hsl(var(--primary) / 0.08), transparent 50%)`,
      }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: gradientX.get() 
            ? `radial-gradient(600px circle at ${gradientX.get()}px ${gradientY.get()}px, hsl(var(--primary) / 0.08), transparent 50%)`
            : 'transparent',
        }}
      />
      {/* Update CSS variable for gradient position */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: "transparent",
        }}
        onUpdate={() => {
          document.documentElement.style.setProperty('--mouse-x', `${gradientX.get()}px`);
          document.documentElement.style.setProperty('--mouse-y', `${gradientY.get()}px`);
        }}
      />
    </motion.div>
  );
};

export default MouseGradient;
