import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface BinaryStreamProps {
  className?: string;
  /** Position relative to parent. Parent must be `relative` */
  position?: "top" | "bottom";
  /** Opacity multiplier */
  opacity?: number;
}

function buildStream(seed: number, len: number) {
  let s = seed;
  const rnd = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  let out = "";
  for (let i = 0; i < len; i++) {
    const r = rnd();
    if (r < 0.03) out += "  ";
    else if (r < 0.08) out += " { ";
    else if (r < 0.13) out += " } ";
    else out += r > 0.5 ? "1" : "0";
    out += " ";
  }
  return out;
}

/**
 * Thin scrolling tape of 0s and 1s — works as a tech-styled section divider.
 * Mobile: slower scroll, lower opacity, smaller font.
 */
export const BinaryStream = ({
  className,
  position = "top",
  opacity = 1,
}: BinaryStreamProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const stream = useMemo(() => buildStream(7, 220), []);

  return (
    <div
      aria-hidden
      className={cn(
        "absolute left-0 right-0 overflow-hidden pointer-events-none select-none",
        position === "top" ? "top-0" : "bottom-0",
        className
      )}
      style={{
        height: isMobile ? 14 : 18,
        contain: "layout paint",
        opacity: isMobile ? Math.min(opacity, 0.55) : opacity,
        WebkitMaskImage:
          "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)",
        maskImage:
          "linear-gradient(90deg, transparent 0%, black 12%, black 88%, transparent 100%)",
      }}
    >
      <div
        className={cn(
          "binary-stream-track flex whitespace-nowrap font-mono text-primary",
          isMobile && "binary-stream-track-mobile"
        )}
        style={{
          fontSize: isMobile ? 9 : 10,
          opacity: isMobile ? 0.18 : 0.22,
          textShadow: "0 0 6px hsl(var(--primary) / 0.4)",
        }}
      >
        <span className="shrink-0 pr-8">{stream}</span>
        <span className="shrink-0 pr-8">{stream}</span>
      </div>
    </div>
  );
};

export default BinaryStream;