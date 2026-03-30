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
  progress: number;
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
  bottom: "right", right: "up", top: "left", left: "down",
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "WALK": return { ...state, botState: "walking" };
    case "STOP": return { ...state, botState: "stopping" };
    case "LOOK": return { ...state, botState: "looking" };
    case "THINK": return { ...state, botState: "thinking" };
    case "NEXT_SIDE": {
      const idx = (SIDES.indexOf(state.side) + 1) % 4;
      return { ...state, side: SIDES[idx], facing: SIDE_FACING[SIDES[idx]], progress: 0 };
    }
    case "SET_PROGRESS": return { ...state, progress: action.progress };
    default: return state;
  }
}

/* ─── SVG Robot ─────────────────────────────────────── */
const BotSvg = memo(({ facing, isWalking, isThinking, step }: {
  facing: Facing; isWalking: boolean; isThinking: boolean; step: number;
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

  const pupilDx = facing === "left" ? -1 : facing === "right" ? 1 : 0;
  const pupilDy = facing === "up" ? -1 : facing === "down" ? 1 : 0;
  const legL = isWalking ? (step % 2 === 0 ? -3 : 0) : 0;
  const legR = isWalking ? (step % 2 === 0 ? 0 : -3) : 0;

  return (
    <svg width="36" height="56" viewBox="0 0 36 56" fill="none">
      {/* Antenna */}
      <line x1="18" y1="6" x2="18" y2="0" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />
      <circle cx="18" cy="0" r="2" fill="rgba(167,139,250,0.9)">
        <animate attributeName="opacity" values={isThinking ? "1;0.2;1" : "1;0.3;1"} dur={isThinking ? "0.3s" : "2s"} repeatCount="indefinite" />
      </circle>

      {/* Head */}
      <rect x="4" y="6" width="28" height="22" rx="6" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.6)" strokeWidth="1.5" />

      {/* Eyes */}
      <g style={{ transform: blink ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "12px 17px", transition: "transform 0.08s" }}>
        <circle cx="12" cy="17" r="3.5" fill="rgba(167,139,250,0.9)" />
        <circle cx={12 + pupilDx} cy={17 + pupilDy} r="1.5" fill="rgba(255,255,255,0.9)" />
      </g>
      <g style={{ transform: blink ? "scaleY(0.1)" : "scaleY(1)", transformOrigin: "24px 17px", transition: "transform 0.08s" }}>
        <circle cx="24" cy="17" r="3.5" fill="rgba(167,139,250,0.9)" />
        <circle cx={24 + pupilDx} cy={17 + pupilDy} r="1.5" fill="rgba(255,255,255,0.9)" />
      </g>

      {/* Body */}
      <rect x="6" y="29" width="24" height="16" rx="4" fill="rgba(139,92,246,0.1)" stroke="rgba(139,92,246,0.4)" strokeWidth="1.5" />

      {/* Screen */}
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
      <rect x="9" y={46 + legL} width="6" height="6" rx="2" fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />
      <rect x="21" y={46 + legR} width="6" height="6" rx="2" fill="rgba(139,92,246,0.2)" stroke="rgba(139,92,246,0.4)" strokeWidth="1" />

      {/* Shadow */}
      <ellipse cx="18" cy="54" rx={isWalking ? 8 : 10} ry="2" fill="rgba(139,92,246,0.15)" />

      {/* Thinking dots */}
      {isThinking && (
        <g>
          <circle cx="26" cy="-2" r="1.5" fill="rgba(196,181,253,0.8)">
            <animate attributeName="opacity" values="0;1;0" dur="1.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="30" cy="-5" r="1.5" fill="rgba(196,181,253,0.6)">
            <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="0.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="34" cy="-8" r="1.5" fill="rgba(196,181,253,0.4)">
            <animate attributeName="opacity" values="0;1;0" dur="1.2s" begin="0.4s" repeatCount="indefinite" />
          </circle>
        </g>
      )}
    </svg>
  );
});
BotSvg.displayName = "BotSvg";

/* ─── Position helpers ──────────────────────────────── */
function getPos(side: Side, progress: number, mobile: boolean) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const pad = 60;

  if (mobile) {
    return { x: pad + progress * (vw - pad * 2 - 36), y: vh - 64 };
  }
  switch (side) {
    case "bottom": return { x: pad + progress * (vw - pad * 2 - 36), y: vh - 64 };
    case "right":  return { x: vw - 44, y: vh - pad - 56 - progress * (vh - pad * 2 - 56) };
    case "top":    return { x: vw - pad - 36 - progress * (vw - pad * 2 - 36), y: 8 };
    case "left":   return { x: 8, y: pad + progress * (vh - pad * 2 - 56) };
  }
}

