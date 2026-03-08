import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bot, Wand2, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";

const textTypes = ["Вступление для GEO-страницы", "FAQ под регион", "Описание услуги", "Мета-описание"];

const AITextGenerator = () => {
  const [type, setType] = useState("");
  const [city, setCity] = useState("");
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (!type) { toast.error("Выберите тип текста"); return; }
    if (!niche.trim()) { toast.error("Укажите нишу"); return; }

    setLoading(true);
    setResult("");
    abortRef.current = new AbortController();

    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-text`;
      const resp = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ type, city: city.trim(), niche: niche.trim() }),
        signal: abortRef.current.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "Ошибка сервера" }));
        throw new Error(err.error || `HTTP ${resp.status}`);
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let nlIdx: number;
        while ((nlIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, nlIdx);
          buffer = buffer.slice(nlIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              fullText += content;
              setResult(fullText);
            }
          } catch { /* partial chunk */ }
        }
      }

      toast.success("Текст сгенерирован!");
    } catch (e: any) {
      if (e.name !== "AbortError") {
        toast.error(e.message || "Ошибка генерации");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    toast.success("Скопировано!");
  };

  return (
    <div className="glass rounded-2xl p-6 md:p-8">
      <div className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Тип текста</label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="bg-card border-border">
                <SelectValue placeholder="Выберите тип…" />
              </SelectTrigger>
              <SelectContent>
                {textTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Город / регион</label>
            <Input placeholder="Новосибирск" className="bg-card border-border" value={city} onChange={(e) => setCity(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Ниша / тематика</label>
          <Input placeholder="Дезинсекция, клининг, ремонт…" className="bg-card border-border" value={niche} onChange={(e) => setNiche(e.target.value)} />
        </div>

        <div className="text-center">
          <GradientButton size="lg" onClick={handleGenerate} disabled={loading}>
            {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Wand2 className="w-5 h-5 mr-2" />}
            {loading ? "Генерация…" : "Сгенерировать текст"}
          </GradientButton>
        </div>

        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-primary" />
              <p className="text-sm font-semibold text-foreground">Результат</p>
            </div>
            {result && (
              <GradientButton size="sm" onClick={handleCopy}>
                <Copy className="w-4 h-4 mr-1" />
                Скопировать
              </GradientButton>
            )}
          </div>
          <Textarea
            readOnly
            value={result}
            placeholder="Нажмите «Сгенерировать текст» для начала…"
            className="bg-card border-border min-h-[180px]"
          />
        </div>
      </div>
    </div>
  );
};

export default AITextGenerator;
