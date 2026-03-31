import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, RotateCcw } from "lucide-react";
import IssueCardComponent from "./IssueCard";
import { useIssueTracker } from "@/hooks/useIssueTracker";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState, useMemo } from "react";
import type { IssueCard, IssueSeverity, IssueModule } from "@/lib/site-check-types";

const severityOrder: IssueSeverity[] = ["critical", "high", "medium", "low"];

const severityFilterConfig: { key: IssueSeverity | "all"; label: string; className: string }[] = [
  { key: "all", label: "Все", className: "bg-muted/40 text-foreground" },
  { key: "critical", label: "Критично", className: "bg-red-500/20 text-red-400" },
  { key: "high", label: "Важно", className: "bg-orange-500/20 text-orange-400" },
  { key: "medium", label: "Средне", className: "bg-yellow-500/20 text-yellow-400" },
  { key: "low", label: "Мелко", className: "bg-gray-500/20 text-gray-400" },
];

const categoryFilterConfig: { key: IssueModule | "all"; label: string; className: string }[] = [
  { key: "all", label: "Все", className: "bg-muted/40 text-foreground" },
  { key: "technical", label: "Техника", className: "bg-blue-500/20 text-blue-400" },
  { key: "content", label: "Контент", className: "bg-purple-500/20 text-purple-400" },
  { key: "schema", label: "Schema", className: "bg-indigo-500/20 text-indigo-400" },
  { key: "ai", label: "AI", className: "bg-emerald-500/20 text-emerald-400" },
  { key: "direct", label: "Директ", className: "bg-pink-500/20 text-pink-400" },
  { key: "competitors", label: "Конкуренты", className: "bg-cyan-500/20 text-cyan-400" },
];

interface FullReportViewProps {
  issues: IssueCard[];
  url: string;
}

const FullReportView = ({ issues, url }: FullReportViewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isResolved, toggleIssue, resolvedCount, resetFixes } = useIssueTracker(url);
  const shownToast = useRef(false);
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<IssueModule | "all">("all");

  const totalCount = issues.length;
  const percent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

  // Count issues by severity/category
  const severityCounts = useMemo(() => {
    const counts: Record<string, number> = { all: issues.length };
    for (const i of issues) counts[i.severity] = (counts[i.severity] || 0) + 1;
    return counts;
  }, [issues]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: issues.length };
    for (const i of issues) counts[i.module] = (counts[i.module] || 0) + 1;
    return counts;
  }, [issues]);

  // Filter and sort
  const filteredIssues = useMemo(() => {
    let filtered = issues.filter(issue => {
      const sevMatch = severityFilter === "all" || issue.severity === severityFilter;
      const catMatch = categoryFilter === "all" || issue.module === categoryFilter;
      return sevMatch && catMatch;
    });
    // Sort: severity order, then impact_score descending
    filtered.sort((a, b) => {
      const sevDiff = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
      if (sevDiff !== 0) return sevDiff;
      return (b.impact_score ?? 0) - (a.impact_score ?? 0);
    });
    return filtered;
  }, [issues, severityFilter, categoryFilter]);

  // Gain points calculation
  const gainPoints = useMemo(() => {
    return issues
      .filter(i => !isResolved(i.id || i.title) && (i.severity === "critical" || i.severity === "high"))
      .reduce((sum, i) => sum + (i.impact_score ?? 0), 0);
  }, [issues, isResolved]);

  const criticalCount = useMemo(() => {
    return issues.filter(i => !isResolved(i.id || i.title) && i.severity === "critical").length;
  }, [issues, isResolved]);

  useEffect(() => {
    if (percent === 100 && totalCount > 0 && !shownToast.current) {
      shownToast.current = true;
      toast({
        title: "Отличная работа! 🎉",
        description: "Запустите проверку заново, чтобы обновить баллы.",
      });
    }
  }, [percent, totalCount, toast]);

  if (!issues?.length) return null;

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-foreground">План исправления сайта</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Исправлено: {resolvedCount} из {totalCount}
            </span>
            {resolvedCount > 0 && (
              <button
                onClick={() => {
                  resetFixes();
                  toast({ title: "Прогресс сброшен" });
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                Сбросить
              </button>
            )}
          </div>
        </div>
        <Progress value={percent} className="h-2" />
        {criticalCount > 0 && gainPoints > 0 && (
          <p className="text-xs text-muted-foreground">
            Устраните <span className="text-red-400 font-medium">{criticalCount} критических</span> ошибок → оценка вырастет примерно на <span className="text-primary font-medium">+{gainPoints} баллов</span>
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="space-y-2">
        {/* Severity filter */}
        <div className="flex flex-wrap gap-1.5">
          {severityFilterConfig.map(f => (
            <button
              key={f.key}
              onClick={() => setSeverityFilter(f.key)}
              className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                severityFilter === f.key
                  ? f.className + " ring-1 ring-current font-semibold"
                  : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
              }`}
            >
              {f.label} ({severityCounts[f.key] || 0})
            </button>
          ))}
        </div>
        {/* Category filter */}
        <div className="flex flex-wrap gap-1.5">
          {categoryFilterConfig
            .filter(f => f.key === "all" || (categoryCounts[f.key] || 0) > 0)
            .map(f => (
              <button
                key={f.key}
                onClick={() => setCategoryFilter(f.key as IssueModule | "all")}
                className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                  categoryFilter === f.key
                    ? f.className + " ring-1 ring-current font-semibold"
                    : "bg-muted/20 text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {f.label} ({categoryCounts[f.key] || 0})
              </button>
            ))}
        </div>
      </div>

      {/* Issues list */}
      <div className="space-y-3">
        {filteredIssues.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Нет ошибок по выбранным фильтрам</p>
        )}
        {filteredIssues.map((issue) => (
          <IssueCardComponent
            key={issue.id}
            issue={issue}
            resolved={isResolved(issue.id || issue.title)}
            onToggle={() => toggleIssue(issue.id || issue.title)}
          />
        ))}
      </div>

      {/* Rescan button */}
      {resolvedCount > 0 && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/tools/site-check?url=${encodeURIComponent(url)}&rescan=true`)}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Обновить результаты (Пересканировать)
          </Button>
        </div>
      )}
    </div>
  );
};

export default FullReportView;
