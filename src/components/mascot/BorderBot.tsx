import React, { useEffect, useCallback, useRef, useState, memo } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

/* ─── SVG Robot ─────────────────────────────────────── */
const BotSvg = memo(({ size, isWalking, step, pupilL, pupilR, cursorNear }: {
  size: number; isWalking: boolean; step: number;
  pupilL: { dx: number; dy: number }; pupilR: { dx: number; dy: number };
  cursorNear: boolean;
}) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    let mounted = true;
    const blinkLoop = () => {
      const delay = 3000 + Math.random() * 2000;
      return setTimeout(() => {
        if (!mounted) return;
        setBlink(true);
        setTimeout(() => { if (mounted) setBlink(false); }, 150);
        blinkLoop();
      }, delay);
    };
    const t = blinkLoop();
    return () => { mounted = false; clearTimeout(t); };
  }, []);

  const legL = isWalking ? (step % 2 === 0 ? -2 : 0) : 0;
  const legR = isWalking ? (step % 2 === 0 ? 0 : -2) : 0;
  const h = size * 1.55;

  return (
    <svg width={size} height={h} viewBox="0 0 36 56" fill="none" style={{ contain: "layout style" }}>
      {/* Antenna */}
      <line x1="18" y1="6" x2="18" y2="0" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />
      <circle cx="18" cy="0" r="2" fill="rgba(167,139,250,0.9)">
        <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
      </circle>

      {/* Head */}
      <rect x="4" y="6" width="28" height="22" rx="6" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />

      {/* Cursor attention glow */}
      {cursorNear && (
        <rect x="3" y="5" width="30" height="24" rx="7" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="2">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Left eye */}
      <g style={{ transform: blink ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "12px 17px", transition: "transform 0.08s" }}>
        <circle cx="12" cy="17" r="3.5" fill="rgba(167,139,250,0.9)" />
        <circle cx={12 + pupilL.dx} cy={17 + pupilL.dy} r="1.5" fill="rgba(0,0,0,0.85)" />
      </g>
      {/* Right eye */}
      <g style={{ transform: blink ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "24px 17px", transition: "transform 0.08s" }}>
        <circle cx="24" cy="17" r="3.5" fill="rgba(167,139,250,0.9)" />
        <circle cx={24 + pupilR.dx} cy={17 + pupilR.dy} r="1.5" fill="rgba(0,0,0,0.85)" />
      </g>

      {/* Body */}
      <rect x="6" y="29" width="24" height="16" rx="4" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />

      {/* Screen frame */}
      <rect x="10" y="31" width="16" height="12" rx="2" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.3)" strokeWidth="0.5" />

      {/* Screen bars — animated via SMIL */}
      <rect x="12" y="33" rx="1" height="2" fill="rgba(255,255,255,0.8)">
        <animate attributeName="width" values="12;6;12" dur="1.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.9;0.4;0.9" dur="1.8s" repeatCount="indefinite" />
      </rect>
      <rect x="12" y="36.5" rx="1" height="2" fill="rgba(0,57,166,0.7)">
        <animate attributeName="width" values="8;14;8" dur="2.2s" begin="0.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.6;1;0.6" dur="2.2s" begin="0.4s" repeatCount="indefinite" />
      </rect>
      <rect x="12" y="40" rx="1" height="2" fill="rgba(213,43,30,0.7)">
        <animate attributeName="width" values="10;5;10" dur="1.6s" begin="0.8s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.7;0.2;0.7" dur="1.6s" begin="0.8s" repeatCount="indefinite" />
      </rect>

      {/* Legs */}
      <rect x="9" y={46 + legL} width="6" height="6" rx="2" fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
      <rect x="21" y={46 + legR} width="6" height="6" rx="2" fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />

      {/* Shadow */}
      <ellipse cx="18" cy="54" rx={isWalking ? 8 : 10} ry="2" fill="rgba(139,92,246,0.15)" />
    </svg>
  );
});
BotSvg.displayName = "BotSvg";

/* ─── Idle phrases ──────────────────────────────────── */
const PHRASES = [
  "Введите URL для аудита ↑",
  "Проверю сайт за 2 минуты",
  "GEO-аудит — это важно",
  "Ваш llms.txt настроен?",
  "50+ параметров анализа",
];

const DETECTION_RADIUS = 120;