function sideLen(side: Side, mobile: boolean) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (mobile) return vw - 120;
  return side === "bottom" || side === "top" ? vw - 120 : vh - 120;
}

/* ─── Main Component ────────────────────────────────── */
const BorderBot = memo(() => {
  const location = useLocation();
  const isMobile = useIsMobile();
  const controls = useAnimationControls();
  const [hidden, setHidden] = useState(() => localStorage.getItem("hideBot") === "true");
  const [step, setStep] = useState(0);
  const [state, dispatch] = useReducer(reducer, {
    botState: "walking", side: "bottom", facing: "right", progress: 0,
  });

  const clickCount = useRef(0);
  const clickTimer = useRef<ReturnType<typeof setTimeout>>();
  const stepRef = useRef(0);
  const abortRef = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;

  const shouldHide = hidden || location.pathname.includes("/result/");

  const handleTripleClick = useCallback(() => {
    clickCount.current++;
    if (clickTimer.current) clearTimeout(clickTimer.current);
    if (clickCount.current >= 3) {
      clickCount.current = 0;
      localStorage.setItem("hideBot", "true");
      setHidden(true);
      return;
    }
    clickTimer.current = setTimeout(() => { clickCount.current = 0; }, 500);
  }, []);

  useEffect(() => {
    if (shouldHide) return;

    abortRef.current = false;
    const initPos = getPos("bottom", 0, isMobile);
    controls.set({ x: initPos.x, y: initPos.y });

    const sleep = (ms: number) => new Promise<void>((res) => {
      const t = setTimeout(res, ms);
      // check abort after timeout
      if (abortRef.current) { clearTimeout(t); res(); }
    });

    let stepInterval: ReturnType<typeof setInterval> | null = null;

    const startSteps = () => {
      stepInterval = setInterval(() => { stepRef.current++; setStep(stepRef.current); }, 250);
    };
    const stopSteps = () => { if (stepInterval) { clearInterval(stepInterval); stepInterval = null; } };

    const loop = async () => {
      let currentSide: Side = "bottom";

      while (!abortRef.current) {
        const shouldStop = Math.random() < 0.3;
        const stopAt = shouldStop ? 0.3 + Math.random() * 0.4 : 1;
        const speed = 80 + Math.random() * 40;
        const len = sideLen(currentSide, isMobile);

        dispatch({ type: "WALK" });
        startSteps();

        const walkDist = stopAt * len;
        const dur = walkDist / speed;
        const target = getPos(currentSide, stopAt, isMobile);

        await controls.start({ x: target.x, y: target.y, transition: { duration: dur, ease: "linear" } });
        stopSteps();

        if (abortRef.current) break;

        if (shouldStop && stopAt < 1) {
          if (Math.random() < 0.33) {
            dispatch({ type: "THINK" });
            await sleep(1000 + Math.random() * 1000);
          } else {
            dispatch({ type: "LOOK" });
            await sleep(2000 + Math.random() * 2000);
          }
          if (abortRef.current) break;

          dispatch({ type: "WALK" });
          startSteps();
          const remainDur = ((1 - stopAt) * len) / speed;
          const endPos = getPos(currentSide, 1, isMobile);
          await controls.start({ x: endPos.x, y: endPos.y, transition: { duration: remainDur, ease: "linear" } });
          stopSteps();
        }

        if (abortRef.current) break;

        // Corner pause
        dispatch({ type: "STOP" });
        await sleep(500);
        if (abortRef.current) break;

        // Next side
        if (isMobile) {
          // Bounce back
          const startPos = getPos("bottom", 0, true);
          await controls.start({ x: startPos.x, y: startPos.y, transition: { duration: 0.5 } });
        } else {
          const nextIdx = (SIDES.indexOf(currentSide) + 1) % 4;
          currentSide = SIDES[nextIdx];
          dispatch({ type: "NEXT_SIDE" });
          const startPos = getPos(currentSide, 0, false);
          await controls.start({ x: startPos.x, y: startPos.y, transition: { duration: 0.3 } });
        }
      }
    };

    const t = setTimeout(loop, 1500);
    return () => {
      abortRef.current = true;
      clearTimeout(t);
      stopSteps();
    };
  }, [shouldHide, isMobile, controls]);

  if (shouldHide) return null;

  const bodyRotate = state.botState === "walking" ? ["-2deg", "2deg", "-2deg"] : "0deg";

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
            ? { duration: 0.4, repeat: Infinity, repeatType: "mirror" as const }
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
