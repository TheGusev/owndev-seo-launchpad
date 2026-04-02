import type { ScanScores } from "@/lib/site-check-types";
import ScoreBreakdown from "./ScoreBreakdown";
import type { CriterionResult } from "@/utils/scoreCalculation";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";

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

function getScoreStatus(score: number) {
  if (score <= 40) return "Критично";
  if (score <= 60) return "Требует работы";
  if (score <= 70) return "Хорошо";
  return "Отлично";
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
    <div className="relative w-12 h-12 md:w-16 md:h-16 mx-auto">
      <svg className="w-12 h-12 md:w-16 md:h-16 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" strokeWidth="5" className="stroke-muted/30" />
        <circle
          cx="40" cy="40" r="36" fill="none" strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${getScoreRing(score)} transition-all duration-1000`}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-sm md:text-lg font-bold font-mono score-num ${
        score <= 40 ? "text-destructive" : score <= 70 ? "text-warning" : "text-success"
      }`}>
        {display}
      </span>
    </div>
  );
};

const DiffBadge = ({ diff }: { diff: number }) => {
  if (diff > 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full text-emerald-500 bg-emerald-500/10">
        ▲ +{diff}
      </span>
    );
  }
  if (diff < 0) {
    return (
      <span className="inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full text-red-500 bg-red-500/10">
        ▼ {diff}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium px-1.5 py-0.5 rounded-full text-muted-foreground bg-muted/30">
      ~ без изменений
    </span>
  );
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

const ScoreCards = ({ scores, previousScores, breakdown }: ScoreCardsProps) => (
  <div className="grid grid-cols-5 gap-2 md:gap-3">
    {(Object.keys(scoreLabels) as (keyof ScanScores)[]).map((key) => {
      const val = scores?.[key] ?? 0;
      const hasBreakdown = (key === 'seo' && breakdown?.seo?.length) || (key === 'ai' && breakdown?.ai?.length);
      return (
      <div
        key={key}
        className={`rounded-xl border p-2 md:p-4 text-center ${getScoreColor(val)}`}
      >
        <CircleScore score={val} />
        <p className="mt-1 md:mt-2 text-[10px] md:text-xs font-medium text-muted-foreground">{scoreLabels[key]}</p>
        <p className="text-[9px] md:text-[10px] font-medium opacity-70">{getScoreStatus(val)}</p>
        {previousScores && typeof previousScores[key] === "number" && (
          <div className="mt-1">
            <DiffBadge diff={val - previousScores[key]} />
          </div>
        )}
        {hasBreakdown && (
          <ScoreBreakdown
            type={key as 'seo' | 'ai'}
            currentScore={val}
            breakdown={key === 'seo' ? breakdown?.seo : breakdown?.ai}
          />
        )}
      </div>
      );
    })}
  </div>
);

export default ScoreCards;
