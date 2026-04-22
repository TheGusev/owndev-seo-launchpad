import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface ScanLineProps {
  className?: string;
  /** Animation duration in seconds */
  duration?: number;
  /** Opacity 0..1 */
  opacity?: number;
}

/**
 * Thin glowing horizontal line slowly sweeping top→bottom of its parent.
 * Parent must be `position: relative`.
 * Mobile: slightly lower opacity to avoid distraction.
 */
export const ScanLine = ({ className, duration = 8, opacity }: ScanLineProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const finalOpacity = opacity ?? (isMobile ? 0.25 : 0.4);

  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
      style={{ contain: "layout paint" }}
    >
      <div
        className="scan-line-beam"
        style={{
          animationDuration: `${duration}s`,
          opacity: finalOpacity,
        }}
      />
    </div>
  );
};

export default ScanLine;