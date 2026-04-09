import { useState } from "react";
import ToolCTA from "@/components/tools/ToolCTA";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { ScanSearch, CheckCircle, XCircle, AlertTriangle, Loader2, Globe, Clock, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { checkIndexation, ensureProtocol } from "@/lib/api";
import { saveLastUrl } from "@/utils/lastUrl";
import EmptyState from "@/components/ui/empty-state";
import { useAudit } from "@/state/audit";

interface Issue {
  type: string;
  severity: "error" | "warning" | "ok";
  message: string;
  detail: string;
}

const SeverityIcon = ({ s }: { s: string }) => {
  if (s === "ok") return <CheckCircle className="w-4 h-4 text-success shrink-0" />;
  if (s === "error") return <XCircle className="w-4 h-4 text-destructive shrink-0" />;
  return <AlertTriangle className="w-4 h-4 text-warning shrink-0" />;
};

const IndexationChecker = () => {
  const [url, setUrl] = useState("");
  const { run, current } = useAudit<{ indexable: boolean; issues: Issue[]; meta: any; statusCode: number }>('indexation');
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const loading = current?.loading ?? false;
  const result = current?.result ?? null;

  const handleCheck = async () => {
    if (!url.trim()) { toast({ title: "Введите URL", variant: "destructive" }); return; }
    const normalized = ensureProtocol(url);
    setCheckedAt(null);
    try {
      await run(normalized, () => checkIndexation(normalized));
      setCheckedAt(new Date());
      saveLastUrl(normalized);
    } catch (e: any) {
      toast({ title: "Ошибка проверки", description: e.message, variant: "destructive" });
    }
  };

  const handleReset = () => {
    setCheckedAt(null);
  };

  return (
    <div className="glass rounded-2xl p-5 md:p-8 space-y-6">
      <div className="flex gap-3">
        <Input placeholder="example.com/page" value={url} onChange={(e) => setUrl(e.target.value)} className="bg-card border-border flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleCheck()} />
        <GradientButton onClick={handleCheck} disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ScanSearch className="w-5 h-5" />}
        </GradientButton>
      </div>

      {!loading && !result && checkedAt && (
        <EmptyState onRetry={handleCheck} />
      )}

      {result && (
        <div className="space-y-4">
          {/* URL + timestamp */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Globe className="w-4 h-4 text-primary shrink-0" />
              <p className="text-sm text-foreground font-medium truncate">{url}</p>
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

          <div className={`glass rounded-xl p-4 flex items-center gap-3 ${result.indexable ? "border-success/30" : "border-destructive/30"} border`}>
            {result.indexable ? <CheckCircle className="w-6 h-6 text-success" /> : <XCircle className="w-6 h-6 text-destructive" />}
            <div>
              <p className="font-semibold text-foreground">{result.indexable ? "Страница доступна для индексации" : "Индексация заблокирована"}</p>
              <p className="text-sm text-muted-foreground">{result.meta.title || "Без title"}</p>
            </div>
          </div>

          <div className="glass rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Результаты проверки</h3>
            {result.issues.map((issue, i) => (
              <div key={i} className="flex items-start gap-3">
                <SeverityIcon s={issue.severity} />
                <div>
                  <p className="text-sm font-medium text-foreground">{issue.message}</p>
                  <p className="text-xs text-muted-foreground">{issue.detail}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="glass rounded-xl p-5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Ссылок</p>
              <p className="text-lg font-bold text-foreground">{result.meta.totalLinks}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nofollow</p>
              <p className="text-lg font-bold text-foreground">{result.meta.nofollowLinks}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Canonical</p>
              <p className="text-xs font-medium text-foreground truncate">{result.meta.canonical || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-lg font-bold text-foreground">{result.statusCode}</p>
            </div>
          </div>
        </div>
      )}
      <ToolCTA />
    </div>
  );
};

export default IndexationChecker;
