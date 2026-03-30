import { useEffect, useState } from "react";
import { Loader2, CheckCircle2 } from "lucide-react";

const steps = [
  "Анализируем SEO‑параметры",
  "Рассчитываем LLM Score",
  "Собираем топ-10 конкурентов",
  "Генерируем ключевые слова",
  "Подбираем минус-слова",
  "Составляем план оптимизации",
  "Финализация GEO‑отчёта",
];

interface ScanProgressProps {
  onComplete: () => void;
  realProgress?: number;
}

const ScanProgress = ({ onComplete, realProgress }: ScanProgressProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  // Map real progress (0-100) to steps
  useEffect(() => {
    if (realProgress !== undefined) {
      if (realProgress >= 100) {
        setCurrentStep(steps.length);
        return;
      }
      const stepIndex = Math.min(Math.floor((realProgress / 100) * steps.length), steps.length - 1);
      setCurrentStep(stepIndex);
    }
  }, [realProgress]);

  // Fallback: animate steps if no realProgress
  useEffect(() => {
    if (realProgress !== undefined) return;
    if (currentStep >= steps.length) {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCurrentStep((s) => s + 1), 1200 + Math.random() * 800);
    return () => clearTimeout(t);
  }, [currentStep, onComplete, realProgress]);

  const progress = realProgress ?? Math.min((currentStep / steps.length) * 100, 100);

  return (
    <div className="space-y-6">
      <div className="h-2 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={i} className="flex items-center gap-3 text-sm">
            {i < currentStep ? (
              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            ) : i === currentStep ? (
              <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-border/50 shrink-0" />
            )}
            <span className={i <= currentStep ? "text-foreground" : "text-muted-foreground"}>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScanProgress;
