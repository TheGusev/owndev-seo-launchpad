import { useState, useEffect } from "react";
import ToolCTA from "@/components/tools/ToolCTA";
import { Input } from "@/components/ui/input";
import { GradientButton } from "@/components/ui/gradient-button";
import { TrendingUp, Plus, Trash2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { saveLastUrl } from "@/utils/lastUrl";

interface PositionEntry {
  id: string;
  keyword: string;
  url: string;
  position: number;
  date: string;
}

const STORAGE_KEY = "owndev-position-monitor";

const loadEntries = (): PositionEntry[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); } catch { return []; }
};

const saveEntries = (entries: PositionEntry[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
};

const PositionMonitor = () => {
  const [entries, setEntries] = useState<PositionEntry[]>(loadEntries);
  const [keyword, setKeyword] = useState("");
  const [url, setUrl] = useState("");
  const [position, setPosition] = useState("");
  const [selectedKeyword, setSelectedKeyword] = useState<string | null>(null);

  useEffect(() => { saveEntries(entries); }, [entries]);

  const handleAdd = () => {
    if (!keyword.trim() || !position.trim()) { toast({ title: "Заполните ключевое слово и позицию", variant: "destructive" }); return; }
    if (url.trim()) saveLastUrl(url.trim());
    const entry: PositionEntry = {
      id: Date.now().toString(),
      keyword: keyword.trim(),
      url: url.trim(),
      position: parseInt(position) || 0,
      date: new Date().toISOString().split("T")[0],
    };
    setEntries((prev) => [...prev, entry]);
    setPosition("");
    toast({ title: "Позиция добавлена" });
  };

  const handleDelete = (id: string) => {
    setEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const uniqueKeywords = [...new Set(entries.map((e) => e.keyword))];
  const chartKeyword = selectedKeyword || uniqueKeywords[0];
  const chartData = entries
    .filter((e) => e.keyword === chartKeyword)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date, position: e.position }));

  return (
    <div className="glass rounded-2xl p-5 md:p-8 space-y-6">
      <div className="glass rounded-xl p-4 space-y-3">
        <p className="text-sm text-muted-foreground">Добавьте позицию вручную (из Google Search Console или проверки в выдаче)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input placeholder="Ключевое слово" value={keyword} onChange={(e) => setKeyword(e.target.value)} className="bg-card border-border" />
          <Input placeholder="URL (необязательно)" value={url} onChange={(e) => setUrl(e.target.value)} className="bg-card border-border" />
          <Input placeholder="Позиция" type="number" value={position} onChange={(e) => setPosition(e.target.value)} className="bg-card border-border"
            onKeyDown={(e) => e.key === "Enter" && handleAdd()} />
          <GradientButton onClick={handleAdd} className="min-h-[44px]"><Plus className="w-4 h-4 mr-1" /> Добавить</GradientButton>
        </div>
      </div>

      {uniqueKeywords.length > 0 && (
        <>
          <div className="flex flex-wrap gap-2">
            {uniqueKeywords.map((kw) => (
              <button key={kw} onClick={() => setSelectedKeyword(kw)}
                className={`text-xs px-3 py-2 rounded-lg transition-colors min-h-[36px] ${chartKeyword === kw ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
                {kw}
              </button>
            ))}
          </div>

          {chartData.length >= 2 && (
            <div className="glass rounded-xl p-4">
              <p className="text-sm font-semibold text-foreground mb-3">
                <TrendingUp className="w-4 h-4 inline mr-1" /> {chartKeyword}
              </p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis reversed domain={[1, "auto"]} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Line type="monotone" dataKey="position" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="glass rounded-xl p-4">
            <p className="text-sm font-semibold text-foreground mb-3">Все записи ({entries.length})</p>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {entries.slice().reverse().map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm py-1.5 border-b border-border/30">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-muted-foreground w-20 shrink-0">{e.date}</span>
                    <span className="font-medium text-foreground truncate">{e.keyword}</span>
                    <span className="text-primary font-bold">#{e.position}</span>
                  </div>
                  <button onClick={() => handleDelete(e.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {entries.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <TrendingUp className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Пока нет данных. Добавьте первую позицию выше.</p>
        </div>
      )}
      <ToolCTA />
    </div>
  );
};

export default PositionMonitor;
