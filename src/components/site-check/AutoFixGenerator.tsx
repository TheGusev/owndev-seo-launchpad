import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

interface AutoFixGeneratorProps {
  templateKey: string;
  generated: Record<string, string>;
}

export default function AutoFixGenerator({ templateKey, generated }: AutoFixGeneratorProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const snippets = useMemo(
    () =>
      Object.entries(generated).filter(
        ([, value]) => typeof value === "string" && value.trim().length > 0
      ),
    [generated]
  );

  if (!snippets.length) return null;

  const safeKey = typeof templateKey === "string" ? templateKey : "";

  const getFormatLabel = () => {
    if (safeKey.includes("llms")) return "TXT";
    if (safeKey.includes("robots") || safeKey.includes("sitemap")) return "XML";
    return "HTML";
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">
          Автофикс: {getFormatLabel()}-шаблоны
        </h3>
      </div>
      <div className="space-y-2">
        {snippets.map(([key, value]) => (
          <div
            key={key}
            className="rounded-md border border-border/60 bg-card/60 px-3 py-2 text-xs font-mono leading-relaxed"
          >
            <div className="mb-1 flex items-center justify-between gap-2">
              <span className="truncate text-[11px] uppercase tracking-wide text-muted-foreground">
                {key}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="xs"
                  className="h-6 px-2 text-[11px]"
                  onClick={() => setActiveKey(activeKey === key ? null : key)}
                >
                  {activeKey === key ? "Скрыть" : "Показать"}
                </Button>
              </div>
            </div>
            {activeKey === key && (
              <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap text-[11px]">
                {value}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
