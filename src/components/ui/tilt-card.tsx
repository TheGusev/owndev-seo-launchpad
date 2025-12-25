import { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";

interface TiltCardProps {
  children: React.ReactNode;
  className?: string;
  maxTilt?: number;
  glareEnabled?: boolean;
}

const TiltCard = ({ 
  children, 
  className, 
  maxTilt = 15,
  glareEnabled = true 
}: TiltCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice(window.matchMedia('(hover: none)').matches);
  }, []);

  // Motion values for mouse position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Spring physics for smooth animation
  const springConfig = { stiffness: 300, damping: 20 };
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [maxTilt, -maxTilt]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-maxTilt, maxTilt]), springConfig);
  const scale = useSpring(1, springConfig);

  // Glare position
  const glareX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), springConfig);
  const glareY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), springConfig);
  const glareOpacity = useSpring(0, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current || isTouchDevice) return;

    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Normalize to -0.5 to 0.5
    const normalizedX = (e.clientX - centerX) / rect.width;
    const normalizedY = (e.clientY - centerY) / rect.height;

    mouseX.set(normalizedX);
    mouseY.set(normalizedY);
  };

  const handleMouseEnter = () => {
    if (isTouchDevice) return;
    scale.set(1.02);
    glareOpacity.set(0.15);
  };

  const handleMouseLeave = () => {
    if (isTouchDevice) return;
    mouseX.set(0);
    mouseY.set(0);
    scale.set(1);
    glareOpacity.set(0);
  };

  // For touch devices, return simple div
  if (isTouchDevice) {
    return (
      <div className={cn("relative", className)}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={cardRef}
      className={cn("relative", className)}
      style={{
        rotateX,
        rotateY,
        scale,
        transformStyle: "preserve-3d",
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {/* Glare effect */}
      {glareEnabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
          style={{
            opacity: glareOpacity,
            background: `radial-gradient(circle at ${glareX.get()}% ${glareY.get()}%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
          }}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: useTransform(
                [glareX, glareY],
                ([x, y]) => `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.3) 0%, transparent 50%)`
              ),
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
};

export default TiltCard;
