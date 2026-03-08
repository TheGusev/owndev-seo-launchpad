import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { Bot, Copy, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

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

  const handleGenerate = async () => {
    if (!topic.trim()) { toast({ title: "Введите тему", variant: "destructive" }); return; }
    setLoading(true);
    setResult("");
    try {
      const { data, error } = await supabase.functions.invoke("generate-text", { body: { type, topic, keywords } });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      setResult(data.text || "");
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
    <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Тип текста</label>
          <div className="flex flex-wrap gap-2">
            {textTypes.map((t) => (
              <button key={t.value} onClick={() => setType(t.value)}
                className={`text-sm px-3 py-1.5 rounded-lg transition-colors ${type === t.value ? "bg-primary text-primary-foreground" : "bg-card text-muted-foreground hover:text-foreground"}`}>
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

      {result && (
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-foreground">Результат</p>
            <button onClick={handleCopy} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
              {copied ? <CheckCircle className="w-3 h-3 text-success" /> : <Copy className="w-3 h-3" />}
              {copied ? "Скопировано" : "Копировать"}
            </button>
          </div>
          <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{result}</div>
        </div>
      )}
    </div>
  );
};

export default AITextGenerator;
