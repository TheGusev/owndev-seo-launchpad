import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader = ({ onComplete }: PreloaderProps) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Fallback timeout - force complete after 2 seconds
  useEffect(() => {
    const fallbackTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(fallbackTimer);
  }, [onComplete]);

  useEffect(() => {
    const duration = 1500; // Reduced from 2000ms
    const interval = 50;
    const increment = 100 / (duration / interval);
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment + Math.random() * 3;
        if (next >= 100) {
          clearInterval(timer);
          return 100;
        }
        return next;
      });
    }, interval);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const exitTimer = setTimeout(() => {
        setIsExiting(true);
      }, 200);
      return () => clearTimeout(exitTimer);
    }
  }, [progress]);

  useEffect(() => {
    if (isExiting) {
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 500);
      return () => clearTimeout(completeTimer);
    }
  }, [isExiting, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-background"
      initial={{ opacity: 1 }}
      animate={{ opacity: isExiting ? 0 : 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-6"
        animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 0.95 : 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Logo */}
        <motion.div
          className="relative"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-5xl md:text-7xl font-bold font-mono tracking-tighter">
            <span className="text-primary">OWN</span>
            <span className="text-foreground">DEV</span>
          </span>
        </motion.div>

        {/* Progress section */}
        <div className="flex flex-col items-center gap-3 w-48">
          {/* Counter */}
          <div className="text-3xl md:text-4xl font-mono font-bold text-foreground tabular-nums">
            {Math.floor(progress)}
            <span className="text-primary">%</span>
          </div>

          {/* Progress bar */}
          <div className="w-full h-[2px] bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Preloader;
