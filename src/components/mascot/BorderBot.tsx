import React, { useReducer, useEffect, useCallback, useRef, useState, memo } from "react";
import { motion, useAnimationControls } from "framer-motion";
import { useLocation } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

/* ─── Types ─────────────────────────────────────────── */
type Facing = "left" | "right" | "up" | "down";
type Side = "bottom" | "right" | "top" | "left";
type BotState = "walking" | "stopping" | "looking" | "thinking";

interface State {
  botState: BotState;
  side: Side;
  facing: Facing;
  progress: number; // 0→1 along current side
}

type Action =
  | { type: "WALK" }
  | { type: "STOP" }
  | { type: "LOOK" }
  | { type: "THINK" }
  | { type: "NEXT_SIDE" }
  | { type: "SET_PROGRESS"; progress: number };

const SIDES: Side[] = ["bottom", "right", "top", "left"];
const SIDE_FACING: Record<Side, Facing> = {
  bottom: "right",
  right: "up",
  top: "left",
  left: "down",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "WALK":
      return { ...state, botState: "walking" };
    case "STOP":
      return { ...state, botState: "stopping" };
    case "LOOK":
      return { ...state, botState: "looking" };
    case "THINK":
      return { ...state, botState: "thinking" };
    case "NEXT_SIDE": {
      const idx = (SIDES.indexOf(state.side) + 1) % 4;
      return { ...state, side: SIDES[idx], facing: SIDE_FACING[SIDES[idx]], progress: 0 };
    }
    case "SET_PROGRESS":
      return { ...state, progress: action.progress };
    default:
      return state;
  }
}

/* ─── SVG Robot ─────────────────────────────────────── */
const BotSvg = memo(({ facing, isWalking, isThinking, step }: {
  facing: Facing;
  isWalking: boolean;
  isThinking: boolean;
  step: number;
}) => {
  const [blink, setBlink] = useState(false);

  useEffect(() => {
    const blinkLoop = () => {
      const delay = 3000 + Math.random() * 2000;
      const timer = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 150);
        blinkLoop();
      }, delay);
      return timer;
    };
    const t = blinkLoop();
    return () => clearTimeout(t);
  }, []);

  const pupilDx = facing === "left" ? -1 : facing === "right" ? 1 : 0;
  const pupilDy = facing === "up" ? -1 : facing === "down" ? 1 : 0;
  const legOffsetL = isWalking ? (step % 2 === 0 ? -3 : 0) : 0;
  const legOffsetR = isWalking ? (step % 2 === 0 ? 0 : -3) : 0;

  return (
    <svg width="36" height="52" viewBox="0 0 36 52" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Antenna */}
      <line x1="18" y1="6" x2="18" y2="0" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />
      <circle cx="18" cy="0" r="2" fill="rgba(167,139,250,0.9)">
        <animate
          attributeName="opacity"
          values={isThinking ? "1;0.2;1" : "1;0.3;1"}
          dur={isThinking ? "0.3s" : "2s"}
          repeatCount="indefinite"
        />
      </circle>

      {/* Head */}
      <rect x="4" y="6" width="28" height="22" rx="6" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />

      {/* Eyes */}
      <g transform={`translate(0, ${blink ? 3 : 0})`} style={{ transformOrigin: "18px 17px" }}>
        <g style={{ transform: blink ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "12px 17px" }}>
          <circle cx="12" cy="17" r="3.5" fill="rgba(167,139,250,0.9)" />
          <circle cx={12 + pupilDx} cy={17 + pupilDy} r="1.5" fill="rgba(255,255,255,0.9)" />
        </g>
        <g style={{ transform: blink ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "24px 17px" }}>
          <circle cx="24" cy="17" r="3.5" fill="rgba(167,139,250,0.9)" />
          <circle cx={24 + pupilDx} cy={17 + pupilDy} r="1.5" fill="rgba(255,255,255,0.9)" />
        </g>
      </g>

      {/* Body */}
      <rect x="6" y="29" width="24" height="16" rx="4" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />

      {/* Screen on body */}
      <rect x="13" y="33" width="10" height="2" rx="1" fill="rgba(167,139,250,0.5)">
        <animate attributeName="width" values="10;6;10" dur="1.5s" repeatCount="indefinite" />
      </rect>
      <rect x="13" y="36.5" width="7" height="2" rx="1" fill="rgba(167,139,250,0.35)">
        <animate attributeName="width" values="7;10;7" dur="1.8s" repeatCount="indefinite" />
      </rect>
      <rect x="13" y="40" width="5" height="2" rx="1" fill="rgba(167,139,250,0.25)">
        <animate attributeName="width" values="5;8;5" dur="2.1s" repeatCount="indefinite" />
      </rect>

      {/* Legs */}
      <rect x="9" y={46 + legOffsetL} width="6" height="6" rx="2" fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
      <rect x="21" y={46 + legOffsetR} width="6" height="6" rx="2" fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />

      {/* Shadow */}
      <ellipse cx="18" cy="54" rx={isWalking ? 8 : 10} ry="2" fill="rgba(139,92,246,0.15)" />

      {/* Thinking dots */}
      {isThinking && (
        <g>
          <circle cx="24" cy="-4" r="1.5" fill="rgba(196,181,253,0.8)">
            <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="28" cy="-7" r="1.5" fill="rgba(196,181,253,0.6)">
            <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="32" cy="-10" r="1.5" fill="rgba(196,181,253,0.4)">
            <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
});
BotSvg.displayName = "BotSvg";

