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

export interface ScoreBreakdownData {
  seo?: CriterionResult[];
  ai?: CriterionResult[];
  direct?: CriterionResult[];
  schema?: CriterionResult[];
  total?: CriterionResult[];
}

type ScoreType = 'seo' | 'ai' | 'direct' | 'schema' | 'total';

interface ScoreCardsProps {
  scores: ScanScores;
  previousScores?: ScanScores;
  breakdown?: ScoreBreakdownData;
}

const ScoreCards = ({ scores, previousScores, breakdown }: ScoreCardsProps) => {
  const [activeModal, setActiveModal] = useState<ScoreType | null>(null);

  const keys = Object.keys(scoreLabels) as (keyof ScanScores)[];

  return (
    <>
      {/* Mobile: 3+2 grid, Desktop: 5 columns */}
      <div className="grid grid-cols-3 gap-2 md:grid-cols-5 md:gap-3">
        {keys.map((key, i) => {
          const val = scores?.[key] ?? 0;
          return (
            <div
              key={key}
              className={`rounded-xl border p-3 text-center ${getScoreColor(val)} ${
                i >= 3 ? "col-span-1" : ""
              }`}
            >
              <CircleScore score={val} />
              <p className="mt-1 text-[10px] font-medium text-muted-foreground">{scoreLabels[key]}</p>
              {previousScores && typeof previousScores[key] === "number" && (
                <DiffBadge diff={val - previousScores[key]} />
              )}
              <button
                onClick={() => setActiveModal(key as ScoreType)}
                className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors underline decoration-dotted mt-1 block mx-auto"
              >
                Как рассчитан?
              </button>
            </div>
          );
        })}
      </div>
      {/* Center last 2 items on mobile via CSS: on 3-col grid, items 4-5 naturally flow to row 2 */}
      <style>{`
        @media (max-width: 767px) {
          .grid.grid-cols-3 > :nth-child(4) { grid-column-start: 1; }
          .grid.grid-cols-3 > :nth-child(5) { grid-column-start: 2; }
        }
      `}</style>

      {activeModal && (
        <ScoreDetailsModal
          type={activeModal}
          score={scores[activeModal] ?? 0}
          scores={scores}
          breakdown={breakdown?.[activeModal]}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
};

export default ScoreCards;
