import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface GeometricRaysProps {
  className?: string;
  /** Override stroke opacity (0..1). Default 0.4 */
  opacity?: number;
}

/**
 * Thin angular SVG lines emitting from each corner.
 * Inspired by cyberpunk HUD overlays — purely decorative.
 */
export const GeometricRays = ({ className, opacity = 0.4 }: GeometricRaysProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const effOpacity = isMobile ? Math.min(opacity, 0.22) : opacity;
  const stroke = `hsl(var(--primary) / ${effOpacity})`;
  const filter = "drop-shadow(0 0 4px hsl(var(--primary) / 0.5))";

  return (
    <div
      aria-hidden
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
    >
      {/* Top-left */}
      <svg className="absolute top-0 left-0 w-[40vw] max-w-[520px] h-auto" viewBox="0 0 400 300" fill="none">
        <g style={{ filter }}>
          <polyline className="ray-line" points="0,40 80,40 120,80 220,80" stroke={stroke} strokeWidth="1" style={{ animationDelay: "0.1s" }} />
          <polyline className="ray-line" points="0,120 60,120 100,160 180,160 200,180" stroke={stroke} strokeWidth="1" style={{ animationDelay: "0.4s" }} />
          <polyline className="ray-line" points="0,200 40,200 70,230 140,230" stroke={stroke} strokeWidth="1" style={{ animationDelay: "0.7s" }} />
          <polyline className="ray-shine-line" points="0,40 80,40 120,80 220,80" stroke="hsl(var(--primary))" strokeWidth="1.5" style={{ animationDelay: "2s" }} />
        </g>
      </svg>

      {/* Top-right (hidden on mobile) */}
      <svg className={cn("absolute top-0 right-0 w-[40vw] max-w-[520px] h-auto", isMobile && "hidden")} viewBox="0 0 400 300" fill="none">
        <g style={{ filter, transform: "scaleX(-1)", transformOrigin: "center" }}>
          <polyline className="ray-line" points="0,60 90,60 130,100 240,100" stroke={stroke} strokeWidth="1" style={{ animationDelay: "0.2s" }} />
          <polyline className="ray-line" points="0,140 70,140 110,180 200,180" stroke={stroke} strokeWidth="1" style={{ animationDelay: "0.5s" }} />
          <polyline className="ray-shine-line" points="0,60 90,60 130,100 240,100" stroke="hsl(var(--primary))" strokeWidth="1.5" style={{ animationDelay: "3s" }} />
        </g>
      </svg>

      {/* Bottom-left (hidden on mobile) */}
      <svg className={cn("absolute bottom-0 left-0 w-[35vw] max-w-[460px] h-auto", isMobile && "hidden")} viewBox="0 0 400 300" fill="none">
        <g style={{ filter, transform: "scaleY(-1)", transformOrigin: "center" }}>
          <polyline className="ray-line" points="0,50 70,50 100,80 180,80" stroke={stroke} strokeWidth="1" style={{ animationDelay: "0.3s" }} />
          <polyline className="ray-line" points="0,130 50,130 90,170 170,170" stroke={stroke} strokeWidth="1" style={{ animationDelay: "0.6s" }} />
        </g>
      </svg>

      {/* Bottom-right */}
      <svg className="absolute bottom-0 right-0 w-[35vw] max-w-[460px] h-auto" viewBox="0 0 400 300" fill="none">
        <g style={{ filter, transform: "scale(-1, -1)", transformOrigin: "center" }}>
          <polyline className="ray-line" points="0,70 80,70 120,110 220,110" stroke={stroke} strokeWidth="1" style={{ animationDelay: "0.4s" }} />
          <polyline className="ray-line" points="0,160 60,160 100,200 200,200" stroke={stroke} strokeWidth="1" style={{ animationDelay: "0.8s" }} />
          <polyline className="ray-shine-line" points="0,70 80,70 120,110 220,110" stroke="hsl(var(--primary))" strokeWidth="1.5" style={{ animationDelay: "5s" }} />
        </g>
      </svg>
    </div>
  );
};

export default GeometricRays;