/* ─── Position calculator ───────────────────────────── */
function getPosition(
  side: Side,
  progress: number,
  isMobile: boolean
): { x: number; y: number } {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const pad = 60;
  const botW = 36;
  const botH = 52;

  if (isMobile) {
    // only bottom
    return { x: pad + progress * (vw - pad * 2 - botW), y: vh - botH - 8 };
  }

  switch (side) {
    case "bottom":
      return { x: pad + progress * (vw - pad * 2 - botW), y: vh - botH - 8 };
    case "right":
      return { x: vw - botW - 8, y: vh - pad - botH - progress * (vh - pad * 2 - botH) };
    case "top":
      return { x: vw - pad - botW - progress * (vw - pad * 2 - botW), y: 8 };
    case "left":
      return { x: 8, y: pad + progress * (vh - pad * 2 - botH) };
  }
}

function getSideLength(side: Side, isMobile: boolean): number {
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  if (isMobile) return vw - 120;
  return side === "bottom" || side === "top" ? vw - 120 : vh - 120;
}

/* ─── Main Component ────────────────────────────────── */
const BorderBot = memo(() => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const controls = useAnimationControls();
  const [hidden, setHidden] = useState(() => localStorage.getItem("hideBot") === "true");
  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout>>();
  const stepRef = useRef(0);
  const [step, setStep] = useState(0);
  const abortRef = useRef(false);
  const isRunning = useRef(false);

  const [state, dispatch] = useReducer(reducer, {
    botState: "walking",
    side: "bottom",
    facing: "right",
    progress: 0,
  });

  // Hide on result pages
  if (location.pathname.includes("/result/")) return null;
  if (hidden) return null;

  const handleTripleClick = useCallback(() => {
    clickCount.current++;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (clickCount.current >= 3) {
      clickCount.current = 0;
      localStorage.setItem("hideBot", "true");
      setHidden(true);
      return;
    }
    clickTimer.current = setTimeout(() => {
      clickCount.current = 0;
    }, 500);
  }, []);

  /* ─── Movement loop ──────────────────────────────── */
  const runLoop = useCallback(async () => {
    if (isRunning.current) return;
    isRunning.current = true;
    abortRef.current = false;

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        const t = setTimeout(resolve, ms);
        // Store for potential cleanup
        if (abortRef.current) { clearTimeout(t); resolve(); }
      });

    while (!abortRef.current) {
      // Decide if we stop mid-side
      const shouldStop = Math.random() < 0.3;
      const stopAt = shouldStop ? 0.3 + Math.random() * 0.4 : 1;
      const speed = 80 + Math.random() * 40; // px/sec
      const currentSide = state.side;
      const sideLen = getSideLength(currentSide, isMobile);

      // Walk to stopAt or end
      dispatch({ type: "WALK" });
      const walkDist = stopAt * sideLen;
      const duration = walkDist / speed;

      const targetPos = getPosition(
        currentSide,
        stopAt,
        isMobile
      );

      // Step animation
      const stepInterval = setInterval(() => {
        stepRef.current++;
        setStep(stepRef.current);
      }, 250);

      await controls.start({
        x: targetPos.x,
        y: targetPos.y,
        transition: { duration, ease: "linear" },
      });

      clearInterval(stepInterval);
      dispatch({ type: "SET_PROGRESS", progress: stopAt });

      if (abortRef.current) break;

      // If stopped mid-side
      if (shouldStop && stopAt < 1) {
        const isThinking = Math.random() < 0.33;
        if (isThinking) {
          dispatch({ type: "THINK" });
          await sleep(1000 + Math.random() * 1000);
        } else {
          dispatch({ type: "LOOK" });
          await sleep(2000 + Math.random() * 2000);
        }

        if (abortRef.current) break;

        // Continue to end of side
        dispatch({ type: "WALK" });
        const remainDist = (1 - stopAt) * sideLen;
        const remainDur = remainDist / speed;

        const endPos = getPosition(currentSide, 1, isMobile);

        const stepInterval2 = setInterval(() => {
          stepRef.current++;
          setStep(stepRef.current);
        }, 250);

        await controls.start({
          x: endPos.x,
          y: endPos.y,
          transition: { duration: remainDur, ease: "linear" },
        });

        clearInterval(stepInterval2);
      }

      if (abortRef.current) break;

      // Corner pause
      dispatch({ type: "STOP" });
      await sleep(500);

      if (abortRef.current) break;

      // Next side (mobile stays on bottom, reverses)
      if (isMobile) {
        // Reverse direction on mobile
        dispatch({ type: "SET_PROGRESS", progress: 0 });
        const startPos = getPosition("bottom", 0, true);
        await controls.start({
          x: startPos.x,
          y: startPos.y,
          transition: { duration: 0.3 },
        });
      } else {
        dispatch({ type: "NEXT_SIDE" });
        // Snap to start of next side
        const nextIdx = (SIDES.indexOf(currentSide) + 1) % 4;
        const nextSide = SIDES[nextIdx];
        const startPos = getPosition(nextSide, 0, false);
        await controls.start({
          x: startPos.x,
          y: startPos.y,
          transition: { duration: 0.3 },
        });
      }
    }

    isRunning.current = false;
  }, [controls, isMobile, state.side]);

  useEffect(() => {
    if (hidden) return;
    // Set initial position
    const initPos = getPosition("bottom", 0, isMobile);
    controls.set({ x: initPos.x, y: initPos.y });

    // Small delay before starting
    const t = setTimeout(() => runLoop(), 1000);
    return () => {
      abortRef.current = true;
      clearTimeout(t);
    };
  }, [hidden, isMobile]); // eslint-disable-line react-hooks/exhaustive-deps

  const bodyRotate = state.botState === "walking"
    ? ["-2deg", "2deg", "-2deg"]
    : "0deg";

  return (
    <motion.div
      animate={controls}
      onClick={handleTripleClick}
      style={{
        position: "fixed",
        zIndex: 9999,
        willChange: "transform",
        pointerEvents: "auto",
        cursor: "pointer",
        width: 36,
        height: 56,
      }}
    >
      <motion.div
        animate={{ rotate: bodyRotate }}
        transition={
          state.botState === "walking"
            ? { duration: 0.4, repeat: Infinity, repeatType: "mirror" }
            : { duration: 0.2 }
        }
      >
        <BotSvg
          facing={state.facing}
          isWalking={state.botState === "walking"}
          isThinking={state.botState === "thinking"}
          step={step}
        />
      </motion.div>
    </motion.div>
  );
});

BorderBot.displayName = "BorderBot";
export default BorderBot;
