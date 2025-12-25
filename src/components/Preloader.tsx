import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface PreloaderProps {
  onComplete: () => void;
}

const Preloader = ({ onComplete }: PreloaderProps) => {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const duration = 2000; // 2 seconds total
    const interval = 50; // Update every 50ms
    const increment = 100 / (duration / interval);
    
    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + increment + Math.random() * 2;
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
      }, 300);
      return () => clearTimeout(exitTimer);
    }
  }, [progress]);

  useEffect(() => {
    if (isExiting) {
      const completeTimer = setTimeout(() => {
        onComplete();
      }, 800);
      return () => clearTimeout(completeTimer);
    }
  }, [isExiting, onComplete]);

  return (
    <motion.div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Top curtain */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-1/2 bg-background"
        initial={{ y: 0 }}
        animate={{ y: isExiting ? "-100%" : 0 }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      />
      
      {/* Bottom curtain */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-1/2 bg-background"
        initial={{ y: 0 }}
        animate={{ y: isExiting ? "100%" : 0 }}
        transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
      />

      {/* Content */}
      <motion.div
        className="relative z-10 flex flex-col items-center gap-8"
        animate={{ opacity: isExiting ? 0 : 1, scale: isExiting ? 0.9 : 1 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <motion.div
          className="relative"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <span className="text-6xl md:text-8xl font-bold font-mono tracking-tighter">
            <span className="text-primary">OWN</span>
            <span className="text-foreground">DEV</span>
          </span>
          
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 blur-2xl opacity-50"
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="text-6xl md:text-8xl font-bold font-mono tracking-tighter text-primary">
              OWNDEV
            </span>
          </motion.div>
        </motion.div>

        {/* Progress section */}
        <div className="flex flex-col items-center gap-4 w-64">
          {/* Counter */}
          <motion.div
            className="text-4xl md:text-5xl font-mono font-bold text-foreground tabular-nums"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {Math.floor(progress)}
            <span className="text-primary">%</span>
          </motion.div>

          {/* Progress bar */}
          <div className="w-full h-[2px] bg-muted/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary via-secondary to-primary rounded-full"
              style={{ width: `${progress}%` }}
              transition={{ duration: 0.1 }}
            />
          </div>

          {/* Loading text */}
          <motion.p
            className="text-sm text-muted-foreground font-mono uppercase tracking-widest"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Загрузка
          </motion.p>
        </div>
      </motion.div>

      {/* Decorative grid lines */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          className="absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isExiting ? 0 : 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <motion.div
          className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/20 to-transparent"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: isExiting ? 0 : 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
      </div>
    </motion.div>
  );
};

export default Preloader;
