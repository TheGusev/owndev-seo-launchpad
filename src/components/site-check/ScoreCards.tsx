import { useState } from "react";
import type { ScanScores } from "@/lib/site-check-types";
import type { CriterionResult } from "@/utils/scoreCalculation";
import { useAnimatedCounter } from "@/hooks/useAnimatedCounter";
import ScoreDetailsModal from "./ScoreDetailsModal";

/**
 * Sprint 5 — Карточки скоров.
 *
 * Если в скане есть geoScore/seoScore/croScore (новый бэк после Sprint 3) —
 * показываем 3 честные карточки. Иначе fallback на старый layout (5 карточек:
 * total/seo/direct/schema/ai) — для старых сохранённых сканов.
 */

const legacyLabels: Record<keyof ScanScores, string> = {
  total: "Общий",
  seo: "SEO",
  direct: "Директ",
  schema: "Schema",
  ai: "AI",
  geo: "GEO",
  cro: "CRO",
};

const tripleLabels = {
  geo: { title: "GEO", subtitle: "AI-видимость" },
  seo: { title: "SEO", subtitle: "Поиск" },
  cro: { title: "CRO", subtitle: "Конверсия" },
} as const;

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

type ScoreType = 'seo' | 'ai' | 'direct' | 'schema' | 'total' | 'geo' | 'cro';

interface ScoreCardsProps {
  scores: ScanScores;
  previousScores?: ScanScores;
  breakdown?: ScoreBreakdownData;
}

const ScoreCards = ({ scores, previousScores, breakdown }: ScoreCardsProps) => {
  const [activeModal, setActiveModal] = useState<ScoreType | null>(null);

  const hasTriple =
    typeof scores?.geo === 'number' &&
    typeof scores?.seo === 'number' &&
    typeof scores?.cro === 'number';

  if (hasTriple) {
    const tripleKeys: Array<'geo' | 'seo' | 'cro'> = ['geo', 'seo', 'cro'];
    return (
      <>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {tripleKeys.map((key) => {
            const val = (scores[key] ?? 0) as number;
            const meta = tripleLabels[key];
            return (
              <div
                key={key}
                className={`rounded-2xl border p-5 text-center ${getScoreColor(val)}`}
              >
                <CircleScore score={val} />
                <p className="mt-2 text-sm font-semibold text-foreground">{meta.title}</p>
                <p className="text-[11px] text-muted-foreground">{meta.subtitle}</p>
                {previousScores && typeof previousScores[key] === "number" && (
                  <DiffBadge diff={val - (previousScores[key] as number)} />
                )}
                <button
                  onClick={() => setActiveModal(key)}
                  className="text-[11px] text-muted-foreground/60 hover:text-foreground transition-colors underline decoration-dotted mt-2 block mx-auto"
                >
                  Как рассчитан?
                </button>
              </div>
            );
          })}
        </div>

        {activeModal && (
          <ScoreDetailsModal
            type={activeModal as ScoreType}
            score={(scores[activeModal as 'geo' | 'seo' | 'cro'] ?? 0) as number}
            scores={scores}
            breakdown={breakdown?.[activeModal as keyof ScoreBreakdownData]}
            onClose={() => setActiveModal(null)}
          />
        )}
      </>
    );
  }

  // Legacy fallback (старые сканы)
  const keys: Array<keyof ScanScores> = ['total', 'seo', 'direct', 'schema', 'ai'];

  return (
    <>
      {/* Mobile: total full-width + 2x2, Desktop: 5 columns */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-5 md:gap-3">
        {keys.map((key, i) => {
          const val = (scores?.[key] ?? 0) as number;
          return (
            <div
              key={key}
              className={`rounded-xl border p-3 text-center ${getScoreColor(val)} ${
                i === 0 ? "col-span-2 md:col-span-1" : "col-span-1"
              }`}
            >
              <CircleScore score={val} />
              <p className="mt-1 text-[10px] font-medium text-muted-foreground">{legacyLabels[key]}</p>
              {previousScores && typeof previousScores[key] === "number" && (
                <DiffBadge diff={val - (previousScores[key] as number)} />
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

      {activeModal && (
        <ScoreDetailsModal
          type={activeModal}
          score={(scores[activeModal as keyof ScanScores] ?? 0) as number}
          scores={scores}
          breakdown={breakdown?.[activeModal as keyof ScoreBreakdownData]}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
};

export default ScoreCards;
