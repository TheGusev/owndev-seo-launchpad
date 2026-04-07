import { useState } from "react";
import { ChevronDown, ChevronUp, AlertTriangle, Info, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { AuditIssue, IssuePriority } from "@/lib/api/types";

const severityIcon = {
  critical: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const severityColor: Record<string, string> = {
  critical: "text-destructive",
  warning: "text-warning",
  info: "text-primary",
};

const priorityStyle: Record<IssuePriority, string> = {
  P1: "bg-destructive/20 text-destructive border-destructive/30",
  P2: "bg-warning/20 text-warning border-warning/30",
  P3: "bg-muted text-muted-foreground border-border",
};

interface AuditIssueRowProps {
  issue: AuditIssue;
  confidence?: number;
}

const AuditIssueRow = ({ issue, confidence }: AuditIssueRowProps) => {
  const [expanded, setExpanded] = useState(false);
  const Icon = severityIcon[issue.severity as keyof typeof severityIcon] ?? Info;
  const color = severityColor[issue.severity] ?? "text-muted-foreground";
  const priority = issue.priority ?? "P3";
  const source = (issue as any).source as string | undefined;

  return (
    <div className="rounded-lg border border-border/40 bg-card/30 p-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-start gap-3 w-full text-left min-h-[32px]"
      >
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${color}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground leading-snug">{issue.message}</p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{issue.detail}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge className={`text-[10px] px-1.5 py-0 border ${priorityStyle[priority]}`}>
            {priority}
          </Badge>
          {confidence != null && (
            <span className="text-[10px] text-muted-foreground font-mono">{confidence}%</span>
          )}
          {source && (
            <span className="text-[10px] px-1 py-0 rounded bg-muted text-muted-foreground">{source}</span>
          )}
          {expanded ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
        </div>
      </button>

      {expanded && issue.recommendation && (
        <div className="mt-2 ml-7 pl-3 border-l-2 border-primary/30">
          <p className="text-xs text-primary/80 font-medium mb-0.5">Рекомендация:</p>
          <p className="text-xs text-muted-foreground">{issue.recommendation}</p>
        </div>
      )}
    </div>
  );
};

export default AuditIssueRow;
