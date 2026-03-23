import { useState } from "react";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Search, Globe, Zap, Loader2, AlertTriangle, CheckCircle, Info, Bot, Hash, RefreshCw, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import ToolCTA from "./ToolCTA";

interface AuditIssue {
  type: string;
  severity: "critical" | "warning" | "info";
  message: string;
  recommendation: string;
  category: "seo" | "llm";
  details?: string[];
  context?: string;
}

interface AuditResult {
  seoScore: number;
  llmScore: number;
  issues: AuditIssue[];
  summary: string;
  meta: {
    url: string;
    title: string | null;
    description: string | null;
    htmlSizeKB: number;
    loadTimeMs: number;
    totalImages: number;
    imagesWithoutAlt: number;
    wordCount: number;
    h2Count: number;
    jsonLdCount: number;
  };
}

const severityConfig = {
  critical: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", label: "Критично" },
  warning: { icon: AlertTriangle, color: "text-warning", bg: "bg-warning/10", label: "Внимание" },
  info: { icon: Info, color: "text-primary", bg: "bg-primary/10", label: "Инфо" },
};

const ScoreCard = ({ label, score, icon: Icon }: { label: string; score: number; icon: React.ElementType }) => {
  const color = score >= 80 ? "text-success" : score >= 50 ? "text-warning" : "text-destructive";
  return (
    <div className="glass rounded-xl p-6 text-center flex-1">
      <div className="flex items-center justify-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
      <p className={`text-4xl font-bold font-mono ${color}`}>{score}</p>
      <Progress value={score} className="mt-3 h-2" />
    </div>
  );
};

const IssueCard = ({ issue }: { issue: AuditIssue }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = severityConfig[issue.severity];
  const Icon = cfg.icon;
  const hasExtra = (issue.details && issue.details.length > 0) || issue.context;

  return (
    <div className={`rounded-xl p-4 ${cfg.bg} border border-border/30`}>
      <div className="flex items-start gap-3">
        <Icon className={`w-4 h-4 mt-0.5 shrink-0 ${cfg.color}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{issue.category.toUpperCase()}</span>
          </div>
          <p className="text-sm font-medium text-foreground">{issue.message}</p>
          <p className="text-xs text-muted-foreground mt-1">→ {issue.recommendation}</p>

          {hasExtra && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-primary hover:underline mt-2 min-h-[28px]"
            >
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              {expanded ? "Скрыть детали" : "Подробнее"}
            </button>
          )}

          {expanded && (
            <div className="mt-2 space-y-1.5">
              {issue.details && issue.details.length > 0 && (
                <div className="bg-background/50 rounded-lg p-2.5">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Примеры:</p>
                  {issue.details.map((d, i) => (
                    <p key={i} className="text-xs text-muted-foreground font-mono break-all">{d}</p>
                  ))}
                </div>
              )}
              {issue.context && (
                <p className="text-xs text-muted-foreground italic">💡 {issue.context}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const SEOAuditor = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "seo" | "llm">("all");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const runAudit = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setCheckedAt(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("seo-audit", {
        body: { url: url.trim() },
      });
      if (fnError) throw new Error(fnError.message);
      if (data.error) throw new Error(data.error);
      setResult(data as AuditResult);
      setCheckedAt(new Date());
    } catch (e: any) {
      setError(e.message || "Произошла ошибка");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setCheckedAt(null);
  };

  const filteredIssues = result?.issues.filter(i => activeTab === "all" || i.category === activeTab) || [];

  return (
    <div className="glass rounded-2xl p-5 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">URL сайта для аудита</label>
          <div className="flex gap-3">
            <Input
              placeholder="https://example.com"
              className="bg-card border-border flex-1"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && runAudit()}
            />
            <GradientButton onClick={runAudit} disabled={loading || !url.trim()}>
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </GradientButton>
          </div>
        </div>

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground text-sm">Анализируем страницу…</p>
          </div>
        )}

        {error && (
          <div className="glass rounded-xl p-5 border border-destructive/30">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </div>
        )}

        {result && (
          <>
            {/* Analyzed URL + timestamp */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Globe className="w-4 h-4 text-primary shrink-0" />
                <p className="text-sm text-foreground font-medium truncate">{result.meta.url}</p>
              </div>
              <div className="flex items-center gap-3">
                {checkedAt && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {checkedAt.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                  </span>
                )}
                <button onClick={handleReset} className="text-xs text-primary hover:underline flex items-center gap-1 min-h-[28px]">
                  <RefreshCw className="w-3 h-3" /> Проверить заново
                </button>
              </div>
            </div>

            {/* Dual scores */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ScoreCard label="SEO Score" score={result.seoScore} icon={Search} />
              <ScoreCard label="LLM Score" score={result.llmScore} icon={Bot} />
            </div>

            <p className="text-sm text-muted-foreground text-center">{result.summary}</p>

            {/* Quick stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: Globe, label: "HTML", value: `${result.meta.htmlSizeKB} КБ` },
                { icon: Zap, label: "Загрузка", value: `${(result.meta.loadTimeMs / 1000).toFixed(1)}с` },
                { icon: Hash, label: "Слов", value: `${result.meta.wordCount}` },
                { icon: Search, label: "JSON‑LD", value: `${result.meta.jsonLdCount}` },
              ].map((s) => (
                <div key={s.label} className="glass rounded-xl p-3 text-center">
                  <s.icon className="w-4 h-4 text-primary mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-sm font-bold text-foreground">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2">
              {(["all", "seo", "llm"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors min-h-[36px] ${
                    activeTab === tab ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab === "all" ? `Все (${result.issues.length})` : tab === "seo" ? `SEO (${result.issues.filter(i => i.category === "seo").length})` : `LLM (${result.issues.filter(i => i.category === "llm").length})`}
                </button>
              ))}
            </div>

            {/* Issues */}
            {filteredIssues.length > 0 && (
              <div className="space-y-3">
                {filteredIssues.map((issue, i) => (
                  <IssueCard key={i} issue={issue} />
                ))}
              </div>
            )}

            {filteredIssues.length === 0 && (
              <div className="glass rounded-xl p-6 text-center">
                <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                <p className="text-sm text-foreground font-medium">Проблем не найдено!</p>
              </div>
            )}

            <ToolCTA />
          </>
        )}

        {!loading && !result && !error && (
          <div className="glass rounded-xl p-5 text-center text-muted-foreground text-sm">
            Введите URL и нажмите кнопку — получите двойной аудит: классический SEO + готовность к AI‑поиску
          </div>
        )}
      </div>
    </div>
  );
};

export default SEOAuditor;
