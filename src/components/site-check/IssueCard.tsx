import { ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import type { IssueCard as IssueCardType } from "@/lib/site-check-types";

const severityConfig = {
  critical: { emoji: "🔴", label: "Критичная", className: "text-red-500 bg-red-500/10 border-red-500/20" },
  high: { emoji: "🟠", label: "Важная", className: "text-orange-500 bg-orange-500/10 border-orange-500/20" },
  medium: { emoji: "🟡", label: "Средняя", className: "text-yellow-500 bg-yellow-500/10 border-yellow-500/20" },
  low: { emoji: "⚪", label: "Низкая", className: "text-muted-foreground bg-muted/30 border-border/30" },
};

const moduleLabels: Record<string, string> = {
  technical: "Техника",
  content: "Контент",
  direct: "Директ",
  competitors: "Конкуренты",
  semantics: "Семантика",
  schema: "Schema",
  ai: "AI",
};

interface IssueCardProps {
  issue: IssueCardType;
}

const IssueCardComponent = ({ issue }: IssueCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const sev = severityConfig[issue.severity];

  return (
    <div className={`rounded-xl border p-4 ${sev.className} transition-all duration-300`}>
      <div className="flex items-start gap-3">
        <span className="text-lg mt-0.5">{sev.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-muted/40 text-muted-foreground">
              {moduleLabels[issue.module]}
            </span>
            <span className="text-xs text-muted-foreground">{sev.label}</span>
          </div>
          <h4 className="font-semibold text-sm text-foreground">{issue.title}</h4>
          <p className="text-xs text-muted-foreground mt-1">{issue.found}</p>
        </div>
      </div>

      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expanded ? "Свернуть" : "Как исправить"}
      </button>

      {expanded && (
        <div className="mt-3 space-y-3 text-xs border-t border-border/30 pt-3">
          <div>
            <span className="font-semibold text-foreground">📍 Где:</span>
            <p className="text-muted-foreground mt-0.5">{issue.location}</p>
          </div>
          <div>
            <span className="font-semibold text-foreground">❓ Почему важно:</span>
            <p className="text-muted-foreground mt-0.5">{issue.why_it_matters}</p>
          </div>
          <div>
            <span className="font-semibold text-foreground">🔧 Как исправить:</span>
            <p className="text-muted-foreground mt-0.5">{issue.how_to_fix}</p>
          </div>
          <div>
            <span className="font-semibold text-foreground">✅ Пример:</span>
            <pre className="mt-1 p-2 rounded-lg bg-muted/40 text-[11px] overflow-x-auto whitespace-pre-wrap text-foreground/80">
              {issue.example_fix}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueCardComponent;
