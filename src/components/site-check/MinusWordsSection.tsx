import { useToast } from "@/hooks/use-toast";
import { Copy } from "lucide-react";

interface MinusWord {
  word: string;
  type?: string;
  category?: string;
  reason: string;
}

interface MinusWordsSectionProps {
  minusWords: MinusWord[] | string[];
}

const MinusWordsSection = ({ minusWords }: MinusWordsSectionProps) => {
  const { toast } = useToast();

  if (!minusWords || minusWords.length === 0) return null;

  const items: MinusWord[] = minusWords.map((mw) =>
    typeof mw === "string"
      ? { word: mw, category: "general", reason: "" }
      : (mw as MinusWord)
  );

  const handleCopyAll = () => {
    const text = items.map(m => `-${m.word}`).join("\n");
    navigator.clipboard.writeText(text);
    toast({ title: "Скопировано!", description: `${items.length} минус-слов` });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {items.map((mw, i) => (
          <span
            key={i}
            className="text-xs px-2 py-1 rounded-md bg-muted/40 text-muted-foreground border border-border/20"
            title={mw.reason || undefined}
          >
            -{mw.word}
          </span>
        ))}
      </div>

      <button
        onClick={handleCopyAll}
        className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
      >
        <Copy className="w-3.5 h-3.5" />
        Скопировать все минус-фразы
      </button>
    </div>
  );
};

export default MinusWordsSection;
