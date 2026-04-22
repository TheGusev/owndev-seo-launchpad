import { Badge } from "@/components/ui/badge";
import { Target, AlertTriangle, CheckCircle2 } from "lucide-react";
import type { BenchmarkData } from "@/lib/site-check-types";

interface Props {
  benchmark: BenchmarkData | null;
}

/**
 * Sprint 5 — Сравнение с эталоном категории сайта.
 * Заменяет старый раздел «Конкуренты», но показывает не ссылки на конкретные
 * сайты, а структурированные требования по категории (магазин, медиа и т.п.).
 */
export default function BenchmarkCard({ benchmark }: Props) {
  if (!benchmark) return null;

  const passRatio = benchmark.total > 0 ? benchmark.passed / benchmark.total : 0;
  const tone =
    passRatio >= 0.8 ? "text-emerald-400" : passRatio >= 0.5 ? "text-yellow-400" : "text-destructive";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Target className="w-4 h-4 text-primary" />
        <span className="text-sm font-semibold text-foreground">
          Сравнение с эталоном «{benchmark.category}»
        </span>
        <span className={`ml-auto text-xs font-mono ${tone}`}>
          {benchmark.passed}/{benchmark.total}
        </span>
      </div>

      {benchmark.gaps.length === 0 ? (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Полностью соответствует эталону категории.
        </div>
      ) : (
        <div className="space-y-1.5">
          {benchmark.gaps.map((gap, i) => (
            <div
              key={i}
              className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg border border-border/40 bg-card/40"
            >
              <AlertTriangle
                className={`w-3.5 h-3.5 shrink-0 ${
                  gap.severity === "critical" || gap.severity === "high"
                    ? "text-destructive"
                    : "text-yellow-500"
                }`}
              />
              <span className="font-medium text-foreground">{gap.key}</span>
              <span className="text-muted-foreground">факт: {String(gap.actual)}</span>
              <span className="ml-auto">
                <Badge variant="outline" className="text-[10px]">
                  ожидается {String(gap.expected)}
                </Badge>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}