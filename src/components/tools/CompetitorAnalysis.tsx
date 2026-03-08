import { useState } from "react";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Swords, CheckCircle, XCircle, Loader2 } from "lucide-react";
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
  hasFaq: boolean;
  hasViewport: boolean;
  hasCanonical: boolean;
  hasOg: boolean;
  loadTimeMs: number;
  htmlSizeKB: number;
  internalLinks: number;
  externalLinks: number;
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
    <tr className="border-b border-border/30">
      <td className="py-2 text-sm text-muted-foreground">{label}</td>
      <td className={`py-2 text-sm font-medium ${c1}`}>{v1}</td>
      <td className={`py-2 text-sm font-medium ${c2}`}>{v2}</td>
    </tr>
  );
};

const CompetitorAnalysis = () => {
  const [url1, setUrl1] = useState("");
  const [url2, setUrl2] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ page1: PageMetrics; page2: PageMetrics } | null>(null);

  const handleAnalyze = async () => {
    if (!url1 || !url2) { toast({ title: "Введите оба URL", variant: "destructive" }); return; }
    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("competitor-analysis", { body: { url1, url2 } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data);
    } catch (e: any) {
      toast({ title: "Ошибка анализа", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
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
        <div className="glass rounded-xl p-5 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-sm font-semibold text-muted-foreground w-1/3">Метрика</th>
                <th className="py-2 text-sm font-semibold text-foreground truncate max-w-[200px]" title={result.page1.url}>Страница 1</th>
                <th className="py-2 text-sm font-semibold text-foreground truncate max-w-[200px]" title={result.page2.url}>Страница 2</th>
              </tr>
            </thead>
            <tbody>
              <MetricRow label="Title" v1={result.page1.title.slice(0, 60) || "—"} v2={result.page2.title.slice(0, 60) || "—"} />
              <MetricRow label="H1" v1={result.page1.h1.slice(0, 60) || "—"} v2={result.page2.h1.slice(0, 60) || "—"} />
              <MetricRow label="Слов на странице" v1={result.page1.wordCount} v2={result.page2.wordCount} better="higher" />
              <MetricRow label="H2 заголовков" v1={result.page1.h2Count} v2={result.page2.h2Count} better="higher" />
              <MetricRow label="H3 заголовков" v1={result.page1.h3Count} v2={result.page2.h3Count} better="higher" />
              <MetricRow label="Изображений" v1={result.page1.imageCount} v2={result.page2.imageCount} better="higher" />
              <MetricRow label="Без alt" v1={result.page1.imagesWithoutAlt} v2={result.page2.imagesWithoutAlt} better="lower" />
              <MetricRow label="Внутр. ссылок" v1={result.page1.internalLinks} v2={result.page2.internalLinks} better="higher" />
              <MetricRow label="Внешн. ссылок" v1={result.page1.externalLinks} v2={result.page2.externalLinks} />
              <MetricRow label="Размер HTML" v1={`${result.page1.htmlSizeKB} КБ`} v2={`${result.page2.htmlSizeKB} КБ`} better="lower" />
              <MetricRow label="Загрузка" v1={`${(result.page1.loadTimeMs / 1000).toFixed(1)}с`} v2={`${(result.page2.loadTimeMs / 1000).toFixed(1)}с`} better="lower" />
              <tr className="border-b border-border/30">
                <td className="py-2 text-sm text-muted-foreground">Технические</td>
                <td className="py-2 space-x-2">
                  <BoolBadge value={result.page1.hasJsonLd} label="JSON-LD" />
                  <BoolBadge value={result.page1.hasFaq} label="FAQ" />
                  <BoolBadge value={result.page1.hasCanonical} label="Canonical" />
                  <BoolBadge value={result.page1.hasOg} label="OG" />
                </td>
                <td className="py-2 space-x-2">
                  <BoolBadge value={result.page2.hasJsonLd} label="JSON-LD" />
                  <BoolBadge value={result.page2.hasFaq} label="FAQ" />
                  <BoolBadge value={result.page2.hasCanonical} label="Canonical" />
                  <BoolBadge value={result.page2.hasOg} label="OG" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CompetitorAnalysis;
