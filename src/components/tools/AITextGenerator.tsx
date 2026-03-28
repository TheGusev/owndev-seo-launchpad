import { useState } from "react";
import ToolCTA from "@/components/tools/ToolCTA";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { Bot, Copy, CheckCircle, Loader2, Clock, RefreshCw } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import EmptyState from "@/components/ui/empty-state";

const textTypes = [
  { value: "meta", label: "Meta Title + Description" },
  { value: "intro", label: "Вводный абзац" },
  { value: "faq", label: "FAQ (5 вопросов)" },
  { value: "service", label: "Описание услуги" },
  { value: "product", label: "Описание товара" },
];

const AITextGenerator = () => {
  const [type, setType] = useState("meta");
  const [topic, setTopic] = useState("");
  const [keywords, setKeywords] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [copied, setCopied] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  const handleGenerate = async () => {
    if (!topic.trim()) { toast({ title: "Введите тему", variant: "destructive" }); return; }
    setLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-text", { body: { type, topic, keywords } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data.text || "");
      setGeneratedAt(new Date());
    } catch (e: any) {
      toast({ title: "Ошибка генерации", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    toast({ title: "Скопировано!" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass rounded-2xl p-5 md:p-8 space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Тип текста</label>
          <div className="flex flex-wrap gap-2">
            {textTypes.map((t) => (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`text-sm px-3 py-2 rounded-lg transition-colors min-h-[36px] ${type === t.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Тема</label>
          <Input placeholder="Например: Установка кондиционеров в Москве" value={topic} onChange={(e) => setTopic(e.target.value)}
            className="bg-card border-border" />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Ключевые слова (необязательно)</label>
          <Input placeholder="кондиционер, монтаж, сплит-система" value={keywords} onChange={(e) => setKeywords(e.target.value)}
            className="bg-card border-border" />
        </div>

        <div className="text-center">
          <GradientButton size="lg" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Bot className="w-5 h-5 mr-2" />}
            Сгенерировать текст
          </GradientButton>
        </div>
      </div>

      {!loading && result === "" && generatedAt && (
        <EmptyState onRetry={handleGenerate} />
      )}

      {result && result.length > 0 && (
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
            <p className="text-sm font-semibold text-foreground">Результат</p>
            <div className="flex items-center gap-3">
              {generatedAt && (
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {generatedAt.toLocaleString("ru-RU", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" })}
                </span>
              )}
              <button onClick={() => { setResult(""); setGeneratedAt(null); }} className="text-xs text-primary hover:underline flex items-center gap-1 min-h-[28px]">
                <RefreshCw className="w-3 h-3" /> Заново
              </button>
              <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                {copied ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
                {copied ? "Скопировано" : "Копировать"}
              </button>
            </div>
          </div>
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result}</div>
        </div>
      )}
      <ToolCTA />
    </div>
  );
};

export default AITextGenerator;
