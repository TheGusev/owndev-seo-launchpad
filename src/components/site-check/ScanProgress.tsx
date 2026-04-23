import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Globe, Brain, FileText, Cpu, Key, CheckCircle2,
  Loader2, AlertCircle, Clock,
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NeuralNetworkBg } from "@/components/ui/neural-network-bg";

type Stage = {
  pct: number;
  label: string;
  desc: string;
  icon: typeof Play;
  slow?: boolean;
  slowHint?: string;
  subSteps?: string[];
};

// Sprint 9 — те же 6 этапов + sub-steps в стиле терминала.
const stages: Stage[] = [
  {
    pct: 5, label: "Запуск", desc: "Инициализация проверки", icon: Play,
    subSteps: ["resolve DNS...", "init scan_id", "check rate-limit"],
  },
  {
    pct: 15, label: "Загрузка и заголовки", desc: "HTML, redirects, HTTPS, кэш, безопасность", icon: Globe,
    subSteps: ["GET / → 200", "trace redirects (max 10)", "TLS handshake · HSTS", "parse response headers", "check cache-control"],
  },
  {
    pct: 35, label: "Технические файлы", desc: "robots.txt, sitemap.xml, llms.txt, security.txt", icon: FileText,
    subSteps: ["fetch /robots.txt", "check AI bots: GPTBot, Claude, Perplexity", "fetch /sitemap.xml", "fetch /llms.txt + /llms-full.txt", "fetch /.well-known/security.txt"],
  },
  {
    pct: 55, label: "Глубокий анализ HTML", desc: "Schema.org, контент, ресурсы, GEO/CRO сигналы", icon: Cpu,
    subSteps: ["parse <head> · meta · canonical", "count H1/H2/H3 · word count", "extract Schema.org JSON-LD", "scan resources · images · scripts", "detect GEO signals (E-E-A-T)", "detect CRO signals (CTA, forms)"],
  },
  {
    pct: 75, label: "AI-анализ темы и контента", desc: "Один LLM-запрос на тематику и качество", icon: Brain, slow: true, slowHint: "AI-запрос к LLM, обычно 5–10 сек",
    subSteps: ["build prompt · 1 LLM call", "classify category", "score content quality", "extract topics"],
  },
  {
    pct: 95, label: "Расчёт скоров", desc: "GEO / SEO / CRO + сравнение с эталоном категории", icon: Key,
    subSteps: ["calc GEO score (7 components)", "calc SEO score (5 components)", "calc CRO score (6 components)", "compare to category benchmark", "build issues + priority"],
  },
  { pct: 100, label: "Готово", desc: "Сохраняем результат", icon: CheckCircle2 },
];

interface ScanProgressProps {
  onComplete: () => void;
  realProgress?: number;
  error?: string | null;
  domain?: string;
  startedAt?: number;
  /** When true, the animation is replaced with a brief "loading saved result" spinner. */
  cached?: boolean;
}

const formatElapsed = (ms: number) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
};

