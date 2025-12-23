import { useScroll, useTransform, MotionValue } from 'framer-motion';
import { useRef, RefObject } from 'react';

interface UseParallaxOptions {
  offset?: number;
  direction?: 'up' | 'down';
  range?: [number, number];
}

interface UseParallaxReturn {
  ref: RefObject<HTMLDivElement>;
  y: MotionValue<string>;
  scrollYProgress: MotionValue<number>;
}

export function useParallax(options: UseParallaxOptions = {}): UseParallaxReturn {
  const { offset = 0.5, direction = 'up', range = [0, 1] } = options;
  const ref = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });
  
  const y = useTransform(
    scrollYProgress,
    range,
    direction === 'up' 
      ? [`${offset * 100}px`, `${-offset * 100}px`] 
      : [`${-offset * 100}px`, `${offset * 100}px`]
  );
  
  return { ref, y, scrollYProgress };
}
