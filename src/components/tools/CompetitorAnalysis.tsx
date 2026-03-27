import { useState } from "react";
import ToolCTA from "@/components/tools/ToolCTA";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Swords, CheckCircle, XCircle, Loader2, Clock, RefreshCw, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PageMetrics {
  url: string;
  title: string;
  description: string;
  h1: string;
  h2Count: number;
  h3Count: number;
  wordCount: number;
  imageCount: number;
  imagesWithoutAlt: number;
  hasJsonLd: boolean;
  jsonLdTypes: string[];
  jsonLdCount: number;
  hasFaq: boolean;
  hasViewport: boolean;
  hasCanonical: boolean;
  hasOg: boolean;
  loadTimeMs: number;
  htmlSizeKB: number;
  internalLinks: number;
  externalLinks: number;
  isHttps: boolean;
  hasRobotsTxt: boolean;
  hasSitemapXml: boolean;
  lang: string;
  listCount: number;
  tableCount: number;
  brokenLinks: string[];
  seoScore: number;
  imgsWithoutDimensions: number;
  hasLazyImages: boolean;
  hasFontDisplaySwap: boolean;
  hasPreloadHero: boolean;
}

const BoolBadge = ({ value, label }: { value: boolean; label: string }) => (
  <span className="inline-flex items-center gap-1 text-xs">
    {value ? <CheckCircle className="w-3 h-3 text-success" /> : <XCircle className="w-3 h-3 text-destructive" />}
    {label}
  </span>
);

const MetricRow = ({ label, v1, v2, better }: { label: string; v1: string | number; v2: string | number; better?: "higher" | "lower" }) => {
  let c1 = "text-foreground", c2 = "text-foreground";
  if (better && v1 !== v2) {
    const n1 = typeof v1 === "number" ? v1 : 0;
    const n2 = typeof v2 === "number" ? v2 : 0;
    if (better === "higher") { if (n1 > n2) c1 = "text-success"; else c2 = "text-success"; }
    else { if (n1 < n2) c1 = "text-success"; else c2 = "text-success"; }
  }
  return (
    <div className="flex items-center justify-between py-2 border-b border-border/30 gap-2">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <div className="flex items-center gap-3 text-right">
        <span className={`text-sm font-medium ${c1}`}>{v1}</span>
        <span className="text-xs text-muted-foreground">/</span>
        <span className={`text-sm font-medium ${c2}`}>{v2}</span>
      </div>
    </div>
  );
};

const ScoreCompare = ({ s1, s2 }: { s1: number; s2: number }) => {
  const c1 = s1 >= s2 ? "text-success" : s1 >= 50 ? "text-warning" : "text-destructive";
  const c2 = s2 >= s1 ? "text-success" : s2 >= 50 ? "text-warning" : "text-destructive";
  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="glass rounded-xl p-5 text-center">
        <Trophy className="w-5 h-5 text-primary mx-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-1">SEO Score — Страница 1</p>
        <p className={`text-3xl font-bold font-mono ${c1}`}>{s1}</p>
        <Progress value={s1} className="mt-2 h-2" />
      </div>
      <div className="glass rounded-xl p-5 text-center">
        <Trophy className="w-5 h-5 text-primary mx-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-1">SEO Score — Страница 2</p>
        <p className={`text-3xl font-bold font-mono ${c2}`}>{s2}</p>
        <Progress value={s2} className="mt-2 h-2" />
      </div>
    </div>
  );
};

