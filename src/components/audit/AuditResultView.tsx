import { Loader2, AlertTriangle, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import EmptyState from "@/components/ui/empty-state";
import AuditSectionBlock, { type SectionConfig } from "./AuditSectionBlock";
import AuditPriorityList from "./AuditPriorityList";
import AuditActions from "./AuditActions";
import type { AuditResult, AuditIssue, ToolId } from "@/lib/api/types";

const SECTIONS: SectionConfig[] = [
  { id: "indexability", label: "Indexability", categories: ["technical", "seo"], whyImportant: "Если поисковик не может найти и проиндексировать страницу, остальные оптимизации бесполезны." },
  { id: "content", label: "Content Structure", categories: ["content"], whyImportant: "Структурированный контент помогает и поисковикам, и LLM правильно понять смысл страницы." },
  { id: "ai-readiness", label: "AI Readiness", categories: ["ai", "llm"], whyImportant: "AI-поисковики (Perplexity, ChatGPT, Gemini) используют структуру и мета-данные для формирования ответов." },
  { id: "eeat", label: "E-E-A-T", categories: ["eeat", "trust"], whyImportant: "Сигналы экспертности и доверия напрямую влияют на ранжирование и AI-цитирование." },
  { id: "schema", label: "Schema / llms.txt", categories: ["schema"], whyImportant: "Структурированные данные и llms.txt помогают AI-системам корректно интерпретировать контент." },
  { id: "speed", label: "Speed / Rendering", categories: ["speed", "performance"], whyImportant: "Скорость загрузки влияет на Core Web Vitals и пользовательский опыт." },
  { id: "yandex-ai", label: "ЯндексGPT и Алиса", categories: ["yandex_ai", "yandex_no_llms_txt", "yandex_thin_llms_txt", "yandex_no_org_schema", "yandex_no_content_schema", "yandex_no_question_headings", "yandex_no_lists_tables", "yandex_very_slow", "yandex_slow"], whyImportant: "ЯндексGPT и голосовой помощник Алиса используют структуру, скорость и разметку сайта для формирования ответов в поиске." },
  { id: "brand", label: "Brand Signals", categories: ["brand"], comingSoon: true },
];

interface AuditResultViewProps {
  result: AuditResult | null;
  isLoading?: boolean;
  error?: string | null;
  toolId?: ToolId;
  url?: string;
  onRetry?: () => void;
}

const getIssuesForSection = (issues: AuditIssue[], section: SectionConfig): AuditIssue[] =>
  issues.filter((i) => section.categories.includes(i.category ?? ""));

const AuditResultView = ({ result, isLoading, error, url, onRetry }: AuditResultViewProps) => {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-center py-8 gap-3">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Анализируем страницу…</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 rounded-xl" />)}
      </div>
    );
  }

  if (error) {
    return <EmptyState message={error} onRetry={onRetry} />;
  }

  if (!result) {
    return (
      <div className="glass rounded-xl p-6 text-center text-muted-foreground text-sm">
        Введите URL и нажмите кнопку — получите структурированный аудит сайта
      </div>
    );
  }

  const scoreColor = result.score >= 80 ? "text-success" : result.score >= 50 ? "text-warning" : "text-destructive";
  const confColor = result.confidence >= 70 ? "text-success" : result.confidence >= 40 ? "text-warning" : "text-muted-foreground";

  const p1 = result.issues.filter((i) => i.priority === "P1").slice(0, 3);
  const quickWins = result.issues.filter((i) => i.priority === "P3" || !i.priority).slice(0, 3);

  return (
    <div className="space-y-5">
      {/* URL */}
      {url && (
        <p className="text-xs text-muted-foreground truncate">🔗 {url}</p>
      )}

      {/* Summary + scores */}
      <div className="glass rounded-xl p-5 space-y-4">
        <p className="text-sm text-foreground">{result.summary}</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">AI Visibility Score</p>
            <p className={`text-3xl font-bold font-mono ${scoreColor}`}>{result.score}</p>
            <Progress value={result.score} className="mt-2 h-2" />
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground mb-1">Confidence</p>
            <p className={`text-3xl font-bold font-mono ${confColor}`}>{result.confidence}</p>
            <Progress value={result.confidence} className="mt-2 h-2" />
          </div>
        </div>
      </div>

      {/* Quick highlights: P1 critical + quick wins */}
      {(p1.length > 0 || quickWins.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {p1.length > 0 && (
            <div className="glass rounded-xl p-4 border border-destructive/20">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <span className="text-xs font-semibold text-destructive">Критические проблемы</span>
              </div>
              {p1.map((issue, i) => (
                <p key={i} className="text-xs text-foreground truncate">• {issue.message}</p>
              ))}
            </div>
          )}
          {quickWins.length > 0 && (
            <div className="glass rounded-xl p-4 border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-success" />
                <span className="text-xs font-semibold text-success">Быстрые улучшения</span>
              </div>
              {quickWins.map((issue, i) => (
                <p key={i} className="text-xs text-foreground truncate">• {issue.message}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sections */}
      <div className="space-y-2">
        {SECTIONS.map((section) => (
          <AuditSectionBlock
            key={section.id}
            section={section}
            issues={getIssuesForSection(result.issues, section)}
            confidence={result.confidence}
          />
        ))}
      </div>

      {/* Priority list */}
      <AuditPriorityList issues={result.issues} />

      {/* Actions */}
      <AuditActions />
    </div>
  );
};

export default AuditResultView;
