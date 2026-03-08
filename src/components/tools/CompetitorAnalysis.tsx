import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { Users, Loader2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface CompetitorData {
  url: string;
  title: string;
  description: string;
  h1: string;
  wordCount: number;
  imageCount: number;
  imagesWithoutAlt: number;
  internalLinks: number;
  externalLinks: number;
  htmlSize: number;
  error?: string;
}

const CompetitorAnalysis = () => {
  const [urls, setUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<CompetitorData[] | null>(null);

  const handleAnalyze = async () => {
    const urlList = urls.split("\n").map(u => u.trim()).filter(Boolean);
    if (urlList.length === 0) {
      toast({ title: "Ошибка", description: "Введите хотя бы один URL", variant: "destructive" });
      return;
    }
    if (urlList.length > 5) {
      toast({ title: "Ошибка", description: "Максимум 5 URL", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("competitor-analysis", {
        body: { urls: urlList },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data.results);
      toast({ title: "Готово", description: `Проанализировано ${data.results.length} URL` });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message || "Не удалось выполнить анализ", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const truncate = (s: string, max = 60) => s.length > max ? s.slice(0, max) + "…" : s;

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">URL конкурентов (до 5, по одному на строку)</label>
          <Textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder={"https://competitor1.com\nhttps://competitor2.com\nhttps://competitor3.com"}
            className="bg-card border-border min-h-[140px]"
          />
        </div>

        <div className="text-center">
          <GradientButton size="lg" onClick={handleAnalyze} disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Users className="w-5 h-5 mr-2" />}
            {loading ? "Анализируем…" : "Анализировать конкурентов"}
          </GradientButton>
        </div>

        {results && results.length > 0 && (
          <div className="glass rounded-xl p-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>H1</TableHead>
                  <TableHead className="text-right">Слова</TableHead>
                  <TableHead className="text-right">Изобр.</TableHead>
                  <TableHead className="text-right">Без alt</TableHead>
                  <TableHead className="text-right">Внутр. ссылки</TableHead>
                  <TableHead className="text-right">Внеш. ссылки</TableHead>
                  <TableHead className="text-right">HTML (КБ)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i} className={r.error ? "opacity-50" : ""}>
                    <TableCell className="max-w-[150px] truncate text-xs">{truncate(r.url, 40)}</TableCell>
                    <TableCell className="max-w-[200px] text-xs">{r.error ? <span className="text-destructive">{r.error}</span> : truncate(r.title)}</TableCell>
                    <TableCell className="max-w-[200px] text-xs">{truncate(r.h1)}</TableCell>
                    <TableCell className="text-right">{r.wordCount}</TableCell>
                    <TableCell className="text-right">{r.imageCount}</TableCell>
                    <TableCell className="text-right">{r.imagesWithoutAlt}</TableCell>
                    <TableCell className="text-right">{r.internalLinks}</TableCell>
                    <TableCell className="text-right">{r.externalLinks}</TableCell>
                    <TableCell className="text-right">{(r.htmlSize / 1024).toFixed(1)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompetitorAnalysis;
