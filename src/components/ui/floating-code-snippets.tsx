import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

interface FloatingCodeSnippetsProps {
  className?: string;
  /** Override the default snippet pool */
  snippets?: string[];
  /** Mobile count (default 2) */
  mobileCount?: number;
  /** Desktop count (default 5) */
  desktopCount?: number;
  /** Opacity multiplier */
  opacity?: number;
}

const DEFAULT_SNIPPETS = [
  '<meta property="og:title" />',
  '"@type": "FAQPage"',
  "User-agent: *",
  "lighthouse: 98",
  "llms.txt ✓",
  '"score": 87',
  "schema.org/Article",
  "rel=\"canonical\"",
  "robots.txt → Allow",
  "{ \"ai_ready\": true }",
];

const FLOAT_CLASSES = [
  "code-snippet-float-1",
  "code-snippet-float-2",
  "code-snippet-float-3",
];

/**
 * Slowly drifting semi-transparent code fragments — pure decoration.
 * Mobile-aware: fewer items + smaller font.
 */
export const FloatingCodeSnippets = ({
  className,
  snippets = DEFAULT_SNIPPETS,
  mobileCount = 2,
  desktopCount = 5,
  opacity = 1,
}: FloatingCodeSnippetsProps) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const items = useMemo(() => {
    const count = isMobile ? mobileCount : desktopCount;
    return Array.from({ length: count }).map((_, i) => {
      const text = snippets[i % snippets.length];
      const top = 8 + ((i * 17) % 78);
      const left = 6 + ((i * 23) % 82);
      const delay = (i * 1.3) % 6;
      const cls = FLOAT_CLASSES[i % FLOAT_CLASSES.length];
      return { text, top, left, delay, cls };
    });
  }, [isMobile, mobileCount, desktopCount, snippets]);

  return (
    <div
      aria-hidden
      className={cn(
        "absolute inset-0 overflow-hidden pointer-events-none",
        className
      )}
      style={{ contain: "layout paint", opacity }}
    >
      {items.map((it, i) => (
        <span
          key={i}
          className={cn(
            "absolute font-mono whitespace-nowrap text-primary/60 select-none",
            it.cls,
            isMobile ? "text-[10px]" : "text-[12px]"
          )}
          style={{
            top: `${it.top}%`,
            left: `${it.left}%`,
            animationDelay: `${it.delay}s`,
            textShadow: "0 0 8px hsl(var(--primary) / 0.45)",
          }}
        >
          {it.text}
        </span>
      ))}
    </div>
  );
};

export default FloatingCodeSnippets;