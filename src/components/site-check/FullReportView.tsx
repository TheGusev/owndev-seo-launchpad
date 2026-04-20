import { useNavigate } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RefreshCw, RotateCcw, ChevronDown, Copy, Check, ExternalLink, ClipboardCopy } from "lucide-react";
import AutoFixGenerator from "@/components/site-check/AutoFixGenerator";
import { useIssueTracker } from "@/hooks/useIssueTracker";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useRef, useState, useMemo } from "react";
import type { IssueCard, IssueSeverity, IssueModule } from "@/lib/site-check-types";
import { Checkbox } from "@/components/ui/checkbox";

const severityOrder: IssueSeverity[] = ["critical", "high", "medium", "low"];

const severityConfig: Record<string, { label: string; emoji: string; borderClass: string; bgClass: string }> = {
  critical: { label: "Критично", emoji: "🔴", borderClass: "border-l-red-500", bgClass: "bg-red-500/5" },
  high: { label: "Важно", emoji: "🟠", borderClass: "border-l-orange-500", bgClass: "bg-orange-500/5" },
  medium: { label: "Средне", emoji: "🟡", borderClass: "border-l-yellow-500", bgClass: "bg-yellow-500/5" },
  low: { label: "Мелко", emoji: "⚪", borderClass: "border-l-border", bgClass: "bg-muted/5" },
};

const categoryConfig: Record<string, { label: string; className: string }> = {
  technical: { label: "Техника", className: "bg-blue-500/20 text-blue-400" },
  content: { label: "Контент", className: "bg-purple-500/20 text-purple-400" },
  direct: { label: "Директ", className: "bg-pink-500/20 text-pink-400" },
  competitors: { label: "Конкуренты", className: "bg-cyan-500/20 text-cyan-400" },
  semantics: { label: "Семантика", className: "bg-teal-500/20 text-teal-400" },
  schema: { label: "Schema", className: "bg-indigo-500/20 text-indigo-400" },
  ai: { label: "AI", className: "bg-emerald-500/20 text-emerald-400" },
};

