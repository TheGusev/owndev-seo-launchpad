"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useRef, useState, useEffect, Children, isValidElement, cloneElement } from "react";
import { motion, useMotionValue, useSpring, useTransform, PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [activeIndex, setActiveIndex] = useState(0);
  
  const childCount = Children.count(children);
  
  const x = useMotionValue(0);
  const springX = useSpring(x, {
    stiffness: 300,
    damping: 30,
  });
  
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
    if (!autoScroll || (pauseOnHover && isHovered) || isDragging || childCount <= 1) return;
    
    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % childCount;
      scrollToIndex(nextIndex);
    }, autoScrollInterval);
    
    return () => clearInterval(interval);
  }, [autoScroll, isHovered, isDragging, activeIndex, childCount, autoScrollInterval, pauseOnHover]);

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    setIsDragging(false);
    
    const currentX = x.get();
    const velocity = info.velocity.x;
    
    // Calculate target position based on velocity
    const projectedX = currentX + velocity * 0.2;
    
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
  };

  // Show scroll hint only if there's content to scroll
  const canScroll = maxScroll > 0;

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
      {/* Navigation buttons */}
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
          dragElastic={0.1}
          dragTransition={{
            bounceStiffness: 600,
            bounceDamping: 30,
            power: 0.3,
            timeConstant: 200,
          }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          style={{ x: springX }}
          className={cn(
            "flex gap-3 pb-4",
            canScroll && "cursor-grab",
            isDragging && "cursor-grabbing"
          )}
        >
          {childrenWithProps}
        </motion.div>
      </div>

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
