import { useState } from "react";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { FileText, Search, Download, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Keyword {
  keyword: string;
  estimatedVolume: number;
}

interface Cluster {
  name: string;
  keywords: Keyword[];
}

const clusterIcons: Record<string, string> = {
  "Информационные": "📘",
  "Коммерческие": "💰",
  "Транзакционные": "🛒",
};

const SemanticCoreGenerator = () => {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [loading, setLoading] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);

  const handleGenerate = async () => {
    if (!query.trim()) { toast.error("Введите базовый запрос"); return; }
    setLoading(true);
    setClusters([]);
    try {
      const { data, error } = await supabase.functions.invoke("generate-semantic-core", {
        body: { query: query.trim(), region: region.trim() },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setClusters(data.clusters || []);
      toast.success("Семантическое ядро сгенерировано!");
    } catch (e: any) {
      toast.error(e.message || "Ошибка генерации");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    const rows = [["Кластер", "Запрос", "Частотность"]];
    clusters.forEach((c) =>
      c.keywords.forEach((k) => rows.push([c.name, k.keyword, String(k.estimatedVolume)]))
    );
    const csv = rows.map((r) => r.join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `semantic-core-${query.trim().replace(/\s+/g, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV скачан!");
  };

  const totalKeywords = clusters.reduce((s, c) => s + c.keywords.length, 0);

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Базовый запрос</label>
            <Input
              placeholder="ремонт квартир"
              className="bg-card border-border"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Регион</label>
            <Input
              placeholder="Москва"
              className="bg-card border-border"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-3">
          <GradientButton size="lg" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <FileText className="w-5 h-5 mr-2" />}
            {loading ? "Генерация…" : "Собрать семантику"}
          </GradientButton>
          {clusters.length > 0 && (
            <GradientButton size="lg" variant="outline" onClick={handleExportCSV}>
              <Download className="w-5 h-5 mr-2" />
              Скачать CSV
            </GradientButton>
          )}
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          {(clusters.length > 0 ? clusters : [
            { name: "Информационные", keywords: [] },
            { name: "Коммерческие", keywords: [] },
            { name: "Транзакционные", keywords: [] },
          ]).map((cluster) => (
            <div key={cluster.name} className="glass rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{clusterIcons[cluster.name] || "📋"}</span>
                <p className="text-sm font-semibold text-foreground">{cluster.name}</p>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                {cluster.keywords.length} запросов
              </p>
              {cluster.keywords.length > 0 && (
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {cluster.keywords.map((k, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                      <span className="text-foreground truncate mr-2">{k.keyword}</span>
                      <span className="text-muted-foreground whitespace-nowrap">~{k.estimatedVolume}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {clusters.length > 0 && (
          <div className="glass rounded-xl p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Всего: <span className="font-semibold text-foreground">{totalKeywords}</span> запросов в{" "}
              <span className="font-semibold text-foreground">{clusters.length}</span> кластерах
            </p>
          </div>
        )}

        {clusters.length === 0 && !loading && (
          <div className="glass rounded-xl p-5 text-center text-muted-foreground text-sm">
            Введите запрос и нажмите «Собрать семантику» — AI сгенерирует кластеризованное ядро
          </div>
        )}
      </div>
    </div>
  );
};

export default SemanticCoreGenerator;
