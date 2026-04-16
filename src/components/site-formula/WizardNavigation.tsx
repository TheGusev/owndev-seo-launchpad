import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  isStepValid: boolean;
  loading: boolean;
  onBack: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export default function WizardNavigation({
  currentStep,
  totalSteps,
  isStepValid,
  loading,
  onBack,
  onNext,
  onSubmit,
}: WizardNavigationProps) {
  const isLast = currentStep === totalSteps;

  return (
    <div className="flex items-center justify-between pt-6 border-t border-border">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={currentStep <= 1 || loading}
        className="gap-2"
      >
        <ArrowLeft className="h-4 w-4" /> Назад
      </Button>

      {isLast ? (
        <Button
          onClick={onSubmit}
          disabled={!isStepValid || loading}
          className="gap-2 bg-gradient-to-r from-primary to-accent text-primary-foreground hover:opacity-90"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Анализируем...</>
          ) : (
            <><Sparkles className="h-4 w-4" /> Получить формулу</>
          )}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={!isStepValid || loading}
          className="gap-2"
        >
          Далее <ArrowRight className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
