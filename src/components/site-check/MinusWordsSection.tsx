import { Badge } from "@/components/ui/badge";

interface MinusWord {
  word: string;
  type: string;
  reason: string;
}

interface MinusWordsSectionProps {
  minusWords: MinusWord[] | string[];
}

const MinusWordsSection = ({ minusWords }: MinusWordsSectionProps) => {
  if (!minusWords || minusWords.length === 0) return null;

  // Support both string[] and object[] formats
  const items: MinusWord[] = minusWords.map((mw) =>
    typeof mw === "string"
      ? { word: mw, type: "general", reason: "" }
      : (mw as MinusWord)
  );

  const general = items.filter((m) => m.type === "general");
  const thematic = items.filter((m) => m.type === "thematic");

  const renderGroup = (title: string, description: string, words: MinusWord[]) => {
    if (words.length === 0) return null;
    return (
      <div className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-foreground/80">{title}</h3>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {words.map((mw, i) => (
            <Badge
              key={i}
              variant="outline"
              className="bg-red-500/5 text-red-400 border-red-500/20 text-xs"
              title={mw.reason || undefined}
            >
              -{mw.word}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">
        Минус-слова ({items.length})
      </h2>

      {renderGroup(
        "Общие минус-слова",
        "Исключают нецелевой трафик для любой тематики",
        general
      )}

      {renderGroup(
        "Тематические минус-слова",
        "Специфичные для вашей ниши — исключают запросы смежных, но нерелевантных тем",
        thematic
      )}

      <div className="rounded-xl border border-border/30 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground/70">💡 Рекомендация</p>
        <p>Добавьте общие минус-слова на уровне аккаунта Яндекс.Директ, а тематические — на уровне кампании.</p>
      </div>
    </div>
  );
};

export default MinusWordsSection;
