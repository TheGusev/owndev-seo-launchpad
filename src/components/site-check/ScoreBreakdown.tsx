import { useState } from "react";
import { ChevronDown, ChevronUp, Check, X, AlertTriangle } from "lucide-react";
import {
  SEO_CRITERIA, LLM_CRITERIA, type CriterionResult, type ScoreCriterion,
  computePotentialScore,
} from "@/utils/scoreCalculation";

interface ScoreBreakdownProps {
  type: 'seo' | 'ai';
  currentScore: number;
  breakdown?: CriterionResult[];
}

const criteriaMap: Record<string, ScoreCriterion> = {};
[...SEO_CRITERIA, ...LLM_CRITERIA].forEach(c => { criteriaMap[c.key] = c; });

const StatusIcon = ({ status }: { status: string }) => {
  if (status === 'pass') return <Check className="w-4 h-4 text-emerald-500" />;
  if (status === 'partial') return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
  return <X className="w-4 h-4 text-red-500" />;
};

const statusBg = (status: string) => {
  if (status === 'pass') return 'bg-emerald-500/10';
  if (status === 'partial') return 'bg-yellow-500/10';
  return 'bg-red-500/10';
};

const ScoreBreakdown = ({ type, currentScore, breakdown }: ScoreBreakdownProps) => {
  const [open, setOpen] = useState(false);

  if (!breakdown || breakdown.length === 0) return null;

  const criteria = type === 'seo' ? SEO_CRITERIA : LLM_CRITERIA;
  const potential = computePotentialScore(currentScore, breakdown);
  const canImprove = potential > currentScore;

  return (
    <div className="mt-2">
      <button
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        Как рассчитан?
      </button>

      {open && (
        <div className="mt-2 rounded-lg border border-border/50 bg-card/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="border-b border-border/30">
                  <th className="text-left py-1.5 px-2 font-medium text-muted-foreground">Критерий</th>
                  <th className="text-center py-1.5 px-1 font-medium text-muted-foreground w-10">Вес</th>
                  <th className="text-center py-1.5 px-1 font-medium text-muted-foreground w-10">Балл</th>
                  <th className="text-center py-1.5 px-1 font-medium text-muted-foreground w-8"></th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item) => {
                  const meta = criteriaMap[item.key];
                  return (
                    <tr key={item.key} className={`border-b border-border/20 ${statusBg(item.status)}`}>
                      <td className="py-1 px-2">
                        <span className="font-medium">{meta?.label || item.key}</span>
                        <span className="block text-muted-foreground/70 text-[10px]">{meta?.description || ''}</span>
                      </td>
                      <td className="text-center py-1 px-1 text-muted-foreground">{item.weight}</td>
                      <td className="text-center py-1 px-1 font-semibold">
                        <span className={
                          item.status === 'pass' ? 'text-emerald-500' :
                          item.status === 'partial' ? 'text-yellow-500' : 'text-red-500'
                        }>
                          {item.earned}
                        </span>
                      </td>
                      <td className="text-center py-1 px-1">
                        <StatusIcon status={item.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-border/50">
                  <td className="py-1.5 px-2 font-semibold">Итого</td>
                  <td className="text-center py-1.5 px-1 font-semibold text-muted-foreground">
                    {breakdown.reduce((s, c) => s + c.weight, 0)}
                  </td>
                  <td className="text-center py-1.5 px-1 font-bold text-primary">
                    {breakdown.reduce((s, c) => s + c.earned, 0)}
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {canImprove && (
            <div className="px-2 py-2 border-t border-border/30 bg-primary/5 text-[11px]">
              <span className="text-muted-foreground">Если исправить все ошибки, балл вырастет с </span>
              <span className="font-bold text-foreground">{currentScore}</span>
              <span className="text-muted-foreground"> до </span>
              <span className="font-bold text-emerald-500">{potential}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ScoreBreakdown;
