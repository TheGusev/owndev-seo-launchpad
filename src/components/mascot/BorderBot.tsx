import React, { useEffect, useCallback, useRef, useState, memo } from "react";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

/* ─── Types ─────────────────────────────────────────── */
type Mood = "idle" | "happy" | "surprised" | "thinking";

/* ─── Context phrases by route ──────────────────────── */
const ROUTE_PHRASES: Record<string, string[]> = {
  "/": ["Проверь свой сайт бесплатно!", "GEO-аудит за 60 секунд", "Ваш llms.txt настроен?"],
  "/tools": ["Попробуй SEO-аудит!", "13 бесплатных инструментов", "Все инструменты бесплатны"],
  "/tools/site-check": ["Введи URL и жми Enter ↑", "Проверю 50+ параметров", "Аудит занимает 2 минуты"],
  "/blog": ["Читай про llms.txt!", "Новые статьи каждую неделю", "GEO — тренд 2025 года"],
  "/geo-rating": ["Смотри топ сайтов Рунета!", "Кто лидер GEO-рейтинга?"],
  "/academy": ["Учись GEO бесплатно!", "Пошаговые уроки внутри"],
};

const FALLBACK_PHRASES = [
  "Введите URL для аудита ↑",
  "Проверю сайт за 2 минуты",
  "GEO-аудит — это важно",
  "Ваш llms.txt настроен?",
  "50+ параметров анализа",
];

function getPhrasesForPath(pathname: string): string[] {
  // exact match first
  if (ROUTE_PHRASES[pathname]) return ROUTE_PHRASES[pathname];
  // prefix match
  for (const key of Object.keys(ROUTE_PHRASES)) {
    if (key !== "/" && pathname.startsWith(key)) return ROUTE_PHRASES[key];
  }
  return FALLBACK_PHRASES;
}

/* ─── SVG Eyes by mood ──────────────────────────────── */
const Eyes = memo(({ blink, pupilL, pupilR, mood }: {
  blink: boolean;
  pupilL: { dx: number; dy: number };
  pupilR: { dx: number; dy: number };
  mood: Mood;
}) => {
  if (mood === "happy") {
    return (
      <>
        {/* Happy eyes — arcs */}
        <path d="M8.5 18 Q12 13 15.5 18" stroke="rgba(167,139,250,0.9)" strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M20.5 18 Q24 13 27.5 18" stroke="rgba(167,139,250,0.9)" strokeWidth="2" fill="none" strokeLinecap="round" />
        {/* Smile */}
        <path d="M13 22 Q18 26 23 22" stroke="rgba(167,139,250,0.7)" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      </>
    );
  }

  if (mood === "surprised") {
    return (
      <>
        {/* Big eyes */}
        <g style={{ transform: blink ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "12px 17px", transition: "transform 0.08s" }}>
          <circle cx="12" cy="17" r="4.5" fill="rgba(167,139,250,0.9)" />
          <circle cx={12 + pupilL.dx} cy={17 + pupilL.dy} r="1.8" fill="rgba(0,0,0,0.85)" />
        </g>
        <g style={{ transform: blink ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "24px 17px", transition: "transform 0.08s" }}>
          <circle cx="24" cy="17" r="4.5" fill="rgba(167,139,250,0.9)" />
          <circle cx={24 + pupilR.dx} cy={17 + pupilR.dy} r="1.8" fill="rgba(0,0,0,0.85)" />
        </g>
        {/* O-mouth */}
        <circle cx="18" cy="23" r="2" fill="none" stroke="rgba(167,139,250,0.7)" strokeWidth="1.2" />
      </>
    );
  }

  if (mood === "thinking") {
    return (
      <>
        {/* Left eye normal */}
        <g style={{ transform: blink ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "12px 17px", transition: "transform 0.08s" }}>
          <circle cx="12" cy="17" r="3.5" fill="rgba(167,139,250,0.9)" />
          <circle cx={12 + pupilL.dx} cy={17 + pupilL.dy} r="1.5" fill="rgba(0,0,0,0.85)" />
        </g>
        {/* Right eye squinted */}
        <line x1="20" y1="17" x2="28" y2="17" stroke="rgba(167,139,250,0.9)" strokeWidth="2" strokeLinecap="round" />
      </>
    );
  }

  // idle — default eyes
  return (
    <>
      <g style={{ transform: blink ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "12px 17px", transition: "transform 0.08s" }}>
        <circle cx="12" cy="17" r="3.5" fill="rgba(167,139,250,0.9)" />
        <circle cx={12 + pupilL.dx} cy={17 + pupilL.dy} r="1.5" fill="rgba(0,0,0,0.85)" />
      </g>
      <g style={{ transform: blink ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "24px 17px", transition: "transform 0.08s" }}>
        <circle cx="24" cy="17" r="3.5" fill="rgba(167,139,250,0.9)" />
        <circle cx={24 + pupilR.dx} cy={17 + pupilR.dy} r="1.5" fill="rgba(0,0,0,0.85)" />
      </g>
    </>
  );
});
Eyes.displayName = "Eyes";

