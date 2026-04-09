import { useState } from "react";
import { Copy, Check, ExternalLink, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DirectAdSuggestion {
  headline1: string;
  headline2: string;
  ad_text: string;
  sitelinks: { title: string; description: string }[];
  callouts: string[];
}

interface DirectAdPreviewProps {
  adSuggestion: DirectAdSuggestion;
  readinessScore: number;
  url: string;
}

const DirectAdPreview = ({ adSuggestion, readinessScore, url }: DirectAdPreviewProps) => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: "Скопировано", description: field });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAll = () => {
    const full = [
      `Заголовок 1: ${adSuggestion.headline1}`,
      `Заголовок 2: ${adSuggestion.headline2}`,
      `Текст: ${adSuggestion.ad_text}`,
      `\nБыстрые ссылки:`,
      ...adSuggestion.sitelinks.map((s, i) => `${i + 1}. ${s.title} — ${s.description}`),
      `\nУточнения: ${adSuggestion.callouts.join(" · ")}`,
    ].join("\n");
    navigator.clipboard.writeText(full);
    toast({ title: "Скопировано", description: "Всё объявление скопировано" });
  };

  const scoreColor = readinessScore >= 7 ? "text-success" : readinessScore >= 4 ? "text-warning" : "text-destructive";
  const scoreBg = readinessScore >= 7 ? "bg-success/10" : readinessScore >= 4 ? "bg-warning/10" : "bg-destructive/10";

  const CopyBtn = ({ text, field }: { text: string; field: string }) => (
    <button
      onClick={() => copyToClipboard(text, field)}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-muted"
      title="Скопировать"
    >
      {copiedField === field ? (
        <Check className="w-3.5 h-3.5 text-success" />
      ) : (
        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
      )}
    </button>
  );

  const displayDomain = (() => {
    try { return new URL(url).hostname; } catch { return url; }
  })();

  return (
    <div className="space-y-4">
      {/* Readiness Score */}
      <div className={`flex items-center gap-3 rounded-lg p-3 ${scoreBg}`}>
        <Gauge className={`w-5 h-5 ${scoreColor}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-foreground">
            Direct Readiness: <span className={`font-bold ${scoreColor}`}>{readinessScore}/10</span>
          </p>
          <p className="text-xs text-muted-foreground">
            {readinessScore >= 7 ? "Страница готова к запуску рекламы" :
             readinessScore >= 4 ? "Требуются доработки перед запуском" :
             "Страница не готова — высокий риск слива бюджета"}
          </p>
        </div>
        {/* Mini progress bar */}
        <div className="w-20 h-2 rounded-full bg-muted/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              readinessScore >= 7 ? "bg-success" : readinessScore >= 4 ? "bg-warning" : "bg-destructive"
            }`}
            style={{ width: `${readinessScore * 10}%` }}
          />
        </div>
      </div>

      {/* Ad Preview - only show if we have actual ad content */}
      {adSuggestion.headline1 && (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border/30 flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">Превью объявления Яндекс.Директ</p>
            <button
              onClick={copyAll}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
            >
              <Copy className="w-3.5 h-3.5" /> Скопировать всё
            </button>
          </div>

          <div className="p-4 space-y-2">
            {/* Ad mock */}
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="px-1 py-0.5 rounded bg-muted text-[10px] font-medium">Реклама</span>
                <span>{displayDomain}</span>
              </div>

              {/* Headlines */}
              <div className="group flex items-start gap-1">
                <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary text-base font-medium hover:underline leading-tight">
                  {adSuggestion.headline1} — {adSuggestion.headline2}
                </a>
                <CopyBtn text={`${adSuggestion.headline1} — ${adSuggestion.headline2}`} field="Заголовки" />
              </div>

              {/* Ad text */}
              <div className="group flex items-start gap-1">
                <p className="text-sm text-foreground/80 leading-snug">{adSuggestion.ad_text}</p>
                <CopyBtn text={adSuggestion.ad_text} field="Текст объявления" />
              </div>
            </div>

            {/* Sitelinks */}
            {adSuggestion.sitelinks.length > 0 && (
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 pt-1 border-t border-border/20">
                {adSuggestion.sitelinks.map((link, i) => (
                  <div key={i} className="group">
                    <div className="flex items-center gap-1">
                      <span className="text-xs text-primary font-medium hover:underline cursor-pointer">{link.title}</span>
                      <CopyBtn text={link.title} field={`Ссылка ${i + 1}`} />
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">{link.description}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Callouts */}
            {adSuggestion.callouts.length > 0 && (
              <div className="group flex items-center gap-1 pt-1 border-t border-border/20">
                <p className="text-[11px] text-muted-foreground">
                  {adSuggestion.callouts.join(" · ")}
                </p>
                <CopyBtn text={adSuggestion.callouts.join(" · ")} field="Уточнения" />
              </div>
            )}
          </div>

          {/* Char limits info */}
          <div className="px-4 py-2 bg-muted/20 border-t border-border/20 flex flex-wrap gap-3 text-[10px] text-muted-foreground/60">
            <span>Заг.1: {adSuggestion.headline1.length}/35</span>
            <span>Заг.2: {adSuggestion.headline2.length}/30</span>
            <span>Текст: {adSuggestion.ad_text.length}/81</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectAdPreview;
