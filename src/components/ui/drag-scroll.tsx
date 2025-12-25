"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useRef, useState, useEffect, Children, isValidElement, cloneElement } from "react";
import { motion, useMotionValue, useSpring, useTransform, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Touch/Swipe constants
const SWIPE_VELOCITY_THRESHOLD = 500; // px/s
const SWIPE_DISTANCE_THRESHOLD = 50;  // px

interface DragScrollContainerProps {
  children: ReactNode;
  className?: string;
  itemWidth?: number;
  gap?: number;
  autoScroll?: boolean;
  autoScrollInterval?: number;
  pauseOnHover?: boolean;
}

export function DragScrollContainer({
  children,
  className,
  itemWidth = 320,
  gap = 12,
  autoScroll = false,
  autoScrollInterval = 4000,
  pauseOnHover = true,
}: DragScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isTouching, setIsTouching] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  const childCount = Children.count(children);
  
  const x = useMotionValue(0);
  const springX = useSpring(x, {
    stiffness: 300,
    damping: 30,
  });

  // Detect touch device
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);
  
  // Calculate progress for indicators
  const progress = useTransform(springX, [0, -(scrollWidth - containerWidth)], [0, 1]);
  const [progressValue, setProgressValue] = useState(0);
  
  useEffect(() => {
    const unsubscribe = progress.on("change", (v) => {
      setProgressValue(Math.max(0, Math.min(1, v)));
    });
    return unsubscribe;
  }, [progress]);

  // Track active index based on scroll position
  useEffect(() => {
    const cardStep = itemWidth + gap;
    const unsubscribe = springX.on("change", (currentX) => {
      const centerOffset = containerWidth / 2 - itemWidth / 2;
      const currentOffset = -currentX + centerOffset;
      const newActiveIndex = Math.round(currentOffset / cardStep);
      const clampedIndex = Math.max(0, Math.min(newActiveIndex, childCount - 1));
      if (clampedIndex !== activeIndex) {
        setActiveIndex(clampedIndex);
      }
    });
    return unsubscribe;
  }, [springX, containerWidth, itemWidth, gap, childCount, activeIndex]);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
        setScrollWidth(containerRef.current.scrollWidth);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    
    // Recalculate after children render
    const timer = setTimeout(updateDimensions, 100);
    
    return () => {
      window.removeEventListener("resize", updateDimensions);
      clearTimeout(timer);
    };
  }, [children]);

  const maxScroll = Math.max(0, scrollWidth - containerWidth);
  const cardStep = itemWidth + gap;

  const scrollToIndex = (index: number) => {
    const clampedIndex = Math.max(0, Math.min(index, childCount - 1));
    const targetX = -clampedIndex * cardStep;
    const finalX = Math.max(-maxScroll, Math.min(0, targetX));
    x.set(finalX);
    setActiveIndex(clampedIndex);
  };

  // Auto-scroll logic
  useEffect(() => {
    if (!autoScroll || (pauseOnHover && isHovered) || isDragging || isTouching || childCount <= 1) return;
    
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % childCount;
      scrollToIndex(nextIndex);
    }, autoScrollInterval);
    
    return () => clearInterval(interval);
  }, [autoScroll, isHovered, isDragging, isTouching, activeIndex, childCount, autoScrollInterval, pauseOnHover]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    setIsTouching(false);
    setHasInteracted(true);
    
    const { velocity, offset } = info;
    
    // Fast swipe detection - switch by 1 card
    if (Math.abs(velocity.x) > SWIPE_VELOCITY_THRESHOLD) {
      const direction = velocity.x > 0 ? -1 : 1;
      scrollToIndex(activeIndex + direction);
      return;
    }
    
    // Sufficient offset - also switch
    if (Math.abs(offset.x) > SWIPE_DISTANCE_THRESHOLD) {
      const direction = offset.x > 0 ? -1 : 1;
      scrollToIndex(activeIndex + direction);
      return;
    }
    
    // Otherwise - snap to current position with momentum
    const currentX = x.get();
    const momentum = velocity.x * 0.15;
    const projectedX = currentX + momentum;
    
    // Snap to nearest card
    const targetIndex = Math.round(-projectedX / cardStep);
    const clampedIndex = Math.max(0, Math.min(targetIndex, Math.floor(maxScroll / cardStep)));
    const targetX = -clampedIndex * cardStep;
    
    // Clamp to bounds
    const finalX = Math.max(-maxScroll, Math.min(0, targetX));
    
    x.set(finalX);
    setActiveIndex(clampedIndex);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    setHasInteracted(true);
  };

  const handleTouchStart = () => {
    setIsTouching(true);
  };

  const handleTouchEnd = () => {
    setIsTouching(false);
  };

  // Show scroll hint only if there's content to scroll
  const canScroll = maxScroll > 0;

  // Touch-specific drag transition config
  const dragTransitionConfig = isTouchDevice
    ? {
        bounceStiffness: 400,
        bounceDamping: 25,
        power: 0.4,
        timeConstant: 300,
      }
    : {
        bounceStiffness: 600,
        bounceDamping: 30,
        power: 0.3,
        timeConstant: 200,
      };

  // Clone children with active state
  const childrenWithProps = Children.map(children, (child, index) => {
    if (isValidElement(child)) {
      return cloneElement(child as React.ReactElement<{ isActive?: boolean; distanceFromCenter?: number }>, {
        isActive: index === activeIndex,
        distanceFromCenter: Math.abs(index - activeIndex),
      });
    }
    return child;
  });

  return (
    <div 
      className={cn("relative", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Navigation buttons - hidden on mobile */}
      {canScroll && (
        <>
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: activeIndex > 0 ? 1 : 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToIndex(activeIndex - 1)}
            disabled={activeIndex === 0}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 
                       w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50
                       flex items-center justify-center text-foreground
                       hover:bg-background hover:border-primary/50 transition-colors
                       disabled:cursor-not-allowed hidden md:flex"
          >
            <ChevronLeft className="w-5 h-5" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: activeIndex < childCount - 1 ? 1 : 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => scrollToIndex(activeIndex + 1)}
            disabled={activeIndex === childCount - 1}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 
                       w-10 h-10 rounded-full bg-background/80 backdrop-blur-sm border border-border/50
                       flex items-center justify-center text-foreground
                       hover:bg-background hover:border-primary/50 transition-colors
                       disabled:cursor-not-allowed hidden md:flex"
          >
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </>
      )}

      {/* Scroll container */}
      <div className="overflow-hidden">
        <motion.div
          ref={containerRef}
          drag={canScroll ? "x" : false}
          dragConstraints={{ left: -maxScroll, right: 0 }}
          dragElastic={isTouchDevice ? 0.15 : 0.1}
          dragTransition={dragTransitionConfig}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          style={{ 
            x: springX,
            touchAction: "pan-y",
            WebkitOverflowScrolling: "touch" as any,
          }}
          className={cn(
            "flex gap-3 pb-4 select-none",
            canScroll && "cursor-grab",
            isDragging && "cursor-grabbing",
            isTouching && "scale-[0.995]",
            "transition-transform duration-150"
          )}
        >
          {childrenWithProps}
        </motion.div>
      </div>

      {/* Swipe hint for mobile */}
      {isTouchDevice && canScroll && !hasInteracted && (
        <motion.div
          initial={{ opacity: 0, x: 10 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            x: [10, 0, -10, -20],
          }}
          transition={{ 
            duration: 2,
            repeat: 2,
            repeatDelay: 0.5,
          }}
          className="absolute bottom-16 right-4 flex items-center gap-2 text-muted-foreground text-sm pointer-events-none z-20"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Свайп</span>
        </motion.div>
      )}

      {/* Fade edges */}
      {canScroll && (
        <>
          <div 
            className="absolute left-0 top-0 bottom-4 w-16 pointer-events-none bg-gradient-to-r from-background to-transparent z-10"
            style={{ opacity: progressValue > 0.05 ? 1 : 0, transition: "opacity 0.3s" }}
          />
          <div 
            className="absolute right-0 top-0 bottom-4 w-16 pointer-events-none bg-gradient-to-l from-background to-transparent z-10"
            style={{ opacity: progressValue < 0.95 ? 1 : 0, transition: "opacity 0.3s" }}
          />
        </>
      )}

      {/* Dot indicators */}
      {canScroll && (
        <div className="mt-4 flex justify-center gap-2">
          {Array.from({ length: childCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all duration-300",
                i === activeIndex 
                  ? "bg-primary w-6" 
                  : "bg-muted hover:bg-muted-foreground/50 w-2"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}
