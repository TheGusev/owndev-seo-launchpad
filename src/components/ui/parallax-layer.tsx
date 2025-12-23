import { motion, useScroll, useTransform } from 'framer-motion';
import { useRef, ReactNode, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface ParallaxLayerProps {
  children: ReactNode;
  speed?: number;
  className?: string;
  disabled?: boolean;
}

export const ParallaxLayer = ({ 
  children, 
  speed = 0.3, 
  className,
  disabled = false
}: ParallaxLayerProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    [`${speed * -50}%`, `${speed * 50}%`]
  );
  
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.2, 0.8, 1],
    [0.7, 1, 1, 0.7]
  );

  // Disable parallax on mobile for performance
  if (isMobile || disabled) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }
  
  return (
    <motion.div
      ref={ref}
      style={{ y, opacity }}
      className={cn('will-change-transform', className)}
    >
      {children}
    </motion.div>
  );
};