const severityFilterConfig: { key: IssueSeverity | "all"; label: string; className: string }[] = [
  { key: "all", label: "Все", className: "bg-muted/40 text-foreground" },
  { key: "critical", label: "Критично", className: "bg-red-500/20 text-red-400" },
  { key: "high", label: "Важно", className: "bg-orange-500/20 text-orange-400" },
  { key: "medium", label: "Средне", className: "bg-yellow-500/20 text-yellow-400" },
  { key: "low", label: "Мелко", className: "bg-muted/40 text-muted-foreground" },
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

const scrollableStyle: React.CSSProperties = {
  msOverflowStyle: "none",
  scrollbarWidth: "none",
};

const IssueRow = ({ issue, resolved, onToggle, url, onExpand, isExpanded }: {
  issue: IssueCard; resolved: boolean; onToggle: () => void; url: string;
  onExpand: () => void; isExpanded: boolean;
}) => {
  const { toast } = useToast();
  const sev = severityConfig[issue.severity] || severityConfig.low;
  const cat = categoryConfig[issue.module] || { label: issue.module, className: "bg-muted/40 text-muted-foreground" };

  return (
    <div className={`border-l-[3px] ${sev.borderClass} ${sev.bgClass} rounded-lg mb-2 ${resolved ? "opacity-50" : ""}`}>
      <div
        className="flex items-center gap-2 py-2.5 px-3 cursor-pointer hover:bg-muted/10 transition-colors min-h-[44px]"
        onClick={onExpand}
      >
        <Checkbox
          checked={resolved}
          onCheckedChange={() => onToggle()}
          onClick={(e) => e.stopPropagation()}
          className="shrink-0"
        />
        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${cat.className}`}>
          {cat.label}
        </span>
        <span className={`text-xs flex-1 min-w-0 truncate ${resolved ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {issue.title}
        </span>
        {(issue.impact_score ?? 0) > 0 && (
          <span className="text-[10px] font-semibold text-primary shrink-0">+{issue.impact_score}</span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-muted-foreground shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 space-y-3 text-xs border-t border-border/10">
          <p className="text-muted-foreground">{issue.found}</p>

          {issue.why_it_matters && (
            <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-2.5">
              <span className="font-semibold text-yellow-400 text-[11px]">Почему это важно</span>
              <p className="text-muted-foreground mt-0.5">{issue.why_it_matters}</p>
            </div>
          )}

          <div>
            <span className="font-semibold text-foreground text-[11px]">Как исправить</span>
            <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground mt-0.5">
              {issue.how_to_fix.split('\n').filter(l => l.trim()).map((line, i) => (
                <li key={i}>{line.replace(/^\d+\.\s*/, '').trim()}</li>
              ))}
            </ol>
          </div>

          {issue.example_fix && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground text-[11px]">Пример</span>
                <button
                  onClick={() => { navigator.clipboard.writeText(issue.example_fix); toast({ title: "Скопировано!" }); }}
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary/80"
                >
                  <Copy className="w-3 h-3" /> Копировать
                </button>
              </div>
              <pre className="p-2 rounded-lg bg-muted/40 text-[11px] overflow-x-auto whitespace-pre-wrap break-all text-foreground/80 border border-border/20">
                {issue.example_fix}
              </pre>
            </div>
          )}

          <AutoFixGenerator issueTitle={issue.title} url={url} />

          {issue.docs_url && (
            <a href={issue.docs_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80">
              Документация <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
};

const FullReportView = ({ issues, url }: FullReportViewProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isResolved, toggleIssue, resolvedCount, resetFixes } = useIssueTracker(url);
  const [bulkCopied, setBulkCopied] = useState(false);
  const shownToast = useRef(false);
  const [severityFilter, setSeverityFilter] = useState<IssueSeverity | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState<IssueModule | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totalCount = issues.length;
  const percent = totalCount > 0 ? Math.round((resolvedCount / totalCount) * 100) : 0;

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

  const filteredIssues = useMemo(() => {
    let filtered = issues.filter(issue => {
      const sevMatch = severityFilter === "all" || issue.severity === severityFilter;
      const catMatch = categoryFilter === "all" || issue.module === categoryFilter;
      return sevMatch && catMatch;
    });
    filtered.sort((a, b) => {
      const sevDiff = severityOrder.indexOf(a.severity) - severityOrder.indexOf(b.severity);
      if (sevDiff !== 0) return sevDiff;
      return (b.impact_score ?? 0) - (a.impact_score ?? 0);
    });
    return filtered;
  }, [issues, severityFilter, categoryFilter]);

  useEffect(() => {
    if (percent === 100 && totalCount > 0 && !shownToast.current) {
      shownToast.current = true;
      toast({ title: "Отличная работа!", description: "Запустите проверку заново, чтобы обновить баллы." });
    }
  }, [percent, totalCount, toast]);

  if (!issues?.length) return null;

  const handleCopyAllFixes = () => {
    const unresolvedWithFixes = issues
      .filter((i) => !isResolved(i.id || i.title) && i.example_fix && i.example_fix.trim().length > 0);
    if (unresolvedWithFixes.length === 0) {
      toast({ title: "Нет исправлений для копирования", description: "Все проблемы решены или у них нет готового кода." });
      return;
    }
    const text = unresolvedWithFixes
      .map((i, idx) => `# ${idx + 1}. ${i.title}\n# (${i.severity}/${i.module})\n${i.example_fix}`)
      .join("\n\n---\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setBulkCopied(true);
      toast({ title: `Скопировано ${unresolvedWithFixes.length} исправлений` });
      setTimeout(() => setBulkCopied(false), 2000);
    });
  };

  const unresolvedFixCount = issues.filter(
    (i) => !isResolved(i.id || i.title) && i.example_fix && i.example_fix.trim().length > 0,
  ).length;

  return (
    <div className="space-y-3">
      {/* Bulk copy fixes */}
      {unresolvedFixCount > 0 && (
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyAllFixes}
            className="gap-2"
          >
            {bulkCopied ? (
              <Check className="w-3.5 h-3.5 text-green-500" />
            ) : (
              <ClipboardCopy className="w-3.5 h-3.5" />
            )}
            Скопировать все исправления ({unresolvedFixCount})
          </Button>
        </div>
      )}

      {/* Progress */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">
          Исправлено: {resolvedCount} из {totalCount} ({percent}%)
        </span>
        {resolvedCount > 0 && (
          <button onClick={() => { resetFixes(); toast({ title: "Прогресс сброшен" }); }} className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
            <RotateCcw className="w-3 h-3" /> Сбросить
          </button>
        )}
      </div>
      <Progress
        value={percent}
        className={`h-1.5 ${percent >= 50 ? "[&>div]:bg-green-500" : "[&>div]:bg-orange-500"}`}
      />

      {/* Stats summary */}
      <div className="flex items-center gap-2 text-xs flex-wrap">
        {severityOrder.map(sev => {
          const count = severityCounts[sev] || 0;
          if (count === 0) return null;
          const cfg = severityConfig[sev];
          return (
            <button
              key={sev}
              onClick={() => setSeverityFilter(severityFilter === sev ? "all" : sev)}
              className={`inline-flex items-center gap-1 transition-colors hover:opacity-80 ${severityFilter === sev ? "font-semibold" : "text-muted-foreground"}`}
            >
              <span>{cfg.emoji}</span>
              <span>{cfg.label} ({count})</span>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="space-y-1.5">
        <div className="flex gap-1 overflow-x-auto whitespace-nowrap" style={scrollableStyle}>
          {severityFilterConfig.map(f => (
            <button key={f.key} onClick={() => setSeverityFilter(f.key)}
              className={`text-[10px] px-2 py-1 rounded-full transition-all shrink-0 ${severityFilter === f.key ? f.className + " ring-1 ring-current font-semibold" : "bg-muted/20 text-muted-foreground hover:bg-muted/40"}`}>
              {f.label} ({severityCounts[f.key] || 0})
            </button>
          ))}
        </div>
        <div className="flex gap-1 overflow-x-auto whitespace-nowrap" style={scrollableStyle}>
          {categoryFilterConfig.filter(f => f.key === "all" || (categoryCounts[f.key] || 0) > 0).map(f => (
            <button key={f.key} onClick={() => setCategoryFilter(f.key as IssueModule | "all")}
              className={`text-[10px] px-2 py-1 rounded-full transition-all shrink-0 ${categoryFilter === f.key ? f.className + " ring-1 ring-current font-semibold" : "bg-muted/20 text-muted-foreground hover:bg-muted/40"}`}>
              {f.label} ({categoryCounts[f.key] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* Issues list */}
      <div>
        {filteredIssues.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">Нет ошибок по выбранным фильтрам</p>
        )}
        {filteredIssues.map((issue) => {
          const id = issue.id || issue.title;
          return (
            <IssueRow
              key={id}
              issue={issue}
              resolved={isResolved(id)}
              onToggle={() => toggleIssue(id)}
              url={url}
              isExpanded={expandedId === id}
              onExpand={() => setExpandedId(expandedId === id ? null : id)}
            />
          );
        })}
      </div>

      {/* Rescan */}
      {resolvedCount > 0 && (
        <div className="flex justify-center pt-2">
          <Button variant="outline" size="sm" onClick={() => navigate(`/tools/site-check?url=${encodeURIComponent(url)}&rescan=true`)} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Пересканировать
          </Button>
        </div>
      )}
    </div>
  );
};

export default FullReportView;
