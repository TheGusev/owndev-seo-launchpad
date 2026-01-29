import { useState, useEffect } from 'react';
import { cn } from "@/lib/utils";

interface AnimatedGridProps {
  lineCount?: { h: number; v: number };
  className?: string;
  theme?: 'primary' | 'accent' | 'secondary';
}

const AnimatedGrid = ({ 
  lineCount = { h: 6, v: 8 },
  className,
  theme = 'primary'
}: AnimatedGridProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Reduce complexity on mobile
  const actualLineCount = isMobile 
    ? { h: Math.min(lineCount.h, 3), v: Math.min(lineCount.v, 4) }
    : lineCount;

  const horizontalLines = Array.from({ length: actualLineCount.h }, (_, i) => ({
    y: ((i + 1) / (actualLineCount.h + 1)) * 100,
    delay: i * 0.15
  }));
  
  const verticalLines = Array.from({ length: actualLineCount.v }, (_, i) => ({
    x: ((i + 1) / (actualLineCount.v + 1)) * 100,
    delay: i * 0.12
  }));
  
  // Only show dots on desktop
  const dots = isMobile ? [] : horizontalLines.flatMap((h, hi) => 
    verticalLines.map((v, vi) => ({
      x: v.x,
      y: h.y,
      delay: (hi + vi) * 0.08
    }))
  );
  
  return (
    <svg 
      className={cn(
        "absolute inset-0 w-full h-full pointer-events-none",
        `grid-theme-${theme}`,
        className
      )}
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
    >
      {/* Horizontal lines */}
      {horizontalLines.map((line, i) => (
        <line
          key={`h-${i}`}
          x1="0" 
          y1={line.y}
          x2="100" 
          y2={line.y}
          className="grid-line"
          style={{ animationDelay: `${line.delay}s` }}
        />
      ))}
      
      {/* Vertical lines */}
      {verticalLines.map((line, i) => (
        <line
          key={`v-${i}`}
          x1={line.x} 
          y1="0"
          x2={line.x} 
          y2="100"
          className="grid-line"
          style={{ animationDelay: `${line.delay}s` }}
        />
      ))}
      
      {/* Dots at intersections - desktop only */}
      {dots.map((dot, i) => (
        <circle
          key={`dot-${i}`}
          cx={dot.x}
          cy={dot.y}
          r="0.25"
          className="detail-dot"
          style={{ animationDelay: `${1.5 + dot.delay}s` }}
        />
      ))}
    </svg>
  );
};

export { AnimatedGrid };
