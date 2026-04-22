import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MatrixRainProps {
  className?: string;
  /** Visual density: low (mobile-first), medium, high (desktop hero) */
  density?: "low" | "medium" | "high";
  /** Opacity multiplier 0..1 */
  opacity?: number;
}

const CHARS = "01{}<>/=;[]()$#@*+-_λΣΔ∞⌘※AIMLLMSEOGEOGPT01010".split("");

function pickChar(seed: number) {
  return CHARS[Math.floor((Math.sin(seed * 999.13) * 0.5 + 0.5) * CHARS.length) % CHARS.length];
}

/**
 * Matrix-style digital rain in brand cyan.
 * - Mobile (<=768px): pure CSS columns, no canvas — battery-safe.
 * - Desktop: canvas with low FPS to keep CPU low.
 * Pauses when off-screen via IntersectionObserver. Respects reduced motion.
 */
export const MatrixRain = ({ className, density = "low", opacity = 0.18 }: MatrixRainProps) => {
  const [isMobile, setIsMobile] = useState(false);
  const [inView, setInView] = useState(true);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!wrapRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "100px" }
    );
    obs.observe(wrapRef.current);
    return () => obs.disconnect();
  }, []);

  // Mobile CSS columns config
  const mobileColumns = useMemo(() => {
    const count = density === "low" ? 6 : density === "medium" ? 8 : 10;
    return Array.from({ length: count }).map((_, i) => {
      const dur = 9 + ((i * 1.7) % 7);
      const delay = (i * 0.9) % 6;
      const left = (i / count) * 100 + (i % 2 === 0 ? 2 : 6);
      const chars = Array.from({ length: 12 }).map((_, j) => pickChar(i * 11 + j));
      return { left, dur, delay, chars };
    });
  }, [density]);

  // Desktop canvas
  useEffect(() => {
    if (isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;
    if (!inView) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let last = 0;
    const fontSize = 14;
    const cols = density === "high" ? 38 : density === "medium" ? 28 : 20;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    };
    resize();

    const drops = Array.from({ length: cols }).map(() => Math.random() * 50);
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = (t: number) => {
      // Throttle to ~20fps
      if (t - last < 50) {
        raf = requestAnimationFrame(tick);
        return;
      }
      last = t;
      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "rgba(8,12,22,0.18)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize * dpr}px 'JetBrains Mono', monospace`;
      ctx.fillStyle = `hsla(174, 72%, 60%, ${0.55 * opacity * 5})`;
      const colW = w / cols;
      for (let i = 0; i < cols; i++) {
        const ch = CHARS[Math.floor(Math.random() * CHARS.length)];
        const x = i * colW + colW * 0.2;
        const y = drops[i] * fontSize * dpr;
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.975) drops[i] = 0;
        drops[i] += 1;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [isMobile, density, opacity, inView]);

  return (
    <div
      ref={wrapRef}
      aria-hidden
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
      style={{ contain: "layout paint", opacity: isMobile ? Math.min(opacity, 0.18) : opacity }}
    >
      {isMobile ? (
        <div className="absolute inset-0">
          {mobileColumns.map((col, i) => (
            <span
              key={i}
              className="matrix-column"
              style={{
                left: `${col.left}%`,
                animationDuration: `${col.dur}s`,
                animationDelay: `${col.delay}s`,
              }}
            >
              {col.chars.map((c, j) => (
                <span key={j} style={{ opacity: Math.max(0.2, 1 - j * 0.07) }}>
                  {c}
                </span>
              ))}
            </span>
          ))}
        </div>
      ) : (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      )}
    </div>
  );
};

export default MatrixRain;