import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface AuroraBackgroundProps {
  className?: string;
  intensity?: "subtle" | "normal" | "strong";
}

/**
 * Decorative "northern lights" background.
 * - 3 GPU-accelerated radial blurs drifting at different speeds.
 * - Mobile: single layer.
 * - Respects prefers-reduced-motion via global CSS.
 */
export const AuroraBackground = ({ className, intensity = "normal" }: AuroraBackgroundProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const opacity = intensity === "subtle" ? 0.12 : intensity === "strong" ? 0.32 : 0.22;

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
        className="aurora-layer aurora-1"
        style={{
          top: "-15%",
          left: "-10%",
          width: "60vw",
          height: "60vw",
          background: `radial-gradient(circle, hsl(var(--primary) / ${opacity}) 0%, transparent 65%)`,
        }}
      />
      {!isMobile && (
        <>
          <div
            className="aurora-layer aurora-2"
            style={{
              top: "10%",
              right: "-15%",
              width: "55vw",
              height: "55vw",
              background: `radial-gradient(circle, hsl(var(--secondary) / ${opacity * 0.85}) 0%, transparent 65%)`,
            }}
          />
          <div
            className="aurora-layer aurora-3"
            style={{
              bottom: "-20%",
              left: "20%",
              width: "65vw",
              height: "65vw",
              background: `radial-gradient(circle, hsl(var(--accent) / ${opacity * 0.9}) 0%, transparent 70%)`,
            }}
          />
        </>
      )}
    </div>
  );
};

export default AuroraBackground;