/* ─── Main Component ────────────────────────────────── */
const BorderBot = memo(() => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [hidden, setHidden] = useState(() => localStorage.getItem("owndev_bot_hidden") === "true");
  const [step, setStep] = useState(0);
  const [isWalking, setIsWalking] = useState(false);
  const [posX, setPosX] = useState(0);
  const [direction, setDirection] = useState(1);
  const [speech, setSpeech] = useState("");
  const [showSpeech, setShowSpeech] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [cursorNear, setCursorNear] = useState(false);
  const [cursorAngle, setCursorAngle] = useState<number | null>(null);

  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout>>();
  const animFrameRef = useRef<number>();
  const robotRef = useRef<HTMLDivElement>(null);
  const hasGreetedCursor = useRef(false);

  const shouldHide = hidden || location.pathname.includes("/result/") || location.pathname.includes("/report/");

  useEffect(() => {
    console.log("[BorderBot] mounted, shouldHide:", shouldHide);
    const t = setTimeout(() => setMounted(true), 2000);
    return () => clearTimeout(t);
  }, []);

  // Cursor tracking (desktop only)
  useEffect(() => {
    if (isMobile || shouldHide || !mounted) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!robotRef.current) return;
      const rect = robotRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < DETECTION_RADIUS) {
        const angle = Math.atan2(dy, dx) * (180 / Math.PI);
        setCursorAngle(angle);
        setCursorNear(true);
      } else {
        setCursorAngle(null);
        setCursorNear(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isMobile, shouldHide, mounted]);

  // Greet on first cursor proximity
  useEffect(() => {
    if (cursorNear && !hasGreetedCursor.current) {
      hasGreetedCursor.current = true;
      setSpeech("👀");
      setShowSpeech(true);
      setTimeout(() => setShowSpeech(false), 2000);
      setTimeout(() => { hasGreetedCursor.current = false; }, 30000);
    }
  }, [cursorNear]);

  // Walking animation along bottom edge
  useEffect(() => {
    if (shouldHide || !mounted) return;

    let cancelled = false;
    let stepTimer: ReturnType<typeof setInterval> | null = null;

    const walk = () => {
      setIsWalking(true);
      stepTimer = setInterval(() => setStep(s => s + 1), 250);

      const maxX = window.innerWidth - 60;
      const speed = 0.5;
      let currentX = 0;
      let dir = 1;

      const tick = () => {
        if (cancelled) return;
        currentX += speed * dir;
        if (currentX >= maxX) { dir = -1; setDirection(-1); }
        if (currentX <= 0) { dir = 1; setDirection(1); }
        setPosX(currentX);
        animFrameRef.current = requestAnimationFrame(tick);
      };

      const pauseLoop = () => {
        if (cancelled) return;
        const delay = 5000 + Math.random() * 8000;
        setTimeout(() => {
          if (cancelled) return;
          setIsWalking(false);
          if (stepTimer) clearInterval(stepTimer);

          const phrase = PHRASES[Math.floor(Math.random() * PHRASES.length)];
          setSpeech(phrase);
          setShowSpeech(true);
          setTimeout(() => setShowSpeech(false), 3500);

          const pauseDur = 2000 + Math.random() * 2000;
          setTimeout(() => {
            if (cancelled) return;
            setIsWalking(true);
            stepTimer = setInterval(() => setStep(s => s + 1), 250);
            pauseLoop();
          }, pauseDur);
        }, delay);
      };

      animFrameRef.current = requestAnimationFrame(tick);
      pauseLoop();
    };

    walk();

    return () => {
      cancelled = true;
      if (stepTimer) clearInterval(stepTimer);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [shouldHide, mounted]);

  const handleTripleClick = useCallback(() => {
    clickCount.current++;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (clickCount.current >= 3) {
      clickCount.current = 0;
      localStorage.setItem("owndev_bot_hidden", "true");
      setHidden(true);
      return;
    }
    clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 500);

    if (clickCount.current === 1) {
      setSpeech("Кликните 3 раза чтобы скрыть меня!");
      setShowSpeech(true);
      setTimeout(() => setShowSpeech(false), 3000);
    }
  }, []);

  // Pupil offset calculation
  const getPupilOffset = (eyeSide: "left" | "right") => {
    if (cursorAngle === null || !cursorNear) return { dx: 0, dy: 0 };
    const MAX_OFFSET = 1.2;
    const baseAngle = eyeSide === "right" ? cursorAngle - 5 : cursorAngle + 5;
    const rad = baseAngle * (Math.PI / 180);
    return { dx: Math.cos(rad) * MAX_OFFSET, dy: Math.sin(rad) * MAX_OFFSET };
  };

  if (shouldHide || !mounted) return null;

  const botSize = isMobile ? 28 : 36;
  const pupilL = getPupilOffset("left");
  const pupilR = getPupilOffset("right");

  return (
    <div style={{ position: "fixed", zIndex: 9999, pointerEvents: "none", inset: 0 }}>
      <div
        ref={robotRef}
        onClick={handleTripleClick}
        style={{
          position: "absolute",
          bottom: 16,
          left: posX + 16,
          pointerEvents: "auto",
          cursor: "pointer",
          transform: `scaleX(${direction === -1 ? -1 : 1}) translateZ(0)`,
          transition: "transform 0.3s",
          willChange: "left",
        }}
      >
        {/* Speech bubble */}
        {showSpeech && (
          <div
            style={{
              position: "absolute",
              bottom: "100%",
              left: "50%",
              transform: `translateX(-50%) ${direction === -1 ? "scaleX(-1)" : ""}`,
              marginBottom: 8,
              whiteSpace: "nowrap",
              pointerEvents: "none",
            }}
            className="px-3 py-1.5 rounded-lg bg-card/90 backdrop-blur border border-border text-xs text-foreground shadow-lg"
          >
            {speech}
            <div
              className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0"
              style={{
                borderLeft: "5px solid transparent",
                borderRight: "5px solid transparent",
                borderTop: "5px solid hsl(var(--border))",
              }}
            />
          </div>
        )}

        <div style={{ animation: isWalking && !cursorNear ? "botSway 0.4s ease-in-out infinite alternate" : "none" }}>
          <BotSvg
            size={botSize}
            isWalking={isWalking && !cursorNear}
            step={step}
            pupilL={pupilL}
            pupilR={pupilR}
            cursorNear={cursorNear}
          />
        </div>
      </div>

      <style>{`
        @keyframes botSway {
          from { transform: rotate(-2deg); }
          to { transform: rotate(2deg); }
        }
      `}</style>
    </div>
  );
});

BorderBot.displayName = "BorderBot";
export default BorderBot;
