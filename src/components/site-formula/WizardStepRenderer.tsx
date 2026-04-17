import type { WizardQuestion } from '@/lib/api/siteFormula';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface WizardStepRendererProps {
  questions: WizardQuestion[];
  answers: Record<string, string | string[]>;
  onAnswer: (questionId: string, value: string | string[]) => void;
}

export default function WizardStepRenderer({ questions, answers, onAnswer }: WizardStepRendererProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      {questions.map((q) => (
        <div key={q.id} className="space-y-3">
          <h3 className="text-base sm:text-lg font-semibold text-foreground">{q.label}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {q.options.map((opt) => {
              const selected = q.type === 'multi'
                ? (Array.isArray(answers[q.id]) ? (answers[q.id] as string[]).includes(opt.value) : false)
                : answers[q.id] === opt.value;

              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (q.type === 'multi') {
                      const current = Array.isArray(answers[q.id]) ? [...(answers[q.id] as string[])] : [];
                      if (current.includes(opt.value)) {
                        onAnswer(q.id, current.filter(v => v !== opt.value));
                      } else {
                        onAnswer(q.id, [...current, opt.value]);
                      }
                    } else {
                      onAnswer(q.id, opt.value);
                    }
                  }}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg border p-4 sm:p-4 text-left transition-all duration-200 min-h-[56px]',
                    'hover:border-primary/50 hover:bg-primary/5 active:scale-[0.99]',
                    selected
                      ? 'border-primary bg-primary/10 shadow-[0_0_12px_hsl(var(--primary)/0.15)]'
                      : 'border-border bg-card'
                  )}
                >
                  <div className={cn(
                    'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    selected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                  )}>
                    {selected && <Check className="h-3 w-3" />}
                  </div>
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              );
            })}
          </div>
          {q.type === 'multi' && (
            <p className="text-xs text-muted-foreground">Можно выбрать несколько вариантов</p>
          )}
        </div>
      ))}
    </div>
  );
}
