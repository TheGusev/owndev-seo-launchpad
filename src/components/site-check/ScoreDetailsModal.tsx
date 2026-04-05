import { useEffect, useCallback } from "react";
import { X, Check, AlertTriangle } from "lucide-react";
import {
  SEO_CRITERIA, LLM_CRITERIA, DIRECT_CRITERIA, SCHEMA_CRITERIA,
  OVERALL_WEIGHTS,
  type CriterionResult, type ScoreCriterion,
  computePotentialScore,
} from "@/utils/scoreCalculation";
import type { ScanScores } from "@/lib/site-check-types";
import { useIsMobile } from "@/hooks/use-mobile";

interface ScoreDetailsModalProps {
  type: 'seo' | 'ai' | 'direct' | 'schema' | 'total';
  score: number;
  scores?: ScanScores;
  breakdown?: CriterionResult[];
  onClose: () => void;
}

const criteriaMap: Record<string, ScoreCriterion> = {};
[...SEO_CRITERIA, ...LLM_CRITERIA, ...DIRECT_CRITERIA, ...SCHEMA_CRITERIA].forEach(c => { criteriaMap[c.key] = c; });

const scoreLabel: Record<string, string> = {
  seo: "SEO",
  ai: "AI / LLM",
  direct: "Яндекс.Директ",
  schema: "Schema.org",
  total: "Общий",
};

function getScoreBadgeColor(score: number) {
  if (score <= 40) return "bg-destructive/20 text-destructive";
  if (score <= 70) return "bg-warning/20 text-warning";
  return "bg-success/20 text-success";
}

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'pass') return <Check className="w-3.5 h-3.5 text-emerald-500" />;
  if (status === 'partial') return <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />;
  return <X className="w-3.5 h-3.5 text-red-500" />;
};

const OverallFormula = ({ scores }: { scores: ScanScores }) => {
  const weights = OVERALL_WEIGHTS;
  const components = [
    { label: 'SEO', weight: weights.seo, value: scores.seo },
    { label: 'Директ', weight: weights.direct, value: scores.direct },
    { label: 'Schema', weight: weights.schema, value: scores.schema },
    { label: 'AI', weight: weights.ai, value: scores.ai },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Общий балл — взвешенная комбинация 4 модулей:
      </p>
      <div className="space-y-2">
        {components.map(c => (
          <div key={c.label} className="flex items-center justify-between text-[13px]">
            <span className="text-muted-foreground">{c.label} × {(c.weight * 100).toFixed(0)}%</span>
            <span className="font-mono font-semibold">
              {c.value} × {c.weight} = <span className="text-foreground">{(c.value * c.weight).toFixed(1)}</span>
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-border/30 pt-2 flex items-center justify-between text-sm font-semibold">
        <span>Итого</span>
        <span className="font-mono">{Math.round(components.reduce((s, c) => s + c.value * c.weight, 0))}/100</span>
      </div>
      <p className="text-[11px] text-muted-foreground/70">
        Округление до целого. Формула: 0.35×SEO + 0.20×Директ + 0.20×Schema + 0.25×AI
      </p>
    </div>
  );
};

const ScoreDetailsModal = ({ type, score, scores, breakdown, onClose }: ScoreDetailsModalProps) => {
  const isMobile = useIsMobile();

  const handleEscape = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [handleEscape]);

  const isTotal = type === 'total';

  return (
    <>
      <div className="fixed inset-0 z-[999] bg-black/60" onClick={onClose} />
      <div
        className={`fixed z-[1000] bg-card border border-border/50 ${
          isMobile
            ? "inset-x-0 bottom-0 rounded-t-2xl max-h-[75vh] animate-in slide-in-from-bottom duration-200"
            : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[480px] max-h-[80vh] rounded-2xl"
        } overflow-y-auto p-5 md:p-6`}
      >
        {isMobile && <div className="w-10 h-1 rounded-full bg-muted mx-auto mb-4" />}

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-foreground">
              {scoreLabel[type]} Score — {score}/100
            </h3>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getScoreBadgeColor(score)}`}>
              {score <= 40 ? "Критично" : score <= 70 ? "Средне" : "Отлично"}
            </span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {isTotal && scores ? (
          <OverallFormula scores={scores} />
        ) : breakdown && breakdown.length > 0 ? (
          <>
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-2 px-1 font-medium text-muted-foreground">Критерий</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground w-12">Вес</th>
                  <th className="text-center py-2 px-1 font-medium text-muted-foreground w-12">Балл</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item) => {
                  const meta = criteriaMap[item.key];
                  return (
                    <tr key={item.key} className="border-b border-border/10">
                      <td className="py-2 px-1">
                        <span className="font-medium text-foreground">{meta?.label || item.key}</span>
                        <span className="block text-muted-foreground text-[11px]">{meta?.description || ''}</span>
                      </td>
                      <td className="text-center py-2 px-1 text-muted-foreground">{item.weight}</td>
                      <td className="text-center py-2 px-1 font-semibold">
                        <span className={
                          item.status === 'pass' ? 'text-emerald-500' :
                          item.status === 'partial' ? 'text-yellow-500' : 'text-red-500'
                        }>
                          {item.earned}
                        </span>
                      </td>
                      <td className="text-center py-2 px-1">
                        <StatusIcon status={item.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(() => {
              const totalWeight = breakdown.reduce((s, c) => s + c.weight, 0);
              const totalEarned = breakdown.reduce((s, c) => s + c.earned, 0);
              const potential = computePotentialScore(score, breakdown);
              const canImprove = potential > score;
              return (
                <>
                  <p className="text-xs text-muted-foreground text-center mt-3">
                    Набрано {totalEarned} из {totalWeight} баллов
                  </p>
                  {canImprove && (
                    <p className="text-xs text-center mt-2 text-muted-foreground">
                      Если исправить все ошибки, балл вырастет с{' '}
                      <span className="font-bold text-foreground">{score}</span> до{' '}
                      <span className="font-bold text-emerald-500">{potential}</span>
                    </p>
                  )}
                </>
              );
            })()}
          </>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Детальная разбивка недоступна для этого модуля.
          </p>
        )}
      </div>
    </>
  );
};

export default ScoreDetailsModal;
