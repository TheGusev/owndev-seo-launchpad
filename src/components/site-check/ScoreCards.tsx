import type { ScanScores } from "@/lib/site-check-types";

const scoreLabels: Record<keyof ScanScores, string> = {
  total: "Общий",
  seo: "SEO",
  direct: "Директ",
  schema: "Schema",
  ai: "AI",
};

function getScoreColor(score: number) {
  if (score <= 40) return "text-red-500 border-red-500/30 bg-red-500/5";
  if (score <= 70) return "text-yellow-500 border-yellow-500/30 bg-yellow-500/5";
  return "text-green-500 border-green-500/30 bg-green-500/5";
}

function getScoreRing(score: number) {
  if (score <= 40) return "stroke-red-500";
  if (score <= 70) return "stroke-yellow-500";
  return "stroke-green-500";
}

const CircleScore = ({ score }: { score: number }) => {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-16 h-16 mx-auto">
      <svg className="w-16 h-16 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" strokeWidth="5" className="stroke-muted/30" />
        <circle
          cx="40" cy="40" r="36" fill="none" strokeWidth="5"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={`${getScoreRing(score)} transition-all duration-1000`}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold ${
        score <= 40 ? "text-red-500" : score <= 70 ? "text-yellow-500" : "text-green-500"
      }`}>
        {score}
      </span>
    </div>
  );
};

interface ScoreCardsProps {
  scores: ScanScores;
}

const ScoreCards = ({ scores }: ScoreCardsProps) => (
  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
    {(Object.keys(scoreLabels) as (keyof ScanScores)[]).map((key) => (
      <div
        key={key}
        className={`rounded-xl border p-4 text-center ${getScoreColor(scores[key])}`}
      >
        <CircleScore score={scores[key]} />
        <p className="mt-2 text-xs font-medium text-muted-foreground">{scoreLabels[key]}</p>
      </div>
    ))}
  </div>
);

export default ScoreCards;
