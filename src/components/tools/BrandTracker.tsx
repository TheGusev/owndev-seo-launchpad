import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Eye, Loader2, CheckCircle2, XCircle, MinusCircle, Copy, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { trackBrand } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { GradientButton } from "@/components/ui/gradient-button";
import { Badge } from "@/components/ui/badge";

interface BrandResult {
  prompt: string;
  aiSystem: string;
  mentioned: boolean;
  sentiment: "positive" | "neutral" | "negative" | null;
  position: number | null;
  competitors: string[];
  fullResponse: string;
}

const AI_SYSTEMS = ["ChatGPT", "Perplexity", "Яндекс Нейро", "Claude"];

const sentimentConfig = {
  positive: { label: "Позитивная", className: "bg-green-500/20 text-green-400", icon: CheckCircle2 },
  neutral: { label: "Нейтральная", className: "bg-muted/40 text-muted-foreground", icon: MinusCircle },
  negative: { label: "Негативная", className: "bg-red-500/20 text-red-400", icon: XCircle },
};

const BrandTracker = () => {
  const { toast } = useToast();
  const [brand, setBrand] = useState("");
  const [prompts, setPrompts] = useState("");
  const [selectedAIs, setSelectedAIs] = useState<string[]>(["ChatGPT", "Perplexity"]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BrandResult[]>([]);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const toggleAI = (ai: string) => {
    setSelectedAIs((prev) =>
      prev.includes(ai) ? prev.filter((a) => a !== ai) : [...prev, ai]
    );
  };

  const generateDefaults = () => {
    if (!brand.trim()) return;
    setPrompts(
      `Лучший SEO-аудит сайта\nКакой инструмент выбрать для SEO\n${brand} отзывы\nАльтернативы ${brand}\nГде проверить готовность сайта к AI`
    );
  };

  const startCheck = async () => {
    const promptList = prompts
      .split("\n")
      .map((p) => p.trim())
      .filter(Boolean);
    if (!brand.trim() || promptList.length === 0 || selectedAIs.length === 0) {
      toast({ title: "Заполните все поля", variant: "destructive" });
      return;
    }

    setLoading(true);
    setResults([]);

    try {
      const data = await trackBrand(brand.trim(), promptList, selectedAIs);

      if (data?.results) {
        setResults(data.results);
      }
    } catch (e: any) {
      toast({
        title: "Ошибка",
        description: e.message || "Не удалось проверить бренд",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const mentionedCount = results.filter((r) => r.mentioned).length;
  const totalCount = results.length;
  const mentionPct = totalCount > 0 ? Math.round((mentionedCount / totalCount) * 100) : 0;

  const allCompetitors = results.flatMap((r) => r.competitors);
  const competitorCounts = allCompetitors.reduce<Record<string, number>>((acc, c) => {
    acc[c] = (acc[c] || 0) + 1;
    return acc;
  }, {});
  const topCompetitors = Object.entries(competitorCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const handleCopyAll = () => {
    const text = results
      .map(
        (r) =>
          `[${r.aiSystem}] "${r.prompt}" → ${r.mentioned ? "Упомянут" : "Не упомянут"}${r.sentiment ? `, ${sentimentConfig[r.sentiment].label}` : ""}${r.position ? `, #${r.position}` : ""}`
      )
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="inline-flex items-center gap-2 glass px-4 py-2 rounded-full mb-4">
          <Eye className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground font-mono">AI Brand Tracker</span>
        </div>
        <p className="text-muted-foreground max-w-xl mx-auto">
          Проверьте, как AI-системы видят ваш бренд. Узнайте, упоминаетесь ли вы в ответах ChatGPT, Perplexity и Яндекс Нейро.
        </p>
      </div>

      <div className="glass rounded-2xl p-6 md:p-8 max-w-2xl mx-auto space-y-5">
        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">Название бренда</label>
          <div className="flex gap-2">
            <input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Например: OWNDEV"
              className="flex-1 bg-muted/20 border border-border/50 rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none transition-colors"
            />
            <button
              onClick={generateDefaults}
              className="text-xs text-primary hover:text-primary/80 border border-primary/30 rounded-lg px-3 whitespace-nowrap transition-colors"
            >
              Авто-промты
            </button>
          </div>
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">
            Промты для проверки (по одному на строку)
          </label>
          <textarea
            value={prompts}
            onChange={(e) => setPrompts(e.target.value)}
            placeholder={"Лучший SEO-аудит сайта\nГде проверить готовность сайта к AI\nИнструменты для GEO оптимизации"}
            rows={5}
            className="w-full bg-muted/20 border border-border/50 rounded-lg px-4 py-3 text-foreground placeholder:text-muted-foreground/50 focus:border-primary/50 focus:ring-1 focus:ring-primary/30 outline-none resize-none transition-colors"
          />
        </div>

        <div>
          <label className="text-sm text-muted-foreground mb-1.5 block">AI-системы для проверки</label>
          <div className="flex gap-2 flex-wrap">
            {AI_SYSTEMS.map((ai) => (
              <label
                key={ai}
                className={`flex items-center gap-2 border rounded-lg px-4 py-2 cursor-pointer transition-colors ${
                  selectedAIs.includes(ai)
                    ? "bg-primary/10 border-primary/40 text-foreground"
                    : "bg-muted/10 border-border/30 text-muted-foreground hover:border-primary/20"
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedAIs.includes(ai)}
                  onChange={() => toggleAI(ai)}
                  className="accent-primary w-4 h-4"
                />
                <span className="text-sm">{ai}</span>
              </label>
            ))}
          </div>
        </div>

        <GradientButton
          onClick={startCheck}
          disabled={loading || !brand.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Проверяем...
            </>
          ) : (
            "Проверить упоминания"
          )}
        </GradientButton>
      </div>

      {/* Results */}
      <AnimatePresence>
        {results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Summary */}
            <div className="glass rounded-2xl p-6 max-w-2xl mx-auto">
              <h3 className="font-semibold text-foreground mb-4">Сводка</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">{mentionPct}%</div>
                  <div className="text-xs text-muted-foreground">Упоминаемость</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">
                    {mentionedCount}/{totalCount}
                  </div>
                  <div className="text-xs text-muted-foreground">Упоминаний</div>
                </div>
                <div className="text-center col-span-2 md:col-span-1">
                  <div className="text-2xl font-bold text-foreground">{topCompetitors.length}</div>
                  <div className="text-xs text-muted-foreground">Конкурентов найдено</div>
                </div>
              </div>

              {topCompetitors.length > 0 && (
                <div>
                  <span className="text-xs text-muted-foreground block mb-2">Топ конкуренты:</span>
                  <div className="flex gap-2 flex-wrap">
                    {topCompetitors.map(([name, count]) => (
                      <Badge key={name} variant="secondary" className="text-xs">
                        {name} ({count})
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Results table */}
            <div className="glass rounded-2xl p-4 md:p-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Результаты</h3>
                <button
                  onClick={handleCopyAll}
                  className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors"
                >
                  {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copied ? "Скопировано" : "Копировать всё"}
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/30">
                      <th className="text-left text-xs text-muted-foreground font-medium py-2 pr-4">Промт</th>
                      <th className="text-left text-xs text-muted-foreground font-medium py-2 pr-4">AI</th>
                      <th className="text-center text-xs text-muted-foreground font-medium py-2 pr-4">Упомянут?</th>
                      <th className="text-center text-xs text-muted-foreground font-medium py-2 pr-4">Тональность</th>
                      <th className="text-center text-xs text-muted-foreground font-medium py-2 pr-4">Позиция</th>
                      <th className="text-left text-xs text-muted-foreground font-medium py-2">Конкуренты</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr
                        key={i}
                        className="border-b border-border/10 cursor-pointer hover:bg-muted/10 transition-colors"
                        onClick={() => setExpandedRow(expandedRow === i ? null : i)}
                      >
                        <td className="py-2.5 pr-4 max-w-[200px] truncate text-foreground">{r.prompt}</td>
                        <td className="py-2.5 pr-4 text-muted-foreground whitespace-nowrap">{r.aiSystem}</td>
                        <td className="py-2.5 pr-4 text-center">
                          {r.mentioned ? (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">✓ Да</Badge>
                          ) : (
                            <Badge className="bg-red-500/20 text-red-400 text-xs">✗ Нет</Badge>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-center">
                          {r.sentiment && (
                            <Badge className={`${sentimentConfig[r.sentiment].className} text-xs`}>
                              {sentimentConfig[r.sentiment].label}
                            </Badge>
                          )}
                        </td>
                        <td className="py-2.5 pr-4 text-center text-foreground font-mono">
                          {r.position ? `#${r.position}` : "—"}
                        </td>
                        <td className="py-2.5 text-muted-foreground text-xs max-w-[150px] truncate">
                          {r.competitors.length > 0 ? r.competitors.join(", ") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Expanded response */}
            {expandedRow !== null && results[expandedRow] && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6 max-w-4xl mx-auto"
              >
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Полный ответ: {results[expandedRow].aiSystem} → "{results[expandedRow].prompt}"
                </h4>
                <pre className="text-xs text-muted-foreground whitespace-pre-wrap bg-muted/20 rounded-lg p-4 max-h-64 overflow-y-auto">
                  {results[expandedRow].fullResponse}
                </pre>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BrandTracker;