const CompetitorAnalysis = () => {
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ page1: PageMetrics; page2: PageMetrics } | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);

  const handleAnalyze = async () => {
    if (!url1 || !url2) { toast({ title: "Введите оба URL", variant: "destructive" }); return; }
    setLoading(true);
    setResult(null);
    setCheckedAt(null);
    try {
      const { data, error } = await supabase.functions.invoke("competitor-analysis", { body: { url1, url2 } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data);
      setCheckedAt(new Date());
    } catch (e: any) {
      toast({ title: "Ошибка анализа", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setCheckedAt(null);
  };

  return (
    <div className="glass rounded-2xl p-5 md:p-8 space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">URL страницы 1</label>
          <Input placeholder="https://example.com" value={url1} onChange={(e) => setUrl1(e.target.value)} className="bg-card border-border" />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">URL страницы 2</label>
          <Input placeholder="https://competitor.com" value={url2} onChange={(e) => setUrl2(e.target.value)} className="bg-card border-border" />
        </div>
      </div>
      <div className="text-center">
        <GradientButton size="lg" onClick={handleAnalyze} disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Swords className="w-5 h-5 mr-2" />}
          Сравнить страницы
        </GradientButton>
      </div>

      {result && (
        <div className="space-y-4">
          {/* Timestamp + reset */}
          <div className="flex items-center justify-end gap-3">
            {checkedAt && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {checkedAt.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
              </span>
            )}
            <button onClick={handleReset} className="text-xs text-primary hover:underline flex items-center gap-1 min-h-[28px]">
              <RefreshCw className="w-3 h-3" /> Сравнить заново
            </button>
          </div>

          {/* SEO Score comparison */}
          <ScoreCompare s1={result.page1.seoScore} s2={result.page2.seoScore} />

          {/* Description comparison */}
          <div className="glass rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-foreground">Meta Description</p>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Страница 1 ({result.page1.description.length} симв.)</p>
                <p className="text-xs text-foreground">{result.page1.description || "— Отсутствует —"}</p>
              </div>
              <div className="bg-background/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground mb-1">Страница 2 ({result.page2.description.length} симв.)</p>
                <p className="text-xs text-foreground">{result.page2.description || "— Отсутствует —"}</p>
              </div>
            </div>
          </div>

          <div className="glass rounded-xl p-4 md:p-5">
            {/* Header with page labels */}
            <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
              <span className="text-sm font-semibold text-muted-foreground">Метрика</span>
              <div className="flex items-center gap-3 text-right">
                <span className="text-xs font-semibold text-foreground truncate max-w-[100px] sm:max-w-[200px]" title={result.page1.url}>С.1</span>
                <span className="text-xs text-muted-foreground">/</span>
                <span className="text-xs font-semibold text-foreground truncate max-w-[100px] sm:max-w-[200px]" title={result.page2.url}>С.2</span>
              </div>
            </div>

            <MetricRow label="Title" v1={result.page1.title.slice(0, 40) || "—"} v2={result.page2.title.slice(0, 40) || "—"} />
            <MetricRow label="H1" v1={result.page1.h1.slice(0, 40) || "—"} v2={result.page2.h1.slice(0, 40) || "—"} />
            <MetricRow label="Слов" v1={result.page1.wordCount} v2={result.page2.wordCount} better="higher" />
            <MetricRow label="H2" v1={result.page1.h2Count} v2={result.page2.h2Count} better="higher" />
            <MetricRow label="H3" v1={result.page1.h3Count} v2={result.page2.h3Count} better="higher" />
            <MetricRow label="Изображений" v1={result.page1.imageCount} v2={result.page2.imageCount} better="higher" />
            <MetricRow label="Без alt" v1={result.page1.imagesWithoutAlt} v2={result.page2.imagesWithoutAlt} better="lower" />
            <MetricRow label="Списков" v1={result.page1.listCount ?? 0} v2={result.page2.listCount ?? 0} better="higher" />
            <MetricRow label="Таблиц" v1={result.page1.tableCount ?? 0} v2={result.page2.tableCount ?? 0} better="higher" />
            <MetricRow label="Внутр. ссылки" v1={result.page1.internalLinks} v2={result.page2.internalLinks} better="higher" />
            <MetricRow label="Внешн. ссылки" v1={result.page1.externalLinks} v2={result.page2.externalLinks} />
            <MetricRow label="JSON-LD" v1={result.page1.jsonLdCount ?? (result.page1.hasJsonLd ? 1 : 0)} v2={result.page2.jsonLdCount ?? (result.page2.hasJsonLd ? 1 : 0)} better="higher" />
            <MetricRow label="Битых ссылок" v1={(result.page1.brokenLinks ?? []).length} v2={(result.page2.brokenLinks ?? []).length} better="lower" />
            <MetricRow label="Img без размеров" v1={result.page1.imgsWithoutDimensions ?? 0} v2={result.page2.imgsWithoutDimensions ?? 0} better="lower" />
            <MetricRow label="HTML" v1={`${result.page1.htmlSizeKB} КБ`} v2={`${result.page2.htmlSizeKB} КБ`} better="lower" />
            <MetricRow label="Загрузка" v1={`${(result.page1.loadTimeMs / 1000).toFixed(1)}с`} v2={`${(result.page2.loadTimeMs / 1000).toFixed(1)}с`} better="lower" />
            <MetricRow label="Язык" v1={result.page1.lang || "—"} v2={result.page2.lang || "—"} />

            {/* Technical badges - stacked for mobile */}
            <div className="pt-3 mt-3 border-t border-border space-y-3">
              <p className="text-sm font-semibold text-muted-foreground">Технические</p>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Страница 1</p>
                <div className="flex flex-wrap gap-2">
                  <BoolBadge value={result.page1.isHttps} label="HTTPS" />
                  <BoolBadge value={result.page1.hasRobotsTxt} label="robots.txt" />
                  <BoolBadge value={result.page1.hasSitemapXml} label="sitemap" />
                  <BoolBadge value={result.page1.hasJsonLd} label="JSON-LD" />
                  <BoolBadge value={result.page1.hasFaq} label="FAQ" />
                  <BoolBadge value={result.page1.hasCanonical} label="Canonical" />
                  <BoolBadge value={result.page1.hasOg} label="OG" />
                  <BoolBadge value={result.page1.hasLazyImages ?? false} label="Lazy" />
                  <BoolBadge value={result.page1.hasFontDisplaySwap ?? false} label="font-swap" />
                  <BoolBadge value={result.page1.hasPreloadHero ?? false} label="Preload" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium">Страница 2</p>
                <div className="flex flex-wrap gap-2">
                  <BoolBadge value={result.page2.isHttps} label="HTTPS" />
                  <BoolBadge value={result.page2.hasRobotsTxt} label="robots.txt" />
                  <BoolBadge value={result.page2.hasSitemapXml} label="sitemap" />
                  <BoolBadge value={result.page2.hasJsonLd} label="JSON-LD" />
                  <BoolBadge value={result.page2.hasFaq} label="FAQ" />
                  <BoolBadge value={result.page2.hasCanonical} label="Canonical" />
                  <BoolBadge value={result.page2.hasOg} label="OG" />
                  <BoolBadge value={result.page2.hasLazyImages ?? false} label="Lazy" />
                  <BoolBadge value={result.page2.hasFontDisplaySwap ?? false} label="font-swap" />
                  <BoolBadge value={result.page2.hasPreloadHero ?? false} label="Preload" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <ToolCTA />
    </div>
  );
};

export default CompetitorAnalysis;
