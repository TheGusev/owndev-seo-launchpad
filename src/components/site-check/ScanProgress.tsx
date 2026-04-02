import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Brain, FileText, CheckCircle2, Loader2, AlertCircle } from "lucide-react";

const steps = [
  { icon: Globe, label: "Сканируем сайт", description: "Загрузка HTML, проверка доступности" },
  { icon: Brain, label: "Анализируем контент", description: "SEO-факторы, Schema.org, мета-теги" },
  { icon: Brain, label: "AI‑анализ", description: "LLM Score, AI-видимость, E‑E‑A‑T" },
  { icon: FileText, label: "Генерируем отчёт", description: "Конкуренты, рекомендации, баллы" },
];

interface ScanProgressProps {
  onComplete: () => void;
  realProgress?: number;
  error?: string | null;
}

const ScanProgress = ({ onComplete, realProgress, error }: ScanProgressProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Map real progress (0-100) to steps (0-3)
  useEffect(() => {
    if (realProgress !== undefined) {
      if (realProgress >= 100) {
        setCurrentStep(steps.length);
        const t = setTimeout(onComplete, 600);
        return () => clearTimeout(t);
      }
      const stepIndex = Math.min(Math.floor((realProgress / 100) * steps.length), steps.length - 1);
      setCurrentStep(stepIndex);
    }
  }, [realProgress, onComplete]);

  // Fallback: simulate steps if no realProgress
  useEffect(() => {
    if (realProgress !== undefined) return;
    if (currentStep >= steps.length) {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
    const delays = [3000, 4000, 3000, 2000];
    const t = setTimeout(() => setCurrentStep((s) => s + 1), delays[currentStep] ?? 2000);
    return () => clearTimeout(t);
  }, [currentStep, onComplete, realProgress]);

  const progress = realProgress ?? Math.min((currentStep / steps.length) * 100, 100);
  const errorStep = error ? currentStep : -1;

  return (
    <div className="glass rounded-2xl p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      {/* Horizontal stepper */}
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const Icon = step.icon;
          const isDone = i < currentStep && !error;
          const isActive = i === currentStep;
          const isError = i === errorStep && !!error;
          const isFuture = i > currentStep;

          return (
            <div key={i} className="flex items-center flex-1 last:flex-initial">
              <div className="flex flex-col items-center gap-1.5 min-w-0">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                    isError
                      ? "bg-destructive/20 border-2 border-destructive"
                      : isDone
                      ? "bg-green-500/20 border-2 border-green-500"
                      : isActive
                      ? "bg-primary/20 border-2 border-primary"
                      : "bg-muted/20 border-2 border-border/50"
                  }`}
                >
                  {isError ? (
                    <AlertCircle className="w-5 h-5 text-destructive" />
                  ) : isDone ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : isActive ? (
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <Icon className="w-5 h-5 text-primary" />
                    </motion.div>
                  ) : (
                    <Icon className="w-5 h-5 text-muted-foreground/50" />
                  )}
                </div>
                <span
                  className={`text-xs font-medium text-center hidden sm:block ${
                    isError ? "text-destructive" : isDone ? "text-green-500" : isActive ? "text-foreground" : "text-muted-foreground/50"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-2 rounded-full bg-border/30 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isDone ? "bg-green-500 w-full" : isActive ? "bg-primary w-1/2" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Прогресс</span>
          <span className="font-mono">{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 rounded-full bg-muted/30 overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Current step description */}
      <AnimatePresence mode="wait">
        <motion.div
          key={error ? "error" : currentStep}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-center space-y-1"
        >
          {error ? (
            <p className="text-sm text-destructive font-medium">{error}</p>
          ) : currentStep < steps.length ? (
            <>
              <p className="text-sm text-foreground font-medium flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                {steps[currentStep].description}...
              </p>
              <p className="text-xs text-muted-foreground">
                Обычно проверка занимает 15–30 секунд
              </p>
            </>
          ) : (
            <p className="text-sm text-green-500 font-medium flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Готово! Переходим к результатам...
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default ScanProgress;
