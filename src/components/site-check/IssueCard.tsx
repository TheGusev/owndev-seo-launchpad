import { ChevronDown, ChevronUp, CheckCircle2, Copy, ExternalLink } from "lucide-react";
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import AutoFixGenerator from "@/components/site-check/AutoFixGenerator";
import type { IssueCard as IssueCardType } from "@/lib/site-check-types";

const severityConfig = {
  critical: { emoji: "🔴", label: "Критично", badgeClass: "bg-red-500/20 text-red-400", borderClass: "border-red-500/30" },
  high: { emoji: "🟠", label: "Важно", badgeClass: "bg-orange-500/20 text-orange-400", borderClass: "border-orange-500/30" },
  medium: { emoji: "🟡", label: "Средне", badgeClass: "bg-yellow-500/20 text-yellow-400", borderClass: "border-yellow-500/30" },
  low: { emoji: "⚪", label: "Мелко", badgeClass: "bg-gray-500/20 text-gray-400", borderClass: "border-border/30" },
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

interface IssueCardProps {
  issue: IssueCardType;
  resolved?: boolean;
  onToggle?: () => void;
  siteUrl?: string;
  pageTitle?: string;
  pageDescription?: string;
}

function renderHowToFix(text: string) {
  const lines = text.split('\n').filter(l => l.trim());
  return (
    <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
      {lines.map((line, i) => {
        const cleaned = line.replace(/^\d+\.\s*/, '').trim();
        return <li key={i}>{cleaned}</li>;
      })}
    </ol>
  );
}

const IssueCardComponent = ({ issue, resolved = false, onToggle, siteUrl, pageTitle, pageDescription }: IssueCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const { toast } = useToast();
  const sev = severityConfig[issue.severity];
  const cat = categoryConfig[issue.module] || { label: issue.module, className: "bg-muted/40 text-muted-foreground" };
  const impactScore = issue.impact_score ?? 0;

  const handleCopy = () => {
    navigator.clipboard.writeText(issue.example_fix);
    toast({ title: "Скопировано!" });
  };

  return (
    <div className={`rounded-xl border p-4 ${sev.borderClass} bg-card/50 transition-all duration-300 ${resolved ? "opacity-50" : ""}`}>
      {/* Header */}
      <div className="flex items-start gap-3">
        {onToggle && (
          <Checkbox
            checked={resolved}
            onCheckedChange={() => onToggle()}
            className="mt-1 shrink-0"
          />
        )}
        {resolved ? (
          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
        ) : (
          <span className="text-lg mt-0.5">{sev.emoji}</span>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${sev.badgeClass}`}>
              {sev.label}
            </span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.className}`}>
              {cat.label}
            </span>
            {impactScore > 0 && (
              <span className="text-xs font-semibold text-primary ml-auto">
                +{impactScore} б.
              </span>
            )}
          </div>
          <h4 className={`font-semibold text-sm ${resolved ? "line-through text-muted-foreground" : "text-foreground"}`}>
            {issue.title}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">{issue.found}</p>
          {issue.location && (
            <p className="text-xs text-muted-foreground/70 mt-0.5">📍 {issue.location}</p>
          )}
        </div>
      </div>

      {/* Expand toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="mt-3 flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 active:text-primary/80 transition-colors min-h-[44px]"
      >
        {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        {expanded ? "Свернуть" : "Как исправить"}
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="mt-3 space-y-4 text-xs border-t border-border/30 pt-3">
          {/* Why important */}
          <div className="rounded-lg bg-yellow-500/5 border border-yellow-500/20 p-3">
            <span className="font-semibold text-yellow-400">❓ Почему это важно</span>
            <p className="text-muted-foreground mt-1">{issue.why_it_matters}</p>
          </div>

          {/* How to fix */}
          <div>
            <span className="font-semibold text-foreground">🔧 Как исправить</span>
            <div className="mt-1.5">
              {renderHowToFix(issue.how_to_fix)}
            </div>
          </div>

          {/* Example */}
          {issue.example_fix && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-foreground">✅ Пример</span>
                <button
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
                >
                  <Copy className="w-3 h-3" />
                  Копировать
                </button>
              </div>
              <pre className="p-3 rounded-lg bg-muted/40 text-[11px] overflow-x-auto whitespace-pre-wrap break-all max-w-full text-foreground/80 border border-border/20">
                {issue.example_fix}
              </pre>
            </div>
          )}

          {/* Auto-fix generator */}
          {siteUrl && (
            <AutoFixGenerator
              issueTitle={issue.title}
              url={siteUrl}
              pageTitle={pageTitle}
              pageDescription={pageDescription}
            />
          )}

          {/* Footer: docs link */}
          {issue.docs_url && (
            <div className="pt-2 border-t border-border/20">
              <a
                href={issue.docs_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
              >
                Документация <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default IssueCardComponent;