/** Бегущий тикер sub-steps в стиле терминала. */
const SubstepTicker = ({ steps, isMobile }: { steps: string[]; isMobile: boolean }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (!steps?.length) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % steps.length), 900);
    return () => clearInterval(t);
  }, [steps]);
  if (!steps?.length) return null;
  const visibleCount = isMobile ? 1 : 2;
  const visible = Array.from({ length: visibleCount }, (_, k) => steps[(idx + k) % steps.length]);
  return (
    <div className="mt-1.5 font-mono text-[11px] leading-snug overflow-hidden">
      <AnimatePresence mode="popLayout" initial={false}>
        {visible.map((line, i) => (
          <motion.div
            key={`${idx}-${i}-${line}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: i === 0 ? 1 : 0.55, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            className="text-primary/85 truncate"
          >
            <span className="text-muted-foreground/60">▸ </span>
            {line}
            {i === 0 && <span className="ml-0.5 text-primary animate-pulse">▮</span>}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const ScanProgress = ({ onComplete, realProgress = 0, error, domain, startedAt, cached = false }: ScanProgressProps) => {
  const realPct = Math.min(100, Math.max(0, realProgress));

  // ── Smoothing: displayProgress lerps к realPct, не быстрее 12%/сек ──
  // (≈8 сек на полный бар — даже если бэк отдаёт 100% сразу, шкала не «улетает»)
  const [displayProgress, setDisplayProgress] = useState(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());
  useEffect(() => {
    const MAX_PER_SEC = 12; // % в секунду
    const tick = (t: number) => {
      const dt = Math.max(0, (t - lastTickRef.current) / 1000);
      lastTickRef.current = t;
      setDisplayProgress((cur) => {
        if (cur >= realPct) return cur;
        const step = MAX_PER_SEC * dt;
        return Math.min(realPct, cur + step);
      });
      rafRef.current = requestAnimationFrame(tick);
    };
    lastTickRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [realPct]);

  const progress = displayProgress;

  // ── Mobile detection ──
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Track when realProgress last changed (heartbeat)
  const [lastUpdateAt, setLastUpdateAt] = useState<number>(() => Date.now());
  const prevProgressRef = useRef<number>(realPct);
  useEffect(() => {
    if (realPct !== prevProgressRef.current) {
      prevProgressRef.current = realPct;
      setLastUpdateAt(Date.now());
    }
  }, [realPct]);

  // Tick every second for elapsed counters
  const [now, setNow] = useState<number>(() => Date.now());
  useEffect(() => {
    if (realPct >= 100 || error) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [realPct, error]);

  // Trigger onComplete только когда РЕАЛЬНЫЙ progress=100 И displayProgress догнал
  useEffect(() => {
    if (realPct >= 100 && displayProgress >= 100) {
      const t = setTimeout(onComplete, 400);
      return () => clearTimeout(t);
    }
  }, [realPct, displayProgress, onComplete]);

  const elapsedTotalMs = startedAt ? now - startedAt : 0;
  const secondsSinceUpdate = Math.floor((now - lastUpdateAt) / 1000);

  // Determine active stage: first stage whose pct > progress
  const activeIndex = stages.findIndex((s) => progress < s.pct);
  const currentStageIndex = activeIndex === -1 ? stages.length - 1 : activeIndex;
  const currentStage = stages[currentStageIndex];

  // Honest cached fast-path: don't pretend we're scanning for 14 seconds.
  // Rendered AFTER all hooks to keep hook order stable.
  if (cached) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3 max-w-xl mx-auto relative">
        <NeuralNetworkBg className="-z-10 opacity-40 -m-6" density="low" />
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Загружаем сохранённый результат…</p>
        {domain && (
          <p className="text-xs text-muted-foreground/70">
            Этот домен сканировался недавно — показываем кэш
          </p>
        )}
      </div>
    );
  }

  // Visual progress stage label
  const stageLabelTop = error
    ? "Произошла ошибка"
    : progress >= 100
    ? "Готово"
    : `${currentStage.label}…`;

  return (
    <TooltipProvider delayDuration={150}>
      <div className="space-y-6 max-w-xl mx-auto relative">
        <NeuralNetworkBg className="-z-10 opacity-60 -m-6" density="medium" />
        {/* Header */}
        {domain && (
          <motion.p
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-lg font-semibold text-foreground"
          >
            Анализируем <span className="text-primary">{domain}</span>…
          </motion.p>
        )}

        {/* Steps list */}
        <div className="space-y-2">
          {stages.map((stage, i) => {
            const Icon = stage.icon;
            const isDone = progress >= stage.pct && !(i === stages.length - 1 && progress < 100);
            const isActive = !error && !isDone && i === currentStageIndex;
            const isError = !!error && i === currentStageIndex;
            const showLlmHeartbeat = isActive && stage.slow && secondsSinceUpdate >= 3;
            const showStuckWarning = isActive && secondsSinceUpdate > 90;

            const row = (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                className={`flex items-start gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                  isError
                    ? "bg-destructive/10 border border-destructive/30"
                    : isDone
                    ? "bg-card/40 opacity-70"
                    : isActive
                    ? "bg-primary/5 border border-primary/20"
                    : "bg-card/20 opacity-40"
                }`}
              >
                <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-0.5">
                  {isError ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : isActive ? (
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                  ) : (
                    <Icon className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p
                      className={`text-sm font-medium ${
                        isError
                          ? "text-destructive"
                          : isDone || isActive
                          ? "text-foreground"
                          : "text-muted-foreground/50"
                      }`}
                    >
                      {stage.label}
                    </p>
                    {stage.slow && (isActive || isFutureBadge(isDone, isActive)) && (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                        AI
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs ${
                      isError
                        ? "text-destructive/70"
                        : isDone
                        ? "text-green-500/80"
                        : isActive
                        ? "text-muted-foreground"
                        : "text-muted-foreground/30"
                    }`}
                  >
                    {isError ? error : isDone ? `✓ Готово` : isActive ? stage.desc : ""}
                  </p>

                  {/* Sub-steps ticker — только на активной стадии */}
                  {isActive && stage.subSteps && (
                    <SubstepTicker steps={stage.subSteps} isMobile={isMobile} />
                  )}

                  {/* Heartbeat for slow LLM stages */}
                  {showLlmHeartbeat && (
                    <p className="mt-1 text-xs text-primary/80 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 animate-pulse" />
                      Идёт уже {secondsSinceUpdate}s… LLM-запрос может занять до 60 сек
                    </p>
                  )}
                  {showStuckWarning && (
                    <p className="mt-1 text-xs text-amber-500">
                      Дольше обычного, продолжаем ждать…
                    </p>
                  )}
                </div>
              </motion.div>
            );

            return stage.slow && stage.slowHint ? (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div>{row}</div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  {stage.slowHint}
                </TooltipContent>
              </Tooltip>
            ) : (
              row
            );
          })}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{stageLabelTop}</span>
            <span className="font-mono">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
            <span>Обычно 15–30 секунд</span>
            {startedAt && (
              <span className="font-mono tabular-nums">
                Идёт: {formatElapsed(elapsedTotalMs)}
              </span>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

// helper: keep AI badge visible on done slow steps too (subtle)
const isFutureBadge = (isDone: boolean, isActive: boolean) => isDone || isActive;

export default ScanProgress;
