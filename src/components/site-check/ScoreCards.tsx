import { useState } from "react";
import type { ScanScores } from "@/lib/site-check-types";
import type { CriterionResult } from "@/utils/scoreCalculation";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import ScoreDetailsModal from "./ScoreDetailsModal";

const scoreLabels: Record<keyof ScanScores, string> = {
  total: "Общий",
  seo: "SEO",
  direct: "Директ",
  schema: "Schema",
  ai: "AI",
};

function getScoreColor(score: number) {
  if (score <= 40) return "text-destructive border-destructive/30 bg-destructive/5";
  if (score <= 70) return "text-warning border-warning/30 bg-warning/5";
  return "text-success border-success/30 bg-success/5";
}

function getScoreRing(score: number) {
  if (score <= 40) return "stroke-destructive";
  if (score <= 70) return "stroke-warning";
  return "stroke-success";
}

const CircleScore = ({ score }: { score: number }) => {
  const display = useAnimatedCounter(score, 1000);
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (display / 100) * circumference;

  return (
    <div className="relative w-14 h-14 mx-auto">
      <svg className="w-14 h-14 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" strokeWidth="5" className="stroke-muted/30" />
        <circle
          cx="40" cy="40" r="36" fill="none" strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${getScoreRing(score)} transition-all duration-1000`}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-base font-bold font-mono score-num ${
        score <= 40 ? "text-destructive" : score <= 70 ? "text-warning" : "text-success"
      }`}>
        {display}
      </span>
    </div>
  );
};

const DiffBadge = ({ diff }: { diff: number }) => {
  if (diff > 0) return <span className="text-[10px] font-medium text-emerald-500">▲+{diff}</span>;
  if (diff < 0) return <span className="text-[10px] font-medium text-red-500">▼{diff}</span>;
  return null;
};

interface ScoreBreakdownData {
  seo?: CriterionResult[];
  ai?: CriterionResult[];
}

interface ScoreCardsProps {
  scores: ScanScores;
  previousScores?: ScanScores;
  breakdown?: ScoreBreakdownData;
}

const ScoreCards = ({ scores, previousScores, breakdown }: ScoreCardsProps) => {
  const [activeModal, setActiveModal] = useState<'seo' | 'ai' | null>(null);

  return (
    <>
      <div className="flex gap-2 md:grid md:grid-cols-5 md:gap-3 overflow-x-auto scrollbar-hide pb-2 md:pb-0">
        {(Object.keys(scoreLabels) as (keyof ScanScores)[]).map((key) => {
          const val = scores?.[key] ?? 0;
          const hasBreakdown = (key === 'seo' && breakdown?.seo?.length) || (key === 'ai' && breakdown?.ai?.length);
          return (
            <div
              key={key}
              className={`rounded-xl border p-3 text-center min-w-[68px] flex-shrink-0 md:flex-shrink md:min-w-0 ${getScoreColor(val)}`}
            >
              <CircleScore score={val} />
              <p className="mt-1 text-[10px] font-medium text-muted-foreground">{scoreLabels[key]}</p>
              {previousScores && typeof previousScores[key] === "number" && (
                <DiffBadge diff={val - previousScores[key]} />
              )}
              {hasBreakdown && (
                <button
                  onClick={() => setActiveModal(key as 'seo' | 'ai')}
                  className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors underline decoration-dotted mt-1 block mx-auto"
                >
                  Как рассчитан?
                </button>
              )}
            </div>
          );
        })}
      </div>

      {activeModal && breakdown?.[activeModal] && (
        <ScoreDetailsModal
          type={activeModal}
          score={scores[activeModal] ?? 0}
          breakdown={breakdown[activeModal]!}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
};

export default ScoreCards;
