import { useState } from "react";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { Sparkles, Copy, CheckCircle, Loader2, Download, Clock, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Cluster {
  name: string;
  intent: string;
  keywords: string[];
}

const intentLabels: Record<string, { label: string; color: string }> = {
  informational: { label: "Инфо", color: "bg-blue-500/20 text-blue-400" },
  commercial: { label: "Комм.", color: "bg-amber-500/20 text-amber-400" },
  transactional: { label: "Транз.", color: "bg-emerald-500/20 text-emerald-400" },
  navigational: { label: "Навиг.", color: "bg-purple-500/20 text-purple-400" },
};

const SemanticCoreGenerator = () => {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) { toast({ title: "Введите тему", variant: "destructive" }); return; }
    setLoading(true);
    setClusters([]);
    try {
      const { data, error } = await supabase.functions.invoke("generate-semantic-core", { body: { topic } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setClusters(data.clusters || []);
    } catch (e: any) {
      toast({ title: "Ошибка генерации", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    const text = clusters.map(c => `## ${c.name} (${c.intent})\n${c.keywords.join("\n")}`).join("\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast({ title: "Скопировано!" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadCSV = () => {
    const header = "Кластер,Интент,Ключевое слово";
    const lines = clusters.flatMap(c =>
      c.keywords.map(kw => [c.name, c.intent, kw].map(v => `"${v.replace(/"/g, '""')}"`).join(","))
    );
    const csv = [header, ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "semantic-core.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalKeywords = clusters.reduce((sum, c) => sum + c.keywords.length, 0);

  return (
    <div className="glass rounded-2xl p-5 md:p-8 space-y-6">
      <div className="flex gap-3">
        <Input placeholder="Например: ремонт квартир в Москве" value={topic} onChange={(e) => setTopic(e.target.value)}
          className="bg-card border-border flex-1" onKeyDown={(e) => e.key === "Enter" && handleGenerate()} />
        <GradientButton onClick={handleGenerate} disabled={loading}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
        </GradientButton>
      </div>

      {clusters.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">
              {clusters.length} кластеров, {totalKeywords} ключей
            </p>
            <div className="flex items-center gap-3">
              <button onClick={handleDownloadCSV} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                <Download className="w-3 h-3" /> CSV
              </button>
              <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                {copied ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                {copied ? "Скопировано" : "Копировать"}
              </button>
            </div>
          </div>

          {clusters.map((cluster, i) => {
            const intent = intentLabels[cluster.intent] || intentLabels.informational;
            return (
              <div key={i} className="glass rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${intent.color}`}>{intent.label}</span>
                  <h3 className="text-sm font-semibold text-foreground">{cluster.name}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {cluster.keywords.map((kw, j) => (
                    <span key={j} className="text-xs bg-card px-2 py-1 rounded-lg text-muted-foreground">{kw}</span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SemanticCoreGenerator;
