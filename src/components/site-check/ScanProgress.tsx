import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, AlignLeft, Bot, Code, Star, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

const steps = [
  { icon: Search, label: "Краулинг страницы", desc: "Загружаем и анализируем HTML...", done: "HTML загружен и проанализирован" },
  { icon: FileText, label: "Индексируемость", desc: "Проверяем доступность для поисковиков...", done: "Страница индексируется" },
  { icon: AlignLeft, label: "Структура контента", desc: "Анализируем заголовки, текст, списки...", done: "Структура проанализирована" },
  { icon: Bot, label: "AI-готовность", desc: "llms.txt, FAQ, структурированность...", done: "AI-сигналы собраны" },
  { icon: Code, label: "Schema.org разметка", desc: "JSON-LD, микроразметка...", done: "Разметка проверена" },
  { icon: Star, label: "E-E-A-T сигналы", desc: "Экспертность, авторитетность, доверие...", done: "E-E-A-T оценён" },
];

const STEP_DELAYS = [2500, 3000, 3500, 3000, 2500, 2000];

const progressStages = [
  { min: 0,  max: 20,  label: 'Загрузка страницы',    icon: '🌐' },
  { min: 20, max: 40,  label: 'Технический SEO',      icon: '⚙️' },
  { min: 40, max: 60,  label: 'Schema.org анализ',    icon: '📋' },
  { min: 60, max: 80,  label: 'E-E-A-T и контент',    icon: '✍️' },
  { min: 80, max: 95,  label: 'AI Score расчёт',      icon: '🤖' },
  { min: 95, max: 100, label: 'Формирование отчёта',  icon: '📊' },
];

interface ScanProgressProps {
  onComplete: () => void;
  realProgress?: number;
  error?: string | null;
  domain?: string;
}

const ScanProgress = ({ onComplete, realProgress, error, domain }: ScanProgressProps) => {
  const [simStep, setSimStep] = useState(0);
  const [allDone, setAllDone] = useState(false);

  // Simulated step progression (independent of API)
  useEffect(() => {
    if (allDone || error) return;
    if (simStep >= steps.length) return;
    const t = setTimeout(() => setSimStep((s) => s + 1), STEP_DELAYS[simStep] ?? 2500);
    return () => clearTimeout(t);
  }, [simStep, allDone, error]);

  // When real progress hits 100 — mark all done
  useEffect(() => {
    if (realProgress !== undefined && realProgress >= 100 && !allDone) {
      setAllDone(true);
      setSimStep(steps.length);
      const t = setTimeout(onComplete, 800);
      return () => clearTimeout(t);
    }
  }, [realProgress, allDone, onComplete]);

  // If simulation finishes before API — just wait
  const currentStep = allDone ? steps.length : simStep;
  const progress = allDone ? 100 : realProgress ?? Math.min((currentStep / steps.length) * 100, 95);
  const currentStage =
    progressStages.find((s) => progress >= s.min && progress <= s.max) ??
    progressStages[progressStages.length - 1];

  return (
    <div className="space-y-6 max-w-xl mx-auto">
      {/* Header */}
      {domain && (
        <motion.p
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center text-lg font-semibold text-foreground"
        >
          Анализируем <span className="text-primary">{domain}</span>...
        </motion.p>
      )}

      {/* Steps list */}
      <div className="space-y-2">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < currentStep;
          const isActive = i === currentStep && !allDone && !error;
          const isError = i === currentStep && !!error;
          const isFuture = i > currentStep;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-300 ${
                isError
                  ? "bg-destructive/10 border border-destructive/30"
                  : isDone
                  ? "bg-card/40 opacity-70"
                  : isActive
                  ? "bg-primary/5 border border-primary/20"
                  : "bg-card/20 opacity-40"
              }`}
            >
              {/* Status icon */}
              <div className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center">
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

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${
                  isError ? "text-destructive" : isDone ? "text-foreground" : isActive ? "text-foreground" : "text-muted-foreground/50"
                }`}>
                  {step.label}
                </p>
                <p className={`text-xs ${
                  isError ? "text-destructive/70" : isDone ? "text-green-500/80" : isActive ? "text-muted-foreground" : "text-muted-foreground/30"
                }`}>
                  {isError ? error : isDone ? `✓ ${step.done}` : isActive ? step.desc : ""}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Прогресс</span>
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
        <p className="text-xs text-muted-foreground text-center">
          Обычно проверка занимает 15–30 секунд
        </p>
      </div>
    </div>
  );
};

export default ScanProgress;
