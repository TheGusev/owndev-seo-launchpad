import React from 'react';
import { Brain, AlertTriangle, Info, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiSystemResult {
  id: string;
  name: string;
  icon: string;
  color: string;
  score: number;
  verdict: string;
  reason: string;
  suggestions: string[];
}

interface LlmJudgeData {
  success: boolean;
  url: string;
  domain: string;
  avg_score: number;
  systems: AiSystemResult[];
}

interface LlmJudgeSectionProps {
  data: LlmJudgeData | null;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

const LlmJudgeSection = ({ data, loading, error, onRetry }: LlmJudgeSectionProps) => {
  const [expanded, setExpanded] = React.useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-10 gap-3">
        <Loader2 className="w-6 h-6 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Опрашиваем нейросети... это займёт ~15 секунд</p>
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
        <p className="text-sm text-muted-foreground">AI-аудит пока недоступен</p>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry} className="gap-2">
            <Brain className="w-3.5 h-3.5" /> Запустить AI-проверку
          </Button>
        )}
      </div>
    );
  }

  const scoreColor = (score: number) =>
    score >= 60 ? 'text-green-400' : score >= 30 ? 'text-yellow-400' : 'text-red-400';
  const scoreBg = (score: number) =>
    score >= 60 ? 'border-green-500/30 bg-green-500/5' : score >= 30 ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-red-500/30 bg-red-500/5';
  const avgColor = data.avg_score >= 60 ? 'text-green-400' : data.avg_score >= 30 ? 'text-yellow-400' : 'text-red-400';

  const recommendation = data.avg_score >= 60
    ? 'Отличная AI-видимость! Поддерживайте актуальность контента и мониторьте конкурентов.'
    : data.avg_score >= 30
    ? 'Частичная видимость. Усильте E-E-A-T, добавьте FAQ-контент, публикуйтесь на vc.ru, habr.com, dtf.ru.'
    : 'Ваш сайт невидим для нейросетей. Приоритет: llms.txt, Schema.org разметка, экспертный контент, PR на авторитетных площадках.';

  return (
    <section className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground">AI-видимость по нейросетям</h2>
        </div>
        <div className={`text-2xl font-bold font-mono ${avgColor}`}>
          {data.avg_score}<span className="text-sm text-muted-foreground font-normal">/100</span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {data.systems.map((sys) => (
          <button
            key={sys.id}
            onClick={() => setExpanded(expanded === sys.id ? null : sys.id)}
            className={`rounded-xl border p-4 text-left transition-all hover:scale-[1.02] ${scoreBg(sys.score)} ${expanded === sys.id ? 'ring-1 ring-primary/50' : ''}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-foreground">{sys.name}</span>
              <span className={`text-xl font-bold font-mono ${scoreColor(sys.score)}`}>{sys.score}</span>
            </div>
            <p className="text-[11px] text-muted-foreground line-clamp-1">{sys.verdict}</p>
            {expanded === sys.id && (
              <div className="mt-3 space-y-2 text-[11px]">
                <p className="text-foreground/80">{sys.reason}</p>
                {sys.suggestions?.length > 0 && (
                  <ul className="space-y-1">
                    {sys.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-1.5">
                        <span className="text-primary shrink-0">→</span>
                        <span className="text-muted-foreground">{s}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      <div className={`flex items-start gap-3 p-4 rounded-xl border ${
        data.avg_score >= 60 ? 'border-green-500/20 bg-green-500/5' :
        data.avg_score >= 30 ? 'border-yellow-500/20 bg-yellow-500/5' :
        'border-red-500/20 bg-red-500/5'
      }`}>
        <Info className="w-4 h-4 shrink-0 mt-0.5 text-muted-foreground" />
        <p className="text-xs text-foreground">{recommendation}</p>
      </div>
    </section>
  );
};

export default LlmJudgeSection;
