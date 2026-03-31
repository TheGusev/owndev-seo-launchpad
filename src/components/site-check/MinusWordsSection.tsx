import { Badge } from "@/components/ui/badge";

interface MinusWord {
  word: string;
  type?: string;
  category?: string;
  reason: string;
}

interface MinusWordsSectionProps {
  minusWords: MinusWord[] | string[];
}

const categoryLabels: Record<string, { title: string; description: string }> = {
  informational: { title: "Информационные", description: "Исключают информационные запросы без коммерческого интента" },
  irrelevant: { title: "Нерелевантные", description: "Исключают запросы смежных, но нерелевантных тем" },
  competitor: { title: "Конкуренты", description: "Исключают брендовые запросы конкурентов" },
  geo: { title: "Регионы", description: "Исключают запросы с нерелевантной географией" },
  other: { title: "Прочие", description: "Прочие минус-слова для точной настройки кампании" },
  general: { title: "Общие", description: "Исключают нецелевой трафик для любой тематики" },
  thematic: { title: "Тематические", description: "Специфичные для вашей ниши минус-слова" },
};

const MinusWordsSection = ({ minusWords }: MinusWordsSectionProps) => {
  if (!minusWords || minusWords.length === 0) return null;

  const items: MinusWord[] = minusWords.map((mw) =>
    typeof mw === "string"
      ? { word: mw, category: "general", reason: "" }
      : (mw as MinusWord)
  );

  // Group by category (fallback to type for legacy data)
  const groups: Record<string, MinusWord[]> = {};
  items.forEach((m) => {
    const key = m.category || m.type || "other";
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  });

  const orderedKeys = ["general", "thematic", "informational", "irrelevant", "competitor", "geo", "other"];
  const sortedKeys = orderedKeys.filter((k) => groups[k]?.length > 0);
  // Add any unexpected keys
  Object.keys(groups).forEach((k) => {
    if (!sortedKeys.includes(k) && groups[k].length > 0) sortedKeys.push(k);
  });

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-bold text-foreground">
        Минус-слова ({items.length})
      </h2>

      {sortedKeys.map((key) => {
        const meta = categoryLabels[key] || { title: key, description: "" };
        return (
          <div key={key} className="space-y-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground/80">{meta.title}</h3>
              {meta.description && <p className="text-xs text-muted-foreground">{meta.description}</p>}
            </div>
            <div className="flex flex-wrap gap-2">
              {groups[key].map((mw, i) => (
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
      })}

      <div className="rounded-xl border border-border/30 p-4 text-sm text-muted-foreground space-y-1">
        <p className="font-medium text-foreground/70">💡 Рекомендация</p>
        <p>Добавьте общие минус-слова на уровне аккаунта Яндекс.Директ, а тематические — на уровне кампании.</p>
      </div>
    </div>
  );
};

export default MinusWordsSection;
