import { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface TypingCodeBlockProps {
  lines: string[];
  language?: string;
  /** ms per character */
  speed?: number;
  /** delay between lines, ms */
  lineDelay?: number;
  className?: string;
  title?: string;
  loop?: boolean;
  /** Pause before restarting loop (ms) */
  loopPause?: number;
  /** Visual style */
  variant?: "ide" | "minimal" | "inline";
  /** Behaviour on mobile (<=768px) */
  mobileVariant?: "compact" | "hidden";
}

const KEYWORDS = /\b(const|let|var|function|return|if|else|for|while|import|from|export|default|async|await|class|new|true|false|null|undefined|GET|POST|HTTP|JSON)\b/g;
const STRINGS = /(["'`])(?:\\.|(?!\1).)*\1/g;
const COMMENTS = /(\/\/[^\n]*|#[^\n]*|>\s.*)/g;
const NUMBERS = /\b(\d+(?:\.\d+)?)\b/g;
const CHECKMARKS = /(✓|✗|→|⚡|✦)/g;

function highlight(line: string): string {
  // Escape HTML first
  let html = line
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Order matters: comments → strings → keywords → numbers → marks
  html = html.replace(COMMENTS, '<span style="color:hsl(var(--muted-foreground))">$1</span>');
  html = html.replace(STRINGS, (m) => `<span style="color:hsl(var(--accent))">${m}</span>`);
  html = html.replace(KEYWORDS, '<span style="color:hsl(var(--secondary))">$1</span>');
  html = html.replace(NUMBERS, '<span style="color:hsl(var(--primary))">$1</span>');
  html = html.replace(CHECKMARKS, '<span style="color:hsl(var(--primary))">$1</span>');
  return html;
}

export const TypingCodeBlock = ({
  lines,
  language = "bash",
  speed = 28,
  lineDelay = 220,
  className,
  title,
  loop = true,
  loopPause = 3500,
  variant = "ide",
  mobileVariant = "compact",
}: TypingCodeBlockProps) => {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  const timersRef = useRef<number[]>([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const reduceMotion = useMemo(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  // Mobile speed boost — type quicker so the user doesn't have to wait
  const effSpeed = isMobile ? Math.min(speed, 18) : speed;
  const effLineDelay = isMobile ? Math.min(lineDelay, 120) : lineDelay;

  useEffect(() => {
    if (reduceMotion) {
      setDisplayed(lines);
      setDone(true);
      return;
    }

    let cancelled = false;
    const run = () => {
      setDisplayed([]);
      setDone(false);
      let acc = 0;
      lines.forEach((line, lineIdx) => {
        for (let i = 0; i <= line.length; i++) {
          const t = window.setTimeout(() => {
            if (cancelled) return;
            setDisplayed((prev) => {
              const next = [...prev];
              next[lineIdx] = line.slice(0, i);
              return next;
            });
          }, acc);
          timersRef.current.push(t);
          acc += effSpeed;
        }
        acc += effLineDelay;
      });
      const finishT = window.setTimeout(() => {
        if (cancelled) return;
        setDone(true);
        if (loop) {
          const restartT = window.setTimeout(run, loopPause);
          timersRef.current.push(restartT);
        }
      }, acc);
      timersRef.current.push(finishT);
    };

    run();

    return () => {
      cancelled = true;
      timersRef.current.forEach(clearTimeout);
      timersRef.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, effSpeed, effLineDelay, loop, loopPause, reduceMotion]);

  // Mobile gating
  if (isMobile && mobileVariant === "hidden") return null;

  const isMinimal = variant === "minimal" || (isMobile && variant === "ide" && false);
  const isInline = variant === "inline";
  const compact = isMobile && variant === "ide";

  // ── Inline (single-line terminal style) ─────────────────────────────────
  if (isInline) {
    const last = displayed[displayed.length - 1] ?? "";
    return (
      <div
        aria-hidden
        className={cn(
          "inline-flex items-center gap-2 font-mono text-[12px] md:text-[13px] text-primary/90",
          className
        )}
      >
        <span className="text-muted-foreground">&gt;</span>
        <span
          dangerouslySetInnerHTML={{
            __html: highlight(last) + (!done ? '<span class="code-cursor" style="color:hsl(var(--primary))">▎</span>' : ""),
          }}
        />
      </div>
    );
  }

  // ── Minimal (no chrome, no line numbers) ────────────────────────────────
  if (variant === "minimal") {
    return (
      <div
        aria-hidden
        className={cn(
          "rounded-lg border border-primary/15 bg-card/30 backdrop-blur-md p-3 font-mono leading-relaxed",
          isMobile ? "text-[11px] max-h-[160px] overflow-hidden" : "text-[12.5px]",
          className
        )}
      >
        {displayed.map((line, i) => (
          <div key={i} className="whitespace-pre text-foreground/90 break-all">
            <span
              dangerouslySetInnerHTML={{
                __html:
                  highlight(line ?? "") +
                  (i === displayed.length - 1 && !done
                    ? '<span class="code-cursor" style="color:hsl(var(--primary))">▎</span>'
                    : ""),
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // ── IDE (default; compact on mobile) ────────────────────────────────────
  return (
    <div
      className={cn(
        "rounded-xl border border-primary/20 bg-card/40 backdrop-blur-md overflow-hidden shadow-[0_0_40px_hsl(var(--primary)/0.08)]",
        compact && "max-h-[180px]",
        className
      )}
      aria-hidden
    >
      <div className={cn(
        "flex items-center gap-2 border-b border-primary/10 bg-background/40",
        compact ? "px-3 py-1.5" : "px-4 py-2"
      )}>
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-destructive/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-warning/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-success/70" />
        </div>
        <span className="ml-2 text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
          {title ?? language}
        </span>
      </div>
      <div className={cn(
        "font-mono leading-relaxed overflow-hidden",
        compact ? "p-3 text-[11px]" : "p-4 text-[12.5px]"
      )}>
        {displayed.map((line, i) => (
          <div key={i} className="flex gap-3 whitespace-pre">
            {!compact && (
              <span className="select-none text-muted-foreground/40 w-5 text-right shrink-0">
                {i + 1}
              </span>
            )}
            <span
              className="text-foreground/90 break-all"
              dangerouslySetInnerHTML={{
                __html:
                  highlight(line ?? "") +
                  (i === displayed.length - 1 && !done
                    ? '<span class="code-cursor" style="color:hsl(var(--primary))">▎</span>'
                    : ""),
              }}
            />
          </div>
        ))}
        {done && (
          <div className="flex gap-3 whitespace-pre mt-1">
            {!compact && (
              <span className="select-none text-muted-foreground/40 w-5 text-right shrink-0">
                {displayed.length + 1}
              </span>
            )}
            <span className="code-cursor text-primary">▎</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default TypingCodeBlock;