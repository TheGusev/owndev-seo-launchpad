import React, { useEffect, useState } from 'react';
import { Brain, AlertTriangle, Info, Loader2, RefreshCw, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface AiSystem {
  id: string;
  name: string;
  icon: string;
  color: string;
  // Backend may return null when a model failed (timeout / parse error / quota).
  // We render "—" in that case instead of a misleading 0.
  score: number | null;
  verdict: string;
  reason: string;
  suggestions: string[];
  error?: string;
}

export interface LlmJudgeData {
  // null when ALL models failed or OPENAI_API_KEY is missing.
  // Frontend must show "—" — never substitute a stale or 0 value.
  avg_score: number | null;
  systems: AiSystem[];
  url?: string;
  domain?: string;
  systems_total?: number;
  systems_ok?: number;
  systems_failed?: number;
  error_code?: string;
  _pending?: boolean;
  _cached?: boolean;
}

interface LlmJudgeSectionProps {
  data: LlmJudgeData | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const scoreTextClass = (score: number | null) => {
  if (score === null || score === undefined) return 'text-muted-foreground';
  return score >= 70 ? 'text-success' : score >= 40 ? 'text-warning' : 'text-destructive';
};

const scoreBorderClass = (score: number | null) => {
  if (score === null || score === undefined) return 'border-muted/30 bg-muted/5';
  return score >= 70
    ? 'border-success/30 bg-success/5'
    : score >= 40
    ? 'border-warning/30 bg-warning/5'
    : 'border-destructive/30 bg-destructive/5';
};

const AnimatedCounter: React.FC<{ value: number }> = ({ value }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const target = Math.max(0, Math.min(100, Math.round(value || 0)));
    const start = performance.now();
    const duration = 900;
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(target * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);
  return <span>{display}</span>;
};

const SystemCard: React.FC<{ sys: AiSystem }> = ({ sys }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border p-4 transition-all ${scoreBorderClass(sys.score)}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: sys.color || 'hsl(var(--primary))' }}
            aria-hidden
          />
          <span className="text-sm font-semibold text-foreground truncate">{sys.name}</span>
        </div>
        <span className={`text-2xl font-bold font-mono ${scoreTextClass(sys.score)}`}>
          {sys.score === null || sys.score === undefined ? '—' : sys.score}
          <span className="text-xs text-muted-foreground font-normal">/100</span>
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{sys.verdict}</p>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
        aria-expanded={open}
      >
        Подробнее
        {open ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {open && (
        <div className="mt-3 pt-3 border-t border-border/60 space-y-3">
          {sys.reason && (
            <p className="text-xs text-foreground/80 leading-relaxed">{sys.reason}</p>
          )}
          {sys.suggestions?.length > 0 && (
            <ul className="space-y-1.5">
              {sys.suggestions.map((s, i) => (
                <li key={i} className="flex gap-1.5 text-xs">
                  <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-muted-foreground">{s}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

const LlmJudgeSection: React.FC<LlmJudgeSectionProps> = ({ data, loading, error, onRetry }) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Опрашиваем нейросети...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <AlertTriangle className="w-5 h-5 text-destructive" />
        <p className="text-sm text-destructive">{error}</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Повторить
          </Button>
        )}
      </div>
    );
  }

  if (!data || !data.systems?.length) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-3">
        <Brain className="w-8 h-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">AI-аудит ещё не запущен</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <Brain className="w-3.5 h-3.5" /> Запустить AI-проверку
          </Button>
        )}
      </div>
    );
  }

  const avg = data.avg_score;
  const avgIsNull = avg === null || avg === undefined;
  const avgClass = scoreTextClass(avg);
  const recommendation = avgIsNull
    ? 'Не удалось получить оценку AI-видимости. Проверьте соединение и повторите проверку.'
    : avg >= 70
    ? 'Отличная AI-видимость. Поддерживайте актуальность контента и мониторьте конкурентов.'
    : avg >= 40
    ? 'Частичная видимость. Усильте E-E-A-T, добавьте FAQ-контент, публикуйтесь на vc.ru, habr.com.'
    : 'Сайт почти невидим для нейросетей. Приоритет: llms.txt, Schema.org, экспертный контент, PR.';

  // Border tone for the big circle and the bottom card.
  const tone = avgIsNull
    ? { border: 'border-muted/40', bg: 'bg-muted/5' }
    : avg >= 70
    ? { border: 'border-success/40', bg: 'bg-success/5' }
    : avg >= 40
    ? { border: 'border-warning/40', bg: 'bg-warning/5' }
    : { border: 'border-destructive/40', bg: 'bg-destructive/5' };

  return (
    <section className="space-y-6">
      <div className="flex flex-col items-center text-center gap-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-base font-bold text-foreground">AI-видимость в нейросетях</h2>
        </div>

        <div
          className={`relative w-32 h-32 rounded-full border-4 flex items-center justify-center ${tone.border} ${tone.bg}`}
        >
          <div className={`text-4xl font-bold font-mono ${avgClass}`}>
            {avgIsNull ? '—' : <AnimatedCounter value={avg} />}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Средний балл AI-видимости
          {typeof data.systems_ok === 'number' && typeof data.systems_total === 'number' && data.systems_total > 0 && (
            <span className="ml-2 opacity-70">· {data.systems_ok}/{data.systems_total} моделей</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.systems.map((sys) => (
          <SystemCard key={sys.id} sys={sys} />
        ))}
      </div>

      <div
        className={`flex items-start gap-3 p-4 rounded-xl border ${
          avgIsNull
            ? 'border-muted/30 bg-muted/5'
            : avg >= 70
            ? 'border-success/20 bg-success/5'
            : avg >= 40
            ? 'border-warning/20 bg-warning/5'
            : 'border-destructive/20 bg-destructive/5'
        }`}
      >
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
        <p className="text-xs text-foreground">{recommendation}</p>
      </div>
    </section>
  );
};

export default LlmJudgeSection;