import { useState } from "react";
import ToolCTA from "@/components/tools/ToolCTA";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Link2, CheckCircle, XCircle, Loader2, ExternalLink, Globe, Clock, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { checkInternalLinks, ensureProtocol } from "@/lib/api";
import { saveLastUrl } from "@/utils/lastUrl";
import EmptyState from "@/components/ui/empty-state";
import { useAudit } from "@/state/audit";

interface LinkResult {
  href: string;
  text: string;
  status: number | null;
  ok: boolean;
  isNofollow: boolean;
}

const statusExplanation: Record<number, string> = {
  400: "Некорректный запрос",
  401: "Требуется авторизация",
  403: "Доступ запрещён",
  404: "Страница не найдена",
  410: "Страница удалена навсегда",
  500: "Ошибка сервера",
  502: "Ошибка шлюза",
  503: "Сервис временно недоступен",
  504: "Таймаут шлюза",
};

const InternalLinksChecker = () => {
  const [url, setUrl] = useState("");
  const { run, current } = useAudit<{ totalFound: number; checked: number; working: number; broken: number; links: LinkResult[]; unchecked: number }>('internal-links');
  const [filter, setFilter] = useState<"all" | "broken" | "nofollow">("all");
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const loading = current?.loading ?? false;
  const result = current?.result ?? null;

  const handleCheck = async () => {
    if (!url.trim()) { toast({ title: "Введите URL", variant: "destructive" }); return; }
    const normalized = ensureProtocol(url);
    setCheckedAt(null);
    try {
      await run(normalized, () => checkInternalLinks(normalized));
      setCheckedAt(new Date());
      saveLastUrl(normalized);
    } catch (e: any) {
      toast({ title: "Ошибка проверки", description: e.message, variant: "destructive" });
    }
  };

  const handleReset = () => {
    setCheckedAt(null);
  };

  const filteredLinks = result?.links.filter((l) => {
    if (filter === "broken") return !l.ok;
    if (filter === "nofollow") return l.isNofollow;
    return true;
  }) || [];

  return (
    <div className="glass rounded-2xl p-5 md:p-8 space-y-6">
      <div className="flex gap-3">
        <Input placeholder="example.com" value={url} onChange={(e) => setUrl(e.target.value)} className="bg-card border-border flex-1"
          onKeyDown={(e) => e.key === "Enter" && handleCheck()} />
        <GradientButton onClick={handleCheck} disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Link2 className="w-5 h-5" />}
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

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{result.totalFound}</p>
              <p className="text-xs text-muted-foreground">Найдено</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-success">{result.working}</p>
              <p className="text-xs text-muted-foreground">Рабочих</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className={`text-2xl font-bold ${result.broken > 0 ? "text-destructive" : "text-foreground"}`}>{result.broken}</p>
              <p className="text-xs text-muted-foreground">Битых</p>
            </div>
            <div className="glass rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{result.checked}</p>
              <p className="text-xs text-muted-foreground">Проверено</p>
            </div>
          </div>

          {result.unchecked > 0 && (
            <p className="text-xs text-muted-foreground text-center">+ {result.unchecked} ссылок не проверено (лимит 50)</p>
          )}

          <div className="flex gap-2">
            {(["all", "broken", "nofollow"] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)}
                className={`text-xs px-3 py-2 rounded-lg transition-colors min-h-[36px] ${filter === f ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
                {f === "all" ? "Все" : f === "broken" ? "Битые" : "Nofollow"}
              </button>
            ))}
          </div>

          <div className="glass rounded-xl p-4 max-h-[400px] overflow-y-auto space-y-2">
            {filteredLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Нет ссылок по фильтру</p>
            ) : filteredLinks.map((link, i) => (
              <div key={i} className="flex items-start gap-2 py-1.5 border-b border-border/30">
                {link.ok ? <CheckCircle className="w-4 h-4 text-success shrink-0 mt-0.5" /> : <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <a href={link.href} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline truncate flex items-center gap-1">
                      {link.href} <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                    {link.isNofollow && <span className="text-[10px] px-1.5 py-0.5 rounded bg-warning/20 text-warning">nofollow</span>}
                    {link.status && (
                      <span className={`text-[10px] ${link.ok ? "text-muted-foreground" : "text-destructive font-bold"}`}>
                        {link.status}
                        {!link.ok && link.status && statusExplanation[link.status] && ` — ${statusExplanation[link.status]}`}
                      </span>
                    )}
                  </div>
                  {link.text && <p className="text-xs text-muted-foreground truncate">Текст ссылки: {link.text}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <ToolCTA />
    </div>
  );
};

export default InternalLinksChecker;