/* ─── Screen content by mood ────────────────────────── */
const ScreenContent = memo(({ mood }: { mood: Mood }) => {
  if (mood === "thinking") {
    return (
      <>
        <circle cx="14" cy="37" r="1.2" fill="rgba(167,139,250,0.7)">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" repeatCount="indefinite" />
        </circle>
        <circle cx="18" cy="37" r="1.2" fill="rgba(167,139,250,0.7)">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.3s" repeatCount="indefinite" />
        </circle>
        <circle cx="22" cy="37" r="1.2" fill="rgba(167,139,250,0.7)">
          <animate attributeName="opacity" values="0.3;1;0.3" dur="1.2s" begin="0.6s" repeatCount="indefinite" />
        </circle>
      </>
    );
  }

  return (
    <>
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
    </>
  );
});
ScreenContent.displayName = "ScreenContent";

/* ─── SVG Robot ─────────────────────────────────────── */
const BotSvg = memo(({ size, isWalking, step, pupilL, pupilR, cursorNear, mood }: {
  size: number; isWalking: boolean; step: number;
  pupilL: { dx: number; dy: number }; pupilR: { dx: number; dy: number };
  cursorNear: boolean; mood: Mood;
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

  const armWave = mood === "happy";

  return (
    <svg width={size} height={h} viewBox="0 0 36 56" fill="none" style={{ contain: "layout style", overflow: "visible" }}>
      {/* Antenna */}
      <line x1="18" y1="6" x2="18" y2="0" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />
      <circle cx="18" cy="0" r="2" fill={mood === "happy" ? "rgba(250,204,21,0.9)" : "rgba(167,139,250,0.9)"}>
        <animate attributeName="opacity" values="1;0.3;1" dur={mood === "happy" ? "0.8s" : "2s"} repeatCount="indefinite" />
      </circle>

      {/* Head */}
      <rect x="4" y="6" width="28" height="22" rx="6" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />

      {/* Cursor attention glow */}
      {cursorNear && (
        <rect x="3" y="5" width="30" height="24" rx="7" fill="none" stroke="rgba(139,92,246,0.3)" strokeWidth="2">
          <animate attributeName="opacity" values="0.3;0.7;0.3" dur="1.5s" repeatCount="indefinite" />
        </rect>
      )}

      {/* Eyes + expressions */}
      <Eyes blink={blink} pupilL={pupilL} pupilR={pupilR} mood={mood} />

      {/* Left arm */}
      <rect
        x="0" y="31" width="5" height="10" rx="2"
        fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1"
        style={{
          transformOrigin: "3px 31px",
          transform: armWave ? "rotate(-30deg)" : "rotate(0deg)",
          transition: "transform 0.4s ease",
        }}
      />
      {/* Right arm */}
      <rect
        x="31" y="31" width="5" height="10" rx="2"
        fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.4)" strokeWidth="1"
        style={{
          transformOrigin: "33px 31px",
          transform: armWave ? "rotate(30deg)" : "rotate(0deg)",
          transition: "transform 0.4s ease",
        }}
      />

      {/* Body */}
      <rect x="6" y="29" width="24" height="16" rx="4" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />

      {/* Screen frame */}
      <rect x="10" y="31" width="16" height="12" rx="2" fill="rgba(139,92,246,0.08)" stroke="rgba(139,92,246,0.3)" strokeWidth="0.5" />

      {/* Screen content */}
      <ScreenContent mood={mood} />

      {/* Legs */}
      <rect x="9" y={46 + legL} width="6" height="6" rx="2" fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
      <rect x="21" y={46 + legR} width="6" height="6" rx="2" fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />

      {/* Shadow */}
      <ellipse cx="18" cy="54" rx={isWalking ? 8 : 10} ry="2" fill="rgba(139,92,246,0.15)" />
    </svg>
  );
});
BotSvg.displayName = "BotSvg";

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
  const [mood, setMood] = useState<Mood>("idle");

  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout>>();
  const animFrameRef = useRef<number>();
  const robotRef = useRef<HTMLDivElement>(null);
  const hasGreetedCursor = useRef(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout>>();
  const phrasesRef = useRef<string[]>(FALLBACK_PHRASES);

  const shouldHide = hidden || location.pathname.includes("/result/") || location.pathname.includes("/report/");

  // Update phrases when route changes
  useEffect(() => {
    phrasesRef.current = getPhrasesForPath(location.pathname);
  }, [location.pathname]);

  // Route-based mood triggers
  useEffect(() => {
    if (!mounted || shouldHide) return;
    if (location.pathname === "/tools/site-check") {
      setMood("happy");
      setSpeech("Отличный выбор! 🎯");
      setShowSpeech(true);
      setTimeout(() => setShowSpeech(false), 3000);
      setTimeout(() => setMood("idle"), 4000);
    }
  }, [location.pathname, mounted, shouldHide]);

  // First visit / return greeting
  useEffect(() => {
    const visited = localStorage.getItem("owndev_visited");
    const t = setTimeout(() => {
      setMounted(true);
      if (!visited) {
        localStorage.setItem("owndev_visited", "true");
        setMood("surprised");
        setSpeech("О, привет! Я BorderBot 🤖");
        setShowSpeech(true);
        setTimeout(() => setShowSpeech(false), 4000);
        setTimeout(() => setMood("idle"), 5000);
      } else {
        setMood("happy");
        setSpeech("С возвращением! 👋");
        setShowSpeech(true);
        setTimeout(() => setShowSpeech(false), 3000);
        setTimeout(() => setMood("idle"), 4000);
      }
    }, 2000);
    return () => clearTimeout(t);
  }, []);

  // Idle detection — thinking mood after 20s of no interaction
  useEffect(() => {
    if (isMobile || shouldHide || !mounted) return;

    const resetIdle = () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      // If currently thinking, snap back to idle
      setMood(prev => prev === "thinking" ? "idle" : prev);
      idleTimer.current = setTimeout(() => {
        setMood("thinking");
        setSpeech("Задумался... 🤔");
        setShowSpeech(true);
        setTimeout(() => setShowSpeech(false), 3000);
      }, 20000);
    };

    resetIdle();
    window.addEventListener("mousemove", resetIdle, { passive: true });
    window.addEventListener("scroll", resetIdle, { passive: true });
    window.addEventListener("keydown", resetIdle, { passive: true });

    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("scroll", resetIdle);
      window.removeEventListener("keydown", resetIdle);
    };
  }, [isMobile, shouldHide, mounted]);

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
        setCursorAngle(Math.atan2(dy, dx) * (180 / Math.PI));
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

  // Walking animation
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

          const phrases = phrasesRef.current;
          const phrase = phrases[Math.floor(Math.random() * phrases.length)];
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

    // Single click → happy reaction
    setMood("happy");
    setSpeech(clickCount.current === 1 ? "Привет! 😊 (3× чтобы скрыть)" : "Ещё разок! 😄");
    setShowSpeech(true);
    setTimeout(() => setShowSpeech(false), 3000);
    setTimeout(() => setMood("idle"), 3000);
  }, []);

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
            mood={mood}
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
