import { useState } from "react";
import { Copy, Check, ExternalLink, Gauge, Download, Pencil, X, Save, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { saveAs } from "file-saver";

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

const LIMITS = { headline1: 35, headline2: 30, ad_text: 81 };

const CharCount = ({ current, max }: { current: number; max: number }) => (
  <span className={`text-[10px] font-mono ${current > max ? "text-destructive font-bold" : "text-muted-foreground"}`}>
    {current}/{max}
  </span>
);

const DirectAdPreview = ({ adSuggestion, readinessScore, url }: DirectAdPreviewProps) => {
  const { toast } = useToast();
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const [headline1, setHeadline1] = useState(adSuggestion.headline1);
  const [headline2, setHeadline2] = useState(adSuggestion.headline2);
  const [adText, setAdText] = useState(adSuggestion.ad_text);
  const [sitelinks, setSitelinks] = useState([...adSuggestion.sitelinks]);
  const [callouts, setCallouts] = useState([...adSuggestion.callouts]);

  const currentAd = {
    headline1: isEditing ? headline1 : adSuggestion.headline1,
    headline2: isEditing ? headline2 : adSuggestion.headline2,
    ad_text: isEditing ? adText : adSuggestion.ad_text,
    sitelinks: isEditing ? sitelinks : adSuggestion.sitelinks,
    callouts: isEditing ? callouts : adSuggestion.callouts,
  };

  const startEdit = () => {
    setHeadline1(adSuggestion.headline1);
    setHeadline2(adSuggestion.headline2);
    setAdText(adSuggestion.ad_text);
    setSitelinks([...adSuggestion.sitelinks]);
    setCallouts([...adSuggestion.callouts]);
    setIsEditing(true);
  };

  const cancelEdit = () => setIsEditing(false);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast({ title: "Скопировано", description: field });
    setTimeout(() => setCopiedField(null), 2000);
  };

  const copyAll = () => {
    const full = [
      `Заголовок 1: ${currentAd.headline1}`,
      `Заголовок 2: ${currentAd.headline2}`,
      `Текст: ${currentAd.ad_text}`,
      `\nБыстрые ссылки:`,
      ...currentAd.sitelinks.map((s, i) => `${i + 1}. ${s.title} — ${s.description}`),
      `\nУточнения: ${currentAd.callouts.join(" · ")}`,
    ].join("\n");
    navigator.clipboard.writeText(full);
    toast({ title: "Скопировано", description: "Всё объявление скопировано" });
  };

  const exportCsv = () => {
    const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const headers = [
      "Заголовок 1", "Заголовок 2", "Текст объявления",
      ...currentAd.sitelinks.flatMap((_, i) => [`Быстрая ссылка ${i + 1} заголовок`, `Быстрая ссылка ${i + 1} описание`]),
      ...currentAd.callouts.map((_, i) => `Уточнение ${i + 1}`),
    ];
    const values = [
      esc(currentAd.headline1), esc(currentAd.headline2), esc(currentAd.ad_text),
      ...currentAd.sitelinks.flatMap(s => [esc(s.title), esc(s.description)]),
      ...currentAd.callouts.map(c => esc(c)),
    ];
    const csv = [headers.map(h => esc(h)).join(";"), values.join(";")].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const hostname = (() => { try { return new URL(url).hostname.replace("www.", ""); } catch { return "ad"; } })();
    saveAs(blob, `owndev_direct_ad_${hostname}.csv`);
    toast({ title: "✅ CSV готов", description: "Импортируйте в Яндекс.Директ Коммандер" });
  };

  const updateSitelink = (idx: number, field: "title" | "description", value: string) => {
    const next = [...sitelinks];
    next[idx] = { ...next[idx], [field]: value };
    setSitelinks(next);
  };

  const updateCallout = (idx: number, value: string) => {
    const next = [...callouts];
    next[idx] = value;
    setCallouts(next);
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
        <div className="w-20 h-2 rounded-full bg-muted/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              readinessScore >= 7 ? "bg-success" : readinessScore >= 4 ? "bg-warning" : "bg-destructive"
            }`}
            style={{ width: `${readinessScore * 10}%` }}
          />
        </div>
      </div>

      {/* Ad Preview */}
      {currentAd.headline1 && (
        <div className="rounded-xl border border-border/50 bg-card overflow-hidden">
          <div className="px-4 py-2.5 bg-muted/30 border-b border-border/30 flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs font-medium text-muted-foreground">Превью объявления Яндекс.Директ</p>
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={cancelEdit}>
                    <X className="w-3.5 h-3.5" /> Отмена
                  </Button>
                  <Button size="sm" variant="default" className="h-7 text-xs gap-1" onClick={() => setIsEditing(false)}>
                    <Save className="w-3.5 h-3.5" /> Готово
                  </Button>
                </>
              ) : (
                <>
                  <button onClick={startEdit} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Редактировать
                  </button>
                  <button onClick={copyAll} className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
                    <Copy className="w-3.5 h-3.5" /> Скопировать всё
                  </button>
                  <button onClick={exportCsv} className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors">
                    <Download className="w-3.5 h-3.5" /> CSV для Коммандера
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-4 space-y-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span className="px-1 py-0.5 rounded bg-muted text-[10px] font-medium">Реклама</span>
                <span>{displayDomain}</span>
              </div>

              {/* Headlines */}
              {isEditing ? (
                <div className="space-y-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-muted-foreground">Заголовок 1</label>
                      <CharCount current={headline1.length} max={LIMITS.headline1} />
                    </div>
                    <Input value={headline1} onChange={e => setHeadline1(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-muted-foreground">Заголовок 2</label>
                      <CharCount current={headline2.length} max={LIMITS.headline2} />
                    </div>
                    <Input value={headline2} onChange={e => setHeadline2(e.target.value)} className="h-8 text-sm" />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-muted-foreground">Текст объявления</label>
                      <CharCount current={adText.length} max={LIMITS.ad_text} />
                    </div>
                    <Textarea value={adText} onChange={e => setAdText(e.target.value)} className="min-h-[60px] text-sm" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="group flex items-start gap-1">
                    <a href={url} target="_blank" rel="noopener noreferrer" className="text-primary text-base font-medium hover:underline leading-tight">
                      {currentAd.headline1} — {currentAd.headline2}
                    </a>
                    <CopyBtn text={`${currentAd.headline1} — ${currentAd.headline2}`} field="Заголовки" />
                  </div>
                  <div className="group flex items-start gap-1">
                    <p className="text-sm text-foreground/80 leading-snug">{currentAd.ad_text}</p>
                    <CopyBtn text={currentAd.ad_text} field="Текст объявления" />
                  </div>
                </>
              )}
            </div>

            {/* Sitelinks */}
            {currentAd.sitelinks.length > 0 && (
              <div className={`${isEditing ? "space-y-2" : "grid grid-cols-2 gap-x-4 gap-y-1"} pt-1 border-t border-border/20`}>
                {isEditing ? (
                  currentAd.sitelinks.map((link, i) => (
                    <div key={i} className="grid grid-cols-2 gap-2">
                      <Input value={link.title} onChange={e => updateSitelink(i, "title", e.target.value)} placeholder={`Ссылка ${i + 1} заголовок`} className="h-7 text-xs" />
                      <Input value={link.description} onChange={e => updateSitelink(i, "description", e.target.value)} placeholder="Описание" className="h-7 text-xs" />
                    </div>
                  ))
                ) : (
                  currentAd.sitelinks.map((link, i) => (
                    <div key={i} className="group">
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-primary font-medium hover:underline cursor-pointer">{link.title}</span>
                        <CopyBtn text={link.title} field={`Ссылка ${i + 1}`} />
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight">{link.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Callouts */}
            {currentAd.callouts.length > 0 && (
              <div className="pt-1 border-t border-border/20">
                {isEditing ? (
                  <div className="flex flex-wrap gap-2">
                    {callouts.map((c, i) => (
                      <Input key={i} value={c} onChange={e => updateCallout(i, e.target.value)} className="h-7 text-xs w-auto min-w-[100px] max-w-[180px]" />
                    ))}
                  </div>
                ) : (
                  <div className="group flex items-center gap-1">
                    <p className="text-[11px] text-muted-foreground">
                      {currentAd.callouts.join(" · ")}
                    </p>
                    <CopyBtn text={currentAd.callouts.join(" · ")} field="Уточнения" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Char limits info */}
          <div className="px-4 py-2 bg-muted/20 border-t border-border/20 flex flex-wrap gap-3 text-[10px] text-muted-foreground/60">
            <span className={currentAd.headline1.length > LIMITS.headline1 ? "text-destructive" : ""}>Заг.1: {currentAd.headline1.length}/{LIMITS.headline1}</span>
            <span className={currentAd.headline2.length > LIMITS.headline2 ? "text-destructive" : ""}>Заг.2: {currentAd.headline2.length}/{LIMITS.headline2}</span>
            <span className={currentAd.ad_text.length > LIMITS.ad_text ? "text-destructive" : ""}>Текст: {currentAd.ad_text.length}/{LIMITS.ad_text}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectAdPreview;
