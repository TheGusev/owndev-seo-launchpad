import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { GradientButton } from "@/components/ui/gradient-button";
import { Shield, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { toast } from "sonner";

interface Issue {
  severity: "high" | "medium" | "low";
  message: string;
}

interface AnalysisResult {
  score: number;
  issues: Issue[];
}

function analyzeText(text: string): AnalysisResult {
  const issues: Issue[] = [];
  if (!text.trim()) return { score: 0, issues: [{ severity: "high", message: "Текст пуст" }] };

  const words = text.toLowerCase().replace(/[^\wа-яё\s]/gi, "").split(/\s+/).filter(Boolean);
  const sentences = text.split(/[.!?]+/).map((s) => s.trim()).filter(Boolean);

  if (words.length < 20) {
    return { score: 50, issues: [{ severity: "medium", message: "Слишком короткий текст для анализа (менее 20 слов)" }] };
  }

  // Word diversity
  const uniqueWords = new Set(words);
  const wordDiversity = uniqueWords.size / words.length;
  let diversityScore = Math.min(wordDiversity * 100 * 1.5, 30);
  if (wordDiversity < 0.4) issues.push({ severity: "high", message: `Низкое разнообразие слов: ${(wordDiversity * 100).toFixed(0)}% уникальных` });
  else if (wordDiversity < 0.55) issues.push({ severity: "medium", message: `Среднее разнообразие слов: ${(wordDiversity * 100).toFixed(0)}% уникальных` });

  // N-gram repetition (3-grams)
  const ngrams = new Map<string, number>();
  for (let i = 0; i <= words.length - 3; i++) {
    const ng = words.slice(i, i + 3).join(" ");
    ngrams.set(ng, (ngrams.get(ng) || 0) + 1);
  }
  const repeatedNgrams = [...ngrams.entries()].filter(([, c]) => c >= 3);
  let ngramScore = 25;
  if (repeatedNgrams.length > 5) {
    ngramScore = 5;
    issues.push({ severity: "high", message: `${repeatedNgrams.length} повторяющихся фраз (3+ раза): «${repeatedNgrams.slice(0, 3).map(([n]) => n).join("», «")}»` });
  } else if (repeatedNgrams.length > 2) {
    ngramScore = 15;
    issues.push({ severity: "medium", message: `${repeatedNgrams.length} повторяющихся фраз найдено` });
  }

  // Template placeholders
  const placeholders = text.match(/\{[^}]+\}/g) || [];
  let placeholderScore = 20;
  if (placeholders.length > 0) {
    placeholderScore = 0;
    issues.push({ severity: "high", message: `Найдены неподставленные плейсхолдеры: ${placeholders.slice(0, 5).join(", ")}` });
  }

  // Sentence diversity
  let sentenceScore = 25;
  if (sentences.length >= 3) {
    const starts = sentences.map((s) => s.split(/\s+/).slice(0, 2).join(" ").toLowerCase());
    const uniqueStarts = new Set(starts);
    const startDiversity = uniqueStarts.size / starts.length;
    if (startDiversity < 0.5) {
      sentenceScore = 8;
      issues.push({ severity: "high", message: "Предложения начинаются одинаково — риск шаблонности" });
    } else if (startDiversity < 0.7) {
      sentenceScore = 16;
      issues.push({ severity: "medium", message: "Часть предложений начинается одинаково" });
    }
  }

  const score = Math.round(Math.min(diversityScore + ngramScore + placeholderScore + sentenceScore, 100));

  if (issues.length === 0) {
    issues.push({ severity: "low", message: "Текст выглядит уникальным и разнообразным" });
  }

  return { score, issues };
}

const severityConfig = {
  high: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  medium: { icon: Info, color: "text-yellow-500", bg: "bg-yellow-500/10" },
  low: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
};

const AntiDuplicateChecker = () => {
  const [text, setText] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleCheck = () => {
    if (!text.trim()) { toast.error("Вставьте текст для проверки"); return; }
    const r = analyzeText(text);
    setResult(r);
    toast.success("Анализ завершён!");
  };

  const scoreColor = result
    ? result.score >= 70 ? "from-green-500 to-emerald-500"
      : result.score >= 40 ? "from-yellow-500 to-amber-500"
      : "from-destructive to-red-500"
    : "from-muted to-muted";

  return (
    <div className="glass rounded-2xl p-5 md:p-8">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-primary shrink-0" />
        <span className="text-sm font-medium text-foreground">Безопасность контента</span>
        <div className="flex-1 min-w-[100px] h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${scoreColor} rounded-full transition-all duration-500`}
            style={{ width: result ? `${result.score}%` : "0%" }}
          />
        </div>
        <span className="text-sm font-bold text-muted-foreground">
          {result ? `${result.score}/100` : "—/100"}
        </span>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Текст для проверки</label>
          <Textarea
            placeholder="Вставьте текст pSEO-страницы…"
            className="bg-card border-border min-h-[180px]"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">Анализ выполняется локально — данные не отправляются на сервер.</p>
        </div>

        <div className="text-center">
          <GradientButton size="lg" onClick={handleCheck}>
            <Shield className="w-5 h-5 mr-2" />
            Проверить уникальность
          </GradientButton>
        </div>

        {result && (
          <div className="space-y-2">
            {result.issues.map((issue, i) => {
              const cfg = severityConfig[issue.severity];
              const Icon = cfg.icon;
              return (
                <div key={i} className={`flex items-start gap-3 rounded-xl p-3 ${cfg.bg}`}>
                  <Icon className={`w-4 h-4 mt-0.5 ${cfg.color} shrink-0`} />
                  <p className="text-sm text-foreground">{issue.message}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AntiDuplicateChecker;
