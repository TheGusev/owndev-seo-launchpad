import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { ListChecks, Loader2 } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface UrlCheckResult {
  url: string;
  statusCode: number;
  status: "ok" | "redirect" | "error" | "noindex";
  noindex: boolean;
  redirectTo?: string;
  error?: string;
}

const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  ok: { label: "OK", variant: "default" },
  redirect: { label: "Редирект", variant: "secondary" },
  noindex: { label: "NoIndex", variant: "destructive" },
  error: { label: "Ошибка", variant: "destructive" },
};

const IndexationChecker = () => {
  const [urls, setUrls] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<UrlCheckResult[] | null>(null);

  const handleCheck = async () => {
    const urlList = urls.split("\n").map(u => u.trim()).filter(Boolean);
    if (urlList.length === 0) {
      toast({ title: "Ошибка", description: "Введите хотя бы один URL", variant: "destructive" });
      return;
    }
    if (urlList.length > 50) {
      toast({ title: "Ошибка", description: "Максимум 50 URL", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResults(null);
    try {
      const { data, error } = await supabase.functions.invoke("check-indexation", {
        body: { urls: urlList },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResults(data.results);

      const ok = data.results.filter((r: UrlCheckResult) => r.status === "ok").length;
      toast({ title: "Готово", description: `${ok} из ${data.results.length} URL доступны (200)` });
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message || "Не удалось проверить", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Список URL (по одному на строку)</label>
          <Textarea
            value={urls}
            onChange={(e) => setUrls(e.target.value)}
            placeholder={"https://example.com/page1\nhttps://example.com/page2\nhttps://example.com/page3"}
            className="bg-card border-border min-h-[180px]"
          />
          <p className="text-xs text-muted-foreground">Максимум 50 URL за один запрос</p>
        </div>

        <div className="text-center">
          <GradientButton size="lg" onClick={handleCheck} disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <ListChecks className="w-5 h-5 mr-2" />}
            {loading ? "Проверяем…" : "Проверить индексацию"}
          </GradientButton>
        </div>

        {results && results.length > 0 && (
          <div className="glass rounded-xl p-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>URL</TableHead>
                  <TableHead className="text-center">Код</TableHead>
                  <TableHead className="text-center">Статус</TableHead>
                  <TableHead>Редирект</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell className="max-w-[300px] truncate text-xs font-mono">{r.url}</TableCell>
                    <TableCell className="text-center font-mono">{r.statusCode || "—"}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant={statusConfig[r.status]?.variant ?? "outline"}>
                        {statusConfig[r.status]?.label ?? r.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {r.redirectTo || r.error || "—"}
                    </TableCell>
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

export default IndexationChecker;
