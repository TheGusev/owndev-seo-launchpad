"use client";

import { cn } from "@/lib/utils";
import { ReactNode, useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring, useTransform, PanInfo } from "framer-motion";

interface DragScrollContainerProps {
  children: ReactNode;
  className?: string;
  itemWidth?: number;
  gap?: number;
}

export function DragScrollContainer({
  children,
  className,
  itemWidth = 320,
  gap = 12,
}: DragScrollContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollWidth, setScrollWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
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
  };

  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Show scroll hint only if there's content to scroll
  const canScroll = maxScroll > 0;

  return (
    <div className={cn("relative", className)}>
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
          {children}
        </motion.div>
      </div>

      {/* Fade edges */}
      {canScroll && (
        <>
          <div 
            className="absolute left-0 top-0 bottom-4 w-8 pointer-events-none bg-gradient-to-r from-background to-transparent z-10"
            style={{ opacity: progressValue > 0.05 ? 1 : 0, transition: "opacity 0.3s" }}
          />
          <div 
            className="absolute right-0 top-0 bottom-4 w-8 pointer-events-none bg-gradient-to-l from-background to-transparent z-10"
            style={{ opacity: progressValue < 0.95 ? 1 : 0, transition: "opacity 0.3s" }}
          />
        </>
      )}

      {/* Progress bar */}
      {canScroll && (
        <div className="mt-4 flex justify-center">
          <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              style={{
                width: `${Math.max(20, (containerWidth / scrollWidth) * 100)}%`,
                x: useTransform(progress, [0, 1], [0, 32 * (1 - containerWidth / scrollWidth) * 4]),
              }}
            />
          </div>
        </div>
      )}

      {/* Drag hint */}
      {canScroll && (
        <motion.div
          initial={{ opacity: 0.7 }}
          animate={{ opacity: isDragging ? 0 : 0.5 }}
          className="absolute top-1/2 right-4 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none hidden md:block"
        >
          <div className="flex items-center gap-1">
            <span>←</span>
            <span>drag</span>
            <span>→</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
